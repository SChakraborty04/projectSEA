import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { pool } from '@/db/index';
import { corsair } from '@/lib/corsair';
import { getAppUrl } from '@/lib/utils';

export async function POST(req: Request) {
    const session = await getSession();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not configured in .env' }, { status: 500 });
    }

    try {
        // 1. Ensure telegram integration exists in corsair_integrations
        await pool.query(
            `INSERT INTO corsair_integrations (id, name, config) 
             VALUES ('telegram', 'Telegram', '{}') 
             ON CONFLICT (id) DO UPDATE SET name = 'Telegram'`
        );

        // 2. Save/Update the global bot token in corsair_accounts under the 'default' tenant
        const existingRes = await pool.query(
            `SELECT id FROM corsair_accounts WHERE tenant_id = 'default' AND integration_id = 'telegram' LIMIT 1`
        );

        if (existingRes.rows.length > 0) {
            await pool.query(
                `UPDATE corsair_accounts SET config = $1, updated_at = NOW() WHERE id = $2`,
                [{ bot_token: botToken }, existingRes.rows[0].id]
            );
        } else {
            const accountId = crypto.randomUUID();
            await pool.query(
                `INSERT INTO corsair_accounts (id, tenant_id, integration_id, config)
                 VALUES ($1, 'default', 'telegram', $2)`,
                [accountId, { bot_token: botToken }]
            );
        }

        // 3. Register the webhook via Corsair — wrapped in try/catch so an ISP that
        //    blocks api.telegram.org (common in India) doesn't kill code generation.
        const client = corsair.withTenant('default');
        const webhookUrl = `${getAppUrl()}/api/webhooks`;
        const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || 'superea_telegram_secret';

        let botUsername: string | null = null;
        let webhookWarning: string | null = null;

        try {
            console.log(`[Telegram Setup] Registering webhook: ${webhookUrl}`);
            await client.telegram.api.webhook.setWebhook({
                url: webhookUrl,
                secret_token: webhookSecret,
            });
            console.log('[Telegram Setup] setWebhook OK');

            // 4. Retrieve the bot username dynamically
            const botInfo = await client.telegram.api.me.getMe({});
            botUsername = botInfo.username??"";
        } catch (networkErr: any) {
            // Detect ISP-level connectivity blocks (ConnectTimeoutError, fetch failed, etc.)
            const causeCode: string = networkErr?.cause?.code ?? '';
            const causeMsg: string = networkErr?.message ?? '';
            const isNetworkBlock =
                causeCode === 'UND_ERR_CONNECT_TIMEOUT' ||
                causeCode === 'ECONNREFUSED' ||
                causeCode === 'ENOTFOUND' ||
                causeMsg.toLowerCase().includes('fetch failed') ||
                causeMsg.toLowerCase().includes('connect timeout');

            if (isNetworkBlock) {
                console.warn(
                    `[Telegram Setup] ISP is blocking api.telegram.org ` +
                    `(${causeCode || causeMsg}). ` +
                    `Webhook registration skipped — connection code still saved.`
                );
                webhookWarning =
                    `⚠️ Your ISP or network is blocking connections to Telegram's servers ` +
                    `(api.telegram.org). The 6-digit connection code below is still valid. ` +
                    `Open the bot on your phone and send it the code to link your account. ` +
                    `Webhook registration works correctly on the production server.`;
            } else {
                // Re-throw unexpected errors so they surface properly
                throw networkErr;
            }
        }

        // 5. Generate a 6-digit connection code, reset the linked chat, and store the code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // expires in 15 minutes

        await pool.query(
            `UPDATE "user" SET telegram_connection_code = $1, telegram_code_expires_at = $2, telegram_chat_id = NULL WHERE id = $3`,
            [code, expiresAt, session.user.id]
        );

        return NextResponse.json({
            success: true,
            botUsername,
            connectionCode: code,
            warning: webhookWarning,
        });
    } catch (err: any) {
        console.error('[Telegram Setup Error]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
