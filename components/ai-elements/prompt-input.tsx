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
    <div className="relative flex items-center bg-white dark:bg-[#1C1C1F] border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] rounded-none p-2 pl-12 pr-14 transition-all">
      <div className="absolute left-3">
        <AgentMicButton />
      </div>
      {children}
      <button 
        type="submit" 
        className="absolute right-3 p-2 bg-[#FFD93D] text-black border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-75 rounded-none"
      >
        <SendIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export function PromptInputTextarea({ className, onChange, value, placeholder, disabled }: any) {
  return (
    <textarea 
      className={`w-full bg-transparent px-4 py-3 outline-none resize-none min-h-[44px] max-h-[200px] text-xs font-bold uppercase tracking-wider text-black dark:text-white ${className || ''}`} 
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
