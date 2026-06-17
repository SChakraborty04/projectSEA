'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Mail, RefreshCw, AlertCircle, Inbox, Send, FileText, Star, Loader2, Globe,
  Sparkles, Calendar, Keyboard, Search, MessageSquare, Sparkle, SendHorizontal, CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { toast } from 'sonner'
import { AgentMicButton } from '@/components/agent-mic-button'
import { Conversation, ConversationContent } from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmailMessage {
  id: string
  threadId?: string
  subject?: string
  from?: string
  to?: string
  snippet?: string
  body?: string
  internalDate?: string
  createdAt?: string
  labelIds?: string[]
  phishingAnalysis?: {
    isPhishing: boolean
    confidence: number
    label: string
  }
}

type ConnectionState = 'loading' | 'not_connected' | 'connected' | 'error'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  } catch {
    return ''
  }
}

function isUnread(labelIds?: string[]): boolean {
  return labelIds?.includes('UNREAD') ?? false
}

function getSenderName(from?: string): string {
  if (!from) return 'Unknown'
  const match = from.match(/^([^<]+)</)
  return match ? match[1].trim() : from
}

function isPriority(msg: EmailMessage): boolean {
  const isStarred = msg.labelIds?.includes('STARRED')
  const isUnreadMsg = isUnread(msg.labelIds)
  const text = ((msg.subject || "") + " " + (msg.snippet || "")).toLowerCase()
  const urgentKeywords = ["urgent", "important", "meeting", "sync", "schedule", "action required", "approved", "critical", "zoom", "google meet", "call", "project"]
  const hasUrgentKeyword = urgentKeywords.some(keyword => text.includes(keyword))
  
  return !!(isStarred || (isUnreadMsg && hasUrgentKeyword))
}

