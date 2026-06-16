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
        // 1. Fetch integration ID for telegram in corsair_integrations (create it if missing)
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

        // 3. Register the single static webhook with Telegram via Corsair client (using default tenant)
        const client = corsair.withTenant('default');
        await client.telegram.api.webhook.setWebhook({
            url: `${getAppUrl()}/api/webhooks`,
            secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || 'superea_telegram_secret'
        });

        // 4. Retrieve the bot username dynamically
        const botInfo = await client.telegram.api.me.getMe({});
        const botUsername = botInfo.username;

        // 5. Generate a 6-digit connection code and save to user table
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
        
        await pool.query(
            `UPDATE "user" SET telegram_connection_code = $1, telegram_code_expires_at = $2, telegram_chat_id = NULL WHERE id = $3`,
            [code, expiresAt, session.user.id]
        );

        return NextResponse.json({ success: true, botUsername, connectionCode: code });
    } catch (err: any) {
        console.error('[Telegram Setup Error]', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
