"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-09", desktop: 59, mobile: 110 },
  { date: "2024-04-10", desktop: 261, mobile: 190 },
  { date: "2024-04-11", desktop: 327, mobile: 350 },
  { date: "2024-04-12", desktop: 292, mobile: 210 },
  { date: "2024-04-13", desktop: 342, mobile: 380 },
  { date: "2024-04-14", desktop: 137, mobile: 220 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-16", desktop: 138, mobile: 190 },
  { date: "2024-04-17", desktop: 446, mobile: 360 },
  { date: "2024-04-18", desktop: 364, mobile: 410 },
  { date: "2024-04-19", desktop: 243, mobile: 180 },
  { date: "2024-04-20", desktop: 89, mobile: 150 },
  { date: "2024-04-21", desktop: 137, mobile: 200 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-23", desktop: 138, mobile: 230 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-04-25", desktop: 215, mobile: 250 },
  { date: "2024-04-26", desktop: 75, mobile: 130 },
  { date: "2024-04-27", desktop: 383, mobile: 420 },
  { date: "2024-04-28", desktop: 122, mobile: 180 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-04-30", desktop: 454, mobile: 380 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-02", desktop: 293, mobile: 310 },
  { date: "2024-05-03", desktop: 247, mobile: 190 },
  { date: "2024-05-04", desktop: 385, mobile: 420 },
  { date: "2024-05-05", desktop: 481, mobile: 390 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-07", desktop: 388, mobile: 300 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-09", desktop: 227, mobile: 180 },
  { date: "2024-05-10", desktop: 293, mobile: 330 },
  { date: "2024-05-11", desktop: 335, mobile: 270 },
  { date: "2024-05-12", desktop: 197, mobile: 240 },
]

const chartConfig = {
  emails: {
    label: "Emails Synced",
    color: "#3b82f6",
  },
  meetings: {
    label: "Meetings Scheduled",
    color: "#10b981",
  },
} satisfies ChartConfig

interface ChartAreaProps {
  data?: Array<{ date: string; emails: number; meetings: number }>;
}

export function ChartAreaInteractive({ data = [] }: ChartAreaProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("7d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let daysToSubtract = 7
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "90d") {
      daysToSubtract = 90
    }
    
    const now = new Date()
    const startDate = new Date()
    startDate.setDate(now.getDate() - daysToSubtract)
    
    return sorted.filter((item) => {
      const date = new Date(item.date)
      return date >= startDate
    })
  }, [data, timeRange]);

  return (
    <Card className="@container/card border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none bg-white dark:bg-[#1C1C1F] overflow-hidden">
      <CardHeader className="pb-4 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-5">
        <div>
          <CardTitle className="text-lg font-black uppercase tracking-wider text-black dark:text-white">Activity Volume</CardTitle>
          <CardDescription className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-1">
            Emails synced and calendar meetings scheduled over time
          </CardDescription>
        </div>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex gap-2"
          >
            <ToggleGroupItem value="90d" className="border-2 border-black dark:border-white rounded-none font-black uppercase text-[10px] tracking-wider hover:bg-[#FFD93D] dark:hover:bg-[#db6802] data-[state=on]:bg-[#FFD93D] dark:data-[state=on]:bg-[#db6802] data-[state=on]:text-black hover:text-black transition-all">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d" className="border-2 border-black dark:border-white rounded-none font-black uppercase text-[10px] tracking-wider hover:bg-[#FFD93D] dark:hover:bg-[#db6802] data-[state=on]:bg-[#FFD93D] dark:data-[state=on]:bg-[#db6802] data-[state=on]:text-black hover:text-black transition-all">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d" className="border-2 border-black dark:border-white rounded-none font-black uppercase text-[10px] tracking-wider hover:bg-[#FFD93D] dark:hover:bg-[#db6802] data-[state=on]:bg-[#FFD93D] dark:data-[state=on]:bg-[#db6802] data-[state=on]:text-black hover:text-black transition-all">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 border-2 border-black dark:border-white rounded-none font-bold uppercase text-[10px] tracking-wider bg-white dark:bg-black text-black dark:text-white **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
              <SelectItem value="90d" className="rounded-none font-bold uppercase text-[10px]">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-none font-bold uppercase text-[10px]">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-none font-bold uppercase text-[10px]">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillEmails" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#3b82f6"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="#3b82f6"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMeetings" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#10b981"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="#10b981"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="meetings"
              type="natural"
              fill="url(#fillMeetings)"
              stroke="#10b981"
              stackId="a"
            />
            <Area
              dataKey="emails"
              type="natural"
              fill="url(#fillEmails)"
              stroke="#3b82f6"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
