"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { X, Volume2, Terminal, Loader2 } from "lucide-react"

type VapiContextType = {
  isCallActive: boolean;
  startCall: () => void;
  stopCall: () => void;
  toggleCall: () => void;
  vapiAssistantId: string | null;
  isSpeaking: boolean;
  isThinking: boolean;
  activeToolCalls: any[];
}

const VapiContext = createContext<VapiContextType | undefined>(undefined)

export function VapiProvider({ 
  children,
  vapiPublicKey, 
  vapiAssistantId: initialVapiAssistantId
}: { 
  children: React.ReactNode; 
  vapiPublicKey: string; 
  vapiAssistantId: string | null; 
}) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [agentSettings, setAgentSettings] = useState<{ name: string; voiceId: string; firstMessage: string; userName: string } | null>(null)
  
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [activeToolCalls, setActiveToolCalls] = useState<any[]>([])

  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isSpeakingRef = useRef(false)
  const conversationHistoryRef = useRef<string>("")
  const isCallActiveRef = useRef(false)

  // Fetch agent voice settings on mount/update
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/voice/status")
        if (res.ok) {
          const data = await res.json()
          setAgentSettings(data)
        }
      } catch (err) {
        console.error("Failed to fetch voice status:", err)
      }
    }
    fetchSettings()
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      } catch (e) {}
      recognitionRef.current = null
    }
    if (audioRef.current) {
      try {
        audioRef.current.pause()
      } catch (e) {}
      audioRef.current = null
    }
    isCallActiveRef.current = false
    setIsCallActive(false)
    setIsSpeaking(false)
    setIsThinking(false)
    setActiveToolCalls([])
  }

  // Play text using Cartesia TTS
  const speakText = async (text: string): Promise<void> => {
    if (!isCallActiveRef.current) return

    // Stop recognition while the assistant is speaking
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }

    isSpeakingRef.current = true
    setIsSpeaking(true)

    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: agentSettings?.voiceId
        })
      })

      if (!res.ok) throw new Error("TTS failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      if (audioRef.current) {
        try {
          audioRef.current.pause()
        } catch (e) {}
      }

      const audio = new Audio(url)
      audioRef.current = audio

      return new Promise((resolve) => {
        audio.onended = () => {
          isSpeakingRef.current = false
          setIsSpeaking(false)
          // Resume listening after audio finishes
          if (isCallActiveRef.current) {
            startListening()
          }
          resolve()
        }
        audio.onerror = () => {
          isSpeakingRef.current = false
          setIsSpeaking(false)
          if (isCallActiveRef.current) {
            startListening()
          }
          resolve()
        }
        audio.play().catch((err) => {
          console.error("Audio playback blocked/failed:", err)
          isSpeakingRef.current = false
          setIsSpeaking(false)
          if (isCallActiveRef.current) {
            startListening()
          }
          resolve()
        })
      })

    } catch (err) {
      console.error("Speak error:", err)
      isSpeakingRef.current = false
      setIsSpeaking(false)
      if (isCallActiveRef.current) {
        startListening()
      }
    }
  }

  // Start speech recognition listening
  const startListening = () => {
    if (!isCallActiveRef.current || isSpeakingRef.current) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome or Safari.")
      cleanup()
      return
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => {
        console.log("Speech recognition started...")
      }

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript
        if (!transcript) return

        console.log("Speech recognition transcript:", transcript)
        toast.info(`You: "${transcript}"`)

        // Stop recognition while thinking
        try {
          recognition.stop()
        } catch (e) {}

        // Append user prompt to history
        conversationHistoryRef.current += `\nUSER: ${transcript}`

        // Trigger AI agent response
        toast.loading("Agent is thinking...", { id: "agent-thinking" })
        setIsThinking(true)
        setActiveToolCalls([])
        try {
          const res = await fetch("/api/voice/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: transcript,
              history: conversationHistoryRef.current
            })
          })

          toast.dismiss("agent-thinking")
          setIsThinking(false)

          if (!res.ok) throw new Error("Chat agent call failed")
          
          const json = await res.json()
          const reply = json.text || "I processed that."
          const toolCalls = json.toolCalls || []
          setActiveToolCalls(toolCalls)

          // Append agent response to history
          conversationHistoryRef.current += `\nASSISTANT: ${reply}`
          
          // Speak the reply
          await speakText(reply)

          // Check if agent wants to say goodbye
          const lowerReply = reply.toLowerCase()
          if (
            lowerReply.includes("goodbye") || 
            lowerReply.includes("bye bye") || 
            lowerReply.includes("talk to you later")
          ) {
            setTimeout(() => {
              cleanup()
            }, 1000)
          }

        } catch (err) {
          toast.dismiss("agent-thinking")
          setIsThinking(false)
          toast.error("Failed to get agent response")
          if (isCallActiveRef.current) {
            startListening()
          }
        }
      }

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error)
        // Auto-restart listening if it's not a severe error
        if (event.error !== "aborted" && isCallActiveRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            startListening()
          }, 1000)
        }
      }

      recognition.onend = () => {
        console.log("Speech recognition ended.")
      }

      recognition.start()

    } catch (e) {
      console.error("Failed to start speech recognition:", e)
    }
  }

  const startCall = async () => {
    cleanup()
    isCallActiveRef.current = true
    setIsCallActive(true)
    setIsSpeaking(false)
    setIsThinking(false)
    setActiveToolCalls([])
    conversationHistoryRef.current = ""
    
    toast.success("Voice assistant connected!")

    const firstMsg = agentSettings?.firstMessage || "Hello, how can I help you today?"
    conversationHistoryRef.current += `\nASSISTANT: ${firstMsg}`
    await speakText(firstMsg)
  }

  const stopCall = () => {
    cleanup()
    toast.info("Voice assistant disconnected.")
  }

  const toggleCall = () => {
    if (isCallActive) stopCall()
    else startCall()
  }

  // We expose a static fallback to satisfy contract
  const vapiAssistantId = initialVapiAssistantId || "custom-mastra-voice"

  return (
    <VapiContext.Provider value={{ 
      isCallActive, 
      startCall, 
      stopCall, 
      toggleCall, 
      vapiAssistantId,
      isSpeaking,
      isThinking,
      activeToolCalls
    }}>
      {children}
      {isCallActive && (
        <AgentVoicePopupCard 
          isSpeaking={isSpeaking}
          isThinking={isThinking}
          activeToolCalls={activeToolCalls}
          agentName={agentSettings?.name || "SuperEA"}
          userName={agentSettings?.userName || "User"}
          onDisconnect={stopCall}
        />
      )}
    </VapiContext.Provider>
  )
}

