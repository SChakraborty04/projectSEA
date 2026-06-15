'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, RefreshCw, AlertCircle, Inbox, Send, FileText, Star, Loader2, Globe } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoogleSignInButton({ onConnect, isLoading }: { onConnect: () => void; isLoading: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-4 md:p-6">
      {/* Animated mail icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl shadow-blue-500/30">
          <Mail className="h-12 w-12 text-white" />
        </div>
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-2xl font-bold tracking-tight">Connect your Gmail</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Sign in with Google to sync your emails. Your messages will be fetched securely and kept up to date in real time.
        </p>
      </div>

      <Button
        id="gmail-connect-btn"
        size="lg"
        onClick={onConnect}
        disabled={isLoading}
        className="gap-3 h-12 px-8 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 font-medium"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        ) : (
          <Globe className="h-5 w-5 text-blue-500" />
        )}
        <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
      </Button>

      <p className="text-xs text-muted-foreground max-w-xs text-center">
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
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all duration-150 border-b border-border/50 hover:bg-muted/50 ${
        selected ? 'bg-blue-50 dark:bg-blue-950/30' : ''
      } ${unread ? 'bg-background' : 'bg-muted/20'}`}
    >
      {/* Unread dot */}
      <div className="mt-1.5 flex-shrink-0">
        {unread ? (
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        ) : (
          <div className="h-2 w-2" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${unread ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>
            {getSenderName(message.from)}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isStarred && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
            <span className="text-xs text-muted-foreground">
              {formatDate(message.createdAt || message.internalDate)}
            </span>
          </div>
        </div>
        <p className={`text-sm truncate mt-0.5 ${unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {message.subject || '(no subject)'}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {message.snippet}
        </p>
      </div>
    </button>
  )
}

function EmailDetail({ message, onClose }: { message: EmailMessage; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 p-4 border-b border-border">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold leading-tight">{message.subject || '(no subject)'}</h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span className="truncate">From: {message.from}</span>
          </div>
          {message.to && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              To: {message.to}
            </div>
          )}
        </div>
        <Button id="email-close-btn" variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
          ✕
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {message.body ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: message.body }}
          />
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message.snippet}</p>
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
  // Zero Gmail API calls — reads from DB populated by Pub/Sub webhooks.
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
      // non-critical — webhook setup will be attempted again on next connect
    }
  }, [])

  // ── Start polling every 10 seconds (DB only — no API quota) ────────────
  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(() => {
      fetchFromDb()
    }, 60_000)
  }, [fetchFromDb])

  // ── Stop polling ─────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // ── Handle Google connect button click ──────────────────────────────────
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

  // ── On mount: check if we just came back from OAuth ─────────────────────
  useEffect(() => {
    const connected = searchParams?.get('connected')
    const error = searchParams?.get('error')

    if (connected === 'true') {
      // OAuth just completed — register webhook, then fetch from DB once
      setConnectionState('connected')
      registerWebhook()
      fetchFromDb()         // initial load from local DB (will be empty on first sign up)
      startPolling()        // subsequent updates come from DB via webhooks
    } else if (error) {
      setConnectionState('error')
    } else {
      // Normal page load — check status then do one DB fetch
      checkStatus().then((isConnected) => {
        if (isConnected) {
          fetchFromDb()     // load current webhook-synced messages
          startPolling()    // then keep up to date via DB polling
        }
      })
    }

    return () => stopPolling()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Stats derived from messages ──────────────────────────────────────────
  // Sort messages in descending order of actual email date (most recent first)
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = a.internalDate || a.createdAt || ''
    const dateB = b.internalDate || b.createdAt || ''
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })

  const unreadCount = sortedMessages.filter((m) => isUnread(m.labelIds)).length
  const inboxMessages = sortedMessages.filter((m) => m.labelIds?.includes('INBOX'))
  const sentMessages = sortedMessages.filter((m) => m.labelIds?.includes('SENT'))

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (connectionState === 'loading') {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (connectionState === 'not_connected') {
    return <GoogleSignInButton onConnect={handleConnect} isLoading={isConnecting} />
  }

  if (connectionState === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center space-y-1">
          <p className="font-semibold">Something went wrong</p>
          <p className="text-sm text-muted-foreground">Could not connect to Gmail. Please try again.</p>
        </div>
        <Button id="gmail-retry-btn" onClick={handleConnect} variant="outline">
          Try again
        </Button>
      </div>
    )
  }

  // ── Connected state ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email</h1>
          <p className="text-muted-foreground text-sm">
            {lastRefreshed
              ? `Last updated ${formatDate(lastRefreshed.toISOString())}`
              : 'Syncing your emails…'}
          </p>
        </div>
        <Button
          id="email-refresh-btn"
          variant="outline"
          size="sm"
          onClick={fetchFromDb}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm font-medium">Inbox</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{inboxMessages.length}</p>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {unreadCount} unread
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-green-500" />
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sentMessages.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Messages sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{messages.length}</p>
            <p className="text-xs text-muted-foreground mt-1">All messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Email list + detail */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Message list */}
        <Card className="flex-none w-full md:w-80 lg:w-96 flex flex-col overflow-hidden">
          <Tabs defaultValue="inbox" className="flex flex-col h-full">
            <CardHeader className="py-3 px-4 border-b border-border space-y-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-sm font-semibold">Messages</CardTitle>
                <CardDescription className="text-xs">
                  {isRefreshing ? 'Refreshing…' : `${messages.length} emails • auto-refreshes every 1m`}
                </CardDescription>
              </div>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inbox">Inbox</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
              </TabsList>
            </CardHeader>
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="inbox" className="m-0 h-full flex flex-col data-[state=inactive]:hidden">
                {inboxMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3 p-6 text-center min-h-[200px]">
                    <Inbox className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No inbox emails yet.</p>
                  </div>
                ) : (
                  inboxMessages.map((msg, index) => (
                    <EmailRow
                      key={msg.id || `email-inbox-${index}`}
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
                    <Send className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No sent emails yet.</p>
                  </div>
                ) : (
                  sentMessages.map((msg, index) => (
                    <EmailRow
                      key={msg.id || `email-sent-${index}`}
                      message={msg}
                      selected={selectedMessage?.id === msg.id}
                      onClick={() => setSelectedMessage(msg)}
                    />
                  ))
                )}
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Message detail */}
        <Card className="hidden md:flex flex-1 flex-col overflow-hidden">
          {selectedMessage ? (
            <EmailDetail
              message={selectedMessage}
              onClose={() => setSelectedMessage(null)}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-6">
              <Mail className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Select an email to read it</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
