import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Activity } from 'lucide-react';

export function Tool({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="w-full flex justify-end mb-6">
      <div className="max-w-[80%] bg-[#FFFDF5] dark:bg-[#1C1C1F] border-4 border-black dark:border-white rounded-none overflow-hidden shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] ml-auto">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { expanded, setExpanded } as any);
          }
          return child;
        })}
      </div>
    </div>
  );
}

export function ToolHeader({ type, state, className, expanded, setExpanded }: any) {
  const name = type.replace('tool-', '');
  return (
    <div 
      className={`px-4 py-3 flex items-center justify-between hover:bg-[#FFD93D] dark:hover:bg-[#db6802] hover:text-black dark:hover:text-white transition-colors border-b-2 border-black/10 dark:border-white/10 ${className}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2">
        <Activity className={`w-4 h-4 ${state === 'output-available' ? 'text-green-600' : state === 'output-error' ? 'text-red-500 animate-pulse' : 'text-amber-500 animate-pulse'}`} />
        <span className={`text-[10px] font-black uppercase tracking-wider ${state === 'output-error' ? 'text-red-500' : 'text-black dark:text-white'}`}>
          {name} {state === 'output-available' ? 'completed' : state === 'output-error' ? 'failed' : 'running...'}
        </span>
      </div>
      {expanded ? <ChevronDown className="w-4 h-4 text-black dark:text-white" /> : <ChevronRight className="w-4 h-4 text-black dark:text-white" />}
    </div>
  );
}

export function ToolContent({ children, expanded }: any) {
  if (!expanded) return null;
  return <div className="border-t-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-4 space-y-4">{children}</div>;
}

export function ToolInput({ input }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase font-black text-black/60 dark:text-white/60 mb-1">Input</div>
      <pre className="text-xs font-mono bg-white dark:bg-black border-2 border-black dark:border-white p-2 rounded-none overflow-x-auto text-black dark:text-white">
        {JSON.stringify(input, null, 2)}
      </pre>
    </div>
  );
}

export function ToolOutput({ output, errorText }: any) {
  if (errorText) {
    return (
      <div>
        <div className="text-[10px] uppercase font-black text-[#FF6B6B] mb-1">Error</div>
        <div className="text-xs text-[#FF6B6B] bg-[#FF6B6B]/10 border-2 border-[#FF6B6B] p-2 rounded-none">{errorText}</div>
      </div>
    );
  }
  
  if (!output) return null;
  
  return (
    <div>
      <div className="text-[10px] uppercase font-black text-black/60 dark:text-white/60 mb-1">Output</div>
      <pre className="text-xs font-mono bg-white dark:bg-black border-2 border-black dark:border-white p-2 rounded-none overflow-x-auto text-black dark:text-white">
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  );
}
