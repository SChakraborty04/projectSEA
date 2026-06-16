"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
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
  const router = useRouter()
  const [pendingDrafts, setPendingDrafts] = useState<any[]>([])
  const prevPendingIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    let active = true;

    const checkDrafts = async () => {
      try {
        const res = await fetch("/api/drafts");
        if (res.ok && active) {
          const data = await res.json();
          const drafts = data.drafts || [];
          const pending = drafts.filter((d: any) => d.status === "pending");
          setPendingDrafts(pending);

          const currentIds = new Set<string>(pending.map((d: any) => d.id));
          const prevIds = prevPendingIdsRef.current;

          const newIds = [...currentIds].filter(id => !prevIds.has(id));
          if (newIds.length > 0 && prevIds.size > 0) {
            newIds.forEach(id => {
              const newDraft = pending.find((d: any) => d.id === id);
              if (newDraft) {
                let details = { to: '', subject: '' };
                try {
                  details = JSON.parse(newDraft.emailDetails);
                } catch (e) {}
                
                toast.info(`New Email Draft Awaiting Approval`, {
                  description: `Subject: ${details.subject || "No Subject"} to ${details.to}`,
                  action: {
                    label: "Review",
                    onClick: () => {
                      router.push(`/dashboard?draft=${newDraft.id}`);
                    }
                  },
                  duration: 8000
                });
              }
            });
          }
          prevPendingIdsRef.current = currentIds;
        }
      } catch (err) {
        console.error("Failed to fetch drafts in navigation:", err);
      }
    };

    checkDrafts();
    const interval = setInterval(checkDrafts, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [router]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-none border-t-4 border-black dark:border-white h-14 hover:bg-[#FFFDF5] dark:hover:bg-black uppercase font-black tracking-wider text-xs"
            >
              <div className="relative size-8 shrink-0">
                <Avatar className="h-8 w-8 rounded-none border-2 border-black dark:border-white grayscale">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-none">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                {pendingDrafts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FF6B6B] text-black text-[9px] font-black w-4.5 h-4.5 flex items-center justify-center border-2 border-black rounded-none shadow-[1px_1px_0px_0px_#000]">
                    {pendingDrafts.length}
                  </span>
                )}
              </div>
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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="hover:bg-[#FFD93D] dark:hover:bg-[#db6802] hover:text-black dark:hover:text-white rounded-none cursor-pointer font-bold uppercase tracking-wider text-[10px] p-2.5 flex items-center justify-between transition-all w-full data-[state=open]:bg-[#FFD93D] dark:data-[state=open]:bg-[#db6802] data-[state=open]:text-black dark:data-[state=open]:text-white">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={Notification03Icon} strokeWidth={2} className="size-4" />
                    <span>Notifications</span>
                  </div>
                  {pendingDrafts.length > 0 && (
                    <span className="ml-auto mr-1 bg-[#FF6B6B] text-black border-2 border-black font-black text-[9px] px-1.5 py-0.5 shadow-[1px_1px_0px_0px_#000]">
                      {pendingDrafts.length}
                    </span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="min-w-64 max-w-80 rounded-none border-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] p-1.5 z-[100]">
                    <DropdownMenuLabel className="font-black uppercase tracking-wider text-[9px] text-black/60 dark:text-white/60 p-2 border-b-2 border-black/10 dark:border-white/10 mb-1">
                      Pending Approvals
                    </DropdownMenuLabel>
                    {pendingDrafts.length === 0 ? (
                      <div className="p-4 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        No new notifications
                      </div>
                    ) : (
                      pendingDrafts.slice(0, 5).map((draft) => {
                        let details = { to: '', subject: '', body: '' };
                        try {
                          details = JSON.parse(draft.emailDetails);
                        } catch (e) {}
                        return (
                          <DropdownMenuItem
                            key={draft.id}
                            onClick={() => {
                              router.push(`/dashboard?draft=${draft.id}`);
                            }}
                            className="hover:bg-[#FFD93D] dark:hover:bg-[#db6802] hover:text-black dark:hover:text-white rounded-none cursor-pointer p-2 flex flex-col items-start gap-1 transition-all border-b border-black/5 dark:border-white/5 last:border-0"
                          >
                            <div className="flex justify-between items-center w-full gap-2">
                              <span className="font-black uppercase text-[9px] tracking-wide text-black dark:text-white truncate max-w-[150px]">
                                {details.subject || "No Subject"}
                              </span>
                              <span className="bg-[#FFD93D] text-[8px] font-black text-black border border-black px-1 scale-90 whitespace-nowrap">
                                PENDING
                              </span>
                            </div>
                            <span className="text-[8px] font-bold text-black/60 dark:text-white/60 lowercase truncate w-full">
                              To: {details.to}
                            </span>
                          </DropdownMenuItem>
                        );
                      })
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
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
