"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from "react"
import Vapi from "@vapi-ai/web"

type VapiContextType = {
  isCallActive: boolean;
  startCall: () => void;
  stopCall: () => void;
  toggleCall: () => void;
  vapiAssistantId: string | null;
}

const VapiContext = createContext<VapiContextType | undefined>(undefined)

export function VapiProvider({ 
  children, 
  vapiPublicKey, 
  vapiAssistantId 
}: { 
  children: React.ReactNode; 
  vapiPublicKey: string; 
  vapiAssistantId: string | null; 
}) {
  const [isCallActive, setIsCallActive] = useState(false)
  const vapiRef = useRef<any>(null)

  useEffect(() => {
    if (vapiPublicKey) {
      vapiRef.current = new Vapi(vapiPublicKey)
      
      vapiRef.current.on('call-start', () => setIsCallActive(true))
      vapiRef.current.on('call-end', () => setIsCallActive(false))
    }
    
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
      }
    }
  }, [vapiPublicKey])

  const startCall = () => {
    if (!vapiRef.current || !vapiAssistantId) {
      console.warn("Vapi is not fully initialized or Assistant ID is missing.")
      return
    }
    vapiRef.current.start(vapiAssistantId)
  }

  const stopCall = () => {
    if (!vapiRef.current) return
    vapiRef.current.stop()
  }

  const toggleCall = () => {
    if (isCallActive) stopCall()
    else startCall()
  }

  return (
    <VapiContext.Provider value={{ isCallActive, startCall, stopCall, toggleCall, vapiAssistantId }}>
      {children}
    </VapiContext.Provider>
  )
}

export function useVapiContext() {
  const context = useContext(VapiContext)
  if (context === undefined) {
    throw new Error("useVapiContext must be used within a VapiProvider")
  }
  return context
}
