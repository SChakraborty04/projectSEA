"use client"

import * as React from "react"
import { CreditCard, Sparkles, Check, Hourglass, ShieldCheck, AlertTriangle, Lock } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

export default function BillingPage() {
  const { data: session } = authClient.useSession()
  const [joinedWaitlist, setJoinedWaitlist] = React.useState(false)

  const handleJoinWaitlist = async () => {
    const email = session?.user?.email
    if (!email) {
      toast.error("Failed to retrieve user email. Please try again.")
      return
    }

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setJoinedWaitlist(true)
        toast.success("Successfully joined the Beta Waitlist! We will notify you when subscription plans go live.")
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to join waitlist.")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred. Please try again.")
    }
  }

  const plans = [
    {
      name: "Alpha Trial",
      price: "$0",
      period: "forever (during alpha)",
      description: "Get early access to SuperEA features for testing and feedback.",
      features: [
        "Browser-based Voice Agent Calls",
        "Google Calendar Smart Scheduling",
        "Gmail Inbox Monitoring & Drafting",
        "Telegram Co-Pilot Approvals",
        "Free STT (Web Speech API)",
        "Sonic 3.5 TTS Voice Generation"
      ],
      badge: "Active",
      badgeColor: "bg-[#FFD93D] text-black",
      isCurrent: true,
      buttonText: "Current Plan"
    },
    {
      name: "Pro Assistant",
      price: "$29",
      period: "per month",
      description: "Unlock advanced integrations, higher concurrency, and dedicated phone lines.",
      features: [
        "Everything in Alpha Trial",
        "Dedicated Inbound Phone Number",
        "Pre-verified Custom Domain Routing",
        "Priority AI Model Latency (Lower ping)",
        "Extended Buffer Time & Timezone rules",
        "Weekly Communication Summaries"
      ],
      badge: "Coming in Beta",
      badgeColor: "bg-black text-[#FFD93D] border border-[#FFD93D]",
      isCurrent: false,
      buttonText: "Upgrade in Beta"
    },
    {
      name: "Executive Scale",
      price: "$99",
      period: "per month",
      description: "For founders, power users, and teams managing multiple agent instances.",
      features: [
        "Everything in Pro Assistant",
        "Up to 5 Co-pilot Agent Profiles",
        "Fine-tuned Custom Voices (Cartesia clone)",
        "Shared Team Calendar & Inbox Rules",
        "SLA Response Guarantee",
        "Custom API Endpoint Webhooks"
      ],
      badge: "Coming in Beta",
      badgeColor: "bg-black text-[#FFD93D] border border-[#FFD93D]",
      isCurrent: false,
      buttonText: "Upgrade in Beta"
    }
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="border-b-4 border-black dark:border-white pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white flex items-center gap-3">
          💳 Billing & Subscriptions
        </h1>
        <p className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-2 leading-relaxed">
          Manage your subscription plans, payment methods, and invoices.
        </p>
      </div>

      {/* Beta Announcement Banner */}
      <div className="border-4 border-black dark:border-white p-6 bg-[#FFD93D] text-black shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
        <div className="flex items-start gap-4">
          <div className="bg-black text-white p-2 border-2 border-black shrink-0">
            <Sparkles className="size-6 text-[#FFD93D]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-black uppercase tracking-tight">
              ⚡ Alpha Phase: Free Access Enabled
            </h2>
            <p className="text-xs font-bold uppercase leading-relaxed text-black/80">
              SuperEA is currently running in its initial alpha release. All AI automation, voice agents, calendar integrations, and approvals are 100% free of charge. Paid subscription tiers and custom usage limits will launch officially during the Beta phase.
            </p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="space-y-6">
        <h2 className="text-lg font-black uppercase tracking-tight border-b-2 border-black dark:border-white pb-2">
          Subscription Plans
        </h2>
        
        <div className="relative">
          {/* Lock Overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/45 dark:bg-black/60 backdrop-blur-[2px] border-4 border-black dark:border-white p-6 text-center">
            <div className="bg-[#FFD93D] dark:bg-[#db6802] text-black dark:text-white p-4 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] mb-4">
              <Lock className="size-8 animate-bounce" />
            </div>
            <div className="bg-[#FFFDF5] dark:bg-[#1C1C1F] border-4 border-black dark:border-white p-6 max-w-md shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff]">
              <h3 className="text-base font-black uppercase tracking-tight mb-2">Billing Plans Locked</h3>
              <p className="text-[10px] font-bold uppercase tracking-wide text-black/70 dark:text-white/70 leading-relaxed mb-4">
                Subscriptions and credit payments are disabled during the alpha testing phase. Join the waitlist to be notified when pricing plans go live.
              </p>
              <button
                type="button"
                onClick={handleJoinWaitlist}
                className="bg-[#FFD93D] dark:bg-[#db6802] text-black dark:text-white border-4 border-black dark:border-white px-5 py-2 font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] active:translate-y-px transition-all rounded-none cursor-pointer"
              >
                {joinedWaitlist ? "Joined Waitlist ✓" : "Join Subscription Waitlist"}
              </button>
            </div>
          </div>

          {/* Underlay container with blur / pointer-events-none */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 filter blur-[2px] pointer-events-none select-none opacity-45">
            {plans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`border-4 border-black dark:border-white p-6 bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] flex flex-col justify-between relative ${
                  plan.isCurrent ? 'ring-4 ring-offset-4 ring-[#FFD93D]' : ''
                }`}
              >
                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 border-2 border-black dark:border-white ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black uppercase tracking-tight mt-1">{plan.name}</h3>
                  <div className="mt-4 mb-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tighter">{plan.price}</span>
                    <span className="text-[10px] font-black uppercase text-black/60 dark:text-white/60">/ {plan.period}</span>
                  </div>
                  <p className="text-[10px] font-bold text-black/60 dark:text-white/60 uppercase leading-relaxed min-h-[40px] mb-4 border-b border-black/10 dark:border-white/10 pb-4">
                    {plan.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2 text-[10px] font-bold uppercase tracking-wider text-black/80 dark:text-white/80 leading-snug">
                        <Check className="size-3 text-[#FFD93D] shrink-0 mt-0.5" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={!plan.isCurrent}
                  className={`w-full border-4 border-black dark:border-white p-2.5 font-black uppercase tracking-wider text-[10px] shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] transition-all rounded-none text-center ${
                    plan.isCurrent 
                      ? 'bg-[#FFD93D] text-black cursor-default' 
                      : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 cursor-not-allowed border-black/30 dark:border-white/30 shadow-none'
                  }`}
                >
                  {plan.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice History Block */}
      <div className="border-4 border-black dark:border-white p-6 bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff]">
        <h2 className="text-lg font-black uppercase tracking-tight border-b-2 border-black dark:border-white pb-3 mb-4 flex items-center gap-2">
          <CreditCard className="size-5" /> Invoice History
        </h2>
        
        <div className="border-4 border-dashed border-black/20 dark:border-white/20 p-8 text-center bg-black/5 dark:bg-white/5">
          <Hourglass className="size-8 text-black/40 dark:text-white/40 mx-auto mb-3 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-wider">No Invoices Yet</h3>
          <p className="text-[10px] font-bold uppercase tracking-wide text-black/60 dark:text-white/60 mt-1 max-w-md mx-auto leading-relaxed">
            Invoices and billing receipts will start displaying here as soon as paid tiers launch in our Beta transition.
          </p>
        </div>
      </div>
    </div>
  )
}
