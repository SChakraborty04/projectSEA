import { getSession } from "@/lib/session"
import { db } from "@/db"
import { agentProfiles } from "@/db/schema/agent"
import { user } from "@/db/schema/auth"
import { eq } from "drizzle-orm"
import { AgentSetupForm } from "@/components/agent-setup-form"

export default async function SetupAgentPage() {
  const session = await getSession();
  let existingProfile = null;
  let currentUser = null;

  if (session?.user?.id) {
    const profiles = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, session.user.id));
    if (profiles.length > 0) {
      existingProfile = profiles[0];
    }
    const users = await db.select().from(user).where(eq(user.id, session.user.id));
    if (users.length > 0) {
      currentUser = users[0];
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Setup AI Agent</h1>
        <p className="text-muted-foreground mt-2">
          Configure your personal AI assistant. The assistant will handle your calls, check your availability, and schedule meetings on your calendar.
        </p>
      </div>
      
      <AgentSetupForm 
        initialData={existingProfile} 
        userId={session?.user?.id} 
        telegramChatId={currentUser?.telegramChatId} 
      />
    </div>
  )
}
