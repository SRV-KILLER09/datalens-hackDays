"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { askAiAction } from "@/src/actions/rag";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/src/components/ui/sheet";

type Message = { role: "user" | "assistant"; content: string };

export function ChatDrawer({ connectionId, connectionName }: { connectionId: string, connectionName: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: `Ask me anything about ${connectionName}.` },
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
  // Add user message immediately
  setMessages((m) => [...m, { role: "user", content: userText }]);
  setInput("");
  setIsLoading(true);

  try {
    const result = await askAiAction(userText, connectionId);
    
    // Ensure the reply is a string and handle potential null/undefined
    const reply: string = result?.success && result.answer 
      ? result.answer 
      : `Error: ${result?.error || "Unknown error occurred"}`;

    setMessages((m) => [...m, { role: "assistant", content: reply }]);
  } catch (err) {
    setMessages((m) => [
      ...m, 
      { role: "assistant", content: "The server failed to respond. Please check your connection." }
    ]);
  } finally {
    setIsLoading(false);
  }
};
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Chat with AI
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI Assistant: {connectionName}
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 items-center text-xs text-muted-foreground animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking...
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask a question..."
            className="flex-1 bg-background border rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button onClick={send} disabled={isLoading} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}