// Helper to parse dates & times from email subject/body

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoogleSignInButton({ onConnect, isLoading }: { onConnect: () => void; isLoading: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6 bg-[#FFFDF5] dark:bg-[#121214]">
      <div className="relative">
        <div className="relative flex h-24 w-24 items-center justify-center border-4 border-black dark:border-white bg-[#86EFAC] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none">
          <Mail className="h-12 w-12 text-black" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">Connect your Gmail</h2>
        <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 leading-relaxed">
          Sign in with Google to sync your emails. Your messages will be fetched securely and kept up to date in real time.
        </p>
      </div>

      <Button
        id="gmail-connect-btn"
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
        We only request read access to your Gmail. Your data is encrypted and never shared.
      </p>
    </div>
  )
}

function EmailRow({ message, selected, onClick }: {
  message: EmailMessage
  selected: boolean
  onClick: () => void
}) {
  const unread = isUnread(message.labelIds)
  const isStarred = message.labelIds?.includes('STARRED')

  return (
    <button
      id={`email-row-${message.id}`}
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-4 text-left border-b-4 border-black dark:border-white transition-all duration-75 ${
        selected 
          ? 'bg-[#FFD93D] text-black dark:bg-[#db6802] dark:text-white border-l-8 border-l-black dark:border-l-white pl-2' 
          : 'bg-[#FFFDF5] dark:bg-[#121214] text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
      }`}
    >
      <div className="mt-1 flex-shrink-0">
        {unread ? (
          <div className="h-3.5 w-3.5 border-2 border-black dark:border-white bg-[#C4B5FD] rounded-none shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]" />
        ) : (
          <div className="h-3.5 w-3.5" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`text-xs uppercase tracking-wider truncate ${unread ? 'font-black' : 'font-bold'}`}>
              {getSenderName(message.from)}
            </span>
            {message.phishingAnalysis?.isPhishing && (
              <Badge className="bg-[#FF6B6B] text-black border-2 border-black dark:border-white text-[9px] py-0 px-1.5 leading-normal flex-shrink-0 font-black uppercase rounded-none">
                Phishing
              </Badge>
            )}
            {isPriority(message) && (
              <Badge className="bg-[#FFD93D] text-black border-2 border-black dark:border-white text-[9px] py-0 px-1.5 leading-normal flex-shrink-0 font-black uppercase rounded-none">
                Priority
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isStarred && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 stroke-black dark:stroke-white stroke-2" />}
            <span className={`text-[10px] font-bold uppercase tracking-wide ${selected ? 'text-black/60 dark:text-white/60' : 'text-black/40 dark:text-white/40'}`}>
              {formatDate(message.createdAt || message.internalDate)}
            </span>
          </div>
        </div>
        <p className={`text-xs uppercase tracking-wide truncate mt-1 ${unread ? 'font-black' : 'font-bold'}`}>
          {message.subject || '(no subject)'}
        </p>
        <p className={`text-[10px] uppercase tracking-wide truncate mt-1 ${selected ? 'text-black/60 dark:text-white/60' : 'text-black/40 dark:text-white/40'}`}>
          {message.snippet}
        </p>
      </div>
    </button>
  )
}

function EmailDetail({ 
  message, 
  onClose,
  onDraftReply,
  onSummarize,
  onConvertToCalendar
}: { 
  message: EmailMessage; 
  onClose: () => void;
  onDraftReply: () => void;
  onSummarize: () => void;
  onConvertToCalendar: () => void;
}) {
  const isPhishing = message.phishingAnalysis?.isPhishing
  const confidence = message.phishingAnalysis?.confidence

  return (
    <div className="flex flex-col h-full bg-[#FFFDF5] dark:bg-[#121214]">
      {isPhishing && (
        <div className="bg-[#FF6B6B] text-black border-b-4 border-black dark:border-white px-4 py-3 text-xs flex items-center gap-2 font-black uppercase tracking-wide shadow-[4px_4px_0px_0px_#000] animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-black" />
          <span>
            Warning: This email has been flagged as phishing with{' '}
            {Math.round((confidence ?? 0) * 100)}% confidence. Do not click links or share sensitive information.
          </span>
        </div>
      )}
      
      {/* Detail Header / Action Panel */}
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 border-b-4 border-black dark:border-white bg-white dark:bg-[#1C1C1F]">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black uppercase tracking-tighter leading-none">{message.subject || '(no subject)'}</h2>
          <div className="flex flex-col mt-1.5 text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60">
            <span className="truncate">From: {message.from}</span>
            {message.to && (
              <span className="truncate mt-0.5">
                To: {message.to}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick AI & Calendar actions */}
          <Button 
            onClick={onDraftReply} 
            className="bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-4 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-[10px] transition-all duration-75 h-8 px-2.5 rounded-none flex items-center gap-1"
          >
            <Sparkles className="h-3.5 w-3.5 text-black" />
            AI Reply
          </Button>
          <Button 
            onClick={onSummarize} 
            className="bg-[#C4B5FD] hover:bg-[#b19ffa] text-black border-4 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-[10px] transition-all duration-75 h-8 px-2.5 rounded-none flex items-center gap-1"
          >
            <Sparkle className="h-3.5 w-3.5 text-black" />
            AI Summary
          </Button>
          <Button 
            onClick={onConvertToCalendar} 
            className="bg-[#86EFAC] hover:bg-[#6ee7b7] text-black border-4 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-[10px] transition-all duration-75 h-8 px-2.5 rounded-none flex items-center gap-1"
          >
            <Calendar className="h-3.5 w-3.5 text-black" />
            Invite
          </Button>
          <Button 
            id="email-close-btn" 
            onClick={onClose} 
            className="bg-white hover:bg-black/5 dark:bg-[#121214] dark:hover:bg-white/5 text-black dark:text-white border-4 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black text-xs uppercase h-8 w-8 p-0 rounded-none flex items-center justify-center"
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-auto p-6 bg-[#FFFDF5] dark:bg-[#1C1C1F] text-black dark:text-white font-medium text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none select-text">
        {message.body ? (
          <div
            className="select-text"
            dangerouslySetInnerHTML={{ __html: message.body }}
          />
        ) : (
          <p className="whitespace-pre-wrap select-text">{message.snippet}</p>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmailPage() {
  const searchParams = useSearchParams()
  const [connectionState, setConnectionState] = useState<ConnectionState>('loading')
  const [isConnecting, setIsConnecting] = useState(false)
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Custom smart states
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'starred' | 'phishing' | 'priority'>('all')
  const [showAiSidebar, setShowAiSidebar] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [commandPaletteSearch, setCommandPaletteSearch] = useState('')
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isExtractingCalendar, setIsExtractingCalendar] = useState(false)
  const [calendarEventData, setCalendarEventData] = useState({
    summary: '',
    description: '',
    startDateTime: '',
    endDateTime: ''
  })


  // AI Chat states
  const [input, setInput] = useState('')
  const { messages: aiMessages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    }),
  })

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch connection status ──────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/emails/status')
      const data = await res.json()
      setConnectionState(data.connected ? 'connected' : 'not_connected')
      return data.connected as boolean
    } catch {
      setConnectionState('error')
      return false
    }
  }, [])

  // ── Poll from local DB (background, every 10 s) ──────────────────────────
  const fetchFromDb = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const res = await fetch('/api/emails/messages?source=db')
      const data = await res.json()
      if (data.messages?.length > 0) {
        setMessages(data.messages)
        setLastRefreshed(new Date())
      }
    } catch {
      // silently fail — retry on next poll
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // ── Register webhook after OAuth redirect ────────────────────────────────
  const registerWebhook = useCallback(async () => {
    try {
      await fetch('/api/emails/register-webhook', { method: 'POST' })
    } catch {
      // non-critical
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(() => {
      fetchFromDb()
    }, 60_000)
  }, [fetchFromDb])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const res = await fetch('/api/emails/connect')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
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

    return () => stopPolling()
  }, [])

  // ── Email-to-Calendar triggers ───────────────────────────────────────────
  const handleOpenCalendarInvite = async () => {
    if (!selectedMessage) return
    const sender = getSenderName(selectedMessage.from)
    const subject = selectedMessage.subject || 'Meeting'

    // Show the modal immediately with a loading state
    setCalendarEventData({
      summary: `Meeting with ${sender} re: ${subject}`,
      description: `Based on email from ${selectedMessage.from}:\n\n${selectedMessage.snippet}`,
      startDateTime: '',
      endDateTime: ''
    })
    setShowCalendarModal(true)
    setIsExtractingCalendar(true)

    try {
      const res = await fetch('/api/emails/extract-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body: selectedMessage.body || selectedMessage.snippet || '',
          from: selectedMessage.from,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })

      if (res.ok) {
        const { data } = await res.json()
        // datetime-local input expects "YYYY-MM-DDTHH:mm" — slice to 16 chars
        setCalendarEventData({
          summary: data.summary || `Meeting with ${sender} re: ${subject}`,
          description: data.description || `Based on email from ${selectedMessage.from}:\n\n${selectedMessage.snippet}`,
          startDateTime: data.startDateTime?.slice(0, 16) || '',
          endDateTime: data.endDateTime?.slice(0, 16) || '',
        })
      } else {
        // Fallback: tomorrow at 10 AM
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)
        const end = new Date(tomorrow.getTime() + 60 * 60 * 1000)
        const fmt = (d: Date) => {
          const pad = (n: number) => String(n).padStart(2, '0')
          return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }
        setCalendarEventData(prev => ({ ...prev, startDateTime: fmt(tomorrow), endDateTime: fmt(end) }))
        toast.error('Could not extract date automatically — please fill in manually')
      }
    } catch {
      toast.error('AI extraction failed — please fill in the date manually')
    } finally {
      setIsExtractingCalendar(false)
    }
  }

  // ── AI actions ────────────────────────────────────────────────────────────
  const handleDraftReply = () => {
    if (!selectedMessage) return
    setShowAiSidebar(true)
    const prompt = `Draft a polite, professional reply to this email:\n\nFrom: ${selectedMessage.from}\nSubject: ${selectedMessage.subject}\nBody: ${selectedMessage.body || selectedMessage.snippet}`
    sendMessage({ text: prompt })
  }

  const handleSummarize = () => {
    if (!selectedMessage) return
    setShowAiSidebar(true)
    const prompt = `Summarize this email in 3 bullet points:\n\nFrom: ${selectedMessage.from}\nSubject: ${selectedMessage.subject}\nBody: ${selectedMessage.body || selectedMessage.snippet}`
    sendMessage({ text: prompt })
  }

  const handleAiSubmit = () => {
    if (!input.trim()) return
    let textToSend = input
    
    // Inject selected email context into chat if present
    if (selectedMessage) {
      textToSend = `[Context Selected Email: Subject: "${selectedMessage.subject}", From: "${selectedMessage.from}"]\n\n${input}`
    }

    sendMessage({ text: textToSend })
    setInput('')
  }

  // ── Keyboard Shortcuts listener ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElem = document.activeElement
      const isTyping = activeElem && (
        activeElem.tagName === 'INPUT' || 
        activeElem.tagName === 'TEXTAREA' || 
        activeElem.getAttribute('contenteditable') === 'true'
      )

      if (isTyping) {
        if (e.key === 'Escape') {
          (activeElem as HTMLElement).blur()
          setShowCommandPalette(false)
          setShowCalendarModal(false)
        }
        return
      }

      // Cmd+K or Ctrl+K for command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(prev => !prev)
        return
      }

      if (e.key === 'Escape') {
        setSelectedMessage(null)
        setShowCommandPalette(false)
        setShowCalendarModal(false)
        return
      }

      // 's' -> Focus search input
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder*="SEARCH INBOX"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
        return
      }

      // 'c' -> Toggle AI panel
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        setShowAiSidebar(prev => !prev)
        return
      }

      // 'r' -> Draft reply
      if (e.key === 'r' || e.key === 'R') {
        if (selectedMessage) {
          e.preventDefault()
          handleDraftReply()
        }
        return
      }

      // 'e' -> Calendar invite
      if (e.key === 'e' || e.key === 'E') {
        if (selectedMessage) {
          e.preventDefault()
          handleOpenCalendarInvite()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMessage, showAiSidebar, input])

  // ── Filter & Search logic ───────────────────────────────────────────────
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = a.internalDate || a.createdAt || ''
    const dateB = b.internalDate || b.createdAt || ''
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  const filteredMessages = sortedMessages.filter((msg) => {
    // 1. Search Query Match
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        (msg.subject || "").toLowerCase().includes(query) ||
        (msg.from || "").toLowerCase().includes(query) ||
        (msg.snippet || "").toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    // 2. Filter Tabs/Chips Match
    if (activeFilter === 'unread') return isUnread(msg.labelIds)
    if (activeFilter === 'starred') return msg.labelIds?.includes('STARRED')
    if (activeFilter === 'phishing') return msg.phishingAnalysis?.isPhishing
    if (activeFilter === 'priority') return isPriority(msg)

    return true
  })

  const inboxMessages = filteredMessages.filter((m) => m.labelIds?.includes('INBOX'))
  const sentMessages = filteredMessages.filter((m) => m.labelIds?.includes('SENT'))
  const unreadCount = sortedMessages.filter((m) => isUnread(m.labelIds)).length

  if (connectionState === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#FFFDF5] dark:bg-[#121214]">
        <Loader2 className="h-8 w-8 animate-spin text-black dark:text-white" />
      </div>
    )
  }

  if (connectionState === 'not_connected') {
    return <GoogleSignInButton onConnect={handleConnect} isLoading={isConnecting} />
  }

  if (connectionState === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 bg-[#FFFDF5] dark:bg-[#121214]">
        <div className="relative flex h-16 w-16 items-center justify-center border-4 border-black dark:border-white bg-[#FF6B6B] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] rounded-none">
          <AlertCircle className="h-8 w-8 text-black" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-black uppercase tracking-tighter text-lg">Something went wrong</p>
          <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60">Could not connect to Gmail. Please try again.</p>
        </div>
        <Button 
          id="gmail-retry-btn" 
          onClick={handleConnect} 
          className="bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 h-10 px-4 rounded-none"
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden bg-[#FFFDF5] dark:bg-[#121214] relative">
      
      {/* ─── Dashboard Header ─── */}
      <div className="flex items-center justify-between border-b-4 border-black dark:border-white px-6 py-4 bg-[#FFFDF5] dark:bg-[#121214]">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white flex items-center gap-2">
              <Mail className="h-6 w-6 text-black dark:text-white" />
              Email Inbox
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-0.5">
              {lastRefreshed ? `Synced ${formatDate(lastRefreshed.toISOString())}` : 'Syncing emails…'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-[#C4B5FD] text-black border-2 border-black dark:border-white text-xs font-black uppercase py-0.5 px-2.5 rounded-none shadow-[2px_2px_0px_0px_#000]">
              {unreadCount} Unread
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Keyboard Help / Shortcut badge */}
          <Button 
            onClick={() => setShowCommandPalette(true)}
            className="hidden sm:flex gap-1.5 text-xs bg-white dark:bg-[#1C1C1F] text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase transition-all duration-75 h-10 px-4 rounded-none items-center"
          >
            <Keyboard className="h-4 w-4" />
            <span>Shortcuts</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-none border-2 border-black bg-white px-1.5 font-mono text-[9px] font-black text-black">
              ⌘K
            </kbd>
          </Button>

          <Button
            id="email-refresh-btn"
            onClick={fetchFromDb}
            disabled={isRefreshing}
            className="bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 h-10 px-4 rounded-none flex items-center"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

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

      {/* ─── Workspace Column Split ─── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* PANEL 1: Email List + Tabs */}
        <div className="w-full md:w-80 lg:w-[360px] flex-shrink-0 flex flex-col border-r-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214]">
          <Tabs defaultValue="inbox" className="flex flex-col h-full">
            <div className="p-4 border-b-4 border-black dark:border-white space-y-3 bg-[#FFFDF5] dark:bg-[#121214]">
              {/* Live search input */}
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-black dark:text-white" />
                <input
                  type="text"
                  placeholder="SEARCH INBOX (PRESS 'S')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-[#1C1C1F] border-4 border-black dark:border-white pl-10 pr-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:bg-[#FFD93D]/10 rounded-none shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
                />
              </div>

              {/* Filtering Chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All', activeColor: 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' },
                  { id: 'priority', label: '🔥 Priority', activeColor: 'bg-[#FFD93D] text-black border-black' },
                  { id: 'unread', label: 'Unread', activeColor: 'bg-[#C4B5FD] text-black border-black' },
                  { id: 'starred', label: '⭐ Starred', activeColor: 'bg-[#FFD93D] text-black border-black' },
                  { id: 'phishing', label: '⚠️ Phishing', activeColor: 'bg-[#FF6B6B] text-black border-black' }
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setActiveFilter(chip.id as any)}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                      activeFilter === chip.id 
                        ? chip.activeColor 
                        : 'bg-white dark:bg-[#1C1C1F] text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <TabsList className="grid w-full grid-cols-2 bg-transparent gap-2 p-0 h-auto">
                <TabsTrigger 
                  value="inbox"
                  className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black bg-white dark:bg-[#1C1C1F] border-4 border-black dark:border-white font-black uppercase text-xs tracking-wider py-2 rounded-none shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] data-[state=active]:translate-x-[1px] data-[state=active]:translate-y-[1px] data-[state=active]:shadow-[2px_2px_0px_0px_#000]"
                >
                  Inbox ({inboxMessages.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="sent"
                  className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black bg-white dark:bg-[#1C1C1F] border-4 border-black dark:border-white font-black uppercase text-xs tracking-wider py-2 rounded-none shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] data-[state=active]:translate-x-[1px] data-[state=active]:translate-y-[1px] data-[state=active]:shadow-[2px_2px_0px_0px_#000]"
                >
                  Sent ({sentMessages.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="inbox" className="m-0 h-full flex flex-col data-[state=inactive]:hidden">
                {inboxMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6 text-center min-h-[200px]">
                    <Inbox className="h-10 w-10 text-black/40 dark:text-white/40" />
                    <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60">No inbox messages match filters.</p>
                  </div>
                ) : (
                  inboxMessages.map((msg) => (
                    <EmailRow
                      key={msg.id}
                      message={msg}
                      selected={selectedMessage?.id === msg.id}
                      onClick={() => setSelectedMessage(msg)}
                    />
                  ))
                )}
              </TabsContent>
              <TabsContent value="sent" className="m-0 h-full flex flex-col data-[state=inactive]:hidden">
                {sentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6 text-center min-h-[200px]">
                    <Send className="h-10 w-10 text-black/40 dark:text-white/40" />
                    <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60">No sent messages match filters.</p>
                  </div>
                ) : (
                  sentMessages.map((msg) => (
                    <EmailRow
                      key={msg.id}
                      message={msg}
                      selected={selectedMessage?.id === msg.id}
                      onClick={() => setSelectedMessage(msg)}
                    />
                  ))
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* PANEL 2: Selected Email details */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#121214]/40">
          {selectedMessage ? (
            <EmailDetail
              message={selectedMessage}
              onClose={() => setSelectedMessage(null)}
              onDraftReply={handleDraftReply}
              onSummarize={handleSummarize}
              onConvertToCalendar={handleOpenCalendarInvite}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-6 bg-[#FFFDF5] dark:bg-[#121214]">
              <div className="bg-[#C4B5FD] p-4 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] rounded-none">
                <Mail className="h-10 w-10 text-black" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wider">Select an email to read it</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-black/60 dark:text-white/60 max-w-xs mx-auto mt-1 leading-relaxed">
                  Navigate using the mouse, search above, or use shortcuts to trigger actions instantly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 3: COLLAPSIBLE AI AGENT PANEL (Text & Voice) */}
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

            {/* suggestion actions */}
            {selectedMessage && (
              <div className="p-3 bg-white dark:bg-[#1C1C1F] border-b-4 border-black dark:border-white flex gap-2 overflow-x-auto select-none">
                <Button 
                  onClick={handleDraftReply} 
                  className="bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-black uppercase text-[9px] transition-all duration-75 h-7 px-2.5 rounded-none flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="h-3 w-3 text-black" /> Draft Reply
                </Button>
                <Button 
                  onClick={handleSummarize} 
                  className="bg-[#C4B5FD] hover:bg-[#b19ffa] text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-black uppercase text-[9px] transition-all duration-75 h-7 px-2.5 rounded-none flex items-center gap-1 shrink-0"
                >
                  <Sparkle className="h-3 w-3 text-black" /> Summarize
                </Button>
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
                      <span className="text-xs font-black uppercase tracking-wider">How can I assist you?</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-black/60 dark:text-white/60 leading-relaxed max-w-[240px]">
                        Draft emails, reply to threads, or schedule meetings. Click the Mic button to talk directly!
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
                  placeholder={selectedMessage ? "TYPE REPLY OR SPEAK TO AGENT..." : "TYPE OR SPEAK TO AGENT..."}
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

      {/* ─── MODAL: Command Palette ─── */}
      {showCommandPalette && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-200"
          onClick={() => setShowCommandPalette(false)}
        >
          <div 
            className="bg-[#FFFDF5] dark:bg-[#121214] border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] rounded-none w-full max-w-xl overflow-hidden flex flex-col max-h-[60vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-2 border-b-4 border-black dark:border-white px-4 py-3 bg-white dark:bg-[#1C1C1F]">
              <Search className="h-5 w-5 text-black dark:text-white" />
              <input
                id="command-palette-input"
                type="text"
                placeholder="SEARCH EMAILS OR SELECT A QUICK ACTION..."
                value={commandPaletteSearch}
                onChange={(e) => setCommandPaletteSearch(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-xs font-black uppercase tracking-wider placeholder:text-black/40 dark:placeholder:text-white/40 text-black dark:text-white"
                autoFocus
              />
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-none border-2 border-black bg-white px-1.5 font-mono text-[9px] font-black text-black">
                ESC
              </kbd>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {/* Commands Group */}
              {commandPaletteSearch === "" && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-widest border-b-2 border-dashed border-black/20 dark:border-white/20 pb-1 mb-2">
                    Quick Actions
                  </div>
                  <button
                    onClick={() => {
                      fetchFromDb()
                      setShowCommandPalette(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 rounded-none text-left text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <RefreshCw className="h-4 w-4 text-black dark:text-white" />
                    <span>Sync/Refresh Inbox</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-none border-2 border-black bg-white px-1.5 font-mono text-[9px] font-black text-black">Refresh</kbd>
                  </button>
                  <button
                    onClick={() => {
                      setShowAiSidebar(!showAiSidebar)
                      setShowCommandPalette(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 rounded-none text-left text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    <Sparkles className="h-4 w-4 text-black dark:text-white" />
                    <span>Toggle AI Assistant Panel</span>
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-none border-2 border-black bg-white px-1.5 font-mono text-[9px] font-black text-black">C</kbd>
                  </button>
                  {selectedMessage && (
                    <>
                      <button
                        onClick={() => {
                          handleDraftReply()
                          setShowCommandPalette(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 rounded-none text-left text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        <Sparkles className="h-4 w-4 text-black dark:text-white" />
                        <span>Draft AI Reply</span>
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-none border-2 border-black bg-white px-1.5 font-mono text-[9px] font-black text-black">R</kbd>
                      </button>
                      <button
                        onClick={() => {
                          handleOpenCalendarInvite()
                          setShowCommandPalette(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 rounded-none text-left text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        <Calendar className="h-4 w-4 text-black dark:text-white" />
                        <span>Schedule Meeting (Email-to-Calendar)</span>
                        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-none border-2 border-black bg-white px-1.5 font-mono text-[9px] font-black text-black">E</kbd>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Filter Suggestions */}
              {commandPaletteSearch === "" && (
                <div className="pt-2">
                  <div className="px-3 py-1 text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-widest border-b-2 border-dashed border-black/20 dark:border-white/20 pb-1 mb-2">
                    Filters
                  </div>
                  {[
                    { label: 'Show Priority Inbox', filter: 'priority', icon: '🔥' },
                    { label: 'Show Starred Emails', filter: 'starred', icon: '⭐' },
                    { label: 'Show Unread Emails', filter: 'unread', icon: '📩' },
                    { label: 'Show Phishing Warnings', filter: 'phishing', icon: '⚠️' },
                  ].map((item) => (
                    <button
                      key={item.filter}
                      onClick={() => {
                        setActiveFilter(item.filter as any)
                        setShowCommandPalette(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-black/5 dark:hover:bg-white/5 rounded-none text-left text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Filtered Email Results */}
              {commandPaletteSearch !== "" && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-widest border-b-2 border-dashed border-black/20 dark:border-white/20 pb-1 mb-2">
                    Email Results
                  </div>
                  {messages
                    .filter(m => 
                      (m.subject || "").toLowerCase().includes(commandPaletteSearch.toLowerCase()) ||
                      (m.from || "").toLowerCase().includes(commandPaletteSearch.toLowerCase()) ||
                      (m.snippet || "").toLowerCase().includes(commandPaletteSearch.toLowerCase())
                    )
                    .slice(0, 5)
                    .map(msg => (
                      <button
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg)
                          setShowCommandPalette(false)
                        }}
                        className="w-full flex flex-col px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5 border-b-2 border-dashed border-black/10 dark:border-white/10 last:border-b-0"
                      >
                        <span className="font-black text-[10px] text-black/50 dark:text-white/50 uppercase tracking-wider truncate">{msg.from}</span>
                        <span className="font-bold text-xs text-black dark:text-white uppercase tracking-wide truncate mt-0.5">{msg.subject || "(no subject)"}</span>
                        <span className="text-[10px] text-black/40 dark:text-white/40 uppercase tracking-wider truncate mt-0.5">{msg.snippet}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Email-to-CalendarInvite ─── */}
      {showCalendarModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowCalendarModal(false)}
        >
          <div 
            className="bg-[#FFFDF5] dark:bg-[#121214] border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] rounded-none w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b-4 border-black dark:border-white p-5 flex items-center justify-between bg-white dark:bg-[#1C1C1F]">
              <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                <Calendar className="h-5 w-5 text-black dark:text-white" />
                Schedule Calendar Meeting
              </h3>
              <Button 
                onClick={() => setShowCalendarModal(false)}
                className="bg-white hover:bg-black/5 dark:bg-[#121214] dark:hover:bg-white/5 text-black dark:text-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-black text-xs uppercase h-7 w-7 p-0 rounded-none flex items-center justify-center"
              >
                ✕
              </Button>
            </div>

            {/* AI extraction loading banner */}
            {isExtractingCalendar && (
              <div className="flex items-center gap-3 px-5 py-3 bg-[#FFD93D] dark:bg-[#db6802] border-b-4 border-black dark:border-white">
                <Loader2 className="h-4 w-4 animate-spin text-black flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider text-black">
                  AI is reading your email to extract date &amp; time...
                </span>
              </div>
            )}

            <form 
              onSubmit={async (e) => {
                e.preventDefault()
                const target = e.currentTarget
                const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

                // Convert local datetime strings to UTC via the time API
                const startLocal = (target.elements.namedItem('start') as HTMLInputElement).value
                const endLocal = (target.elements.namedItem('end') as HTMLInputElement).value

                let startUtc: string, endUtc: string
                try {
                  const convRes = await fetch('/api/time/local-to-utc', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      items: [
                        { value: startLocal, timezone: userTimezone },
                        { value: endLocal, timezone: userTimezone },
                      ],
                      timezone: userTimezone,
                    }),
                  })
                  if (!convRes.ok) throw new Error('Time conversion failed')
                  const convJson = await convRes.json()
                  if (convJson.errors?.length > 0) throw new Error(convJson.errors[0].error || 'Time conversion error')
                  const results = convJson.converted?.map((r: any) => r.result)
                  if (!results || results.length < 2) throw new Error('Incomplete time conversion')
                  startUtc = results[0].utc
                  endUtc = results[1].utc
                } catch (convErr: any) {
                  toast.error(convErr.message || "Failed to convert time to UTC")
                  return
                }

                const data = {
                  summary: (target.elements.namedItem('summary') as HTMLInputElement).value,
                  description: (target.elements.namedItem('description') as HTMLTextAreaElement).value,
                  startDateTime: startUtc,
                  endDateTime: endUtc,
                }

                setIsCreatingEvent(true)
                try {
                  const res = await fetch('/api/calendar/events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  })
                  if (res.ok) {
                    toast.success("Calendar event scheduled successfully!")
                    setShowCalendarModal(false)
                  } else {
                    const err = await res.json()
                    toast.error(err.error || "Failed to create event")
                  }
                } catch {
                  toast.error("An error occurred scheduling event")
                } finally {
                  setIsCreatingEvent(false)
                }
              }}
              className="p-5 space-y-4"
            >

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-widest">Event Title</label>
                <input
                  type="text"
                  name="summary"
                  defaultValue={calendarEventData.summary}
                  required
                  className="w-full bg-white dark:bg-[#1C1C1F] border-4 border-black dark:border-white px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:bg-[#FFD93D]/10 rounded-none shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-widest">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    name="start"
                    defaultValue={calendarEventData.startDateTime}
                    required
                    className="w-full bg-white dark:bg-[#1C1C1F] border-4 border-black dark:border-white px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:bg-[#FFD93D]/10 rounded-none shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-widest">End Date & Time</label>
                  <input
                    type="datetime-local"
                    name="end"
                    defaultValue={calendarEventData.endDateTime}
                    required
                    className="w-full bg-white dark:bg-[#1C1C1F] border-4 border-black dark:border-white px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:bg-[#FFD93D]/10 rounded-none shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-widest">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={calendarEventData.description}
                  className="w-full bg-white dark:bg-[#1C1C1F] border-4 border-black dark:border-white px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:bg-[#FFD93D]/10 rounded-none shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  onClick={() => setShowCalendarModal(false)}
                  className="flex-1 bg-white hover:bg-black/5 dark:bg-[#121214] dark:hover:bg-white/5 text-black dark:text-white border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 h-10 px-4 rounded-none"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreatingEvent} 
                  className="flex-1 bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 h-10 px-4 rounded-none flex items-center justify-center"
                >
                  {isCreatingEvent ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Scheduling...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
