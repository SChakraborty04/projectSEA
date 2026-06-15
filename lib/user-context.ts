import { pool } from '../db/index';
import { generateText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { getCorsairAgent } from './agent';

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    extraBody: {
        max_tokens: 4096
    }
});
const model = openrouter('google/gemini-3.1-flash-lite');

export async function buildDailyContext(userId: string, dateStr: string) {
    try {
        console.log(`[Daily Context] Building context for user ${userId} on date ${dateStr}...`);
        
        // 1. Fetch emails for this user
        const emailsRes = await pool.query(
            `SELECT e.data FROM corsair_entities e
             JOIN corsair_accounts a ON e.account_id = a.id
             WHERE e.entity_type = 'messages' AND a.tenant_id = $1`,
            [userId]
        );
        
        const dailyEmails = emailsRes.rows.filter((row: any) => {
            const m = row.data;
            if (!m) return false;
            const emailDate = m.internalDate ? new Date(Number(m.internalDate)) : new Date(m.createdAt || row.created_at);
            const datePart = emailDate.toISOString().split('T')[0];
            return datePart === dateStr;
        });

        // 2. Fetch calendar events for this user
        const eventsRes = await pool.query(
            `SELECT e.data FROM corsair_entities e
             JOIN corsair_accounts a ON e.account_id = a.id
             WHERE e.entity_type = 'events' AND a.tenant_id = $1`,
            [userId]
        );
        
        const dailyEvents = eventsRes.rows.filter((row: any) => {
            const ev = row.data;
            if (!ev) return false;
            const startStr = ev.start?.dateTime || ev.start?.date;
            if (!startStr) return false;
            const startDatePart = new Date(startStr).toISOString().split('T')[0];
            const endStr = ev.end?.dateTime || ev.end?.date;
            const endDatePart = endStr ? new Date(endStr).toISOString().split('T')[0] : startDatePart;
            return dateStr >= startDatePart && dateStr <= endDatePart;
        });

        if (dailyEmails.length === 0 && dailyEvents.length === 0) {
            console.log(`[Daily Context] No emails or events on ${dateStr} for user ${userId}. Deleting context if exists.`);
            await pool.query(
                `DELETE FROM user_daily_contexts WHERE user_id = $1 AND date = $2`,
                [userId, dateStr]
            );
            return;
        }

        // 3. Construct summaries
        const emailSummaries = dailyEmails.map((e: any) => {
            const headers = e.payload?.headers;
            const getHeader = (name: string) => headers?.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
            const subject = e.subject || getHeader('Subject') || '(no subject)';
            const from = e.from || getHeader('From');
            const to = e.to || getHeader('To');
            const isPhish = e.phishingAnalysis?.isPhishing ? " [PHISHING WARNING]" : "";
            return `- EMAIL FROM: ${from}\n  TO: ${to}\n  SUBJECT: ${subject}${isPhish}\n  SNIPPET: ${e.snippet}`;
        }).join('\n');

        const eventSummaries = dailyEvents.map((ev: any) => {
            const start = ev.start?.dateTime || ev.start?.date || '';
            const end = ev.end?.dateTime || ev.end?.date || '';
            return `- CALENDAR EVENT: ${ev.summary || 'Untitled'}\n  START: ${start}\n  END: ${end}\n  DESCRIPTION: ${ev.description || 'N/A'}`;
        }).join('\n');

        // 4. Summarize using LLM
        const prompt = `
You are an AI assistant helping to build a clean, chronological "Daily Context" log for a user.
This log summarizes the user's activities, communications, and agenda for a specific day.

Date: ${dateStr}

Here are the emails received/sent on this day:
${emailSummaries || 'No emails.'}

Here are the calendar events scheduled for this day:
${eventSummaries || 'No calendar events.'}

Please write a concise, structured markdown summary (around 1-2 paragraphs plus bullet points) of the daily context.
Highlight important meetings, tasks mentioned in emails, urgent topics, and a timeline of the day's events.
Do not hallucinate any information not provided in the inputs. Keep it focused only on the provided data.
`;

        const { text } = await generateText({
            model,
            prompt,
        });

        // 5. Upsert daily context
        await pool.query(
            `INSERT INTO user_daily_contexts (id, user_id, date, context, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, NOW())
             ON CONFLICT (user_id, date) 
             DO UPDATE SET context = EXCLUDED.context, updated_at = NOW()`,
            [userId, dateStr, text]
        );
        console.log(`[Daily Context] Successfully built context for user ${userId} on date ${dateStr}.`);
    } catch (err) {
        console.error(`[Daily Context] Error building context for user ${userId} on ${dateStr}:`, err);
    }
}

export async function updateContextForEvent(userId: string, event: any) {
    try {
        const startStr = event.start?.dateTime || event.start?.date;
        const endStr = event.end?.dateTime || event.end?.date;
        if (!startStr) return;
        
        const startDate = new Date(startStr);
        const endDate = endStr ? new Date(endStr) : startDate;
        
        let current = new Date(startDate.toISOString().split('T')[0]);
        const end = new Date(endDate.toISOString().split('T')[0]);
        
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            await buildDailyContext(userId, dateStr);
            current.setDate(current.getDate() + 1);
        }
    } catch (err) {
        console.error(`[Daily Context] Error updating context for event for user ${userId}:`, err);
    }
}

export async function runProactiveAgent(userId: string, msg: any) {
    try {
        console.log(`[Proactive Agent] Triggering proactive agent run for user ${userId}...`);
        const agent = await getCorsairAgent(userId);
        
        const prompt = `
You are a proactive AI assistant. A new legitimate (non-phishing) email has arrived for the user:
From: ${msg.from}
To: ${msg.to}
Subject: ${msg.subject}
Snippet: ${msg.snippet}
Body: ${msg.body}

Analyze this email and determine if any of the following proactive actions are required:
1. RESPONSE REQUIRED: If the email asks the user a direct question, requests info, or requires a reply, draft a reply and send it for approval using the 'request_email_approval' tool.
2. SCHEDULING REQUEST: If the sender requests a meeting or calendar invite (e.g. suggesting times, asking to meet):
   - First check the user's availability and working hours start/end times.
   - If the user is available at the requested time, schedule the invite using the calendar tool (like creating an event).
   - If there is a conflict or overlap, draft a reply email suggesting alternative times (or requesting approval to reschedule).

Make sure to execute any required tools to perform these actions. If no proactive action is needed, simply explain why in your final response.
`;
        const result = await agent.generate([
            { role: 'user', content: prompt }
        ]);
        console.log(`[Proactive Agent] Run completed. Result:`, result.text);
    } catch (err) {
        console.error(`[Proactive Agent] Error running proactive agent for user ${userId}:`, err);
    }
}
