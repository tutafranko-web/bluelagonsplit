"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { MESSAGE_LIMIT } from "@/lib/constants";
import type { ChatMessage } from "@/types/chat";

export function ChatWidget() {
  const t = useTranslations("chat");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());

  const messageCount = messages.filter((m) => m.role === "user").length;
  const limitReached = messageCount >= MESSAGE_LIMIT;

  const sendMessage = async () => {
    if (!input.trim() || isLoading || limitReached) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatInput: userMessage.content,
          sessionId,
        }),
      });
      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: data.output || data.text || "...",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100%-2rem)] sm:w-96 h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-[hsl(214,20%,90%)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[hsl(213,90%,45%)] text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-semibold text-sm">{t("title")}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Greeting */}
            {messages.length === 0 && (
              <div className="bg-[hsl(210,40%,98%)] text-[hsl(215,50%,12%)] rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[85%]">
                {t("greeting")}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-[hsl(213,90%,45%)] text-white rounded-br-sm"
                    : "bg-[hsl(210,40%,98%)] text-[hsl(215,50%,12%)] rounded-tl-sm"
                )}
              >
                {msg.content}
              </div>
            ))}

            {isLoading && (
              <div className="bg-[hsl(210,40%,98%)] rounded-2xl rounded-tl-sm px-4 py-3 text-sm max-w-[85%]">
                <span className="inline-flex gap-1">
                  <span className="w-2 h-2 bg-[hsl(213,90%,45%)]/40 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-[hsl(213,90%,45%)]/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 bg-[hsl(213,90%,45%)]/40 rounded-full animate-bounce [animation-delay:0.3s]" />
                </span>
              </div>
            )}

            {limitReached && (
              <div className="text-center text-xs text-[hsl(215,15%,45%)] bg-[hsl(45,100%,50%)]/10 rounded-lg p-3">
                {t("limitReached")}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[hsl(214,20%,90%)] p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("placeholder")}
                disabled={limitReached || isLoading}
                className="flex-1 px-4 py-2.5 text-sm bg-[hsl(210,20%,96%)] rounded-full outline-none focus:ring-2 focus:ring-[hsl(213,90%,45%)]/30 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || limitReached}
                className="p-2.5 bg-[hsl(213,90%,45%)] text-white rounded-full hover:bg-[hsl(213,90%,40%)] disabled:opacity-50 transition-colors"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-4 right-4 sm:right-6 z-50 p-4 rounded-full shadow-lg transition-all hover:scale-105",
          isOpen
            ? "bg-[hsl(215,60%,18%)] text-white"
            : "bg-[hsl(213,90%,45%)] text-white"
        )}
        aria-label="Chat"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
