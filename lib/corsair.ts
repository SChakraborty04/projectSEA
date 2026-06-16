import 'dotenv/config';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { pool } from '../db/index';
import { telegram } from '@corsair-dev/telegram';
import { getCorsairAgent } from './agent';

/**
 * Send a Telegram message via native fetch, bypassing the Corsair client.
 * The Corsair client uses its own fetch implementation that can fail due to
 * ISP-level blocks on api.telegram.org. Native fetch is more reliable.
 */
async function sendTelegramMessage(chatId: string, text: string, extra: Record<string, any> = {}): Promise<any> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        console.error('[TelegramSend] TELEGRAM_BOT_TOKEN not set');
        return;
    }
    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, ...extra }),
            signal: AbortSignal.timeout(8000),
        });
        const data = await res.json() as any;
        if (!data.ok) {
            console.error(`[TelegramSend] Telegram rejected message to ${chatId}:`, data.description);
        }
        return data.result;
    } catch (err: any) {
        console.warn(`[TelegramSend] Could not reach api.telegram.org (${err?.cause?.code ?? err?.message}). Message not delivered.`);
    }
}

async function editTelegramMessage(chatId: string, messageId: number, text: string, extra: Record<string, any> = {}): Promise<any> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return;
    try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, ...extra }),
            signal: AbortSignal.timeout(8000),
        });
        const data = await res.json() as any;
        if (!data.ok) {
            console.error(`[TelegramEdit] Telegram rejected edit for message ${messageId}:`, data.description);
        }
        return data.result;
    } catch (err: any) {
        console.warn(`[TelegramEdit] Could not reach api.telegram.org (${err?.cause?.code ?? err?.message}).`);
    }
}

async function deleteTelegramMessage(chatId: string, messageId: number): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return;
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
            signal: AbortSignal.timeout(8000),
        });
    } catch (err: any) {
        console.warn(`[TelegramDelete] Could not reach api.telegram.org (${err?.cause?.code ?? err?.message}).`);
    }
}

async function answerTelegramCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return;
    try {
        await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId, ...(text ? { text } : {}) }),
            signal: AbortSignal.timeout(8000),
        });
    } catch (err: any) {
        console.warn(`[TelegramCallback] Could not reach api.telegram.org (${err?.cause?.code ?? err?.message}).`);
    }
}

