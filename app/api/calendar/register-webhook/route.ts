import { NextResponse } from 'next/server';
import { corsair } from '@/lib/corsair';
import { getSession } from '@/lib/session';
import { pool } from '@/db';

export async function POST() {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = corsair.withTenant(session.user.id);
        
        // 1. Temporary placeholder: Corsair currently does not expose a direct webhook register helper for googlecalendar.
        // Google Calendar webhooks typically require setting up an explicit push channel or the Corsair background worker handles it.

        // 2. Fetch all events for the current month and save them to the local database.
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        try {
            const eventsRes = await client.googlecalendar.api.events.getMany({
                calendarId: 'primary',
                timeMin: startOfMonth.toISOString(),
                timeMax: endOfMonth.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 2500,
            });

            if (eventsRes?.items && eventsRes.items.length > 0) {
                // We need the account_id to store in corsair_entities
                const accountRes = await pool.query(
                    `SELECT id FROM corsair_accounts WHERE tenant_id = $1 AND integration_id = 'googlecalendar' LIMIT 1`, 
                    [session.user.id]
                );
                
                const accountId = accountRes.rows[0]?.id;

                if (accountId) {
                    for (const event of eventsRes.items) {
                        if (!event.id) continue;
                        
                        const existing = await pool.query(
                            `SELECT id FROM corsair_entities WHERE account_id = $1 AND entity_id = $2 AND entity_type = 'events'`,
                            [accountId, event.id]
                        );

                        if (existing.rows.length > 0) {
                            await pool.query(
                                `UPDATE corsair_entities SET data = $1, updated_at = NOW() WHERE id = $2`,
                                [event, existing.rows[0].id]
                            );
                        } else {
                            await pool.query(
                                `INSERT INTO corsair_entities (id, account_id, entity_id, entity_type, version, data) VALUES (gen_random_uuid(), $1, $2, 'events', '1', $3)`,
                                [accountId, event.id, event]
                            );
                        }
                    }
                }
            }
        } catch (syncErr) {
            console.error('[Initial event sync failed]', syncErr);
            // We don't throw here to avoid failing the whole request if just sync fails
        }

        // 3. Setup Google Calendar Watch (Webhooks)
        // Note: For this to succeed, process.env.APP_URL must be a domain
        // verified in Google Search Console and added to "Domain Verification" in Google Cloud Console.
        try {
            const accessToken = await (client as any).googlecalendar.keys.get_access_token();
            if (accessToken && process.env.APP_URL) {
                const webhookUrl = `${process.env.APP_URL}/api/webhooks?tenantId=${session.user.id}`;
                const channelId = crypto.randomUUID();
                
                const watchRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/watch', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: channelId,
                        type: 'web_hook',
                        address: webhookUrl,
                    })
                });

                if (!watchRes.ok) {
                    const errorTxt = await watchRes.text();
                    console.error('[Calendar watch failed]', errorTxt);
                } else {
                    const watchData = await watchRes.json();
                    console.log('[Calendar watch succeeded]', watchData);
                }
            }
        } catch (watchErr) {
            console.error('[Calendar watch error]', watchErr);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[calendar webhook registration failed]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
