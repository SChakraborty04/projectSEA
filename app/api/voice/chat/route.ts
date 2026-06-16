import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getCorsairAgent } from '@/lib/agent';

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const tenantId = session?.user?.id;
    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, history } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Load the Mastra agent
    const agent = await getCorsairAgent(tenantId, history || "");

    // Execute the agent in blocking mode to resolve all tool calls
    const result = await agent.generate(text, {
      maxSteps: 15
    });

    return NextResponse.json({ 
      text: result.text,
      toolCalls: result.toolCalls || []
    });

  } catch (error: any) {
    console.error("Voice Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
