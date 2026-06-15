"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChartUpIcon, ChartDownIcon } from "@hugeicons/core-free-icons"

interface SectionCardsProps {
  stats?: {
    totalEmails: number;
    phishingEmails: number;
    pendingDrafts: number;
    totalEvents: number;
  };
}

export function SectionCards({ stats = { totalEmails: 0, phishingEmails: 0, pendingDrafts: 0, totalEvents: 0 } }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#fff] transition-all duration-75">
        <CardHeader className="pb-3 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-4 relative">
          <CardDescription className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60">Emails Synced</CardDescription>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-black dark:text-white mt-1">
            {stats.totalEmails}
          </CardTitle>
          <CardAction className="absolute top-4 right-4">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-[#C4B5FD] text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
              Gmail Active
            </span>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 p-4 text-xs font-bold uppercase tracking-wider">
          <div className="line-clamp-1 flex gap-2 font-black text-black dark:text-white">
            Realtime sync active
          </div>
          <div className="text-black/60 dark:text-white/60 text-[10px]">
            Cached local messages
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#fff] transition-all duration-75">
        <CardHeader className="pb-3 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-4 relative">
          <CardDescription className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60">Threats Filtered</CardDescription>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-[#FF6B6B] dark:text-[#ff8f8f] mt-1">
            {stats.phishingEmails}
          </CardTitle>
          <CardAction className="absolute top-4 right-4">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-[#FF6B6B] text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
              DistilBERT active
            </span>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 p-4 text-xs font-bold uppercase tracking-wider">
          <div className="line-clamp-1 flex gap-2 font-black text-[#FF6B6B]">
            Phishing blocked
          </div>
          <div className="text-black/60 dark:text-white/60 text-[10px]">
            Scans incoming body/snippet
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#fff] transition-all duration-75">
        <CardHeader className="pb-3 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-4 relative">
          <CardDescription className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60">Pending Approvals</CardDescription>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-black dark:text-white mt-1">
            {stats.pendingDrafts}
          </CardTitle>
          <CardAction className="absolute top-4 right-4">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-[#FFD93D] text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
              Awaiting Action
            </span>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 p-4 text-xs font-bold uppercase tracking-wider">
          <div className="line-clamp-1 flex gap-2 font-black text-black dark:text-white">
            Telegram & Web drafts
          </div>
          <div className="text-black/60 dark:text-white/60 text-[10px]">
            Requires user confirmation
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#fff] transition-all duration-75">
        <CardHeader className="pb-3 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-4 relative">
          <CardDescription className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60">Scheduled Meetings</CardDescription>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-black dark:text-white mt-1">
            {stats.totalEvents}
          </CardTitle>
          <CardAction className="absolute top-4 right-4">
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-white text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000]">
              Calendar Sync
            </span>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1 p-4 text-xs font-bold uppercase tracking-wider">
          <div className="line-clamp-1 flex gap-2 font-black text-black dark:text-white">
            Active calendar sync
          </div>
          <div className="text-black/60 dark:text-white/60 text-[10px]">
            Conflict check active
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
