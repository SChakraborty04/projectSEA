import { Agent } from '@mastra/core/agent';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { MastraProvider } from '@corsair-dev/mcp';
import { corsair } from '@/lib/corsair';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { requestEmailApproval } from './telegram-approval';

export async function getCorsairAgent(tenantId: string, historyTranscript: string = "") {
    const activeCorsair = typeof corsair.withTenant === 'function' ? (corsair as any).withTenant(tenantId) : corsair;
    
    const provider = new MastraProvider();
    const toolsArray = await provider.build({ corsair: activeCorsair });

    const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
        extraBody: {
            max_tokens: 4096
        }
    });

    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const requestEmailApprovalTool = createTool({
        id: 'request_email_approval',
        description: 'Send a draft email to the user\'s Telegram bot for approval before sending. Use this tool whenever the user asks you to write, draft, or send an email, so they can explicitly approve/send or reject it from their Telegram chat.',
        inputSchema: z.object({
            to: z.string().regex(/@/, "Must be a valid email address containing an @ symbol").describe("Recipient email address (MUST be a valid email format like name@domain.com, not just a person's name)"),
            subject: z.string().describe('Subject of the email'),
            body: z.string().describe('Body content of the email')
        }),
        execute: async (input) => {
            return await requestEmailApproval(tenantId, input);
        }
    });

    const agentTools = Object.fromEntries([
        ...toolsArray.map((t: any) => [t.id || t.name, t]),
        ['request_email_approval', requestEmailApprovalTool]
    ]);

    const agent = new Agent({
        id: 'corsair-agent',
        name: 'corsair-agent',
        model: openrouter('google/gemini-3.1-flash-lite'),
        instructions: `You have access to Corsair tools. You MUST follow this strict 3-step sequence for every request:
1. EXPLORE: Always use the \`list_operations\` tool first to discover the exact names of the APIs you need. Never claim you cannot do something without checking list_operations.
2. VERIFY: You MUST ALWAYS use the \`get_schema\` tool on the specific operation before writing any code. NEVER guess, assume, or hallucinate API shapes, parameter names (like 'id' vs 'eventId'), or object nesting.
3. EXECUTE: Finally, use the \`run_script\` tool. Your code MUST strictly match the schema returned by get_schema.

CRITICAL CONTEXT:
Current Date and Time: ${now.toISOString()}
User Timezone: ${timeZone}
- When creating calendar events, ALWAYS format the start/end times in the user's local timezone (e.g., using proper offsets like +05:30) rather than defaulting to UTC, unless requested otherwise. Also when returning a time based response, make sure it is formatted in the user's timezone.
- NO OVERLAPPING EVENTS: Whenever scheduling or booking a calendar event, you MUST ALWAYS check the user's availability/existing events for that time window first (e.g. using 'googlecalendar.api.calendar.getAvailability' or listing events via 'googlecalendar.api.events.getMany'). If the desired slot is not empty (i.e. there is any conflict or overlap), you MUST NOT schedule the event. Instead, inform the user that the slot is taken and ask them to select another time.
- EMAIL APPROVALS: When asked to write or send an email, ALWAYS use the 'request_email_approval' tool first to request approval from the user via Telegram instead of sending the email directly using Gmail tools, unless explicitly directed otherwise.
- MISSING EMAIL ADDRESSES: If the user asks you to email a specific person by name (e.g., "Torrent X") but doesn't provide their email address, you MUST first search their Gmail history to find it. Use \`gmail.api.messages.list\` with the \`q\` parameter (e.g., \`q: "Torrent X"\`) to find recent emails, then fetch the message to extract their email address from the headers.

FORMATTING INSTRUCTIONS:
Always format your final response to the user cleanly. Provide a positive confirmation detailing what was done or explain any failure clearly.${historyTranscript}`,
        tools: agentTools,
    });

    return agent;
}

