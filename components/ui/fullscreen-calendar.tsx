"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  SearchIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"

export interface Event {
  id: string | number
  name: string
  datetime: string
}

export interface CalendarData {
  day: Date
  events: Event[]
}

export interface FullScreenCalendarProps {
  data: CalendarData[]
  selectedDay?: Date
  onSelectDay?: (day: Date) => void
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

export function FullScreenCalendar({ data, selectedDay: controlledSelectedDay, onSelectDay }: FullScreenCalendarProps) {
  const today = startOfToday()
  const [internalSelectedDay, setInternalSelectedDay] = React.useState(today)
  const selectedDay = controlledSelectedDay !== undefined ? controlledSelectedDay : internalSelectedDay

  const handleSelectDay = (day: Date) => {
    if (controlledSelectedDay === undefined) {
      setInternalSelectedDay(day)
    }
    if (onSelectDay) {
      onSelectDay(day)
    }
  }

  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy"),
  )
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Calendar Header */}
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
              <h1 className="p-1 text-xs uppercase text-muted-foreground">
                {format(today, "MMM")}
              </h1>
              <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
                <span>{format(today, "d")}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground">
                {format(firstDayCurrentMonth, "MMMM, yyyy")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <Button variant="outline" size="icon" className="hidden lg:flex">
            <SearchIcon size={16} strokeWidth={2} aria-hidden="true" />
          </Button>

          <Separator orientation="vertical" className="hidden h-6 lg:block" />

          <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
            <Button
              onClick={previousMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to previous month"
            >
              <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
            <Button
              onClick={goToToday}
              className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto"
              variant="outline"
            >
              Today
            </Button>
            <Button
              onClick={nextMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to next month"
            >
              <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
            </Button>
          </div>

          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <Separator
            orientation="horizontal"
            className="block w-full md:hidden"
          />

          <Button className="w-full gap-2 md:w-auto">
            <PlusCircleIcon size={16} strokeWidth={2} aria-hidden="true" />
            <span>New Event</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col min-h-0">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border text-center text-xs font-semibold leading-6 lg:flex-none">
          <div className="border-r py-2.5">Sun</div>
          <div className="border-r py-2.5">Mon</div>
          <div className="border-r py-2.5">Tue</div>
          <div className="border-r py-2.5">Wed</div>
          <div className="border-r py-2.5">Thu</div>
          <div className="border-r py-2.5">Fri</div>
          <div className="py-2.5">Sat</div>
        </div>

        {/* Calendar Days */}
        <div className="flex text-xs leading-6 lg:flex-auto min-h-0">
          <div 
            className="hidden w-full border-x lg:grid lg:grid-cols-7 h-full"
            style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))` }}
          >
            {days.map((day, dayIdx) =>
              !isDesktop ? (
                <button
                  onClick={() => handleSelectDay(day)}
                  key={dayIdx}
                  type="button"
                  className={cn(
                    isEqual(day, selectedDay) && "bg-primary/10 border-primary text-primary",
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      isSameMonth(day, firstDayCurrentMonth) &&
                      "text-foreground",
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      "text-muted-foreground",
                    (isEqual(day, selectedDay) || isToday(day)) &&
                      "font-semibold",
                    "flex flex-col border-b border-r px-2 py-2 hover:bg-muted focus:z-10 overflow-hidden",
                  )}
                >
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "ml-auto flex size-6 items-center justify-center rounded-full",
                      isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "bg-primary text-primary-foreground",
                      isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </time>
                  {data.filter((date) => isSameDay(date.day, day) && date.events.length > 0).length > 0 && (
                    <div className="mt-auto flex flex-wrap-reverse gap-0.5">
                      {data
                        .filter((date) => isSameDay(date.day, day) && date.events.length > 0)
                        .map((date) =>
                          date.events.map((event) => (
                            <span
                              key={event.id}
                              className="h-1.5 w-1.5 rounded-full bg-primary"
                            />
                          ))
                        )}
                    </div>
                  )}
                </button>
              ) : (
                <div
                  key={dayIdx}
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      "bg-accent/50 text-muted-foreground",
                    isEqual(day, selectedDay) && "bg-primary/10",
                    "relative flex flex-col border-b border-r hover:bg-muted focus:z-10 cursor-pointer overflow-hidden min-h-0",
                    !isEqual(day, selectedDay) && "hover:bg-accent/75",
                  )}
                >
                  <header className="flex items-center justify-between p-2.5">
                    <button
                      type="button"
                      className={cn(
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          isSameMonth(day, firstDayCurrentMonth) &&
                          "text-foreground",
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          !isSameMonth(day, firstDayCurrentMonth) &&
                          "text-muted-foreground",
                        isEqual(day, selectedDay) &&
                          isToday(day) &&
                          "border-none bg-primary text-primary-foreground",
                        isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          "bg-foreground text-background",
                        (isEqual(day, selectedDay) || isToday(day)) &&
                          "font-semibold",
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border",
                      )}
                    >
                      <time dateTime={format(day, "yyyy-MM-dd")}>
                        {format(day, "d")}
                      </time>
                    </button>
                    {data.filter((date) => isSameDay(date.day, day) && date.events.length > 0).length > 0 && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </header>
                  <div className="flex-1 p-1 overflow-hidden min-h-0">
                    {data
                      .filter((event) => isSameDay(event.day, day))
                      .map((dayData) => (
                        <div key={dayData.day.toString()} className="space-y-1.5">
                          {dayData.events.slice(0, 1).map((event) => (
                            <div
                              key={event.id}
                              className="flex flex-col items-start gap-1 rounded-lg border bg-muted/50 p-2 text-xs leading-tight"
                            >
                              <p className="font-medium leading-none">
                                {event.name}
                              </p>
                              <p className="leading-none text-muted-foreground">
                                {event.datetime
                                  ? new Intl.DateTimeFormat(undefined, {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                    }).format(new Date(event.datetime))
                                  : 'All Day'}
                              </p>
                            </div>
                          ))}
                          {dayData.events.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              + {dayData.events.length - 1} more
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ),
            )}
          </div>

          <div 
            className="isolate grid w-full grid-cols-7 border-x lg:hidden h-full"
            style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))` }}
          >
            {days.map((day, dayIdx) => (
              <button
                onClick={() => handleSelectDay(day)}
                key={dayIdx}
                type="button"
                className={cn(
                  isEqual(day, selectedDay) && "bg-primary/10 border-primary text-primary",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    isSameMonth(day, firstDayCurrentMonth) &&
                    "text-foreground",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    "text-muted-foreground",
                  (isEqual(day, selectedDay) || isToday(day)) &&
                    "font-semibold",
                  "flex flex-col border-b border-r px-2 py-2 hover:bg-muted focus:z-10 overflow-hidden",
                )}
              >
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "ml-auto flex size-6 items-center justify-center rounded-full",
                    isEqual(day, selectedDay) &&
                      isToday(day) &&
                      "bg-primary text-primary-foreground",
                    isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      "bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </time>
                {data.filter((date) => isSameDay(date.day, day) && date.events.length > 0).length > 0 && (
                  <div className="mt-auto flex flex-wrap-reverse gap-0.5">
                    {data
                      .filter((date) => isSameDay(date.day, day) && date.events.length > 0)
                      .map((date) =>
                        date.events.map((event) => (
                          <span
                            key={event.id}
                            className="h-1.5 w-1.5 rounded-full bg-primary"
                          />
                        ))
                      )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
