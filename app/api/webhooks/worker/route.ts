import { NextResponse } from 'next/server';
import { processWebhook } from 'corsair';
import { corsair } from '@/lib/corsair';
import { Receiver } from "@upstash/qstash";

const qstashCurrentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
const qstashNextKey = process.env.QSTASH_NEXT_SIGNING_KEY;

const receiver = qstashCurrentKey && qstashNextKey
    ? new Receiver({
        currentSigningKey: qstashCurrentKey,
        nextSigningKey: qstashNextKey,
      })
    : null;

export async function POST(req: Request) {
    try {
        const bodyText = await req.text();

        // 1. Verify Upstash signature in production
        if (process.env.NODE_ENV === 'production' && receiver) {
            const signature = req.headers.get("upstash-signature");
            if (!signature) {
                return new Response("Missing signature", { status: 401 });
            }
            const isValid = await receiver.verify({
                signature,
                body: bodyText,
            }).catch(() => false);
            
            if (!isValid) {
                return new Response("Invalid signature", { status: 401 });
            }
        }

        // 2. Parse the queued payload
        const payload = JSON.parse(bodyText);
        const { headers, body, tenantId } = payload;

        console.log(`[Webhook Worker] Processing queued webhook for tenant: ${tenantId}`);

        // 3. Execute the Corsair webhook handler
        const result = await processWebhook(corsair, headers, body, { tenantId });
        console.log('[Webhook Worker] processWebhook result:', result);

        if (!result.response) {
            return NextResponse.json({ success: false }, { status: 404 });
        }

        return NextResponse.json(result.response);
    } catch (error: any) {
        console.error("[Webhook Worker] Error processing queued job:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
