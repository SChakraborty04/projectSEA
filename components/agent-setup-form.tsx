"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const formSchema = z.object({
  agentName: z.string().min(2, "Agent name must be at least 2 characters."),
  agentVoice: z.string(),
  firstMessage: z.string().min(2, "First message must be at least 2 characters."),
  companyName: z.string().min(2, "Company name is required."),
  designation: z.string().min(2, "Designation / Title is required."),
  businessDescription: z.string().min(10, "Please provide a detailed description."),
  timezone: z.string(),
  workingHoursStart: z.string(),
  workingHoursEnd: z.string(),
  workingDays: z.array(z.string()).min(1, "Select at least one working day."),
  bufferMinutes: z.coerce.number().min(0).max(120),
  minNoticeHours: z.coerce.number().min(0).max(72),
  customInstructions: z.string().optional(),
})

const DAYS = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
]

export function AgentSetupForm({ 
  initialData, 
  userId, 
  telegramChatId 
}: { 
  initialData: any; 
  userId?: string; 
  telegramChatId?: string | null; 
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  // State for Telegram integration
  const [telegramStatus, setTelegramStatus] = React.useState<{
    isConnected: boolean;
    chatId: string | null;
    botUsername: string | null;
    connectionCode: string | null;
    isSettingUp: boolean;
  }>({
    isConnected: !!telegramChatId,
    chatId: telegramChatId || null,
    botUsername: null,
    connectionCode: null,
    isSettingUp: false,
  });

  const handleConnectTelegram = async () => {
    try {
      setTelegramStatus(prev => ({ ...prev, isSettingUp: true }));
      const res = await fetch("/api/telegram/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Failed to configure Telegram webhook");
      }

      const data = await res.json();
      setTelegramStatus(prev => ({
        ...prev,
        botUsername: data.botUsername,
        connectionCode: data.connectionCode,
        isSettingUp: false,
      }));
      toast.success("Telegram webhook activated!");
    } catch (error) {
      toast.error("Failed to connect Telegram bot. Make sure TELEGRAM_BOT_TOKEN is set on the server.");
      console.error(error);
      setTelegramStatus(prev => ({ ...prev, isSettingUp: false }));
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      agentName: initialData?.agentName || "Assistant",
      agentVoice: "57dcab65-68ac-45a6-8480-6c4c52ec1cd1",
      firstMessage: initialData?.firstMessage || "Hello, how can I help you today?",
      companyName: initialData?.companyName || "",
      designation: initialData?.designation || "",
      businessDescription: initialData?.businessDescription || "",
      timezone: initialData?.timezone || "Asia/Kolkata",
      workingHoursStart: initialData?.workingHoursStart || "10:00",
      workingHoursEnd: initialData?.workingHoursEnd || "18:00",
      workingDays: initialData?.workingDays || ["monday", "tuesday", "wednesday", "thursday", "friday"],
      bufferMinutes: initialData?.bufferMinutes || 15,
      minNoticeHours: initialData?.minNoticeHours || 2,
      customInstructions: initialData?.customInstructions || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      const res = await fetch("/api/vapi/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          vapiAssistantId: initialData?.vapiAssistantId,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to setup agent")
      }

      toast.success("Agent configured successfully!")
      router.refresh()
    } catch (error) {
      toast.error("Failed to configure agent. Please try again.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldGroup>
          <Controller
            name="agentName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="agentName">Agent Name</FieldLabel>
                <Input placeholder="e.g. Sarah" {...field} id="agentName" aria-invalid={fieldState.invalid} />
                <FieldDescription>The name your AI will use when answering calls.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <FieldGroup>
          <Controller
            name="firstMessage"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="firstMessage">First Message</FieldLabel>
                <Input placeholder="Hello, how can I help you today?" {...field} id="firstMessage" aria-invalid={fieldState.invalid} />
                <FieldDescription>What the agent says when they pick up the phone.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>


      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Business Context</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldGroup>
            <Controller
              name="companyName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="companyName">Company Name</FieldLabel>
                  <Input placeholder="Acme Inc." {...field} id="companyName" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldGroup>
            <Controller
              name="designation"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="designation">Your Designation / Title</FieldLabel>
                  <Input placeholder="e.g. Founder & CEO" {...field} id="designation" aria-invalid={fieldState.invalid} />
                  <FieldDescription>Your role or title in the company.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6">
          <FieldGroup>
            <Controller
              name="businessDescription"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="businessDescription">Business Description</FieldLabel>
                  <Textarea 
                    placeholder="What does your company do? What should the agent know about your services?" 
                    className="min-h-[100px]"
                    {...field} 
                    id="businessDescription"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Scheduling Rules</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldGroup>
            <Controller
              name="timezone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
                  <Input placeholder="Asia/Kolkata" {...field} id="timezone" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Controller
                name="workingHoursStart"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="workingHoursStart">Start Time</FieldLabel>
                    <Input type="time" {...field} id="workingHoursStart" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup>
              <Controller
                name="workingHoursEnd"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="workingHoursEnd">End Time</FieldLabel>
                    <Input type="time" {...field} id="workingHoursEnd" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>
          
          <FieldGroup>
            <Controller
              name="bufferMinutes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bufferMinutes">Buffer Time (minutes)</FieldLabel>
                  <Input type="number" {...field} id="bufferMinutes" aria-invalid={fieldState.invalid} />
                  <FieldDescription>Time to keep free between meetings.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          
          <FieldGroup>
            <Controller
              name="minNoticeHours"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="minNoticeHours">Min Notice (hours)</FieldLabel>
                  <Input type="number" {...field} id="minNoticeHours" aria-invalid={fieldState.invalid} />
                  <FieldDescription>Minimum hours before a meeting can be booked.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </div>

        <FieldGroup>
          <Controller
            name="workingDays"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Working Days</FieldLabel>
                <div className="flex flex-wrap gap-4 mt-2">
                  {DAYS.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`workingDays-${day.id}`}
                        checked={field.value?.includes(day.id)}
                        onCheckedChange={(checked) => {
                          return checked
                            ? field.onChange([...field.value, day.id])
                            : field.onChange(field.value?.filter((value) => value !== day.id))
                        }}
                      />
                      <label htmlFor={`workingDays-${day.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Custom Persona Instructions</h3>
        <FieldGroup>
          <Controller
            name="customInstructions"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="customInstructions">Additional Instructions</FieldLabel>
                <Textarea 
                  placeholder="E.g. Always greet the user warmly. If they ask about pricing, say it starts at $99/mo." 
                  className="min-h-[100px]"
                  {...field} 
                  id="customInstructions"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      {/* Telegram Bot Integration Card */}
      <div className="space-y-4 p-6 border rounded-xl bg-card text-card-foreground shadow-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-100 duration-500 pointer-events-none" />
        
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15.68-.79 3.42-1.12 5.18-.14.75-.41 1-.68 1.03-.59.05-1.04-.39-1.61-.76-.89-.58-1.39-.94-2.26-1.51-.99-.66-.35-1.02.22-1.61.15-.15 2.72-2.49 2.77-2.69.01-.03.01-.14-.06-.2-.07-.06-.17-.04-.25-.02-.11.02-1.92 1.21-5.41 3.56-.51.35-.97.52-1.38.51-.45-.01-1.32-.26-1.97-.47-.79-.26-1.42-.4-1.36-.84.03-.23.35-.46.96-.69 3.76-1.64 6.27-2.72 7.54-3.25 3.59-1.51 4.34-1.77 4.83-1.78.11 0 .35.03.5.16.13.11.16.27.18.38.01.07.03.24.02.43z" />
                </svg>
              </span>
              Telegram Bot Integration
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Link your agent to the official Telegram assistant. Once connected, your bot will alert you of upcoming events, display recent emails, support interactive approval buttons, and chat directly in AI Agent mode.
            </p>
          </div>
          
          {telegramStatus.isConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500 border border-emerald-500/20 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Not Configured
            </span>
          )}
        </div>

        <div className="pt-4 border-t border-border/50 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm">
            {telegramStatus.isConnected ? (
              <div className="space-y-1">
                <span className="text-muted-foreground">Linked Chat ID: </span>
                <code className="px-1.5 py-0.5 rounded bg-muted font-mono font-bold text-foreground">{telegramStatus.chatId}</code>
              </div>
            ) : telegramStatus.botUsername && telegramStatus.connectionCode ? (
              <span className="text-amber-500 font-medium">✨ Webhook active! Send the code below to the bot to verify.</span>
            ) : (
              <span className="text-muted-foreground">Click connect to generate your Telegram invite link.</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!telegramStatus.isConnected && !telegramStatus.botUsername && (
              <Button
                type="button"
                variant="outline"
                disabled={telegramStatus.isSettingUp}
                onClick={handleConnectTelegram}
                className="bg-blue-500/5 border-blue-500/20 text-blue-500 hover:bg-blue-500/10 active:scale-95 transition-transform"
              >
                {telegramStatus.isSettingUp ? "Activating..." : "Connect Telegram Bot"}
              </Button>
            )}

            {telegramStatus.botUsername && telegramStatus.connectionCode && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex flex-col items-start bg-amber-500/10 border border-amber-500/20 rounded-md px-4 py-2">
                  <span className="text-xs text-amber-500/80 uppercase font-semibold mb-1">Connection Code</span>
                  <span className="text-2xl font-mono font-bold tracking-widest text-amber-500">{telegramStatus.connectionCode}</span>
                </div>
                <Button
                  type="button"
                  asChild
                  className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-semibold shadow-md active:scale-95 transition-transform flex items-center gap-1.5 h-full py-4"
                >
                  <a 
                    href={`https://t.me/${telegramStatus.botUsername}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    👉 Open Telegram Bot
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </Button>
              </div>
            )}

            {telegramStatus.isConnected && (
              <Button
                type="button"
                variant="outline"
                onClick={handleConnectTelegram}
                disabled={telegramStatus.isSettingUp}
                className="border-muted-foreground/20 text-muted-foreground hover:bg-muted"
              >
                {telegramStatus.isSettingUp ? "Updating..." : "Reconnect / Link New Chat"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
        {isLoading ? "Saving..." : initialData?.vapiAssistantId ? "Update Agent" : "Provision Agent"}
      </Button>
    </form>
  )
}
