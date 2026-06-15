"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X, ArrowRight } from "lucide-react";

export function KeyboardShortcuts() {
    const router = useRouter();
    const pathname = usePathname();
    const { toggleSidebar } = useSidebar();
    const { resolvedTheme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    
    useEffect(() => {
        let lastKey = "";
        let timer: NodeJS.Timeout;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if typing in input/textarea/select
            const target = e.target as HTMLElement;
            const isTyping = target.isContentEditable || 
                             target.tagName === "INPUT" || 
                             target.tagName === "TEXTAREA" || 
                             target.tagName === "SELECT";
                             
            if (isTyping) {
                // Allow escape to blur/unfocus the typing element
                if (e.key === "Escape") {
                    target.blur();
                }
                return;
            }

            if (e.defaultPrevented || e.repeat) return;
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            // Shift + / is '?'
            if (e.key === "?") {
                e.preventDefault();
                setIsOpen(prev => !prev);
                return;
            }

            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
                return;
            }

            // Theme Toggle
            if (e.key.toLowerCase() === "d") {
                e.preventDefault();
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                return;
            }

            // Sidebar Toggle
            if (e.key.toLowerCase() === "t") {
                e.preventDefault();
                toggleSidebar();
                return;
            }

            // Quick Chat/Compose Focus
            if (e.key.toLowerCase() === "c") {
                if (pathname === "/dashboard/email") {
                    return; // Let the email page's local handler manage 'c' key press
                }
                e.preventDefault();
                router.push("/dashboard/chat");
                // Focus the textarea after navigation
                setTimeout(() => {
                    const textarea = document.getElementById("ai-textarea");
                    if (textarea) textarea.focus();
                }, 100);
                return;
            }

            // Sequence navigation: 'g' then another key
            if (lastKey === "g") {
                lastKey = "";
                clearTimeout(timer);
                if (e.key.toLowerCase() === "d") {
                    e.preventDefault();
                    router.push("/dashboard");
                } else if (e.key.toLowerCase() === "c") {
                    e.preventDefault();
                    router.push("/dashboard/chat");
                } else if (e.key.toLowerCase() === "e") {
                    e.preventDefault();
                    router.push("/dashboard/email");
                } else if (e.key.toLowerCase() === "a") {
                    e.preventDefault();
                    router.push("/dashboard/calendar");
                } else if (e.key.toLowerCase() === "s") {
                    e.preventDefault();
                    router.push("/dashboard/agent/setup");
                }
                return;
            }

            if (e.key.toLowerCase() === "g") {
                lastKey = "g";
                timer = setTimeout(() => {
                    lastKey = "";
                }, 1000); // 1-second window for the second key
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            clearTimeout(timer);
        };
    }, [router, pathname, toggleSidebar, resolvedTheme, setTheme, isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b p-4 bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Keyboard className="w-5 h-5 text-primary animate-pulse" />
                                <h3 className="text-base font-semibold font-heading">Keyboard Shortcuts</h3>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
                            {/* Navigation */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-muted-foreground">Go to Dashboard</span>
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">g</kbd>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">d</kbd>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-muted-foreground">Go to AI Chat</span>
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">g</kbd>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">c</kbd>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-muted-foreground">Go to Emails</span>
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">g</kbd>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">e</kbd>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-muted-foreground">Go to Calendar</span>
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">g</kbd>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">a</kbd>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pb-2">
                                        <span className="text-muted-foreground">Go to Agent Setup</span>
                                        <div className="flex items-center gap-1">
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">g</kbd>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">s</kbd>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-muted-foreground">Compose / Start AI Chat</span>
                                        <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">c</kbd>
                                    </div>
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-muted-foreground">Toggle Sidebar</span>
                                        <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">t</kbd>
                                    </div>
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-muted-foreground">Toggle Light/Dark Theme</span>
                                        <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">d</kbd>
                                    </div>
                                    <div className="flex justify-between items-center pb-2">
                                        <span className="text-muted-foreground">Show Help Menu</span>
                                        <kbd className="px-2 py-0.5 text-xs font-mono bg-muted border border-border rounded shadow-sm">?</kbd>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-muted/20 text-center text-xs text-muted-foreground">
                            Press <kbd className="px-1.5 py-0.5 font-mono bg-muted border border-border rounded shadow-sm">Esc</kbd> to close at any time.
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
