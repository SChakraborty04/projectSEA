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
    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldGroup>
          <Controller
            name="agentName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="space-y-1">
                <FieldLabel htmlFor="agentName" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Agent Name</FieldLabel>
                <Input placeholder="E.G. SARAH" {...field} id="agentName" aria-invalid={fieldState.invalid} />
                <FieldDescription className="text-[9px] font-bold text-black/60 dark:text-white/60 uppercase tracking-wider">The name your AI will use when answering calls.</FieldDescription>
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
              <Field data-invalid={fieldState.invalid} className="space-y-1">
                <FieldLabel htmlFor="firstMessage" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">First Message</FieldLabel>
                <Input placeholder="HELLO, HOW CAN I HELP YOU TODAY?" {...field} id="firstMessage" aria-invalid={fieldState.invalid} />
                <FieldDescription className="text-[9px] font-bold text-black/60 dark:text-white/60 uppercase tracking-wider">What the agent says when they pick up the phone.</FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider border-b-4 border-black dark:border-white pb-1 mt-6 mb-3 text-black dark:text-white">Business Context</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldGroup>
            <Controller
              name="companyName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel htmlFor="companyName" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Company Name</FieldLabel>
                  <Input placeholder="ACME INC." {...field} id="companyName" aria-invalid={fieldState.invalid} />
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel htmlFor="designation" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Your Designation / Title</FieldLabel>
                  <Input placeholder="E.G. FOUNDER & CEO" {...field} id="designation" aria-invalid={fieldState.invalid} />
                  <FieldDescription className="text-[9px] font-bold text-black/60 dark:text-white/60 uppercase tracking-wider">Your role or title in the company.</FieldDescription>
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel htmlFor="businessDescription" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Business Description</FieldLabel>
                  <Textarea 
                    placeholder="WHAT DOES YOUR COMPANY DO? WHAT SHOULD THE AGENT KNOW ABOUT YOUR SERVICES?" 
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

      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider border-b-4 border-black dark:border-white pb-1 mt-6 mb-3 text-black dark:text-white">Scheduling Rules</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FieldGroup>
            <Controller
              name="timezone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel htmlFor="timezone" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Timezone</FieldLabel>
                  <Input placeholder="ASIA/KOLKATA" {...field} id="timezone" aria-invalid={fieldState.invalid} />
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
                  <Field data-invalid={fieldState.invalid} className="space-y-1">
                    <FieldLabel htmlFor="workingHoursStart" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Start Time</FieldLabel>
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
                  <Field data-invalid={fieldState.invalid} className="space-y-1">
                    <FieldLabel htmlFor="workingHoursEnd" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">End Time</FieldLabel>
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel htmlFor="bufferMinutes" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Buffer Time (minutes)</FieldLabel>
                  <Input type="number" {...field} id="bufferMinutes" aria-invalid={fieldState.invalid} />
                  <FieldDescription className="text-[9px] font-bold text-black/60 dark:text-white/60 uppercase tracking-wider">Time to keep free between meetings.</FieldDescription>
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
                <Field data-invalid={fieldState.invalid} className="space-y-1">
                  <FieldLabel htmlFor="minNoticeHours" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Min Notice (hours)</FieldLabel>
                  <Input type="number" {...field} id="minNoticeHours" aria-invalid={fieldState.invalid} />
                  <FieldDescription className="text-[9px] font-bold text-black/60 dark:text-white/60 uppercase tracking-wider">Minimum hours before a meeting can be booked.</FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </div>

        <FieldGroup className="pt-2">
          <Controller
            name="workingDays"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="space-y-2">
                <FieldLabel className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Working Days</FieldLabel>
                <div className="flex flex-wrap gap-4 mt-1">
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
                        className="border-2 border-black dark:border-white rounded-none w-4 h-4 data-[state=checked]:bg-[#FFD93D] data-[state=checked]:text-black"
                      />
                      <label htmlFor={`workingDays-${day.id}`} className="text-xs font-bold uppercase tracking-wider leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-black dark:text-white">
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

      <div className="space-y-4 pt-2">
        <h3 className="text-xs font-black uppercase tracking-wider border-b-4 border-black dark:border-white pb-1 mt-6 mb-3 text-black dark:text-white">Custom Persona Instructions</h3>
        <FieldGroup>
          <Controller
            name="customInstructions"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="space-y-1">
                <FieldLabel htmlFor="customInstructions" className="font-black uppercase tracking-wider text-[10px] text-black dark:text-white">Additional Instructions</FieldLabel>
                <Textarea 
                  placeholder="E.G. ALWAYS GREET THE USER WARMLY. IF THEY ASK ABOUT PRICING, SAY IT STARTS AT $99/MO." 
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
      <div className="space-y-4 p-6 border-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#1C1C1F] rounded-none shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] relative overflow-hidden group">
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-black dark:text-white">
              <span className="flex h-6 w-6 items-center justify-center border-2 border-black bg-[#C4B5FD] text-black font-black text-xs">
                T
              </span>
              Telegram Bot Integration
            </h3>
            <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 max-w-2xl leading-normal">
              Link your agent to the official Telegram assistant. Once connected, your bot will alert you of upcoming events, display recent emails, support interactive approval buttons, and chat directly in AI Agent mode.
            </p>
          </div>
          
          {telegramStatus.isConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-none bg-[#86EFAC] px-2.5 py-1 text-[10px] font-black uppercase text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-none bg-[#FF6B6B] px-2.5 py-1 text-[10px] font-black uppercase text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]">
              Not Configured
            </span>
          )}
        </div>

        <div className="pt-4 border-t-2 border-black/20 dark:border-white/20 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs font-bold uppercase tracking-wider">
            {telegramStatus.isConnected ? (
              <div className="space-y-1">
                <span className="text-black/60 dark:text-white/60">Linked Chat ID: </span>
                <code className="px-2 py-0.5 border-2 border-black bg-white dark:bg-black font-mono font-black text-black dark:text-white">{telegramStatus.chatId}</code>
              </div>
            ) : telegramStatus.botUsername && telegramStatus.connectionCode ? (
              <span className="text-[#db6802] font-black">✨ Webhook active! Send the code below to the bot to verify.</span>
            ) : (
              <span className="text-black/60 dark:text-white/60">Click connect to generate your Telegram invite link.</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!telegramStatus.isConnected && !telegramStatus.botUsername && (
              <Button
                type="button"
                variant="outline"
                disabled={telegramStatus.isSettingUp}
                onClick={handleConnectTelegram}
                className="bg-[#C4B5FD] hover:bg-[#b09ffc] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 py-2.5 h-auto rounded-none"
              >
                {telegramStatus.isSettingUp ? "Activating..." : "Connect Telegram Bot"}
              </Button>
            )}

            {telegramStatus.botUsername && telegramStatus.connectionCode && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex flex-col items-start bg-[#FFD93D] border-2 border-black rounded-none px-4 py-1.5 shadow-[2px_2px_0px_0px_#000]">
                  <span className="text-[8px] text-black font-black uppercase mb-0.5">Connection Code</span>
                  <span className="text-xl font-mono font-black tracking-widest text-black">{telegramStatus.connectionCode}</span>
                </div>
                <Button
                  type="button"
                  asChild
                  className="bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] font-black uppercase text-xs hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 flex items-center gap-1.5 h-12 py-3 px-6 rounded-none"
                >
                  <a 
                    href={`https://t.me/${telegramStatus.botUsername}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    👉 Open Telegram Bot
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
                className="bg-white dark:bg-black text-black dark:text-white border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 py-2.5 h-auto rounded-none"
              >
                {telegramStatus.isSettingUp ? "Updating..." : "Reconnect / Link New Chat"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading} 
        className="w-full md:w-auto bg-[#FFD93D] dark:bg-[#db6802] text-black border-4 border-black dark:border-white py-4 px-8 text-sm font-black uppercase tracking-wider hover:bg-[#ffbe25] hover:text-black rounded-none shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] btn-push transition-colors duration-100 flex items-center justify-center"
      >
        {isLoading ? "Saving..." : initialData?.vapiAssistantId ? "Update Agent" : "Provision Agent"}
      </Button>
    </form>
  )
}
