import { getSession } from '@/lib/session';
import { pool } from '@/db/index';
import { corsair } from '@/lib/corsair';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getSession();
        const accountId = session?.user?.id;
        if (!accountId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        // Fetch draft
        const draftRes = await pool.query(
            `SELECT * FROM telegram_drafts WHERE id = $1 AND tenant_id = $2`,
            [id, accountId]
        );

        if (draftRes.rows.length === 0) {
            return new Response(JSON.stringify({ error: "Draft not found or already processed" }), { status: 404 });
        }

        const draft = draftRes.rows[0];
        const emailDetails = JSON.parse(draft.email_details);

        const emailContent = `To: ${emailDetails.to}\nSubject: ${emailDetails.subject}\n\n${emailDetails.body}`;
        const rawBase64Url = Buffer.from(emailContent)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        // Execute email send
        const userClient = corsair.withTenant(accountId);
        await userClient.gmail.api.messages.send({
            userId: 'me',
            raw: rawBase64Url
        });

        // Update Telegram message if linked
        if (draft.telegram_message_id && draft.telegram_chat_id) {
            try {
                const botClient = corsair.withTenant('default');
                await botClient.telegram.api.messages.editMessageText({
                    chat_id: draft.telegram_chat_id,
                    message_id: parseInt(draft.telegram_message_id, 10),
                    text: `✅ *Approved and Sent via Dashboard:*\n\n*To:* ${emailDetails.to}\n*Subject:* ${emailDetails.subject}\n\n*Status:* Sent successfully.`,
                    parse_mode: 'Markdown'
                });
            } catch (telegramErr) {
                console.error("Failed to update telegram message:", telegramErr);
                // Non-fatal error, email is already sent
            }
        }

        // Update draft status
        await pool.query(`UPDATE telegram_drafts SET status = 'approved' WHERE id = $1`, [id]);

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error: any) {
        console.error("Failed to approve draft:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