function AgentVoicePopupCard({
  isSpeaking,
  isThinking,
  activeToolCalls,
  agentName,
  userName,
  onDisconnect
}: {
  isSpeaking: boolean;
  isThinking: boolean;
  activeToolCalls: any[];
  agentName: string;
  userName: string;
  onDisconnect: () => void;
}) {
  const getToolLabel = (name: string) => {
    if (name.includes("request_email_approval")) return "Pushed Telegram Approval";
    if (name.includes("events.getMany") || name.includes("getAvailability")) return "Checked Calendar Availability";
    if (name.includes("events.insert") || name.includes("events.create")) return "Scheduled Calendar Event";
    if (name.includes("messages.list")) return "Searched Gmail History";
    if (name.includes("messages.get") || name.includes("messages.send")) return "Processed Email Message";
    if (name.includes("list_operations")) return "Exploring API Operations";
    if (name.includes("get_schema")) return "Validating API Schema";
    if (name.includes("run_script")) return "Executing AI script";
    return name.split('.').pop() || name;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      {/* Brutalist Stylesheet */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-bar {
          0%, 100% { transform: scaleY(0.15); }
          50% { transform: scaleY(1); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.75); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes scan-laser {
          0% { transform: translateY(0); }
          50% { transform: translateY(40px); }
          100% { transform: translateY(0); }
        }
        .animate-bounce-bar-1 { animation: bounce-bar 0.6s ease-in-out infinite; animation-delay: 0.1s; }
        .animate-bounce-bar-2 { animation: bounce-bar 0.6s ease-in-out infinite; animation-delay: 0.4s; }
        .animate-bounce-bar-3 { animation: bounce-bar 0.6s ease-in-out infinite; animation-delay: 0.2s; }
        .animate-bounce-bar-4 { animation: bounce-bar 0.6s ease-in-out infinite; animation-delay: 0.6s; }
        .animate-bounce-bar-5 { animation: bounce-bar 0.6s ease-in-out infinite; animation-delay: 0.3s; }
        .animate-bounce-bar-6 { animation: bounce-bar 0.6s ease-in-out infinite; animation-delay: 0.5s; }
        .animate-bounce-bar-7 { animation: bounce-bar 0.6s ease-in-out infinite; animation-delay: 0.1s; }
      `}} />

      <div className="bg-[#FFFDF5] dark:bg-[#1C1C1F] border-4 border-black dark:border-white p-4 w-[320px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] flex flex-col gap-3 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black dark:border-white pb-2">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase text-black dark:text-white">{agentName} Active</span>
          </div>
          <button 
            onClick={onDisconnect}
            className="border-2 border-black bg-[#FF6B6B] hover:bg-[#ff4f4f] text-black font-black p-1 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-75 cursor-pointer"
            title="Disconnect"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Visualizer Box */}
        <div className="border-2 border-black bg-white dark:bg-black p-3 h-20 flex items-center justify-center relative overflow-hidden">
          {isThinking ? (
            /* Thinking / Scanning State */
            <div className="flex flex-col items-center justify-center w-full h-full relative">
              <div className="w-full h-10 border border-black/10 dark:border-white/10 relative overflow-hidden flex items-center justify-center">
                {/* Laser scan line */}
                <div 
                  className="absolute left-0 right-0 h-1 bg-[#FFD93D] dark:bg-[#db6802] shadow-[0_0_8px_#FFD93D]"
                  style={{ animation: 'scan-laser 2s linear infinite' }}
                />
                <span className="text-[9px] font-black tracking-widest text-[#db6802] dark:text-[#FFD93D] uppercase animate-pulse">
                  Analyzing Command
                </span>
              </div>
            </div>
          ) : isSpeaking ? (
            /* Agent Speaking State (Pulsing sound waves) */
            <div className="flex items-center justify-center gap-4 w-full h-full">
              <div className="relative flex items-center justify-center">
                <span className="absolute inline-flex h-8 w-8 rounded-full bg-[#C4B5FD] opacity-75" style={{ animation: 'pulse-ring 1.2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }}></span>
                <span className="absolute inline-flex h-12 w-12 rounded-full bg-[#C4B5FD] opacity-40" style={{ animation: 'pulse-ring 1.2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite', animationDelay: '0.4s' }}></span>
                <div className="relative w-8 h-8 bg-[#C4B5FD] border-2 border-black flex items-center justify-center z-10">
                  <Volume2 className="size-4 text-black animate-pulse" />
                </div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-black dark:text-white">Speaking...</span>
            </div>
          ) : (
            /* User Speaking / Listening State (CSS bounce waveform) */
            <div className="flex flex-col items-center justify-center w-full gap-2">
              <div className="flex items-end justify-center gap-1.5 h-8">
                <div className="w-1.5 bg-[#FFD93D] border border-black animate-bounce-bar-1 origin-bottom" style={{ height: '100%' }}></div>
                <div className="w-1.5 bg-[#FFD93D] border border-black animate-bounce-bar-2 origin-bottom" style={{ height: '100%' }}></div>
                <div className="w-1.5 bg-[#FFD93D] border border-black animate-bounce-bar-3 origin-bottom" style={{ height: '100%' }}></div>
                <div className="w-1.5 bg-[#FFD93D] border border-black animate-bounce-bar-4 origin-bottom" style={{ height: '100%' }}></div>
                <div className="w-1.5 bg-[#FFD93D] border border-black animate-bounce-bar-5 origin-bottom" style={{ height: '100%' }}></div>
                <div className="w-1.5 bg-[#FFD93D] border border-black animate-bounce-bar-6 origin-bottom" style={{ height: '100%' }}></div>
                <div className="w-1.5 bg-[#FFD93D] border border-black animate-bounce-bar-7 origin-bottom" style={{ height: '100%' }}></div>
              </div>
              <span className="text-[9px] font-black tracking-widest text-black/60 dark:text-white/60 uppercase truncate max-w-[280px]">
                Listening to {userName}
              </span>
            </div>
          )}
        </div>

        {/* Tool Calls Panel */}
        {(isThinking || activeToolCalls.length > 0) && (
          <div className="border-2 border-black bg-white dark:bg-black p-2 flex flex-col gap-1.5">
            <div className="flex items-center gap-1 border-b border-black/10 dark:border-white/10 pb-1">
              <Terminal className="size-3 text-black/60 dark:text-white/60" />
              <span className="text-[8px] font-black uppercase text-black/60 dark:text-white/60">
                Cognitive Actions
              </span>
            </div>
            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
              {isThinking && activeToolCalls.length === 0 && (
                <div className="flex items-center gap-1.5 text-[8px] font-bold text-black/60 dark:text-white/60 uppercase animate-pulse">
                  <Loader2 className="size-2.5 animate-spin" />
                  Running capabilities check...
                </div>
              )}
              {activeToolCalls.map((tool, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between text-[8px] font-bold uppercase p-1 bg-[#FFFDF5] dark:bg-[#1C1C1F] border border-black/20 dark:border-white/20"
                >
                  <span className="truncate max-w-[170px] text-black dark:text-white">
                    🛠️ {getToolLabel(tool.name)}
                  </span>
                  <span className="text-[7px] px-1 bg-green-500/20 text-green-500 border border-green-500/30">
                    Done
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function useVapiContext() {
  const context = useContext(VapiContext)
  if (context === undefined) {
    throw new Error("useVapiContext must be used within a VapiProvider")
  }
  return context
}
