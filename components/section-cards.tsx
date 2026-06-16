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
      {/* Emails Synced Card */}
      <Card className="@container/card border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#fff] transition-all duration-75">
        <CardHeader className="pb-3 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-4 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2 w-full">
            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60 pt-0.5">
              Emails Synced
            </CardDescription>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-[#C4B5FD] text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
              Gmail Active
            </span>
          </div>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-black dark:text-white mt-1">
            {stats.totalEmails}
          </CardTitle>
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
      
      {/* Threats Filtered Card */}
      <Card className="@container/card border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#fff] transition-all duration-75">
        <CardHeader className="pb-3 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-4 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2 w-full">
            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60 pt-0.5">
              Threats Filtered
            </CardDescription>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-[#FF6B6B] text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
              DistilBERT active
            </span>
          </div>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-[#FF6B6B] dark:text-[#ff8f8f] mt-1">
            {stats.phishingEmails}
          </CardTitle>
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

      {/* Pending Approvals Card */}
      <Card className="@container/card border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#fff] transition-all duration-75">
        <CardHeader className="pb-3 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-4 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2 w-full">
            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60 pt-0.5">
              Pending Approvals
            </CardDescription>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-[#FFD93D] text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
              Awaiting Action
            </span>
          </div>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-black dark:text-white mt-1">
            {stats.pendingDrafts}
          </CardTitle>
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

      {/* Scheduled Meetings Card */}
      <Card className="@container/card border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#fff] transition-all duration-75">
        <CardHeader className="pb-3 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-4 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2 w-full">
            <CardDescription className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60 pt-0.5">
              Scheduled Meetings
            </CardDescription>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 bg-white text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] whitespace-nowrap">
              Calendar Sync
            </span>
          </div>
          <CardTitle className="text-3xl font-black tabular-nums tracking-tighter text-black dark:text-white mt-1">
            {stats.totalEvents}
          </CardTitle>
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
  );
}
