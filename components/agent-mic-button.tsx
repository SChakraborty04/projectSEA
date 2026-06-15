"use client"

import { Mic, MicOff } from "lucide-react"
import { useVapiContext } from "@/components/vapi-provider"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function AgentMicButton() {
  const { isCallActive, toggleCall, vapiAssistantId } = useVapiContext()
  const router = useRouter()

  console.log("AgentMicButton Render: ", { vapiAssistantId, isCallActive })

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!vapiAssistantId) {
      toast.error("Voice assistant is not set up yet.", {
        action: {
          label: "Set Up",
          onClick: () => router.push("/dashboard/agent/setup")
        }
      });
      return;
    }
    
    console.log("Mic button clicked, toggling call...");
    toggleCall();
  }

  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={handleClick}
      className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center ${
        !vapiAssistantId ? "hover:bg-primary/20 text-muted-foreground" :
        isCallActive ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : "hover:bg-primary/20 text-muted-foreground"
      }`}
    >
      {isCallActive ? <MicOff className="size-4" /> : <Mic className="size-4" />}
    </div>
  )
}
