import { getSession } from '@/lib/session';
import { pool } from '@/db/index';
import { getCorsairAgent } from '@/lib/agent';
import { corsair } from '@/lib/corsair';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const session = await getSession();
        const accountId = session?.user?.id;
        if (!accountId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const { feedback } = await req.json();
        if (!feedback) {
            return new Response(JSON.stringify({ error: "Feedback is required" }), { status: 400 });
        }

        // 1. Fetch draft
        const draftRes = await pool.query(
            `SELECT * FROM telegram_drafts WHERE id = $1 AND tenant_id = $2`,
            [id, accountId]
        );

        if (draftRes.rows.length === 0) {
            return new Response(JSON.stringify({ error: "Draft not found" }), { status: 404 });
        }

        const draft = draftRes.rows[0];
        if (draft.status !== 'pending') {
            return new Response(JSON.stringify({ error: "Draft already processed" }), { status: 400 });
        }

        const emailDetails = JSON.parse(draft.email_details);

        // 2. Call AI Agent to improve draft
        const agent = await getCorsairAgent(accountId);
        const prompt = `You are an AI assistant. You drafted this email draft:
To: ${emailDetails.to}
Subject: ${emailDetails.subject}
Body: ${emailDetails.body}

The user wants to edit/improve it with this feedback: "${feedback}"

Please output the improved email in this exact JSON format (and ONLY JSON, no markdown blocks, no other text):
{
  "to": "recipient email",
  "subject": "email subject",
  "body": "improved email body"
}

Ensure the output is valid JSON.`;

        const agentResponse = await agent.generate([
            { role: 'user', content: prompt }
        ]);

        const text = agentResponse.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse improved draft JSON from agent response: " + text);
        }

        const updatedDetails = JSON.parse(jsonMatch[0]);
        if (!updatedDetails.to || !updatedDetails.subject || !updatedDetails.body) {
            throw new Error("Invalid draft structure returned from agent: " + jsonMatch[0]);
        }

        // Ensure email signature is preserved
        const userName = session.user?.name || 'User';
        if (!updatedDetails.body.includes(userName) && !updatedDetails.body.includes('Best,')) {
            updatedDetails.body += `\n\nBest,\n${userName}`;
        }

        // 3. Update database
        await pool.query(
            `UPDATE telegram_drafts SET email_details = $1 WHERE id = $2`,
            [JSON.stringify(updatedDetails), id]
        );

        // 4. Update Telegram message if linked
        if (draft.telegram_message_id && draft.telegram_chat_id) {
            try {
                const botClient = corsair.withTenant('default');
                await botClient.telegram.api.messages.editMessageText({
                    chat_id: draft.telegram_chat_id,
                    message_id: parseInt(draft.telegram_message_id, 10),
                    text: `✉️ *Draft Email Updated via Dashboard:*\n\n*To:* ${updatedDetails.to}\n*Subject:* ${updatedDetails.subject}\n\n*Body:*\n${updatedDetails.body}\n\nDo you want to send this email?`,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "✅ Approve & Send", callback_data: `email_approve:${id}` },
                                { text: "❌ Discard", callback_data: `email_reject:${id}` }
                            ],
                            [
                                { text: "✍️ Suggest Improvement", callback_data: `email_improve:${id}` }
                            ]
                        ]
                    }
                });
            } catch (telegramErr) {
                console.error("Failed to update telegram message:", telegramErr);
            }
        }

        return new Response(JSON.stringify({ success: true, draft: updatedDetails }), { status: 200 });

    } catch (error: any) {
        console.error("Failed to improve draft:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
