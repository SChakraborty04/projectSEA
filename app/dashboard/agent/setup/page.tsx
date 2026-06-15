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
      <div className="mb-8 border-b-4 border-black dark:border-white pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">Setup AI Agent</h1>
        <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-2 leading-relaxed">
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
