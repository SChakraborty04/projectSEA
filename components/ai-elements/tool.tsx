import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Activity } from 'lucide-react';

export function Tool({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="w-full flex justify-end mb-6">
      <div className="max-w-[80%] bg-muted/50 border rounded-2xl overflow-hidden shadow-sm">
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
      className={`px-4 py-3 flex items-center justify-between hover:bg-muted/80 transition-colors ${className}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2">
        <Activity className={`w-4 h-4 ${state === 'output-available' ? 'text-green-500' : state === 'output-error' ? 'text-red-500' : 'text-amber-500 animate-pulse'}`} />
        <span className={`text-xs font-semibold uppercase tracking-wider ${state === 'output-error' ? 'text-red-500' : 'text-muted-foreground'}`}>
          {name} {state === 'output-available' ? 'completed' : state === 'output-error' ? 'failed' : 'running...'}
        </span>
      </div>
      {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </div>
  );
}

export function ToolContent({ children, expanded }: any) {
  if (!expanded) return null;
  return <div className="border-t bg-background/50 p-4 space-y-4">{children}</div>;
}

export function ToolInput({ input }: any) {
  return (
    <div>
      <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Input</div>
      <pre className="text-xs font-mono bg-muted p-2 rounded-md overflow-x-auto text-foreground/80">
        {JSON.stringify(input, null, 2)}
      </pre>
    </div>
  );
}

export function ToolOutput({ output, errorText }: any) {
  if (errorText) {
    return (
      <div>
        <div className="text-[10px] uppercase font-semibold text-red-500 mb-1">Error</div>
        <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded-md">{errorText}</div>
      </div>
    );
  }
  
  if (!output) return null;
  
  return (
    <div>
      <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Output</div>
      <pre className="text-xs font-mono bg-muted p-2 rounded-md overflow-x-auto text-foreground/80">
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  );
}
