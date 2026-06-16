"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { logout } from "@/actions/logout"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVerticalCircle01Icon, UserCircle02Icon, CreditCardIcon, Notification03Icon, Logout01Icon } from "@hugeicons/core-free-icons"

import Link from "next/link"

function getInitials(name?: string) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-none border-t-4 border-black dark:border-white h-14 hover:bg-[#FFFDF5] dark:hover:bg-black uppercase font-black tracking-wider text-xs"
            >
              <Avatar className="h-8 w-8 rounded-none border-2 border-black dark:border-white grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-none">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-black">{user.name}</span>
                <span className="truncate text-[10px] font-bold text-muted-foreground lowercase">
                  {user.email}
                </span>
              </div>
              <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-none border-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] p-1.5"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm border-b-2 border-black dark:border-white pb-3">
                <Avatar className="h-8 w-8 rounded-none border-2 border-black dark:border-white">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-none">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-black uppercase text-xs">{user.name}</span>
                  <span className="truncate text-[10px] font-bold text-muted-foreground lowercase">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <div className="h-1 bg-black dark:bg-white my-1" />
            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuItem asChild className="hover:bg-[#FFD93D] dark:hover:bg-[#db6802] hover:text-black dark:hover:text-white rounded-none cursor-pointer font-bold uppercase tracking-wider text-[10px] p-2.5 flex items-center gap-2 transition-all">
                <Link href="/dashboard/account" className="flex items-center gap-2 w-full">
                  <HugeiconsIcon icon={UserCircle02Icon} strokeWidth={2} className="size-4" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-[#FFD93D] dark:hover:bg-[#db6802] hover:text-black dark:hover:text-white rounded-none cursor-pointer font-bold uppercase tracking-wider text-[10px] p-2.5 flex items-center gap-2 transition-all">
                <Link href="/dashboard/billing" className="flex items-center gap-2 w-full">
                  <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} className="size-4" />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#FFD93D] dark:hover:bg-[#db6802] hover:text-black dark:hover:text-white rounded-none cursor-pointer font-bold uppercase tracking-wider text-[10px] p-2.5 flex items-center gap-2 transition-all">
                <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} className="size-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <div className="h-0.5 bg-black/10 dark:bg-white/10 my-1" />
            <DropdownMenuItem onClick={() => void logout()} className="hover:bg-[#FF6B6B] dark:hover:bg-red-700 hover:text-white rounded-none cursor-pointer font-bold uppercase tracking-wider text-[10px] p-2.5 flex items-center gap-2 transition-all">
              <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
