import React from 'react';

export function Conversation({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex-1 overflow-hidden relative ${className || ''}`}>{children}</div>;
}

export function ConversationContent({ children }: { children: React.ReactNode }) {
  return <div className="h-full overflow-y-auto pb-32 flex flex-col">{children}</div>;
}

export function ConversationScrollButton() {
  return null; // Optional floating scroll to bottom button
}
