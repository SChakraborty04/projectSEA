import { processWebhook } from 'corsair';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { corsair } from '@/lib/corsair';
import { pool } from '@/db/index';
import { Client } from "@upstash/qstash";
import { getAppUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => { headers[key] = value; });

    let bodyText = await request.text();
    let body: any = {};
    if (bodyText) {
        if (request.headers.get('content-type')?.includes('application/json')) {
            try {
                body = JSON.parse(bodyText);
            } catch (e) {
                body = bodyText;
            }
        } else {
            body = bodyText;
        }
    }

    // Read tenantId from query params for multi-tenancy routing
    let tenantId = new URL(request.url).searchParams.get('tenantId') ?? undefined;

    // For Gmail Pub/Sub webhooks, Google doesn't send tenantId in the URL.
    // Instead, they send `emailAddress` in the base64-encoded `message.data`.
    console.log('[Webhook Debug] Incoming body:', JSON.stringify(body).slice(0, 500));
    
    if (!tenantId && typeof body === 'object') {
        // 1. Check if it's a Gmail Pub/Sub message
        if (body?.message?.data) {
            try {
                const decodedStr = Buffer.from(body.message.data, 'base64').toString('utf-8');
                const data = JSON.parse(decodedStr);
                console.log('Decoded data:', JSON.stringify(data).slice(0, 500));
                if (data.emailAddress) {
                    const res = await pool.query(`SELECT id FROM "user" WHERE email = $1 LIMIT 1`, [data.emailAddress]);
                    console.log(`[Webhook Debug] Found user for ${data.emailAddress}:`, res.rows);
                    if (res.rows.length > 0) {
                        tenantId = res.rows[0].id;
                    }
                } else {
                    console.log('[Webhook Debug] Decoded data missing emailAddress:', data);
                }
            } catch (e) {
                console.error('Failed to decode Pub/Sub data to find tenantId', e);
            }
        }

        // 2. Check if it's a Telegram webhook
        // Telegram webhooks always have an 'update_id' at the root
        if (!tenantId && body?.update_id) {
            tenantId = 'default';
            headers['x-telegram-bot-api-secret-token'] = process.env.TELEGRAM_WEBHOOK_SECRET || 'superea_telegram_secret';
            console.log(`[Webhook Debug] Routed Telegram webhook to 'default' tenant with secret token`);
        }
    }

    const isTelegram = tenantId === 'default' || (typeof body === 'object' && body?.update_id);

    console.log('[Webhook Debug] Final tenantId:', tenantId, 'isTelegram:', isTelegram);

    if (isTelegram) {
        console.log('[Telegram Webhook] Received webhook payload. Headers:', JSON.stringify(headers), 'Body:', JSON.stringify(body));
    }

    // If QStash Token is configured, queue the request. Otherwise fall back to synchronous execution.
    // We bypass QStash for Telegram webhooks to ensure instant response times and avoid QStash signature verification/delivery issues in production.
    const qstashToken = process.env.QSTASH_TOKEN;
    if (qstashToken && !isTelegram) {
        try {
            const qstash = new Client({ token: qstashToken });
            await qstash.publishJSON({
                url: `${getAppUrl()}/api/webhooks/worker`,
                body: {
                    headers,
                    body,
                    tenantId,
                },
            });
            console.log('[Webhook Queue] Successfully queued webhook request via QStash');
            return NextResponse.json({ success: true, queued: true });
        } catch (err: any) {
            console.error('[Webhook Queue] Failed to queue via QStash, falling back to sync processing:', err);
        }
    }

    // Fallback/Development: Process synchronously if QStash is not configured
    if (isTelegram) {
        console.log('[Telegram Webhook] Invoking processWebhook synchronously...');
    }
    const result = await processWebhook(corsair, headers, body, { tenantId });
    
    if (isTelegram) {
        console.log('[Telegram Webhook] processWebhook result:', JSON.stringify(result));
    } else {
        console.log(result);
    }

    if (!result.response) {
        if (isTelegram) {
            console.error('[Telegram Webhook] processWebhook did not return a response object');
        }
        return NextResponse.json({ success: false }, { status: 404 });
    }

    return NextResponse.json(result.response);
}