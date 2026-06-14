"use client";

import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import { useState, useEffect, useRef, use } from "react";
import { Send, Bot, User, Loader2, Database, ChevronRight, Table2, Key, Link } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Card } from "../../../../components/ui/card";
import { askAiAction } from "../../../../actions/rag";
import { inspectConnectionSchema } from "../../../../actions/db";
import { authClient } from "@/src/components/landing/auth";

type Message = { role: "user" | "assistant"; content: string };

const ChatPage = ({ params }: { params: Promise<{ connectionId: string }> }) => {
  const { connectionId } = use(params);
  const { data: session } = authClient.useSession();

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Ask me anything about your database schema — I can write queries, explain relationships, or give data insights." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Schema inspector state
  const [schema, setSchema] = useState<any>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load live schema on mount
  useEffect(() => {
    const loadSchema = async () => {
      setSchemaLoading(true);
      const result = await inspectConnectionSchema(connectionId, session?.user?.id, { includeSamples: false });
      if (result.success) setSchema(result.data);
      setSchemaLoading(false);
    };
    loadSchema();
  }, [connectionId, session?.user?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", content: userText }]);
    setInput("");
    setIsLoading(true);
    try {
      const result = await askAiAction(userText, connectionId, session?.user?.id);
      const reply: string = result?.success && result.answer
        ? result.answer
        : `Error: ${result?.error || "Unknown error occurred"}`;
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Critical Chat Failure:", err);
      setMessages((m) => [...m, { role: "assistant", content: "The server failed to respond. Please check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick question chips
  const chips = schema?.tables?.slice(0, 4).map((t: string) => `What does the ${t} table contain?`) ?? [
    "Show me the schema overview",
    "What are the foreign key relationships?",
    "Which table has the most rows?",
  ];

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-5rem)] gap-4">

        {/* ── Left: Schema Inspector Panel ── */}
        <div className={`transition-all duration-300 shrink-0 ${panelOpen ? "w-72" : "w-10"} overflow-hidden`}>
          <div className="h-full flex flex-col">
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <Database className="w-4 h-4 shrink-0" />
              {panelOpen && <span>Live Schema</span>}
              <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${panelOpen ? "rotate-180" : ""}`} />
            </button>

            {panelOpen && (
              <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card/50 p-3 space-y-1">
                {schemaLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Loading schema…</span>
                  </div>
                ) : schema ? (
                  <>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">
                      {schema.tableCount} tables
                    </p>
                    {schema.tables.map((tableName: string) => {
                      const detail = schema.tableDetails?.[tableName];
                      const isExpanded = expandedTable === tableName;
                      const fks = schema.pkFkRelationships?.filter(
                        (r: any) => r.source_table === tableName && r.constraint_type === "FOREIGN KEY"
                      ) ?? [];
                      const pks = schema.pkFkRelationships?.filter(
                        (r: any) => r.source_table === tableName && r.constraint_type === "PRIMARY KEY"
                      ) ?? [];

                      return (
                        <div key={tableName}>
                          <button
                            onClick={() => setExpandedTable(isExpanded ? null : tableName)}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                          >
                            <div className="flex items-center gap-2">
                              <Table2 className="w-3 h-3 text-primary shrink-0" />
                              <span className="text-xs font-mono font-medium truncate">{tableName}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {detail?.rowCount?.toLocaleString() ?? "…"}
                            </span>
                          </button>

                          {isExpanded && detail && (
                            <div className="ml-4 mb-1 space-y-0.5 border-l border-border pl-2">
                              {pks.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-amber-500 font-mono">
                                  <Key className="w-2.5 h-2.5" />
                                  PK: {pks.map((p: any) => p.source_column).join(", ")}
                                </div>
                              )}
                              {fks.map((fk: any, i: number) => (
                                <div key={i} className="flex items-center gap-1 text-[10px] text-blue-400 font-mono">
                                  <Link className="w-2.5 h-2.5" />
                                  {fk.source_column} → {fk.target_table}
                                </div>
                              ))}
                              {detail.columns.map((col: any) => (
                                <div key={col.column_name} className="text-[10px] text-muted-foreground font-mono truncate pl-1">
                                  {col.column_name}
                                  <span className="text-muted-foreground/50 ml-1">({col.data_type})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">Could not load schema.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Chat ── */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="mb-3">
            <h1 className="text-xl font-semibold text-foreground">AI Chat</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Analyzing: <span className="font-mono text-xs bg-muted px-1 rounded">{connectionId}</span>
            </p>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {chips.map((chip: string, i: number) => (
              <button
                key={i}
                onClick={() => { setInput(chip); }}
                className="text-[11px] px-3 py-1 rounded-full border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all font-medium"
              >
                {chip}
              </button>
            ))}
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-auto rounded-xl border border-border bg-card p-5 space-y-4 mb-4 shadow-sm"
          >
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted/50 text-foreground rounded-tl-none border border-border"
                  }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
                <div className="bg-muted/50 border border-border rounded-2xl rounded-tl-none px-4 py-3 text-sm italic text-muted-foreground animate-pulse">
                  Analyzing schema…
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 p-1">
            <input
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="e.g. 'What are the top 10 sellers by revenue?'"
              className="flex-1 h-12 px-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
            />
            <Button
              onClick={send}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-12 w-12 rounded-xl transition-transform active:scale-95"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;