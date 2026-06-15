import { corsair } from '@/lib/corsair';
import { pool } from '@/db/index';
import crypto from 'crypto';

export async function requestEmailApproval(
    tenantId: string,
    emailDetails: { to: string; subject: string; body: string }
) {
    // 1. Fetch user's telegram_chat_id from your DB
    const userRes = await pool.query(
        `SELECT telegram_chat_id FROM "user" WHERE id = $1 LIMIT 1`,
        [tenantId]
    );
    const chatId = userRes.rows[0]?.telegram_chat_id;
    if (!chatId) {
        console.warn(`User ${tenantId} does not have a linked Telegram account.`);
        return { success: false, error: 'User does not have a linked Telegram account.' };
    }

    // The bot is globally registered under the 'default' tenant
    const botClient = corsair.withTenant('default');

    // 2. Generate draft ID and save to telegram_drafts instead of base64 (which hits Telegram's 64 byte limit)
    const draftId = crypto.randomUUID();
    await pool.query(
        `INSERT INTO telegram_drafts (id, tenant_id, email_details) VALUES ($1, $2, $3)`,
        [draftId, tenantId, JSON.stringify(emailDetails)]
    );

    // 3. Send message with Approval Buttons (using snake_case parameters required by Corsair Telegram plugin)
    const msg: any = await botClient.telegram.api.messages.sendMessage({
        chat_id: chatId,
        text: `✉️ *Draft Email Awaiting Approval:*\n\n*To:* ${emailDetails.to}\n*Subject:* ${emailDetails.subject}\n\n*Body:*\n${emailDetails.body}\n\nDo you want to send this email?`,
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "✅ Approve & Send", callback_data: `email_approve:${draftId}` },
                    { text: "❌ Discard", callback_data: `email_reject:${draftId}` }
                ]
            ]
        }
    });

    const messageId = msg?.message_id || msg?.result?.message_id;
    if (messageId) {
        await pool.query(
            `UPDATE telegram_drafts SET telegram_message_id = $1, telegram_chat_id = $2 WHERE id = $3`,
            [messageId.toString(), chatId.toString(), draftId]
        );
    }

    return { success: true };
}
