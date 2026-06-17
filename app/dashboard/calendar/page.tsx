"use client"

import * as React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Calendar as CalendarIcon, RefreshCw, AlertCircle, Loader2, Globe, 
  Check, Sparkles, Sparkle, SendHorizontal, MessageSquare 
} from "lucide-react"
import { format, isSameDay, startOfToday } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarData } from "@/components/ui/fullscreen-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { toast } from 'sonner'
import { AgentMicButton } from '@/components/agent-mic-button'
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'

function GoogleCalendarSignInButton({ onConnect, isLoading }: { onConnect: () => void; isLoading: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6 bg-[#FFFDF5] dark:bg-[#121214]">
      {/* Brutalist calendar icon */}
      <div className="relative">
        <div className="relative flex h-24 w-24 items-center justify-center border-4 border-black dark:border-white bg-[#86EFAC] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none">
          <CalendarIcon className="h-12 w-12 text-black" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Connect Calendar</h2>
        <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 leading-relaxed">
          Sign in with Google to sync your calendar events. Your schedule will be fetched securely and kept up to date in real time.
        </p>
      </div>

      <Button
        size="lg"
        onClick={onConnect}
        disabled={isLoading}
        className="gap-3 h-12 px-8 bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-4 border-black dark:border-white shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 rounded-none"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-black" />
        ) : (
          <Globe className="h-5 w-5 text-black" />
        )}
        <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
      </Button>

      <p className="text-[10px] font-bold uppercase tracking-wider text-black/40 dark:text-white/40 max-w-xs text-center">
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

  // States for Event completion and AI features
  const [completedEvents, setCompletedEvents] = useState<string[]>([])
  const [showAiSidebar, setShowAiSidebar] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  const [input, setInput] = useState('')

  const { messages: aiMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    }),
  })

  // Load completed events from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('completed_events')
      if (stored) {
        setCompletedEvents(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load completed events:', e)
    }
  }, [])

  const toggleCompleteEvent = async (id: string) => {
    const isCurrentlyCompleted = completedEvents.includes(id) || data.some(d => d.events.some(e => String(e.id) === id && (e as any).completed));
    const nextCompleted = !isCurrentlyCompleted;

    // Optimistic UI update
    setCompletedEvents((prev) => {
      const next = nextCompleted ? [...prev, id] : prev.filter((item) => item !== id);
      try {
        localStorage.setItem('completed_events', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save completed events:', e);
      }
      return next;
    });

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: id, completed: nextCompleted })
      });
      
      if (res.ok) {
        toast.success(nextCompleted ? "Event marked as completed on Google Calendar!" : "Event marked as active on Google Calendar!");
        // Re-fetch calendar events to get fresh state from DB cache
        fetchFromDb();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to update calendar event");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update Google Calendar");
      // Revert optimistic update
      setCompletedEvents((prev) => {
        const reverted = nextCompleted ? prev.filter((item) => item !== id) : [...prev, id];
        try {
          localStorage.setItem('completed_events', JSON.stringify(reverted));
        } catch (e) {
          console.error('Failed to save completed events:', e);
        }
        return reverted;
      });
    }
  }

  const handleOpenAiForEvent = (event: any) => {
    setSelectedEvent(event)
    setShowAiSidebar(true)
    setTimeout(() => {
      const textarea = document.querySelector('textarea[placeholder*="ASK AI TO RESCHEDULE"]') as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
      }
    }, 100)
  }

  const handleAiSubmit = () => {
    if (!input.trim()) return
    let textToSend = input
    
    // Inject selected calendar event context if present
    if (selectedEvent) {
      textToSend = `[Context Selected Calendar Event: Name: "${selectedEvent.name}", Original Time: "${selectedEvent.time}", Event ID: "${selectedEvent.id}"]\n\n${input}`
    }

    sendMessage({ text: textToSend })
    setInput('')
  }

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
      <div className="flex flex-1 items-center justify-center bg-[#FFFDF5] dark:bg-[#121214]">
        <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
      </div>
    )
  }

  if (connectionState === 'not_connected') {
    return <GoogleCalendarSignInButton onConnect={handleConnect} isLoading={isConnecting} />
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden bg-[#FFFDF5] dark:bg-[#121214] p-6 gap-4">
      <div className="flex items-center justify-between border-b-4 border-black dark:border-white pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Calendar</h1>
          <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-1">
            View and manage your schedule.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {connectionState === 'connected' && (
            <div className="flex flex-col items-end mr-4 hidden sm:flex">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Connected to Calendar
              </div>
              {lastRefreshed && (
                <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase mt-0.5">
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
              className="bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 h-10 px-4 rounded-none flex items-center"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 h-10 px-4 rounded-none flex items-center"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isConnecting ? 'Connecting...' : 'Connect Calendar'}
            </Button>
          )}

          <Button
            onClick={() => setShowAiSidebar(!showAiSidebar)}
            className={`${
              showAiSidebar 
                ? 'bg-[#FFD93D] text-black' 
                : 'bg-white dark:bg-[#1C1C1F] text-black dark:text-white'
            } hover:bg-black/5 dark:hover:bg-white/5 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 h-10 px-4 rounded-none flex items-center`}
          >
            <Sparkles className="h-4 w-4 mr-2 text-black dark:text-white animate-pulse" />
            Agent Panel
          </Button>
        </div>
      </div>

      {connectionState === 'error' && (
        <Alert variant="destructive" className="border-4 border-black dark:border-white bg-[#FF6B6B] text-black rounded-none shadow-[4px_4px_0px_0px_#000]">
          <AlertCircle className="h-4 w-4 text-black" />
          <AlertTitle className="font-black uppercase tracking-wider">Connection Error</AlertTitle>
          <AlertDescription className="text-xs font-bold uppercase tracking-wide">
            There was a problem connecting to your Google Calendar. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {connectionState === 'connected' && (
        <div className="flex flex-1 min-h-0 overflow-hidden gap-8">
          
          {/* Main Calendar columns: Converted to grid to avoid cut-offs */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pb-8 items-start h-full pr-2">
            {/* Calendar Column */}
            <div className="w-full">
              <Calendar 
                mode="single"
                selected={selectedDay} 
                onSelect={(day) => day && setSelectedDay(day)} 
                className="w-full rounded-none border-4 border-black dark:border-white bg-white dark:bg-[#1C1C1F] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] p-6 [&_table]:w-full [&_td]:w-full [&_th]:w-full"
                classNames={{
                  root: "w-full",
                  months: "relative w-full flex flex-col",
                  month: "w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full mt-4 border-b-2 border-black dark:border-white pb-2",
                  head_cell: "text-black dark:text-white font-black uppercase text-[10px] tracking-wider flex-1 text-center",
                  row: "flex w-full mt-2",
                  cell: "p-0 text-center relative border border-black/5 dark:border-white/5 flex-1 aspect-square focus-within:relative focus-within:z-20",
                  day: "h-full w-full p-0 font-bold uppercase text-[10px] flex items-center justify-center rounded-none transition-all hover:bg-[#FFFDF5] dark:hover:bg-black hover:border border-black dark:hover:border-white",
                  day_selected: "bg-[#FFD93D] dark:bg-[#db6802] text-black border-2 border-black dark:border-white font-black shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:bg-[#FFD93D] dark:hover:bg-[#db6802]",
                  day_today: "bg-[#C4B5FD] text-black border-2 border-dashed border-black font-black",
                  day_outside: "text-muted-foreground opacity-30",
                  day_disabled: "text-muted-foreground opacity-30",
                  day_hidden: "invisible",
                } as any}
                modifiers={{
                  hasEvent: (date) => data.some(d => d.events.length > 0 && isSameDay(d.day, date))
                }}
                modifiersClassNames={{
                  hasEvent: "bg-[#86EFAC] text-black border border-black font-black shadow-[1px_1px_0px_0px_#000]"
                }}
              />
            </div>

            {/* Events for the selected day */}
            <div className="w-full overflow-y-auto pr-2 pb-8 h-full">
              <div className="flex items-center justify-between mb-6 border-b-4 border-black dark:border-white pb-3">
                <h2 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">
                  {format(selectedDay, "EEEE, MMMM d")}
                </h2>
                <div className="text-xs font-black uppercase tracking-wider bg-[#C4B5FD] text-black border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_#000] rounded-none">
                  {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'event' : 'events'}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {selectedDayEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border-4 border-dashed border-black dark:border-white bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] rounded-none">
                    <div className="bg-[#C4B5FD] border-4 border-black p-4 rounded-none shadow-[2px_2px_0px_0px_#000] mb-4">
                      <CalendarIcon className="h-5 w-5 text-black" />
                    </div>
                    <p className="text-black dark:text-white font-black uppercase tracking-wider text-xs">No events scheduled</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-1">Enjoy your free time!</p>
                  </div>
                ) : (
                  selectedDayEvents.map((event) => {
                    const isCompleted = (event as any).completed || completedEvents.includes(String(event.id));
                    return (
                      <div 
                        key={String(event.id)} 
                        className={`group relative flex flex-col gap-1 p-4 rounded-none border-4 border-black dark:border-white bg-white dark:bg-[#1C1C1F] hover:bg-[#FFFDF5] dark:hover:bg-black shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] transition-all duration-75 ${
                          isCompleted ? 'opacity-70 bg-gray-50/50 dark:bg-black/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <h3 className={`font-black uppercase tracking-wider text-xs text-black dark:text-white ${isCompleted ? 'line-through opacity-55' : ''}`}>
                              {event.name}
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-black/60 dark:text-white/60 flex items-center gap-2">
                              <span className={`inline-block h-2 w-2 rounded-none border border-black ${isCompleted ? 'bg-gray-400' : 'bg-[#86EFAC]'}`}></span>
                              {event.time}
                            </p>
                          </div>
                        </div>
                        {(event as any).location && (
                          <div className="mt-2 text-[10px] font-bold uppercase tracking-wide text-black/60 dark:text-white/60 flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-black dark:text-white" />
                            {(event as any).location}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            disabled={isCompleted}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompleteEvent(String(event.id));
                            }}
                            className={`border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-black uppercase text-[9px] transition-all duration-75 h-7 px-2.5 rounded-none flex items-center gap-1 disabled:opacity-75 disabled:translate-none disabled:shadow-none ${
                              isCompleted
                                ? 'bg-[#86EFAC] text-black border-black'
                                : 'bg-white dark:bg-[#121214] text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {isCompleted ? 'Completed' : 'Complete'}
                          </Button>

                          <Button
                            size="sm"
                            disabled={isCompleted}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAiForEvent(event);
                            }}
                            className="bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-black uppercase text-[9px] transition-all duration-75 h-7 px-2.5 rounded-none flex items-center gap-1 disabled:opacity-50 disabled:translate-none disabled:shadow-none"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-black" />
                            Ask AI
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* PANEL: Collapsible AI Agent Panel */}
          {showAiSidebar && (
            <div className="w-full md:w-80 lg:w-[400px] flex-shrink-0 flex flex-col border-l-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] relative overflow-hidden animate-in slide-in-from-right-4 duration-300">
              <div className="border-b-4 border-black dark:border-white p-4 flex items-center justify-between bg-white dark:bg-[#1C1C1F]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-black dark:text-white" />
                  <span className="font-black text-xs uppercase tracking-tighter">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AgentMicButton />
                  <Button 
                    onClick={() => setShowAiSidebar(false)} 
                    className="bg-white hover:bg-black/5 dark:bg-[#121214] dark:hover:bg-white/5 text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-black text-xs uppercase h-7 w-7 p-0 rounded-none flex items-center justify-center"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Selected event indicator */}
              {selectedEvent && (
                <div className="p-3 bg-white dark:bg-[#1C1C1F] border-b-4 border-black dark:border-white flex flex-col gap-1 select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-black/50 dark:text-white/50 tracking-wider">Selected Event</span>
                    <button onClick={() => setSelectedEvent(null)} className="text-[9px] font-black uppercase text-[#FF6B6B] hover:underline">Clear</button>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-black dark:text-white truncate">
                    {selectedEvent.name} ({selectedEvent.time})
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-hidden flex flex-col p-4 bg-[#FFFDF5] dark:bg-[#121214]">
                <Conversation className="h-full">
                  <ConversationContent>
                    {aiMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center flex-1 gap-3 p-4 text-center mt-12">
                        <div className="p-3 bg-[#C4B5FD] border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] rounded-none">
                          <MessageSquare className="h-8 w-8 text-black" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider">Reschedule with AI</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-black/60 dark:text-white/60 leading-relaxed max-w-[240px]">
                          Select a calendar event and tell the AI agent how you want to reschedule it, or send an email update.
                        </p>
                      </div>
                    ) : (
                      aiMessages.map(message => (
                        <div key={message.id}>
                          {message.parts?.map((part, i) => {
                            if (part.type === 'text') {
                              return (
                                <Message key={`${message.id}-${i}`} from={message.role}>
                                  <MessageContent>
                                    <MessageResponse>{part.text}</MessageResponse>
                                  </MessageContent>
                                </Message>
                              )
                            }

                            if (part.type?.startsWith('tool-')) {
                              return (
                                <Tool key={`${message.id}-${i}`}>
                                  <ToolHeader
                                    type={(part as ToolUIPart).type}
                                    state={(part as ToolUIPart).state || 'output-available'}
                                    className="cursor-pointer"
                                  />
                                  <ToolContent>
                                    <ToolInput input={(part as ToolUIPart).input || {}} />
                                    <ToolOutput
                                      output={(part as ToolUIPart).output}
                                      errorText={(part as ToolUIPart).errorText}
                                    />
                                  </ToolContent>
                                </Tool>
                              )
                            }

                            return null
                          })}
                        </div>
                      ))
                    )}
                  </ConversationContent>
                </Conversation>
              </div>

              {error && (
                <div className="mx-4 mb-2 p-3 bg-[#FF6B6B] border-4 border-black dark:border-white text-black text-[10px] font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_#000]">
                  <strong>Error:</strong> {error.message || 'An error occurred during generation.'}
                </div>
              )}

              {/* Chat Input Container */}
              <div className="p-4 bg-white dark:bg-[#1C1C1F] border-t-4 border-black dark:border-white">
                <div className="relative flex items-center bg-white dark:bg-[#121214] border-4 border-black dark:border-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] p-1.5 pl-12 pr-12 rounded-none">
                  <div className="absolute left-3">
                    <AgentMicButton />
                  </div>
                  <textarea
                    className="w-full bg-transparent px-2 py-1 outline-none resize-none min-h-[40px] max-h-[120px] text-xs font-bold uppercase tracking-wider leading-normal"
                    onChange={(e) => setInput(e.target.value)}
                    value={input}
                    placeholder={selectedEvent ? "ASK AI TO RESCHEDULE OR MAIL..." : "TYPE OR SPEAK TO AGENT..."}
                    disabled={status !== 'ready'}
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAiSubmit()
                      }
                    }}
                  />
                  <button 
                    onClick={handleAiSubmit}
                    disabled={status !== 'ready' || !input.trim()}
                    className="absolute right-3 p-1.5 bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-2 border-black rounded-none shadow-[2px_2px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-50 disabled:translate-none disabled:shadow-none"
                  >
                    <SendHorizontal className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  )
}
