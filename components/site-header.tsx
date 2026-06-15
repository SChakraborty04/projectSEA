"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/chat": "Chat",
  "/dashboard/email": "Email",
  "/dashboard/calendar": "Calendar",
}

export function SiteHeader() {
  const pathname = usePathname()

  const title = pathname ? pageTitles[pathname] ?? "Dashboard" : "Dashboard"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) relative z-20">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 border-2 border-black dark:border-white rounded-none bg-white dark:bg-black text-black dark:text-white hover:bg-[#FFD93D] hover:text-black shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] p-1.5 transition-all" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4 bg-black/20 dark:bg-white/20"
        />
        <h1 className="text-base font-black uppercase tracking-wider text-black dark:text-white">{title}</h1>
      </div>
    </header>
  )
}
