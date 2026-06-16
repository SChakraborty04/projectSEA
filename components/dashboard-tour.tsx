"use client"

import * as React from "react"
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Mic, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Play,
  ArrowRight
} from "lucide-react"

export function DashboardTour() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(0)

  React.useEffect(() => {
    // Automatically trigger for new users
    const hasSeenTour = localStorage.getItem("superea-tour-seen")
    if (!hasSeenTour) {
      setIsOpen(true)
    }

    // Listen to manual triggers from the sidebar
    const handleStartTour = () => {
      setCurrentStep(0)
      setIsOpen(true)
    }
    window.addEventListener("start-dashboard-tour", handleStartTour)
    return () => {
      window.removeEventListener("start-dashboard-tour", handleStartTour)
    }
  }, [])

  const steps = [
    {
      title: "Welcome to SuperEA ⚡",
      description: "Meet your personal AI executive assistant. We've built an autonomous assistant to handle your emails, schedule meetings, and take voice commands directly in your browser. Let's take a quick 1-minute visual tour!",
      visual: (
        <div className="flex flex-col items-center justify-center h-48 bg-[#FFD93D] dark:bg-[#db6802] border-4 border-black text-black p-4 relative overflow-hidden isolate">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_50%,#000_50%,#000_75%,transparent_75%,transparent)] bg-[length:40px_40px] opacity-10 animate-[pulse_3s_infinite] z-0" />
          <span className="text-4xl font-black tracking-tighter uppercase mb-2 z-20 bg-white">SUPEREA</span>
          <span className="text-xs font-bold uppercase bg-black text-white px-2 py-0.5 border border-black z-20">YOUR PERSONAL AI ASSISTANT</span>
        </div>
      )
    },
    {
      title: "In-Browser Voice Agent 🎙️",
      description: "Speak directly to your assistant. Simply click the microphone button at the bottom of the sidebar to start a call. Your agent will greet you and can manage calendar events or write emails in real-time.",
      visual: (
        <div className="flex flex-col items-center justify-center h-48 bg-[#FFFDF5] dark:bg-[#1C1C1F] border-4 border-black p-4 text-center">
          <div className="relative flex items-center justify-center mb-2">
            <span className="absolute inline-flex h-16 w-16 animate-ping bg-[#FFD93D]/30 dark:bg-[#db6802]/30 border-2 border-black" />
            <div className="relative w-12 h-12 bg-[#FFD93D] dark:bg-[#db6802] text-black dark:text-white border-4 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <Mic className="size-6 text-black" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60">"Schedule meeting with Jonathan for tomorrow at 2 PM"</span>
        </div>
      )
    },
    {
      title: "Email Approval Pipeline 📬",
      description: "SuperEA monitors your inbox for calendar requests. When a request arrives, the AI automatically drafts a response and queues it. Review the draft, then click 'Approve' to instantly dispatch it via Gmail.",
      visual: (
        <div className="flex flex-col justify-between h-48 bg-[#FFFDF5] dark:bg-[#1C1C1F] border-4 border-black p-4">
          <div className="border-2 border-black p-2 bg-white dark:bg-black text-left">
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-black/60 dark:text-white/60 mb-1">
              <Mail className="size-3" /> Gmail Draft Queue
            </div>
            <div className="text-[10px] font-bold uppercase truncate">To: Jonathan (jonathan@corp.com)</div>
            <div className="text-[9px] font-medium text-black/50 dark:text-white/50 truncate">Draft: Confirming our meeting for tomorrow...</div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#FF6B6B] border-2 border-black text-white p-1 text-[8px] font-black uppercase text-center">Discard</div>
            <div className="flex-1 bg-[#FFD93D] border-2 border-black text-black p-1 text-[8px] font-black uppercase text-center animate-pulse">Approve ✓</div>
          </div>
        </div>
      )
    },
    {
      title: "Smart Calendar Schedulers 📅",
      description: "No more double bookings. Your assistant checks your live Google Calendar availability before scheduling any meetings, keeping a safe buffer time gap, and always preserving original event details on updates.",
      visual: (
        <div className="flex items-center justify-center h-48 bg-[#FFFDF5] dark:bg-[#1C1C1F] border-4 border-black p-4">
          <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
            <div className="border border-black p-2 bg-black/5 text-center text-[10px] font-black">FRI 1:00 PM<br/><span className="text-[8px] text-[#FF6B6B]">BUSY</span></div>
            <div className="border-2 border-black p-2 bg-[#FFD93D] text-black text-center text-[10px] font-black shadow-[2px_2px_0px_0px_#000] animate-bounce">FRI 2:00 PM<br/><span className="text-[8px]">FREE Slot</span></div>
            <div className="border border-black p-2 bg-black/5 text-center text-[10px] font-black">FRI 3:00 PM<br/><span className="text-[8px] text-[#FF6B6B]">BUSY</span></div>
          </div>
        </div>
      )
    },
    {
      title: "Full GDPR Control & Security 🔒",
      description: "Your data privacy is fully respected. Easily check connected accounts, link new Google configurations, and exercise your GDPR Right to Erasure to permanently delete all data from our servers in a single click.",
      visual: (
        <div className="flex flex-col items-center justify-center h-48 bg-[#FF6B6B] text-white border-4 border-black p-4 text-center">
          <ShieldCheck className="size-10 mb-2 text-white animate-[pulse_2s_infinite]" />
          <h4 className="text-xs font-black uppercase tracking-tight">GDPR Erasure Enabled</h4>
          <p className="text-[8px] font-bold uppercase tracking-wider text-white/80 mt-1">Right to be Forgotten compliant</p>
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem("superea-tour-seen", "true")
    setIsOpen(false)
  }

  if (!isOpen) return null

  const activeStep = steps[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-lg bg-[#FFFDF5] dark:bg-[#1C1C1F] border-4 border-black dark:border-white p-6 shadow-[8px_8px_0px_0px_#000] dark:shadow-[8px_8px_0px_0px_#fff] relative animate-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button 
          onClick={handleComplete}
          className="absolute top-4 right-4 bg-[#FF6B6B] hover:bg-red-600 text-white border-2 border-black p-1 shadow-[2px_2px_0px_0px_#000] active:translate-y-px transition-all cursor-pointer rounded-none"
        >
          <X className="size-4" />
        </button>

        {/* Storybook Content */}
        <div className="space-y-4">
          
          {/* Header */}
          <div className="border-b-2 border-dashed border-black dark:border-white pb-2">
            <span className="text-[9px] font-black uppercase tracking-widest bg-[#FFD93D] text-black border border-black px-1.5 py-0.5">
              Tour Step {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Visual Container */}
          <div className="w-full">
            {activeStep.visual}
          </div>

          {/* Text Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-black uppercase tracking-tight text-black dark:text-white">
              {activeStep.title}
            </h3>
            <p className="text-xs font-bold uppercase tracking-wide leading-relaxed text-black/70 dark:text-white/70">
              {activeStep.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-black/10 dark:bg-white/10 h-3 border-2 border-black dark:border-white">
            <div 
              className="bg-[#FFD93D] h-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleComplete}
              className="text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white cursor-pointer"
            >
              Skip Tour
            </button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="bg-black/10 dark:bg-white/10 text-black dark:text-white border-2 border-black dark:border-white px-3 py-1.5 font-black uppercase tracking-wider text-[10px] shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] active:translate-y-px transition-all cursor-pointer flex items-center gap-1 rounded-none"
                >
                  <ChevronLeft className="size-3" /> Back
                </button>
              )}
              
              <button
                type="button"
                onClick={handleNext}
                className="bg-[#FFD93D] dark:bg-[#db6802] text-black dark:text-white border-2 border-black dark:border-white px-4 py-1.5 font-black uppercase tracking-wider text-[10px] shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff] active:translate-y-px transition-all cursor-pointer flex items-center gap-1 rounded-none"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Let's Go! <Play className="size-3 fill-current" />
                  </>
                ) : (
                  <>
                    Next <ChevronRight className="size-3" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
