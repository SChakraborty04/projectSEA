import { NextResponse } from 'next/server';
import { db } from '@/db';
import { corsairAccounts } from '@/db/schema/corsair';
import { corsair } from '@/lib/corsair';
import { getAppUrl } from '@/lib/utils';

export async function POST(req: Request) {
    // 1. Verify authorization header
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        // Find all unique tenantIds from connected accounts
        const accounts = await db.select({ tenantId: corsairAccounts.tenantId }).from(corsairAccounts);
        const tenantIds = Array.from(new Set(accounts.map(a => a.tenantId)));
        
        const results = [];
        
        for (const tenantId of tenantIds) {
            const client = corsair.withTenant(tenantId);
            const userResult = { tenantId, gmail: 'skipped', calendar: 'skipped' };
            
            // Gmail renewal
            try {
                const topicId = await (corsair as any).keys.gmail.get_topic_id().catch(() => null);
                const gmailToken = await (client as any).gmail?.keys?.get_access_token().catch(() => null);
                
                if (topicId && gmailToken) {
                    const watchRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/watch', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${gmailToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            topicName: topicId,
                            labelIds: ['INBOX'],
                            labelFilterBehavior: 'include',
                        }),
                    });
                    
                    if (watchRes.ok) {
                        userResult.gmail = 'renewed';
                    } else {
                        userResult.gmail = `failed: ${await watchRes.text()}`;
                    }
                }
            } catch (err: any) {
                userResult.gmail = `error: ${err.message || String(err)}`;
            }
            
            // Calendar renewal
            try {
                const calendarToken = await (client as any).googlecalendar?.keys?.get_access_token().catch(() => null);
                if (calendarToken) {
                    const webhookUrl = `${getAppUrl()}/api/webhooks?tenantId=${tenantId}`;
                    const channelId = crypto.randomUUID();
                    
                    const watchRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events/watch', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${calendarToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            id: channelId,
                            type: 'web_hook',
                            address: webhookUrl,
                        })
                    });
                    
                    if (watchRes.ok) {
                        userResult.calendar = 'renewed';
                    } else {
                        userResult.calendar = `failed: ${await watchRes.text()}`;
                    }
                }
            } catch (err: any) {
                userResult.calendar = `error: ${err.message || String(err)}`;
            }
            
            results.push(userResult);
        }
        
        return NextResponse.json({ success: true, processed: results });
    } catch (err: any) {
        console.error('[Cron webhook renewal failed]', err);
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}

// Support GET requests for testing in local environment when CRON_SECRET is not configured
export async function GET(req: Request) {
    return POST(req);
}
