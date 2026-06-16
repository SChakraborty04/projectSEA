// app/api/vapi/setup/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { agentProfiles } from '@/db/schema/agent';
import { user } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
    const session = await getSession();
    const tenantId = session?.user?.id;
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    
    // Fetch the full name of the user from the user table
    const userRecord = await db.select().from(user).where(eq(user.id, tenantId)).limit(1);
    const fullName = userRecord.length > 0 ? userRecord[0].name : session.user.name;

    // 1. Compile all database parameters into a highly descriptive Vapi System Prompt
    const systemPrompt = `You are ${body.agentName}, speaking directly to ${fullName}, who is the ${body.designation} at ${body.companyName}.
    - Company: ${body.companyName}
    - Designation/Title: ${body.designation}
    - Business Description: ${body.businessDescription}
    - Working Days: ${body.workingDays.join(', ')}
    - Working Hours: ${body.workingHoursStart} to ${body.workingHoursEnd} (Timezone: ${body.timezone})
    - Buffer Time: Keep a ${body.bufferMinutes}-minute gap between meetings.
    - Specific Instructions: ${body.customInstructions}

    Be professional, direct, and act like a personal assistant speaking to ${fullName} in-browser (always address them by their name, ${fullName}). Politely check availability, draft messages, and schedule meetings on their Google Calendar.
    CRITICAL: Once the user's booking/scheduling request is successfully completed, or if the conversation has naturally finished (e.g. they say goodbye or thanks), say a polite closing statement and immediately call the endCall tool to hang up and call off the call.`;

    // 2. Prepare payload for Vapi
    const vapiPayload = {
        name: body.agentName.substring(0, 40),
        firstMessage: body.firstMessage || "Hello, how can I help you today?",
        endCallMessage: "Thank you for calling. Have a great day, goodbye.",
        endCallPhrases: [
            "goodbye",
            "take care",
            "have a good day",
            "bye bye",
            "talk to you later"
        ],
        silenceTimeoutSeconds: 30,
        hooks: [
            {
                on: "customer.speech.timeout",
                do: [
                    {
                        type: "say",
                        exact: "Are you still there? Let me know if you need any help scheduling."
                    }
                ],
                options: {
                    timeoutSeconds: 10
                }
            }
        ],
        transcriber: {
            provider: "deepgram",
            model: "nova-3",
            language: "en"
        },
        model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }],
            tools: [
                {
                    type: "endCall"
                },
                {
                    type: "function",
                    function: {
                        name: "delegateTask",
                        description: "Delegate a complex task (like checking availability, scheduling a meeting, or sending an email) to the internal AI agent. The internal agent has full access to the user's calendar and email APIs.",
                        parameters: {
                            type: "object",
                            properties: {
                                instruction: { type: "string", description: "The exact instruction to pass to the internal agent. Include all gathered details such as dates, times, names, emails, and the desired action." }
                            },
                            required: ["instruction"]
                        }
                    },
                    messages: [
                        { type: "request-start", content: "Let me process that for you." },
                        { type: "request-complete", content: "The task has been completed." }
                    ]
                }
            ]
        },
        voice: {
            provider: "cartesia",
            model: "sonic-3.5",
            voiceId: (!body.agentVoice || body.agentVoice === 'nova' || body.agentVoice === 'openai-alloy')
                ? "57dcab65-68ac-45a6-8480-6c4c52ec1cd1"
                : body.agentVoice
        },
        // Point Vapi back to your server for tool execution (we will pass tenantId in the query)
        serverUrl: `${process.env.APP_URL}/api/vapi/webhook?tenantId=${tenantId}`,
    };

    // 3. Send to Vapi (Bypassed in alpha - using local Mastra / Cartesia voice loop)
    let assistantId = "custom-mastra-voice";

    // 4. Save/Update your local DB
    // Remove vapiAssistantId from body so it doesn't overwrite our new assistantId
    const { vapiAssistantId: _removed, ...restBody } = body;

    await db.insert(agentProfiles)
        .values({
            userId: tenantId,
            ...restBody,
            vapiAssistantId: assistantId,
        })
        .onConflictDoUpdate({
            target: agentProfiles.userId,
            set: { ...restBody, vapiAssistantId: assistantId }
        });

    return NextResponse.json({ success: true, vapiAssistantId: assistantId });
}
