import { NextResponse } from 'next/server';
import { getCorsairAgent } from '@/lib/agent';

export async function POST(req: Request) {
    try {
        const url = new URL(req.url);
        const tenantId = url.searchParams.get('tenantId');
        
        const body = await req.json();
        
        // Vapi sends a message object
        const message = body?.message;
        const messageType = message?.type;
        
        console.log(`[Vapi Webhook] Received ${messageType || 'unknown'} for tenant ${tenantId}`);

        if (messageType === 'tool-calls') {
            const toolCalls = message.toolWithToolCallList;
            const results = [];

            for (const item of toolCalls) {
                const toolCall = item.toolCall;
                const functionName = toolCall.function.name;
                const args = typeof toolCall.function.arguments === 'string' 
                    ? JSON.parse(toolCall.function.arguments || '{}') 
                    : (toolCall.function.arguments || {});

                console.log(`[Vapi Webhook] Executing tool: ${functionName}`, args);

                if (functionName === 'delegateTask') {
                    if (!tenantId) {
                        results.push({ toolCallId: toolCall.id, result: "No tenantId available." });
                        continue;
                    }

                    try {
                        const agent = await getCorsairAgent(tenantId);
                        
                        const res = await agent.generate([
                            { role: 'user', content: args.instruction }
                        ]);

                        results.push({
                            toolCallId: toolCall.id,
                            result: res.text
                        });
                    } catch (e: any) {
                        results.push({
                            toolCallId: toolCall.id,
                            result: `Failed to execute task: ${e.message}`
                        });
                    }
                } else {
                    results.push({
                        toolCallId: toolCall.id,
                        result: "Unknown function."
                    });
                }
            }

            // Return the array of tool call results to Vapi
            return NextResponse.json({ results }, { status: 200 });
        }

        // For other messages (like status-update, end-of-call-report), just return 200 OK
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("[Vapi Webhook] Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
