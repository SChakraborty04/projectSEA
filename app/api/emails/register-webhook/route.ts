import { NextResponse } from 'next/server';
import { corsair } from '@/lib/corsair';
import { getSession } from '@/lib/session';

/**
 * POST /api/emails/register-webhook
 *
 * Calls Gmail's users.watch API for the authenticated user, telling Gmail to
 * push all inbox events to our Google Cloud Pub/Sub topic.
 *
 * Must be called once after OAuth completes (and re-called every ~7 days
 * because Gmail watch subscriptions expire after 7 days).
 *
 * Requires:
 *   - topic_id set in Corsair integration credentials (via setup script)
 *   - gmail-api-push@system.gserviceaccount.com granted Pub/Sub Publisher
 *     on the topic in Google Cloud Console
 */
export async function POST() {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.id;

    try {
        const client = corsair.withTenant(tenantId);

        // 1. Get the topic_id from Corsair integration credentials
        const topicId = await (corsair as any).keys.gmail.get_topic_id().catch(() => null);
        if (!topicId) {
            return NextResponse.json(
                { error: 'topic_id not configured — run scripts/setup-corsair-gmail.ts first' },
                { status: 500 }
            );
        }

        // 2. Get the Gmail access token from Corsair's per-tenant key store
        //    (Corsair auto-refreshes it if expired)
        const accessToken = await (client as any).gmail.keys.get_access_token();
        if (!accessToken) {
            return NextResponse.json(
                { error: 'No Gmail access token — user must re-authenticate' },
                { status: 401 }
            );
        }

        // 3. Call Gmail users.watch to register the push notification subscription
        //    This tells Gmail: "for this user, push all INBOX changes to our Pub/Sub topic"
        const watchResponse = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/watch',
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topicName: topicId,
                    labelIds: ['INBOX'],
                    labelFilterBehavior: 'include',
                }),
            }
        );

        if (!watchResponse.ok) {
            const error = await watchResponse.text();
            console.error('[register-webhook] Gmail watch failed:', error);
            return NextResponse.json(
                { error: 'Gmail watch registration failed', detail: error },
                { status: watchResponse.status }
            );
        }

        const watchData = await watchResponse.json();
        console.log(`[register-webhook] Gmail watch registered for tenant ${tenantId}:`, watchData);

        // watchData.expiration is a Unix timestamp in ms — watch expires in ~7 days
        return NextResponse.json({
            success: true,
            tenantId,
            historyId: watchData.historyId,
            expiration: watchData.expiration,
        });
    } catch (err) {
        console.error('[register-webhook error]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
