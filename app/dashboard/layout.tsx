import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { agentProfiles } from "@/db/schema/agent"
import { eq } from "drizzle-orm"
import { VapiProvider } from "@/components/vapi-provider"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"

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
      <div id="dashboard-wrapper" className="flex min-h-screen w-full bg-[#FFFDF5] dark:bg-[#121214] text-black dark:text-white">
        <style dangerouslySetInnerHTML={{__html: `
          #dashboard-wrapper,
          #dashboard-wrapper * {
            border-radius: 0px !important;
            --radius: 0px !important;
            --radius-sm: 0px !important;
            --radius-md: 0px !important;
            --radius-lg: 0px !important;
            --radius-xl: 0px !important;
            --radius-2xl: 0px !important;
            --radius-3xl: 0px !important;
          }
          #dashboard-wrapper {
            --background: #FFFDF5 !important;
            --foreground: #000000 !important;
            --card: #FFFDF5 !important;
            --card-foreground: #000000 !important;
            --popover: #FFFDF5 !important;
            --popover-foreground: #000000 !important;
            --border: #000000 !important;
            --input: #000000 !important;
            --sidebar: #FFFDF5 !important;
            --sidebar-foreground: #000000 !important;
            --sidebar-border: #000000 !important;
          }
          .dark #dashboard-wrapper {
            --background: #121214 !important;
            --foreground: #ffffff !important;
            --card: #1C1C1F !important;
            --card-foreground: #ffffff !important;
            --popover: #121214 !important;
            --popover-foreground: #ffffff !important;
            --border: #ffffff !important;
            --input: #ffffff !important;
            --sidebar: #121214 !important;
            --sidebar-foreground: #ffffff !important;
            --sidebar-border: #ffffff !important;
          }
          #dashboard-wrapper [data-slot="sidebar-inset"] {
            margin: 0px !important;
            border-left: 4px solid var(--sidebar-border) !important;
            box-shadow: none !important;
            background-color: var(--background) !important;
          }
          #dashboard-wrapper ::-webkit-scrollbar {
            width: 12px !important;
            height: 12px !important;
          }
          #dashboard-wrapper ::-webkit-scrollbar-track {
            background: #FFFDF5 !important;
            border-left: 4px solid #000000 !important;
          }
          .dark #dashboard-wrapper ::-webkit-scrollbar-track {
            background: #121214 !important;
            border-left: 4px solid #ffffff !important;
          }
          #dashboard-wrapper ::-webkit-scrollbar-thumb {
            background-color: #000000 !important;
            border: 2px solid #FFFDF5 !important;
          }
          .dark #dashboard-wrapper ::-webkit-scrollbar-thumb {
            background-color: #ffffff !important;
            border: 2px solid #121214 !important;
          }
        `}} />
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <KeyboardShortcuts />
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col bg-[#FFFDF5] dark:bg-[#121214]">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </VapiProvider>
  )
}