function getHeader(headers: any[] | undefined, name: string): string {
    return headers?.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function extractBody(payload: any): string {
    if (!payload) return '';
    let data = '';
    if (payload.parts && payload.parts.length > 0) {
        let targetPart = payload.parts.find((p: any) => p.mimeType === 'text/html') 
                      || payload.parts.find((p: any) => p.mimeType === 'text/plain')
                      || payload.parts[0];
        if (targetPart?.parts) {
            return extractBody(targetPart);
        }
        data = targetPart?.body?.data || '';
    } else if (payload.body?.data) {
        data = payload.body.data;
    }

    if (!data) return '';
    try {
        return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    } catch {
        return '';
    }
}

export const corsair = createCorsair({
    plugins: [
        gmail({
            webhookHooks: {
                messageChanged: {
                    async after(ctx: any, response: any) {
                        if (response?.data?.type === 'messageReceived' && response?.corsairEntityId) {
                            const rawMsg = response.data.message;
                            if (rawMsg) {
                                const headers = rawMsg.payload?.headers;
                                const from = getHeader(headers, 'From');
                                const to = getHeader(headers, 'To');
                                const subject = getHeader(headers, 'Subject') || '(no subject)';
                                const body = extractBody(rawMsg.payload) || rawMsg.snippet || '';

                                const normalisedMsg = {
                                    id: rawMsg.id,
                                    from,
                                    to,
                                    subject,
                                    body,
                                    snippet: rawMsg.snippet
                                };

                                try {
                                    const { classifyPhishing } = await import('./phishing-detection');
                                    const analysis = await classifyPhishing(subject, body);
                                    if (analysis) {
                                        console.log(`[Phishing Hook] Analyzed message ${response.corsairEntityId}:`, analysis);
                                        await pool.query(
                                            `UPDATE corsair_entities 
                                             SET data = jsonb_set(data, '{phishingAnalysis}', $1::jsonb), updated_at = NOW() 
                                             WHERE id = $2`,
                                            [JSON.stringify(analysis), response.corsairEntityId]
                                        );

                                        const registerRes = await pool.query(
                                            `INSERT INTO processed_proactive_emails (entity_id) VALUES ($1) ON CONFLICT DO NOTHING`,
                                            [response.corsairEntityId]
                                        );

                                        if (registerRes.rowCount && registerRes.rowCount > 0) {
                                            // Auto-build daily context and trigger proactive AI if safe
                                            try {
                                                const tenantId = ctx.tenantId;
                                                if (tenantId) {
                                                    const { buildDailyContext, runProactiveAgent } = await import('./user-context');
                                                    const todayStr = new Date().toISOString().split('T')[0];
                                                    await buildDailyContext(tenantId, todayStr);

                                                    if (!analysis.isPhishing) {
                                                        // Trigger proactive agent run asynchronously with normalised message details
                                                        runProactiveAgent(tenantId, normalisedMsg).catch((err) => {
                                                            console.error('[Proactive Agent] Run error:', err);
                                                        });
                                                    }
                                                }
                                            } catch (err) {
                                                console.error('[Gmail Hook] Daily Context or Proactive Run failed:', err);
                                            }
                                        } else {
                                            console.log(`[Phishing Hook] Proactive run already triggered for message ${response.corsairEntityId}, skipping.`);
                                        }
                                    }
                                } catch (err) {
                                    console.error('[Phishing Hook] Error running phishing classification:', err);
                                }
                            }
                        }
                    }
                }
            }
        }),
        googlecalendar({
            webhookHooks: {
                onEventChanged: {
                    async after(ctx: any, response: any) {
                        const accountId = ctx.accountId;
                        if (!accountId) return;

                        if (response.type === 'eventCreated' || response.type === 'eventUpdated') {
                            const event = response.event;
                            if (!event || !event.id) return;

                            const existing = await pool.query(
                                `SELECT id FROM corsair_entities WHERE account_id = $1 AND entity_id = $2 AND entity_type = 'events'`,
                                [accountId, event.id]
                            );

                            if (existing.rows.length > 0) {
                                await pool.query(
                                    `UPDATE corsair_entities SET data = $1, updated_at = NOW() WHERE id = $2`,
                                    [event, existing.rows[0].id]
                                );
                            } else {
                                await pool.query(
                                    `INSERT INTO corsair_entities (id, account_id, entity_id, entity_type, version, data) VALUES (gen_random_uuid(), $1, $2, 'events', '1', $3)`,
                                    [accountId, event.id, event]
                                );
                            }

                            // Update Daily Context for the date range of the event
                            try {
                                const tenantId = ctx.tenantId || (await pool.query(
                                    `SELECT tenant_id FROM corsair_accounts WHERE id = $1 LIMIT 1`,
                                    [accountId]
                                )).rows[0]?.tenant_id;

                                if (tenantId) {
                                    const { updateContextForEvent } = await import('./user-context');
                                    await updateContextForEvent(tenantId, event);
                                }
                            } catch (err) {
                                console.error('[Calendar Hook] Context update failed:', err);
                            }
                        } else if (response.type === 'eventDeleted') {
                            await pool.query(
                                `DELETE FROM corsair_entities WHERE account_id = $1 AND entity_id = $2 AND entity_type = 'events'`,
                                [accountId, response.eventId]
                            );

                            // Rebuild context for today on deletion
                            try {
                                const tenantId = ctx.tenantId || (await pool.query(
                                    `SELECT tenant_id FROM corsair_accounts WHERE id = $1 LIMIT 1`,
                                    [accountId]
                                )).rows[0]?.tenant_id;

                                if (tenantId) {
                                    const { buildDailyContext } = await import('./user-context');
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    await buildDailyContext(tenantId, todayStr);
                                }
                            } catch (err) {
                                console.error('[Calendar Hook] Context rebuild on delete failed:', err);
                            }
                        }
                    }
                }
            }
        }),
        telegram({
            webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || 'superea_telegram_secret',
            webhookHooks: {
                message: {
                    message: {
                        async after(ctx: any, response: any) {
                            const message = response.data?.message;
                            if (!message?.text) return;
                            const text = message.text.trim();
                            const chatId = message.chat.id.toString();
                            console.log(`[Telegram Bot] Message received. chatId: ${chatId}, text: "${text}"`);
                            // 1. Handle /start (Onboarding Deep Linking)
                            if (text.startsWith('/start')) {
                                await sendTelegramMessage(chatId,
                                    "👋 *Welcome to SuperEA\!*\n\nPlease enter the 6\-digit connection code from your dashboard to connect your account\.",
                                    { parse_mode: 'MarkdownV2' }
                                );
                                return;
                            }

                            // 1.5 Handle Connection Code
                            if (/^\d{6}$/.test(text)) {
                                console.log(`[Telegram Bot] Validating connection code: ${text} for chatId: ${chatId}`);
                                // Check if code exists and is valid
                                const codeRes = await pool.query(
                                    `SELECT id FROM "user" WHERE telegram_connection_code = $1 AND telegram_code_expires_at > NOW() LIMIT 1`,
                                    [text]
                                );
                                if (codeRes.rows.length > 0) {
                                    const userId = codeRes.rows[0].id;
                                    console.log(`[Telegram Bot] Connection code matched successfully for user: ${userId}`);
                                    await pool.query(
                                        `UPDATE "user" SET telegram_chat_id = $1, telegram_state = 'idle', telegram_connection_code = NULL, telegram_code_expires_at = NULL WHERE id = $2`,
                                        [chatId, userId]
                                    );
                                    await sendTelegramMessage(chatId,
                                        "✅ *Account Successfully Connected\!*\n\nUse these commands to interact with your assistant:\n" +
                                        "• `/calendar` \- See upcoming events\n" +
                                        "• `/email` \- See recent emails\n" +
                                        "• `/chat` \- Enter chat mode with AI Agent",
                                        { parse_mode: 'MarkdownV2' }
                                    );
                                } else {
                                    await sendTelegramMessage(chatId,
                                        "❌ *Invalid or expired code\.* Please generate a new code from your dashboard and try again\.",
                                        { parse_mode: 'MarkdownV2' }
                                    );
                                }
                                return;
                            }

                            // Get the current state of the user and their real tenant ID
                            const userRes = await pool.query(
                                `SELECT id, telegram_state FROM "user" WHERE telegram_chat_id = $1 LIMIT 1`,
                                [chatId]
                            );

                            if (userRes.rows.length === 0) {
                                await sendTelegramMessage(chatId, "⚠️ You have not connected your account yet\. Please connect via the dashboard\.", { parse_mode: 'MarkdownV2' });
                                return;
                            }

                            const userId = userRes.rows[0].id;
                            const userState = userRes.rows[0].telegram_state || 'idle';

                            // 2. Handle /calendar Mode
                            if (text === '/calendar') {
                                await pool.query(`UPDATE "user" SET telegram_state = 'idle' WHERE telegram_chat_id = $1`, [chatId]);
                                
                                // Query synced events from corsair_entities for the user
                                const eventsRes = await pool.query(
                                    `SELECT e.data FROM corsair_entities e
                                     JOIN corsair_accounts a ON e.account_id = a.id
                                     WHERE e.entity_type = 'events' AND a.tenant_id = $1
                                     ORDER BY e.created_at DESC LIMIT 5`,
                                    [userId]
                                );
                                
                                if (eventsRes.rows.length === 0) {
                                    await sendTelegramMessage(chatId, '📅 No upcoming events found\.');
                                    return;
                                }
                                const eventLines = eventsRes.rows.map((row: any) => {
                                    const ev = row.data;
                                    const date = ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString() : 'All Day';
                                    return `• *${(ev.summary || 'Untitled').replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&')}*\n  Time: ${date}`;
                                }).join('\n\n');
                                await sendTelegramMessage(chatId, `📅 *Upcoming Events:*\n\n${eventLines}`, { parse_mode: 'MarkdownV2' });
                                return;
                            }

                            // 3. Handle /email Mode
                            if (text === '/email') {
                                await pool.query(`UPDATE "user" SET telegram_state = 'idle' WHERE telegram_chat_id = $1`, [chatId]);
                                
                                // Query synced email messages from corsair_entities for the user
                                const emailRes = await pool.query(
                                    `SELECT e.data FROM corsair_entities e
                                     JOIN corsair_accounts a ON e.account_id = a.id
                                     WHERE e.entity_type = 'messages' AND a.tenant_id = $1
                                     ORDER BY e.created_at DESC LIMIT 5`,
                                    [userId]
                                );
                                if (emailRes.rows.length === 0) {
                                    await sendTelegramMessage(chatId, '✉️ No recent emails found\.');
                                    return;
                                }
                                const emailLines = emailRes.rows.map((row: any) => {
                                    const msg = row.data;
                                    const subject = msg.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
                                    const from = msg.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown';
                                    return `• *Subject*: ${subject.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&')}\n  *From*: ${from.replace(/[_*\[\]()~`>#+\-=|{}.!]/g, '\\$&')}`;
                                }).join('\n\n');
                                await sendTelegramMessage(chatId, `✉️ *Recent Emails:*\n\n${emailLines}`, { parse_mode: 'MarkdownV2' });
                                return;
                            }

                            // 4. Handle /chat Command
                            if (text === '/chat') {
                                await pool.query(`UPDATE "user" SET telegram_state = 'chatting' WHERE telegram_chat_id = $1`, [chatId]);
                                await sendTelegramMessage(chatId,
                                    "💬 *Chat Mode Active\.* Write anything and your AI agent will respond\. Send `/exit` to stop chatting\.",
                                    { parse_mode: 'MarkdownV2' }
                                );
                                return;
                            }

                            // Exit Chat Mode
                            if (text === '/exit' && userState === 'chatting') {
                                await pool.query(`UPDATE "user" SET telegram_state = 'idle' WHERE telegram_chat_id = $1`, [chatId]);
                                await sendTelegramMessage(chatId, '🚪 Left Chat Mode\. Commands \(/calendar, /email\) are active\.');
                                return;
                            }

                            // 5. Handle AI Draft Improvement feedback
                            if (userState.startsWith('awaiting_improvement:')) {
                                const draftId = userState.split(':')[1];
                                await pool.query(`UPDATE "user" SET telegram_state = 'idle' WHERE telegram_chat_id = $1`, [chatId]);
                                
                                try {
                                    // Send loading/acknowledgement message
                                    const thinkingMsg: any = await sendTelegramMessage(chatId, '⚡ Rewriting draft email based on your feedback\.\.\.');

                                    // Fetch draft details
                                    const draftRes = await pool.query(`SELECT * FROM telegram_drafts WHERE id = $1`, [draftId]);
                                    if (draftRes.rows.length === 0) {
                                        await botClient.telegram.api.messages.sendMessage({
                                            chat_id: chatId,
                                            text: "❌ Draft not found."
                                        });
                                        return;
                                    }
                                    const draft = draftRes.rows[0];
                                    const emailDetails = JSON.parse(draft.email_details);

                                    // Call agent to rewrite
                                    const agent = await getCorsairAgent(userId);
                                    const prompt = `You are an AI assistant. You drafted this email draft:
To: ${emailDetails.to}
Subject: ${emailDetails.subject}
Body: ${emailDetails.body}

The user wants to edit/improve it with this feedback: "${text}"

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

                                    const agentText = agentResponse.text || "";
                                    const jsonMatch = agentText.match(/\{[\s\S]*\}/);
                                    if (!jsonMatch) {
                                        throw new Error("Failed to parse improved draft JSON from agent response: " + agentText);
                                    }

                                    const updatedDetails = JSON.parse(jsonMatch[0]);
                                    if (!updatedDetails.to || !updatedDetails.subject || !updatedDetails.body) {
                                        throw new Error("Invalid draft structure returned from agent: " + jsonMatch[0]);
                                    }

                                    // Ensure signature
                                    const userDetailsRes = await pool.query(`SELECT name FROM "user" WHERE id = $1 LIMIT 1`, [userId]);
                                    const userName = userDetailsRes.rows[0]?.name || 'User';
                                    if (!updatedDetails.body.includes(userName) && !updatedDetails.body.includes('Best Regards,')) {
                                        updatedDetails.body += `\n\nBest Regards,\n${userName}`;
                                    }

                                    // Update database
                                    await pool.query(
                                        `UPDATE telegram_drafts SET email_details = $1 WHERE id = $2`,
                                        [JSON.stringify(updatedDetails), draftId]
                                    );

                                    // If we had a previous message ID, edit it
                                    const inlineKeyboard = {
                                        inline_keyboard: [
                                            [
                                                { text: "✅ Approve & Send", callback_data: `email_approve:${draftId}` },
                                                { text: "❌ Discard", callback_data: `email_reject:${draftId}` }
                                            ],
                                            [
                                                { text: "✍️ Suggest Improvement", callback_data: `email_improve:${draftId}` }
                                            ]
                                        ]
                                    };
                                    const updatedText = `✉️ Draft Email Updated:\n\nTo: ${updatedDetails.to}\nSubject: ${updatedDetails.subject}\n\nBody:\n${updatedDetails.body}\n\nDo you want to send this email?`;
                                    if (draft.telegram_message_id) {
                                        await editTelegramMessage(chatId, parseInt(draft.telegram_message_id, 10), updatedText, { reply_markup: inlineKeyboard });
                                        // Delete the "Rewriting..." loading message
                                        const thinkingMsgId = thinkingMsg?.message_id;
                                        if (thinkingMsgId) await deleteTelegramMessage(chatId, thinkingMsgId);
                                    } else {
                                        await sendTelegramMessage(chatId, updatedText, { reply_markup: inlineKeyboard });
                                    }
                                } catch (err: any) {
                                    console.error('Improvement drafting error:', err);
                                    await sendTelegramMessage(chatId, `⚠️ Sorry, I encountered an error rewriting the draft: ${err.message}`);
                                }
                                return;
                            }

                            // 6. Handle AI Chat Mode Interaction
                            if (userState === 'chatting') {
                                try {
                                    const agent = await getCorsairAgent(userId);
                                    const agentResponse = await agent.generate([
                                        { role: 'user', content: text }
                                    ]);
                                    await sendTelegramMessage(chatId, agentResponse.text || 'I processed that request.');
                                } catch (err) {
                                    console.error('Agent chat error:', err);
                                    await sendTelegramMessage(chatId, '⚠️ Sorry, I encountered an error running your agent.');
                                }
                            }
                        }
                }
            },
            callbackQuery: {
                callbackQuery: {
                    async after(ctx: any, response: any) {
                        const callbackQuery = response.data?.callback_query;
                        if (!callbackQuery?.data) return;
                        const [action, payloadString] = callbackQuery.data.split(':');
                        const chatId = callbackQuery.message?.chat.id.toString();
                        console.log(`[Telegram Bot] Callback query received. chatId: ${chatId}, action: ${action}, payloadString: ${payloadString}`);
                        if (!chatId) return;

                        // Identify the user making the query
                        const userRes = await pool.query(
                            `SELECT id FROM "user" WHERE telegram_chat_id = $1 LIMIT 1`,
                            [chatId]
                        );
                        if (userRes.rows.length === 0) {
                            console.warn(`[Telegram Bot] Callback query warning: No user found with telegram_chat_id: ${chatId}`);
                            return;
                        }
                        const userId = userRes.rows[0].id;
                        console.log(`[Telegram Bot] User found: ${userId}. Initializing clients.`);

                        const userClient = corsair.withTenant(userId);

                        // Answer the callback query to remove Telegram's loading spinner
                        await answerTelegramCallbackQuery(callbackQuery.id);

                        // Handle Approve Action
                        if (action === 'email_approve') {
                            console.log(`[Telegram Bot] Processing email_approve action for draft: ${payloadString}`);
                            try {
                                const draftRes = await pool.query(`SELECT email_details FROM telegram_drafts WHERE id = $1`, [payloadString]);
                                if (draftRes.rows.length === 0) {
                                    console.warn(`[Telegram Bot] Approve failed: Draft ${payloadString} not found in database.`);
                                    await sendTelegramMessage(chatId, '❌ Draft not found or already processed.');
                                    return;
                                }
                                const emailDetails = JSON.parse(draftRes.rows[0].email_details);
                                const emailContent = `To: ${emailDetails.to}\nSubject: ${emailDetails.subject}\n\n${emailDetails.body}`;
                                const rawBase64Url = Buffer.from(emailContent)
                                    .toString('base64')
                                    .replace(/\+/g, '-')
                                    .replace(/\//g, '_')
                                    .replace(/=+$/, '');
                                
                                // Execute the email send via user's Gmail API plugin
                                await userClient.gmail.api.messages.send({
                                    userId: 'me',
                                    raw: rawBase64Url
                                });

                                // Edit original message to show action completed via bot
                                await editTelegramMessage(
                                    chatId,
                                    callbackQuery.message?.message_id,
                                    `✅ Approved and Sent:\n\nTo: ${emailDetails.to}\nSubject: ${emailDetails.subject}\n\nStatus: Sent successfully.`
                                );

                                // Update the draft status
                                await pool.query(`UPDATE telegram_drafts SET status = 'approved' WHERE id = $1`, [payloadString]);
                                console.log(`[Telegram Bot] Email approved, sent, and status updated for draft: ${payloadString}`);
                            } catch (err: any) {
                                console.error(`[Telegram Bot] Error executing email approval:`, err);
                                await sendTelegramMessage(chatId, `❌ Failed to send email: ${err.message}`);
                            }
                        }

                        // Handle Reject Action
                        if (action === 'email_reject') {
                            console.log(`[Telegram Bot] Processing email_reject action for draft: ${payloadString}`);
                            await editTelegramMessage(chatId, callbackQuery.message?.message_id, '❌ Draft Rejected & Discarded.');
                            await pool.query(`UPDATE telegram_drafts SET status = 'rejected' WHERE id = $1`, [payloadString]);
                            console.log(`[Telegram Bot] Email rejected and status updated for draft: ${payloadString}`);
                        }

                        // Handle Improve Action
                        if (action === 'email_improve') {
                            console.log(`[Telegram Bot] Processing email_improve action for draft: ${payloadString}`);
                            await sendTelegramMessage(chatId, '✍️ Please type and send your suggested improvements for this draft email. I will automatically rewrite it for you.');
                            await pool.query(
                                `UPDATE "user" SET telegram_state = $1 WHERE id = $2`,
                                [`awaiting_improvement:${payloadString}`, userId]
                            );
                            console.log(`[Telegram Bot] User state updated to awaiting_improvement for draft: ${payloadString}`);
                        }
                    }
                }
            }
        }
    })
    ],
    database: pool,
    kek: process.env.CORSAIR_KEK!,
    multiTenancy: true
});