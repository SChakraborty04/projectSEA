import React from 'react';
import ReactMarkdown from 'react-markdown';

export function Message({ children, from }: { children: React.ReactNode, from: string }) {
  return (
    <div className={`flex w-full mb-6 ${from === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-none border-4 border-black dark:border-white px-5 py-4 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] font-bold text-xs uppercase tracking-wide ${
        from === 'user' 
          ? 'bg-[#FFD93D] text-black ml-auto' 
          : 'bg-white dark:bg-[#1C1C1F] text-black dark:text-white'
      }`}>
        {children}
      </div>
    </div>
  );
}

export function MessageContent({ children }: { children: React.ReactNode }) {
  return <div className="prose prose-sm dark:prose-invert font-bold text-xs uppercase tracking-wide leading-relaxed">{children}</div>;
}

export function MessageResponse({ children }: { children: string }) {
  return <ReactMarkdown>{children}</ReactMarkdown>;
}
