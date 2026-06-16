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
      title: "Dashboard Tour",
      url: "#tour",
      icon: (
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Agent Settings",
      url: "/dashboard/agent/setup",
      icon: (
        <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Contact Support",
      url: "mailto:hello@sandipan.ch",
      icon: (
        <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
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
    <Sidebar collapsible="offcanvas" {...props} className="border-r-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214]">
      <SidebarHeader className="border-b-4 border-black dark:border-white p-4 h-(--header-height) flex items-center justify-center bg-[#FFFDF5] dark:bg-black z-20">
        <div className="flex items-center gap-2 font-black uppercase text-base text-black dark:text-white w-full">
          <span>SUPEREA</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-[#FFD93D] dark:bg-[#db6802] border-2 border-black dark:border-white text-black dark:text-white font-black leading-none normal-case">v1 α</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#FFFDF5] dark:bg-[#121214]">
        <div className="px-3 py-3">
          {agentProfile ? (
            <div className="border-4 border-black dark:border-white bg-white dark:bg-[#1C1C1F] p-2.5 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] flex items-center justify-between w-full">
              <Link href="/dashboard/agent/setup" className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 border-2 border-black dark:border-white bg-[#C4B5FD] dark:bg-[#9061F9] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/bot.svg" 
                    alt="Agent Logo" 
                    className="size-7 object-contain dark:invert" 
                  />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-xs font-black uppercase truncate max-w-[120px] text-black dark:text-white">{agentProfile.agentName}</span>
                  <span className="text-[9px] font-bold text-black/60 dark:text-white/60 truncate max-w-[120px]">{agentProfile.companyName || "AI Assistant"}</span>
                </div>
              </Link>
              <AgentMicButton />
            </div>
          ) : (
            <Link 
              href="/dashboard/agent/setup" 
              className="flex items-center justify-center gap-2 w-full h-10 border-4 border-black dark:border-white bg-[#FFD93D] hover:bg-[#ffbe25] text-black font-black uppercase text-xs tracking-wider shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75"
            >
              <Plus className="size-4" />
              <span>Setup Agent</span>
            </Link>
          )}
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
