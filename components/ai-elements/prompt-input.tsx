import React, { useRef } from 'react';
import { SendIcon } from 'lucide-react';
import { AgentMicButton } from '@/components/agent-mic-button';

export function PromptInput({ children, onSubmit, className }: { children: React.ReactNode, onSubmit: () => void, className?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <div className={`absolute bottom-6 left-6 right-6 ${className || ''}`}>
      <form 
        ref={formRef}
        onSubmit={(e) => { 
          e.preventDefault(); 
          onSubmit(); 
        }} 
        className="max-w-4xl mx-auto w-full"
      >
        {children}
      </form>
    </div>
  );
}

export function PromptInputBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex items-center bg-background border shadow-sm rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/50 transition-all pl-12 pr-12">
      <div className="absolute left-3">
        <AgentMicButton />
      </div>
      {children}
      <button 
        type="submit" 
        className="absolute right-3 p-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
      >
        <SendIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export function PromptInputTextarea({ className, onChange, value, placeholder, disabled }: any) {
  return (
    <textarea 
      className={`w-full bg-transparent px-4 py-3 outline-none resize-none min-h-[44px] max-h-[200px] text-sm ${className || ''}`} 
      onChange={onChange} 
      value={value} 
      placeholder={placeholder} 
      disabled={disabled} 
      rows={1}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }} 
    />
  );
}
