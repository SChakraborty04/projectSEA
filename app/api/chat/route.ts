
import { Mastra } from '@mastra/core';
import { getSession } from '@/lib/session';
import { handleChatStream } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import { getCorsairAgent } from '@/lib/agent';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        const accountId = session?.user?.id;
        if (!accountId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }

        const body = await req.json();
        console.log("REQUEST BODY:", JSON.stringify(body, null, 2));
        const { messages, timezone } = body;

        const allMessages = body.messages || [];
        const latestMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;

        let historyTranscript = "";
        if (allMessages.length > 1) {
            historyTranscript = "\n\n--- PREVIOUS CHAT HISTORY ---\n" + allMessages.slice(0, -1).map((m: any) => {
                let text = "";
                if (m.parts) {
                    text = m.parts.filter((p:any) => p.type === 'text').map((p:any) => p.text).join(' ');
                } else if (m.content) {
                    text = m.content;
                }
                if (!text) return ""; // Skip empty or tool-only messages in the transcript
                return `${m.role.toUpperCase()}: ${text}`;
            }).filter(Boolean).join("\n");
        }

        const agent = await getCorsairAgent(accountId, historyTranscript, timezone);

        const mastra = new Mastra({
            agents: {
                'corsair-agent': agent
            }
        });

        // The user specifically requested to only send the latest message to the agent,
        // while the frontend useChat hook maintains the visual history.
        if (latestMessage) {
            body.messages = [latestMessage];
        }

        const stream = await handleChatStream({
            mastra,
            agentId: 'corsair-agent',
            params: {
                ...body,
                maxSteps: 15,
                maxTokens: 4096
            }
        });

        return createUIMessageStreamResponse({ stream: stream as any });
        
    } catch (error: any) {
        console.error("API ROUTE ERROR:", error);
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), { status: 500 });
    }
}
