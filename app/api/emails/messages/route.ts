import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { pool } from '@/db/index';

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

    try {
        const messages = await fetchFromDb(tenantId);

        return NextResponse.json({ messages });
    } catch (err) {
        console.error('[emails/messages error]', err);
        return NextResponse.json({ messages: [], error: String(err) }, { status: 500 });
    }
}
