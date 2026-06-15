import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { agentProfiles } from "@/db/schema/agent"
import { eq } from "drizzle-orm"
import { VapiProvider } from "@/components/vapi-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/signin")
  }

  let vapiAssistantId = null;
  if (session?.user?.id) {
    const profiles = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, session.user.id));
    if (profiles.length > 0) {
      vapiAssistantId = profiles[0].vapiAssistantId;
    }
  }

  return (
    <VapiProvider 
      vapiPublicKey={process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ""} 
      vapiAssistantId={vapiAssistantId}
    >
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </VapiProvider>
  )
}