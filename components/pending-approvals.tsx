"use client";

import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Mail, CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { useSearchParams, useRouter } from "next/navigation";

interface Draft {
    id: string;
    emailDetails: string;
    telegramMessageId: string | null;
    telegramChatId: string | null;
    status: string;
    createdAt: string;
}

export function PendingApprovals() {
    return (
        <Suspense fallback={<div className="text-sm font-bold uppercase tracking-wider text-black/60 dark:text-white/60">Loading email approvals...</div>}>
            <PendingApprovalsContent />
        </Suspense>
    );
}

function PendingApprovalsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const draftIdParam = searchParams.get("draft");

    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
    const [improvementText, setImprovementText] = useState("");
    const [isImproving, setIsImproving] = useState(false);

    // Read the query parameter to auto-select draft
    useEffect(() => {
        if (draftIdParam && drafts.length > 0) {
            const found = drafts.find(d => d.id === draftIdParam);
            if (found) {
                setSelectedDraft(found);
            }
        }
    }, [draftIdParam, drafts]);

    const handleClose = () => {
        setSelectedDraft(null);
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.has("draft")) {
                params.delete("draft");
                const newSearch = params.toString();
                router.push(`${window.location.pathname}${newSearch ? "?" + newSearch : ""}`, { scroll: false });
            }
        }
    };

    const fetchDrafts = async () => {
        try {
            const res = await fetch("/api/drafts");
            if (res.ok) {
                const data = await res.json();
                setDrafts(data.drafts || []);
            }
        } catch (error) {
            console.error("Failed to fetch drafts", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImprove = async () => {
        if (!selectedDraft || !improvementText.trim()) return;
        setIsImproving(true);
        try {
            const res = await fetch(`/api/drafts/${selectedDraft.id}/improve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback: improvementText })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Draft rewritten by AI!');
                const updatedDraft = {
                    ...selectedDraft,
                    emailDetails: JSON.stringify(data.draft)
                };
                setSelectedDraft(updatedDraft);
                setDrafts(drafts.map(d => d.id === selectedDraft.id ? updatedDraft : d));
                setImprovementText("");
            } else {
                toast.error(data.error || 'Failed to rewrite draft');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsImproving(false);
        }
    };

    useEffect(() => {
        fetchDrafts();
        // Poll every 10 seconds for new drafts
        const interval = setInterval(fetchDrafts, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/drafts/${id}/${action}`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success(action === 'approve' ? 'Email approved and sent!' : 'Draft discarded');
                setDrafts(drafts.map(d => d.id === id ? { ...d, status: action === 'approve' ? 'approved' : 'rejected' } : d));
            } else {
                toast.error(data.error || 'Action failed');
                fetchDrafts(); // Refresh state
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading && drafts.length === 0) {
        return <div className="text-sm text-muted-foreground">Loading email approvals...</div>;
    }

    if (drafts.length === 0) {
        return (
            <div className="space-y-4 px-4 lg:px-6">
                <h3 className="text-lg font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-black dark:text-white" />
                    Email Drafts & Approvals
                </h3>
                <Card className="flex flex-col items-center justify-center py-16 px-4 text-center border-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#1C1C1F] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] rounded-none">
                    <div className="bg-[#C4B5FD] p-4 border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] rounded-none mb-6">
                        <Mail className="h-8 w-8 text-black" />
                    </div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white mb-2">No Drafts Yet</CardTitle>
                    <CardDescription className="max-w-md mx-auto text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60">
                        Your AI assistant hasn't drafted any emails recently. When you ask it to send an email via chat, it will appear here for your approval.
                    </CardDescription>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 px-4 lg:px-6">
            <h3 className="text-lg font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-black dark:text-white" />
                Email Drafts & Approvals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drafts.map((draft) => {
                    let details: any = {};
                    try {
                        details = JSON.parse(draft.emailDetails);
                    } catch (e) { }

                    return (
                        <Card 
                            key={draft.id} 
                            className="flex flex-col relative overflow-hidden rounded-none border-4 border-black dark:border-white bg-white dark:bg-[#1C1C1F] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[4px_4px_0px_0px_#000] dark:hover:shadow-[4px_4px_0px_0px_#fff] transition-all cursor-pointer"
                            onClick={() => setSelectedDraft(draft)}
                        >
                            <CardHeader className="pb-3 border-b-4 border-black dark:border-white bg-[#FFFDF5] dark:bg-[#121214] p-4">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <CardTitle className="text-sm font-black uppercase tracking-wider text-black dark:text-white line-clamp-1">{details.subject || "No Subject"}</CardTitle>
                                        <CardDescription className="text-[10px] font-bold uppercase text-black/60 dark:text-white/60 mt-1 line-clamp-1">To: {details.to}</CardDescription>
                                    </div>
                                    {draft.status === "approved" && (
                                        <span className="inline-flex items-center bg-[#86EFAC] text-black border-2 border-black font-black text-[9px] uppercase px-2 py-0.5 shadow-[1px_1px_0px_0px_#000] whitespace-nowrap">
                                            Approved
                                        </span>
                                    )}
                                    {draft.status === "rejected" && (
                                        <span className="inline-flex items-center bg-[#FF6B6B] text-black border-2 border-black font-black text-[9px] uppercase px-2 py-0.5 shadow-[1px_1px_0px_0px_#000] whitespace-nowrap">
                                            Rejected
                                        </span>
                                    )}
                                    {draft.status === "pending" && (
                                        <span className="inline-flex items-center bg-[#FFD93D] text-black border-2 border-black font-black text-[9px] uppercase px-2 py-0.5 shadow-[1px_1px_0px_0px_#000] whitespace-nowrap">
                                            Pending
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 p-4 font-bold text-xs leading-relaxed text-black/80 dark:text-white/80">
                                <p className="line-clamp-3 whitespace-pre-wrap">
                                    {details.body}
                                </p>
                            </CardContent>
                            {draft.status === "pending" && (
                                <CardFooter className="flex flex-col gap-2 p-4 border-t-4 border-black dark:border-white mt-auto w-full bg-[#FFFDF5] dark:bg-[#121214]">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="w-full bg-[#86EFAC] hover:bg-[#6ee7b7] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 py-2.5 h-auto rounded-none"
                                        disabled={processingId === draft.id}
                                        onClick={(e) => { e.stopPropagation(); handleAction(draft.id, 'approve'); }}
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Approve & Send
                                    </Button>
                                    <div className="flex gap-2 w-full">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-[#C4B5FD] hover:bg-[#b09ffc] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 py-2 h-auto rounded-none"
                                            disabled={processingId === draft.id}
                                            onClick={(e) => { e.stopPropagation(); setSelectedDraft(draft); }}
                                        >
                                            <Sparkles className="mr-2 h-4 w-4 text-black" />
                                            Improve
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1 bg-[#FF6B6B] hover:bg-[#ff5252] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all duration-75 py-2 h-auto rounded-none"
                                            disabled={processingId === draft.id}
                                            onClick={(e) => { e.stopPropagation(); handleAction(draft.id, 'reject'); }}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Discard
                                        </Button>
                                    </div>
                                </CardFooter>
                            )}
                        </Card>
                    );
                })}
            </div>

            {selectedDraft && (() => {
                let details: any = {};
                try {
                    details = JSON.parse(selectedDraft.emailDetails);
                } catch (e) { }

                return (
                    <Sheet open={selectedDraft !== null} onOpenChange={(open) => { if (!open) handleClose(); }}>
                        <SheetContent className="sm:max-w-md md:max-w-lg flex flex-col h-full bg-[#FFFDF5] dark:bg-[#121214] border-l-4 border-black dark:border-white shadow-2xl p-0 rounded-none">
                            <SheetHeader className="border-b-4 border-black dark:border-white p-6 bg-white dark:bg-[#1C1C1F]">
                                <SheetTitle className="text-lg font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-black dark:text-white" />
                                    Email Draft Details
                                </SheetTitle>
                                <SheetDescription className="text-xs font-bold uppercase tracking-wider text-black/60 dark:text-white/60 mt-1">
                                    Review the complete email draft details before taking action.
                                </SheetDescription>
                            </SheetHeader>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1 border-b-2 border-black/10 dark:border-white/10 pb-3">
                                        <span className="text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-wider">To</span>
                                        <span className="text-sm font-bold text-black dark:text-white select-all">{details.to || "No Recipient"}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 border-b-2 border-black/10 dark:border-white/10 pb-3">
                                        <span className="text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-wider">Subject</span>
                                        <span className="text-sm font-bold text-black dark:text-white">{details.subject || "No Subject"}</span>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <span className="text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-wider">Message Body</span>
                                        <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-4 min-h-[220px] text-xs font-bold text-black dark:text-white leading-relaxed select-text shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] rounded-none overflow-x-auto">
                                            {details.body || "(Empty Body)"}
                                        </div>
                                    </div>

                                    {selectedDraft.status === "pending" && (
                                        <div className="flex flex-col gap-2 pt-4 border-t-2 border-black/20 dark:border-white/20 mt-4">
                                            <span className="text-[10px] font-black text-black/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-1.5">
                                                <Sparkles className="h-3.5 w-3.5 text-black dark:text-white" />
                                                Suggest Improvement
                                            </span>
                                            <div className="flex gap-2">
                                                <textarea
                                                    placeholder="Ask the AI to change the tone, add info, correct details..."
                                                    value={improvementText}
                                                    onChange={(e) => setImprovementText(e.target.value)}
                                                    rows={2}
                                                    className="flex-1 border-4 border-black dark:border-white bg-white dark:bg-black rounded-none px-3 py-2 text-xs font-bold text-black dark:text-white focus:outline-none focus:bg-[#FFD93D] dark:focus:bg-[#db6802] placeholder:text-black/30 dark:placeholder:text-white/30 resize-none"
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    disabled={isImproving || !improvementText.trim()}
                                                    onClick={handleImprove}
                                                    className="self-end bg-[#FFD93D] hover:bg-[#ffbe25] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-black uppercase text-xs transition-all h-10 rounded-none"
                                                >
                                                    {isImproving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rewrite'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedDraft.status === "pending" && (
                                <SheetFooter className="border-t-4 border-black dark:border-white p-6 bg-white dark:bg-[#1C1C1F] flex gap-3 mt-auto rounded-none">
                                    <Button
                                        variant="destructive"
                                        className="flex-1 bg-[#FF6B6B] hover:bg-[#ff5252] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] font-black uppercase text-xs transition-all duration-75 py-3.5 h-auto rounded-none"
                                        disabled={processingId === selectedDraft.id}
                                        onClick={async () => {
                                            await handleAction(selectedDraft.id, 'reject');
                                            handleClose();
                                        }}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Discard
                                    </Button>
                                    <Button
                                        variant="default"
                                        className="flex-1 bg-[#86EFAC] hover:bg-[#6ee7b7] text-black border-4 border-black dark:border-white shadow-[4px_4px_0px_0px_#000] font-black uppercase text-xs transition-all duration-75 py-3.5 h-auto rounded-none"
                                        disabled={processingId === selectedDraft.id}
                                        onClick={async () => {
                                            await handleAction(selectedDraft.id, 'approve');
                                            handleClose();
                                        }}
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Approve & Send
                                    </Button>
                                </SheetFooter>
                            )}
                        </SheetContent>
                    </Sheet>
                );
            })()}
        </div>
    );
}
