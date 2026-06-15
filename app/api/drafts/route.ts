import { getSession } from '@/lib/session';
import { pool } from '@/db/index';

export async function GET(req: Request) {
    try {
        const session = await getSession();
        const accountId = session?.user?.id;
        if (!accountId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const res = await pool.query(
            `SELECT id, email_details as "emailDetails", telegram_message_id as "telegramMessageId", telegram_chat_id as "telegramChatId", status, created_at as "createdAt"
             FROM telegram_drafts
             WHERE tenant_id = $1
             ORDER BY created_at DESC`,
            [accountId]
        );

        return new Response(JSON.stringify({ drafts: res.rows }), { status: 200 });
    } catch (error: any) {
        console.error("Failed to fetch drafts:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
