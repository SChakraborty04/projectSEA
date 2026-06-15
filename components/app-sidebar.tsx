import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSquare01Icon, Mail01Icon, Calendar01Icon, Settings05Icon, HelpCircleIcon, SearchIcon, CommandIcon, ChatIcon } from "@hugeicons/core-free-icons"
import { Plus } from "lucide-react"

import { getSession } from "@/lib/session"
import { db } from "@/db"
import { agentProfiles } from "@/db/schema/agent"
import { eq } from "drizzle-orm"
import { AgentMicButton } from "@/components/agent-mic-button"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Chat",
      url: "/dashboard/chat",
      icon: (
        <HugeiconsIcon icon={ChatIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Email",
      url: "/dashboard/email",
      icon: (
        <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Calendar",
      url: "/dashboard/calendar",
      icon: (
        <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} />
      ),
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: (
        <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Get Help",
      url: "#",
      icon: (
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
      ),
    },
  ],
}

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
   const session = await getSession();
   let agentProfile = null;
   if (session?.user?.id) {
     const profiles = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, session.user.id));
     if (profiles.length > 0) {
       agentProfile = profiles[0];
     }
   }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 py-2">
          <SidebarMenu>
            <SidebarMenuItem>
              {agentProfile ? (
                <SidebarMenuButton
                  className="data-[slot=sidebar-menu-button]:p-1.5! h-auto bg-muted/50 border border-border"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <HugeiconsIcon icon={CommandIcon} strokeWidth={2} className="size-4 text-primary" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold">{agentProfile.agentName}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">{agentProfile.companyName || "AI Assistant"}</span>
                      </div>
                    </div>
                    <AgentMicButton />
                  </div>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  asChild
                  className="data-[slot=sidebar-menu-button]:p-1.5! bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground h-10"
                >
                  <Link href="/dashboard/agent/setup" className="flex items-center justify-center gap-2 w-full">
                    <Plus className="size-4" />
                    <span className="font-semibold">Setup Agent!</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
        user={{
            name: session?.user?.name ?? "Guest",
            email: session?.user?.email ?? "",
            avatar: session?.user?.image ?? "",
          }} 
        />
      </SidebarFooter>
    </Sidebar>
  )
}
