"use client"

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignCircleIcon, Mail01Icon } from "@hugeicons/core-free-icons"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">

        <SidebarMenu className="gap-2 px-1">
          {items.map((item) => {
            const isActive =
              pathname === item.url ||
              pathname === item.url + "/" ||
              (pathname?.startsWith(item.url + "/") && item.url !== "/dashboard")
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  tooltip={item.title} 
                  isActive={isActive}
                  className={`w-full rounded-none border-2 border-transparent h-10 px-3 uppercase font-black text-xs tracking-wider transition-all duration-75 ${
                    isActive 
                      ? "bg-[#FFD93D] text-black border-black border-4 shadow-[3px_3px_0px_0px_#000] dark:bg-[#db6802] dark:text-white dark:border-white dark:shadow-[3px_3px_0px_0px_#fff] hover:bg-[#FFD93D] dark:hover:bg-[#db6802]" 
                      : "hover:bg-[#FFFDF5] dark:hover:bg-black hover:border-black dark:hover:border-white hover:shadow-[3px_3px_0px_0px_#000] dark:hover:shadow-[3px_3px_0px_0px_#fff]"
                  }`}
                >
                  <Link href={item.url} className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
