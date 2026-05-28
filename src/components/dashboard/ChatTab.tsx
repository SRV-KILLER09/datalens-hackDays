"use client";

import React, { useEffect, useState, useRef } from "react";
import { Loader2, DatabaseZap, Send, Bot, User, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { checkEmbeddingStatus, embedDocumentationData, chatWithSchema } from "@/src/actions/chat";
// @ts-ignore
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/src/components/ui/hover-card";
import Image from "next/image";

interface Citation {
    marker: number;
    entity: string;
    images: string[];
    pks?: string[];
    fks?: { column: string, references: string | null }[];
}

interface Message {
    role: "user" | "ai";
    content: string;
    citations?: Citation[];
}

export function ChatTab({ connectionId }: { connectionId: string }) {
    const [isEmbedded, setIsEmbedded] = useState<boolean | null>(null);
    const [isEmbedding, setIsEmbedding] = useState(false);
    const [embeddingStats, setEmbeddingStats] = useState({ total: 0, embeddedCount: 0 });

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    // Auto-scroll handler
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const STORAGE_KEY = `chat_history_${connectionId}`;

    // 1. Restore chat history on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    setMessages(parsed);
                }
            } else {
                setMessages([]); // Reset if no history for this connection
            }
        } catch (err) {
            console.error("Failed to restore chat history:", err);
            setMessages([]);
        }
    }, [connectionId]);

    // 2. Automatically store chat messages in localStorage (limit to 50)
    useEffect(() => {
        if (messages.length === 0) return;

        try {
            const historyToSave = messages.slice(-50);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(historyToSave));
        } catch (err) {
            console.error("Failed to save chat history:", err);
        }
    }, [messages, connectionId]);

    // 3. Clear Chat function
    const clearChat = () => {
        try {
            localStorage.removeItem(STORAGE_KEY);
            setMessages([]);
            toast.success("Chat history cleared.");
        } catch (err) {
            console.error("Failed to clear chat:", err);
            toast.error("Failed to clear chat history.");
        }
    };

    const checkStatus = async () => {
        const status = await checkEmbeddingStatus(connectionId);
        setIsEmbedded(status.embedded);
        setEmbeddingStats({ total: status.total, embeddedCount: status.embeddedCount });
    };

    useEffect(() => {
        checkStatus();
    }, [connectionId]);

    const handleEmbed = async () => {
        setIsEmbedding(true);
        toast.info("Starting documentation embedding via Mixedbread AI...");
        const res = await embedDocumentationData(connectionId);

        if (res.success) {
            toast.success("Successfully generated high-dimensional embeddings and pushed to Qdrant!");
            await checkStatus();
        } else {
            toast.error(res.error || "Failed to embed documentation.");
        }
        setIsEmbedding(false);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        setInputValue("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsTyping(true);

        // Format history for the AI, skipping the immediate last message since we push it manually
        const chatHistory = messages.map(m => ({ role: m.role === "ai" ? "model" : "user", content: m.content }));

        try {
            const res = await chatWithSchema(userMsg, connectionId, chatHistory);

            if (res.success && res.answer) {
                setMessages(prev => [...prev, { role: "ai", content: res.answer, citations: res.citations }]);
            } else {
                toast.error(res.error || "Graph/LLM Inference failed.");
                setMessages(prev => [...prev, { role: "ai", content: "⚠️ **Error**: Failed to complete inference sequence." }]);
            }
        } catch (err: any) {
            toast.error("Network error during inference.");
        } finally {
            setIsTyping(false);
        }
    };

    if (isEmbedded === null) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!isEmbedded) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-card border border-dashed rounded-xl mt-6">
                <DatabaseZap className="w-12 h-12 text-blue-500 mb-4 opacity-80" />
                <h3 className="text-xl font-bold mb-2 tracking-tight">AI Embeddings Required</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-6 leading-relaxed">
                    To chat with your schema, we must map your documentation into high-dimensional vector space using <strong className="text-foreground">Mixedbread AI</strong> and index it into <strong className="text-foreground">Qdrant</strong>.
                    <br /><br />
                    Currently {embeddingStats.embeddedCount} / {embeddingStats.total} tables embedded.
                </p>
                <Button
                    onClick={handleEmbed}
                    disabled={isEmbedding || embeddingStats.total === 0}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md px-6"
                >
                    {isEmbedding ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseZap className="w-4 h-4" />}
                    {isEmbedding ? "Embedding DB Docs..." : "Embed Documentation"}
                </Button>
                {embeddingStats.total === 0 && (
                    <p className="text-xs text-destructive mt-4 max-w-xs text-center">
                        <AlertCircle className="inline w-3 h-3 mr-1" /> You have 0 documentation tables generated. Go back to <b>Schema Explorer</b> and click <b>SYNC AI</b> first.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[70vh] bg-card border border-border rounded-xl mt-6 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-blue-500" />
                    <div>
                        <h2 className="font-semibold text-card-foreground text-sm tracking-tight">Compound Architecture AI</h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Qdrant Vectors + Neo4j Graph API</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearChat}
                        disabled={messages.length === 0}
                        className="h-8 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Clear Chat
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEmbed}
                        disabled={isEmbedding}
                        className="h-8 text-xs font-semibold text-muted-foreground hover:text-blue-500 transition-colors"
                    >
                        {isEmbedding ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
                        {isEmbedding ? "Syncing AI..." : "Re-sync Vectors"}
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                        <DatabaseZap className="w-12 h-12 text-muted-foreground" />
                        <p className="text-sm font-medium">Ask any question about your database architecture.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "ai" && (
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                                <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        )}
                        <div className={`max-w-[80%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted/50 border border-border/50 rounded-tl-sm text-foreground"
                            }`}>
                            {msg.role === "user" ? (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : (
                                <ReactMarkdown
                                    components={{
                                        p: ({ node, children, ...props }) => {
                                            // Intercept text containing [1], [2], etc.
                                            // This is a complex but necessary pattern in ReactMarkdown to wrap inline text without breaking parser rules
                                            const contentArray = React.Children.toArray(children);
                                            const renderedChildren = contentArray.map((child, i) => {
                                                if (typeof child === 'string') {
                                                    const parts = child.split(/(\[\d+\])/g);
                                                    return parts.map((part, j) => {
                                                        const match = part.match(/\[(\d+)\]/);
                                                        if (match && msg.citations) {
                                                            const marker = parseInt(match[1]);
                                                            const citation = msg.citations.find(c => c.marker === marker);
                                                            if (citation && (citation.images.length > 0 || (citation.pks && citation.pks.length > 0) || (citation.fks && citation.fks.length > 0))) {
                                                                return (
                                                                    <HoverCard key={`cite-${i}-${j}`}>
                                                                        <HoverCardTrigger asChild>
                                                                            <span className="inline-flex cursor-pointer text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-1 rounded mx-0.5 text-xs font-bold transition-colors">
                                                                                [{marker}]
                                                                            </span>
                                                                        </HoverCardTrigger>
                                                                        <HoverCardContent side="top" align="center" className="w-[500px] p-0 border shadow-lg bg-card overflow-hidden z-50">
                                                                            <div className="bg-muted px-3 py-2 border-b flex items-center justify-between">
                                                                                <span className="text-xs font-semibold">Reference Table: {citation.entity}</span>
                                                                                <span className="text-[10px] text-muted-foreground uppercase">{citation.images.length} Pages</span>
                                                                            </div>

                                                                            <div className="p-3 border-b bg-muted/10 space-y-2">
                                                                                {citation.pks && citation.pks.length > 0 && (
                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Primary Keys:</span>
                                                                                        {citation.pks.map(pk => (
                                                                                            <span key={pk} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[10px] font-mono border border-blue-500/20 font-bold">
                                                                                                {pk}
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                )}

                                                                                {citation.fks && citation.fks.length > 0 && (
                                                                                    <div className="space-y-1.5">
                                                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Foreign Keys:</span>
                                                                                        <div className="flex flex-col gap-1">
                                                                                            {citation.fks.map((fk, fidx) => (
                                                                                                <div key={fidx} className="flex items-center gap-2 text-[10px] font-mono">
                                                                                                    <span className="text-blue-600 dark:text-blue-400 font-bold">{fk.column}</span>
                                                                                                    <span className="text-muted-foreground">→</span>
                                                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{fk.references}</span>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {(!citation.pks || citation.pks.length === 0) && (!citation.fks || citation.fks.length === 0) && (
                                                                                    <p className="text-[10px] text-muted-foreground italic text-center">No keys defined for this table.</p>
                                                                                )}
                                                                            </div>

                                                                            <div className="max-h-[350px] overflow-y-auto bg-white p-2 flex flex-col gap-2">
                                                                                {citation.images.map((imgSrc, imgIdx) => (
                                                                                    <div key={imgIdx} className="relative w-full border border-border/50 rounded overflow-hidden shadow-sm">
                                                                                        <img
                                                                                            src={imgSrc}
                                                                                            alt={`Documentation for ${citation.entity} page ${imgIdx + 1}`}
                                                                                            className="w-full h-auto object-contain"
                                                                                        />
                                                                                    </div>
                                                                                ))}
                                                                                {citation.images.length === 0 && (
                                                                                    <div className="py-10 text-center opacity-30 flex flex-col items-center">
                                                                                        <DatabaseZap className="w-8 h-8 mb-2" />
                                                                                        <p className="text-xs uppercase">No documentation images found</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </HoverCardContent>
                                                                    </HoverCard>
                                                                );
                                                            }
                                                        }
                                                        return <span key={`text-${i}-${j}`}>{part}</span>;
                                                    });
                                                }
                                                return child;
                                            });

                                            return <p className="mb-3 last:mb-0 leading-7" {...props}>{renderedChildren}</p>;
                                        },
                                        code: ({ node, ...props }) => <code className="bg-background border border-border/50 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                                        pre: ({ node, ...props }) => <pre className="bg-zinc-950 p-4 rounded-lg overflow-x-auto my-4 border border-zinc-800 text-zinc-50" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="list-disc ml-4 my-3 [&>li]:mt-1" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-bold text-foreground" {...props} />
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            )}
                        </div>
                        {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-primary-foreground" />
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-4 justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="max-w-[80%] rounded-2xl px-5 py-4 bg-muted/50 border border-border/50 rounded-tl-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500/50 animate-bounce"></span>
                            <span className="w-2 h-2 rounded-full bg-blue-500/50 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-2 h-2 rounded-full bg-blue-500/50 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <div className="p-4 bg-muted/10 border-t border-border">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="e.g., Show me a query to get all orders for a specific user ID..."
                        className="w-full pr-12 py-6 rounded-xl border-border bg-background shadow-sm focus-visible:ring-blue-500/30 font-medium"
                        disabled={isTyping}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isTyping || !inputValue.trim()}
                        className="absolute right-2 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
                <div className="text-center mt-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Powered by Groq Cloud & Mixedbread Embeddings</p>
                </div>
            </div>
        </div>
    );
}
