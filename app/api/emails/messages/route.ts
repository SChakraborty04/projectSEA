import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { pool } from '@/db/index';
import { corsair } from '@/lib/corsair';

// ─── Types ────────────────────────────────────────────────────────────────────

type RawMsg = {
    id?: string;
    threadId?: string;
    snippet?: string;
    labelIds?: string[];
    internalDate?: string | number | Date | null;
    payload?: any;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHeader(
    headers: { name?: string; value?: string }[] | undefined,
    name: string
): string {
    return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function extractBody(payload: any): string {
    if (!payload) return '';
    let data = '';
    if (payload.parts && payload.parts.length > 0) {
        let targetPart = payload.parts.find((p: any) => p.mimeType === 'text/html') 
                      || payload.parts.find((p: any) => p.mimeType === 'text/plain')
                      || payload.parts[0];
        if (targetPart?.parts) {
            return extractBody(targetPart);
        }
        data = targetPart?.body?.data || '';
    } else if (payload.body?.data) {
        data = payload.body.data;
    }

    if (!data) return '';
    try {
        return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    } catch {
        return '';
    }
}

function normalise(m: any) {
    const headers = m.payload?.headers;
    return {
        id: m.id,
        threadId: m.threadId,
        subject: m.subject || getHeader(headers, 'Subject') || '(no subject)',
        from: m.from || getHeader(headers, 'From'),
        to: m.to || getHeader(headers, 'To'),
        snippet: m.snippet,
        body: m.body || extractBody(m.payload),
        labelIds: m.labelIds ?? [],
        internalDate: m.internalDate
            ? new Date(Number(m.internalDate)).toISOString()
            : m.createdAt,
        phishingAnalysis: m.phishingAnalysis,
    };
}



/**
 * Fetch from the Corsair local DB (used by background polling every 10 s).
 * Zero Gmail API calls — reads from the DB that is populated by Pub/Sub webhooks.
 * Returns an empty array if no webhooks have arrived yet (Pub/Sub not set up, etc.)
 */
async function fetchFromDb(tenantId: string) {
    const res = await pool.query(
        `SELECT e.data 
         FROM corsair_entities e
         JOIN corsair_accounts a ON e.account_id = a.id
         WHERE e.entity_type = 'messages' AND a.tenant_id = $1 
         ORDER BY e.created_at DESC 
         LIMIT 50`,
        [tenantId]
    );

    return res.rows
        .map((row: any) => row.data)
        .filter(Boolean)
        .map((m: any) => normalise(m as RawMsg));
}

// ─── Route handler ────────────────────────────────────────────────────────────

async function syncEmailsFromGmail(tenantId: string) {
    try {
        const status = await corsair.manage.connectionStatus.get({ tenantId });
        if (status['gmail'] !== 'connected') {
            console.log(`[syncEmailsFromGmail] Gmail is not connected for tenant: ${tenantId}`);
            return;
        }

        // Get the account ID for Gmail integration
        const accountRes = await pool.query(
            `SELECT id FROM corsair_accounts 
             WHERE tenant_id = $1 AND integration_id IN (SELECT id FROM corsair_integrations WHERE name = 'gmail')`,
            [tenantId]
        );
        if (accountRes.rows.length === 0) {
            console.warn(`[syncEmailsFromGmail] No corsair_account found for tenant: ${tenantId}`);
            return;
        }
        const accountId = accountRes.rows[0].id;

        const client = corsair.withTenant(tenantId);
        const listRes = await client.gmail.api.messages.list({ userId: 'me', maxResults: 15 });
        if (!listRes || !listRes.messages || listRes.messages.length === 0) {
            console.log(`[syncEmailsFromGmail] No messages returned from Gmail list for tenant: ${tenantId}`);
            return;
        }

        const { classifyPhishing } = await import('@/lib/phishing-detection');

        for (const msg of listRes.messages) {
            if (!msg.id) continue;

            // Check if already in DB (retrieve the row and its data)
            const checkRes = await pool.query(
                `SELECT id, data FROM corsair_entities WHERE account_id = $1 AND entity_id = $2 AND entity_type = 'messages'`,
                [accountId, msg.id]
            );

            const existingRow = checkRes.rows[0];
            const isIncomplete = existingRow && (!existingRow.data || !existingRow.data.payload);

            if (!existingRow || isIncomplete) {
                try {
                    // Fetch full message
                    const fullMsg = await client.gmail.api.messages.get({ userId: 'me', id: msg.id });
                    if (!fullMsg) continue;

                    // Run phishing detection
                    const headers = fullMsg.payload?.headers;
                    const subject = getHeader(headers, 'Subject') || '(no subject)';
                    const body = extractBody(fullMsg.payload) || fullMsg.snippet || '';
                    
                    let phishingAnalysis = null;
                    try {
                        phishingAnalysis = await classifyPhishing(subject, body);
                    } catch (phishErr) {
                        console.error('[Sync Phishing Error]', phishErr);
                    }

                    const dataToSave = {
                        ...fullMsg,
                        phishingAnalysis,
                        createdAt: new Date().toISOString()
                    };

                    if (existingRow) {
                        await pool.query(
                            `UPDATE corsair_entities 
                             SET data = $1, updated_at = NOW() 
                             WHERE id = $2`,
                            [JSON.stringify(dataToSave), existingRow.id]
                        );
                        console.log(`[syncEmailsFromGmail] Successfully updated incomplete message: ${msg.id}`);
                    } else {
                        await pool.query(
                            `INSERT INTO corsair_entities (id, account_id, entity_id, entity_type, version, data, created_at, updated_at)
                             VALUES (gen_random_uuid(), $1, $2, 'messages', '1.0.0', $3, NOW(), NOW())`,
                            [accountId, msg.id, JSON.stringify(dataToSave)]
                        );
                        console.log(`[syncEmailsFromGmail] Successfully synced and inserted new message: ${msg.id}`);
                    }
                } catch (msgErr) {
                    console.error(`[syncEmailsFromGmail] Error fetching/saving message ${msg.id}:`, msgErr);
                }
            }
        }
    } catch (err) {
        console.error('[syncEmailsFromGmail error]', err);
    }
}

/**
 * GET /api/emails/messages
 *
 * Query params:
 *   ?source=api   → fetch from Gmail API (initial load / manual refresh)
 *   ?source=db    → fetch from local DB only (background poll, default)
 *
 * Rate-limit strategy:
 *   - The frontend sends `source=api` only on first mount and on the manual
 *     "Refresh" button click.
 *   - The 10-second background poll always uses `source=db` (free — no API
 *     quota consumed).
 *   - New emails appear in the DB automatically as Pub/Sub webhooks arrive.
 */
export async function GET(request: NextRequest) {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.id;
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');

    try {
        let messages = await fetchFromDb(tenantId);

        const hasValidMessages = messages.some(m => m.subject && m.subject !== '(no subject)');

        // Sync from Gmail if requested or if DB doesn't have valid complete messages
        if (source === 'api' || !hasValidMessages) {
            console.log(`[emails/messages GET] Triggering sync from Gmail for tenant: ${tenantId} (source=${source}, has_valid=${hasValidMessages})`);
            await syncEmailsFromGmail(tenantId);
            messages = await fetchFromDb(tenantId);
        }

        return NextResponse.json({ messages });
    } catch (err) {
        console.error('[emails/messages error]', err);
        return NextResponse.json({ messages: [], error: String(err) }, { status: 500 });
    }
}
