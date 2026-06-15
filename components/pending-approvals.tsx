"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Mail, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Draft {
    id: string;
    emailDetails: string;
    telegramMessageId: string | null;
    telegramChatId: string | null;
    status: string;
    createdAt: string;
}

export function PendingApprovals() {
    const [drafts, setDrafts] = useState<Draft[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

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
            <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Drafts & Approvals
                </h3>
                <Card className="flex flex-col items-center justify-center py-16 px-4 text-center border-dashed border-2 bg-muted/10 shadow-sm">
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl mb-2">No Drafts Yet</CardTitle>
                    <CardDescription className="max-w-md mx-auto text-base">
                        Your AI assistant hasn't drafted any emails recently. When you ask it to send an email via chat, it will appear here for your approval.
                    </CardDescription>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Drafts & Approvals
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {drafts.map((draft) => {
                    let details: any = {};
                    try {
                        details = JSON.parse(draft.emailDetails);
                    } catch (e) { }

                    return (
                        <Card key={draft.id} className="flex flex-col relative overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <CardTitle className="text-base line-clamp-1">{details.subject || "No Subject"}</CardTitle>
                                        <CardDescription className="line-clamp-1">To: {details.to}</CardDescription>
                                    </div>
                                    {draft.status === "approved" && (
                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                                        </Badge>
                                    )}
                                    {draft.status === "rejected" && (
                                        <Badge variant="destructive" className="whitespace-nowrap">
                                            <XCircle className="w-3 h-3 mr-1" /> Rejected
                                        </Badge>
                                    )}
                                    {draft.status === "pending" && (
                                        <Badge variant="secondary" className="whitespace-nowrap">
                                            Pending
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                                    {details.body}
                                </p>
                            </CardContent>
                            {draft.status === "pending" && (
                                <CardFooter className="flex gap-2 pt-4 border-t mt-auto">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="flex-1"
                                        disabled={processingId === draft.id}
                                        onClick={() => handleAction(draft.id, 'approve')}
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Approve & Send
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1"
                                        disabled={processingId === draft.id}
                                        onClick={() => handleAction(draft.id, 'reject')}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Discard
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
