import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/db';
import { agentProfiles } from '@/db/schema/agent';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profiles = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, session.user.id)).limit(1);
    if (profiles.length === 0) {
      return NextResponse.json({ 
        name: "SuperEA", 
        voiceId: "57dcab65-68ac-45a6-8480-6c4c52ec1cd1", 
        firstMessage: "Hello, how can I help you today?",
        userName: session.user.name || "User"
      });
    }

    const profile = profiles[0];
    return NextResponse.json({
      name: profile.agentName || "SuperEA",
      voiceId: profile.agentVoice || "57dcab65-68ac-45a6-8480-6c4c52ec1cd1",
      firstMessage: profile.firstMessage || "Hello, how can I help you today?",
      userName: session.user.name || "User"
    });

  } catch (error: any) {
    console.error("Failed to fetch voice status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
