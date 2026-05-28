"use client";

import DashboardLayout from "../../../../components/dashboard/DashboardLayout";
import { useState, useEffect, useRef, use } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { askAiAction } from "../../../../actions/rag";

type Message = { role: "user" | "assistant"; content: string };

const ChatPage = ({ params }: { params: Promise<{ connectionId: string }> }) => {
  const { connectionId } = use(params);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Ask me anything about your database schema." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const send = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    console.log("Sending query to AI:", { userText, connectionId });
    
    setMessages((m) => [...m, { role: "user", content: userText }]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await askAiAction(userText, connectionId);
      console.log("AI Action Result:", result);

      const reply: string = result?.success && result.answer
        ? result.answer
        : `Error: ${result?.error || "Unknown error occurred"}`;

      if (!result?.success) {
        console.error("AI Error Response:", result?.error);
      }

      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Critical Chat Failure:", err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "The server failed to respond. Please check your connection." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto w-full">
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-foreground">AI Chat</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyzing connection: <span className="font-mono text-xs bg-muted px-1 rounded">{connectionId}</span>
          </p>
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
                Analyzing schema...
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
            placeholder="e.g., 'Generate a query for total sales by month'"
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
    </DashboardLayout>
  );
};

export default ChatPage;