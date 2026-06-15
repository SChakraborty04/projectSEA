import 'dotenv/config';
import { createCorsair } from 'corsair';
import { gmail } from '@corsair-dev/gmail';
import { googlecalendar } from '@corsair-dev/googlecalendar';
import { pool } from '../db/index';
import { telegram } from '@corsair-dev/telegram';
import { getCorsairAgent } from './agent';

export const corsair = createCorsair({
    plugins: [
        gmail(),
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
                        } else if (response.type === 'eventDeleted') {
                            await pool.query(
                                `DELETE FROM corsair_entities WHERE account_id = $1 AND entity_id = $2 AND entity_type = 'events'`,
                                [accountId, response.eventId]
                            );
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
                            const botClient = corsair.withTenant('default'); // The global bot client

                            // 1. Handle /start (Onboarding Deep Linking)
                            if (text.startsWith('/start')) {
                                await botClient.telegram.api.messages.sendMessage({
                                    chat_id: chatId,
                                    text: "👋 *Welcome to SuperEA!*\n\nPlease enter the 6-digit connection code from your dashboard to connect your account.",
                                    parse_mode: 'Markdown'
                                });
                                return;
                            }

                            // 1.5 Handle Connection Code
                            if (/^\d{6}$/.test(text)) {
                                // Check if code exists and is valid
                                const codeRes = await pool.query(
                                    `SELECT id FROM "user" WHERE telegram_connection_code = $1 AND telegram_code_expires_at > NOW() LIMIT 1`,
                                    [text]
                                );
                                if (codeRes.rows.length > 0) {
                                    const userId = codeRes.rows[0].id;
                                    await pool.query(
                                        `UPDATE "user" SET telegram_chat_id = $1, telegram_state = 'idle', telegram_connection_code = NULL, telegram_code_expires_at = NULL WHERE id = $2`,
                                        [chatId, userId]
                                    );
                                    await botClient.telegram.api.messages.sendMessage({
                                        chat_id: chatId,
                                        text: "✅ *Account Successfully Connected!*\n\nUse these commands to interact with your assistant:\n" +
                                              "• `/calendar` - See upcoming events\n" +
                                              "• `/email` - See recent emails\n" +
                                              "• `/chat` - Enter chat mode with AI Agent\n",
                                        parse_mode: 'Markdown'
                                    });
                                } else {
                                    await botClient.telegram.api.messages.sendMessage({
                                        chat_id: chatId,
                                        text: "❌ *Invalid or expired code.*\nPlease generate a new code from your dashboard and try again.",
                                        parse_mode: 'Markdown'
                                    });
                                }
                                return;
                            }

                            // Get the current state of the user and their real tenant ID
                            const userRes = await pool.query(
                                `SELECT id, telegram_state FROM "user" WHERE telegram_chat_id = $1 LIMIT 1`,
                                [chatId]
                            );

                            if (userRes.rows.length === 0) {
                                await botClient.telegram.api.messages.sendMessage({
                                    chat_id: chatId,
                                    text: "⚠️ You have not connected your account yet. Please connect via the dashboard."
                                });
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
                                    await botClient.telegram.api.messages.sendMessage({ chat_id: chatId, text: "📅 No upcoming events found." });
                                    return;
                                }
                                const eventLines = eventsRes.rows.map((row: any) => {
                                    const ev = row.data;
                                    const date = ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString() : 'All Day';
                                    return `• *${ev.summary || 'Untitled'}*\n  Time: ${date}`;
                                }).join('\n\n');
                                await botClient.telegram.api.messages.sendMessage({
                                    chat_id: chatId,
                                    text: `📅 *Upcoming Events:*\n\n${eventLines}`,
                                    parse_mode: 'Markdown'
                                });
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
                                    await botClient.telegram.api.messages.sendMessage({ chat_id: chatId, text: "✉️ No recent emails found." });
                                    return;
                                }
                                const emailLines = emailRes.rows.map((row: any) => {
                                    const msg = row.data;
                                    const subject = msg.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
                                    const from = msg.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Unknown';
                                    return `• *Subject*: ${subject}\n  *From*: ${from}`;
                                }).join('\n\n');
                                await botClient.telegram.api.messages.sendMessage({
                                    chat_id: chatId,
                                    text: `✉️ *Recent Emails:*\n\n${emailLines}`,
                                    parse_mode: 'Markdown'
                                });
                                return;
                            }

                            // 4. Handle /chat Command
                            if (text === '/chat') {
                                await pool.query(`UPDATE "user" SET telegram_state = 'chatting' WHERE telegram_chat_id = $1`, [chatId]);
                                await botClient.telegram.api.messages.sendMessage({
                                    chat_id: chatId,
                                    text: "💬 *Chat Mode Active.*\nWrite anything and your AI agent will respond. Send `/exit` to stop chatting."
                                });
                                return;
                            }

                            // Exit Chat Mode
                            if (text === '/exit' && userState === 'chatting') {
                                await pool.query(`UPDATE "user" SET telegram_state = 'idle' WHERE telegram_chat_id = $1`, [chatId]);
                                await botClient.telegram.api.messages.sendMessage({
                                    chat_id: chatId,
                                    text: "🚪 Left Chat Mode. Commands (/calendar, /email) are active."
                                });
                                return;
                            }

                            // 5. Handle AI Chat Mode Interaction
                            if (userState === 'chatting') {
                                // Run the message through your Mastra Agent
                                try {
                                    const agent = await getCorsairAgent(userId);
                                    const agentResponse = await agent.generate([
                                        { role: 'user', content: text }
                                    ]);
                                    
                                    await botClient.telegram.api.messages.sendMessage({
                                        chat_id: chatId,
                                        text: agentResponse.text || "I processed that request."
                                    });
                                } catch (err) {
                                    console.error('Agent chat error:', err);
                                    await botClient.telegram.api.messages.sendMessage({
                                        chat_id: chatId,
                                        text: "⚠️ Sorry, I encountered an error running your agent."
                                    });
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
                        if (!chatId) return;

                        // Identify the user making the query
                        const userRes = await pool.query(
                            `SELECT id FROM "user" WHERE telegram_chat_id = $1 LIMIT 1`,
                            [chatId]
                        );
                        if (userRes.rows.length === 0) return;
                        const userId = userRes.rows[0].id;

                        const botClient = corsair.withTenant('default');
                        const userClient = corsair.withTenant(userId);

                        // Answer the callback query to remove Telegram's loading spinner
                        await botClient.telegram.api.callback.answerCallbackQuery({
                            callback_query_id: callbackQuery.id
                        });

                        // Handle Approve Action
                        if (action === 'email_approve') {
                            try {
                                const draftRes = await pool.query(`SELECT email_details FROM telegram_drafts WHERE id = $1`, [payloadString]);
                                if (draftRes.rows.length === 0) {
                                    await botClient.telegram.api.messages.sendMessage({
                                        chat_id: chatId,
                                        text: "❌ Draft not found or already processed."
                                    });
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
                                await botClient.telegram.api.messages.editMessageText({
                                    chat_id: chatId,
                                    message_id: callbackQuery.message?.message_id,
                                    text: `✅ *Approved and Sent:*\n\n*To:* ${emailDetails.to}\n*Subject:* ${emailDetails.subject}\n\n*Status:* Sent successfully.`,
                                    parse_mode: 'Markdown'
                                });

                                // Update the draft status
                                await pool.query(`UPDATE telegram_drafts SET status = 'approved' WHERE id = $1`, [payloadString]);
                            } catch (err: any) {
                                await botClient.telegram.api.messages.sendMessage({
                                    chat_id: chatId,
                                    text: `❌ Failed to send email: ${err.message}`
                                });
                            }
                        }

                        // Handle Reject Action
                        if (action === 'email_reject') {
                            await botClient.telegram.api.messages.editMessageText({
                                chat_id: chatId,
                                message_id: callbackQuery.message?.message_id,
                                text: `❌ *Draft Rejected & Discarded.*`,
                                parse_mode: 'Markdown'
                            });
                            await pool.query(`UPDATE telegram_drafts SET status = 'rejected' WHERE id = $1`, [payloadString]);
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