import React from 'react';
import ReactMarkdown from 'react-markdown';

export function Message({ children, from }: { children: React.ReactNode, from: string }) {
  return (
    <div className={`flex w-full mb-6 ${from === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
        from === 'user' 
          ? 'bg-primary text-primary-foreground ml-auto rounded-tr-none' 
          : 'bg-muted text-foreground rounded-tl-none border shadow-sm'
      }`}>
        {children}
      </div>
    </div>
  );
}

export function MessageContent({ children }: { children: React.ReactNode }) {
  return <div className="prose prose-sm dark:prose-invert">{children}</div>;
}

export function MessageResponse({ children }: { children: string }) {
  return <ReactMarkdown>{children}</ReactMarkdown>;
}
