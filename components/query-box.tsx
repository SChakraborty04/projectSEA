"use client";

import { Mic, SendHorizontal, Upload } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface RuixenQueryBoxProps {
  onSend?: (message: string) => void;
}

export default function RuixenQueryBox({ onSend }: RuixenQueryBoxProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 56,
    maxHeight: 220,
  });

  const [inputValue, setInputValue] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSend?.(inputValue);
    setInputValue("");
    adjustHeight(true);
  };

  return (
    <div className="w-full px-4 py-6">
      <div className="relative max-w-2xl mx-auto bg-background rounded-3xl border border-input shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-shadow">
        <Textarea
          id="ai-textarea"
          ref={textareaRef}
          placeholder="Ask anything..."
          className={cn(
            "w-full resize-none border-none bg-transparent",
            "text-base text-foreground placeholder:text-muted-foreground",
            "px-5 py-3 pb-12 pr-[120px] rounded-2xl leading-relaxed",
            "transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        {/* Icon Buttons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1">
          

          <button
            type="button"
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              "p-2 rounded-full transition-all duration-200 ml-1",
              inputValue.trim()
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                : "bg-muted text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
