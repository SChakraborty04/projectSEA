"use client"

import * as React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Calendar as CalendarIcon, RefreshCw, AlertCircle, Loader2, Globe } from "lucide-react"
import { format, isSameDay, startOfToday } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarData } from "@/components/ui/fullscreen-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function GoogleCalendarSignInButton({ onConnect, isLoading }: { onConnect: () => void; isLoading: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-4 md:p-6">
      {/* Animated calendar icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-2xl shadow-emerald-500/30">
          <CalendarIcon className="h-12 w-12 text-white" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-2xl font-bold tracking-tight">Connect Google Calendar</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Sign in with Google to sync your calendar events. Your schedule will be fetched securely and kept up to date in real time.
        </p>
      </div>

      <Button
        size="lg"
        onClick={onConnect}
        disabled={isLoading}
        className="gap-3 h-12 px-8 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        ) : (
          <Globe className="h-5 w-5 text-emerald-500" />
        )}
        <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
      </Button>

      <p className="text-xs text-muted-foreground max-w-xs text-center">
        We only request read access to your Calendar. Your data is encrypted and never shared.
      </p>
    </div>
  )
}

export default function CalendarPage() {
  const searchParams = useSearchParams()

  const [connectionState, setConnectionState] = useState<'checking' | 'connected' | 'not_connected' | 'error'>('checking')
  const [isConnecting, setIsConnecting] = useState(false)
  const [data, setData] = useState<CalendarData[]>([])
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [selectedDay, setSelectedDay] = useState<Date>(startOfToday())

  // ── Fetch connection status ──────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/status')
      const json = await res.json()
      setConnectionState(json.connected ? 'connected' : 'not_connected')
      return json.connected as boolean
    } catch {
      setConnectionState('error')
      return false
    }
  }, [])

  // ── Poll from local DB ──────────────────────────────────────────────────
  const fetchFromDb = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const res = await fetch('/api/calendar/events')
      const json = await res.json()
      
      // We must map string dates back to Date objects
      const parsedData: CalendarData[] = (json.data || []).map((d: any) => ({
        day: new Date(d.day),
        events: d.events
      }))

      setData(parsedData)
      setLastRefreshed(new Date())
    } catch {
      // silently fail — retry on next poll
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // ── Register webhook after OAuth redirect ────────────────────────────────
  const registerWebhook = useCallback(async () => {
    try {
      await fetch('/api/calendar/register-webhook', { method: 'POST' })
    } catch {
      // non-critical
    }
  }, [])

  // ── Start polling every 10 seconds ───────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(() => {
      fetchFromDb()
    }, 60_000)
  }, [fetchFromDb])

  // ── Handle Google connect button click ──────────────────────────────────
  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const res = await fetch('/api/calendar/connect')
      const json = await res.json()
      if (json.url) {
        window.location.href = json.url
      }
    } catch {
      setIsConnecting(false)
    }
  }

  // ── On mount ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const connected = searchParams?.get('connected')
    const error = searchParams?.get('error')

    if (connected === 'true') {
      setConnectionState('connected')
      registerWebhook()
      fetchFromDb()
      startPolling()
    } else if (error) {
      setConnectionState('error')
    } else {
      checkStatus().then((isConnected) => {
        if (isConnected) {
          fetchFromDb()
          startPolling()
        }
      })
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [searchParams, checkStatus, fetchFromDb, registerWebhook, startPolling])


  const selectedDayEvents = React.useMemo(() => {
    const dayData = data.find(d => isSameDay(d.day, selectedDay))
    const events = dayData?.events || []
    
    // Sort events in ascending order of start time (earliest first)
    return [...events].sort((a, b) => {
      const timeA = a.datetime ? new Date(a.datetime).getTime() : 0
      const timeB = b.datetime ? new Date(b.datetime).getTime() : 0
      return timeA - timeB
    })
  }, [data, selectedDay])

  if (connectionState === 'checking') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (connectionState === 'not_connected') {
    return <GoogleCalendarSignInButton onConnect={handleConnect} isLoading={isConnecting} />
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            View and manage your schedule.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {connectionState === 'connected' && (
            <div className="flex flex-col items-end mr-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Connected to Calendar
              </div>
              {lastRefreshed && (
                <span className="text-xs text-muted-foreground/70">
                  Last updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}

          {connectionState === 'connected' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFromDb}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
            </Button>
          )}
        </div>
      </div>

      {connectionState === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            There was a problem connecting to your Google Calendar. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {connectionState === 'connected' && (
        <div className="flex flex-col md:flex-row gap-8 h-full min-h-0 items-start">
          {/* Calendar Takes up left space (50%) */}
          <div className="w-full md:w-1/2 flex-none">
             <Calendar 
                mode="single"
                selected={selectedDay} 
                onSelect={(day) => day && setSelectedDay(day)} 
                className="w-full rounded-2xl border bg-card/50 shadow-sm p-6 [&_table]:w-full [&_td]:w-full [&_th]:w-full"
                classNames={{
                  root: "w-full",
                  months: "relative w-full flex flex-col",
                  month: "w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full mt-4",
                  head_cell: "text-muted-foreground font-medium text-sm flex-1",
                  row: "flex w-full mt-2",
                  cell: "flex-1 p-0 text-center text-sm relative [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-12 md:h-16 w-full p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-xl transition-all",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground font-bold shadow-md",
                  day_today: "bg-accent text-accent-foreground font-bold",
                  day_outside: "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_hidden: "invisible",
                } as any}
                modifiers={{
                  hasEvent: (date) => data.some(d => d.events.length > 0 && isSameDay(d.day, date))
                }}
                modifiersClassNames={{
                  hasEvent: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100 font-medium"
                }}
             />
          </div>

          {/* Tasks for the selected day (50%) */}
          <div className="w-full md:w-1/2 flex-none overflow-y-auto pr-2 pb-8 h-[80vh]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium tracking-tight">
                {format(selectedDay, "EEEE, MMMM d")}
              </h2>
              <div className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {selectedDayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-2xl bg-card/30 border-dashed">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No events scheduled</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Enjoy your free time!</p>
                </div>
              ) : (
                selectedDayEvents.map((event) => (
                  <div key={event.id} className="group relative flex flex-col gap-1 p-4 rounded-2xl border bg-card/50 hover:bg-card hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-medium text-foreground">{event.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500/80"></span>
                          {event.time}
                        </p>
                      </div>
                    </div>
                    {(event as any).location && (
                      <div className="mt-2 text-sm text-muted-foreground/80 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        {(event as any).location}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
