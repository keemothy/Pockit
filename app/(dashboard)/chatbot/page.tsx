"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, ChatResponse } from "@/lib/chatbot-context";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  card_recommendation?: string | null;
  app_action?: { label: string; route: string } | null;
}

const SUGGESTED_PROMPTS = [
  "Which card should I use for dining out?",
  "I'm booking a flight — which card is best?",
  "How do I cancel Netflix?",
  "How do I cancel Adobe Creative Cloud?",
];

const WELCOME: DisplayMessage = {
  role: "assistant",
  content:
    "Hi! I'm your Pockit assistant. I can help you pick the right credit card for any purchase, explain your card benefits, or walk you through canceling a subscription step by step. What can I help you with?",
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send(text: string) {
    const userText = text.trim();
    if (!userText || loading) return;

    const newMessage: DisplayMessage = { role: "user", content: userText };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const history: ChatMessage[] = updatedMessages
      .filter((m) => m !== WELCOME)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: history.slice(0, -1),
        }),
      });

      const data: ChatResponse = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          card_recommendation: data.card_recommendation,
          app_action: data.app_action,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          card_recommendation: null,
          app_action: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const showSuggestedPrompts = messages.length === 1;

  return (
    <div className="flex h-full flex-col bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-200 px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1F78FF] text-white text-sm font-bold">
          P
        </div>
        <div>
          <h1 className="text-base font-semibold text-zinc-900">Pockit Assistant</h1>
          <p className="text-xs text-zinc-500">Credit cards · Benefits · Subscription help</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[75%] flex-col gap-2 ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-[#1F78FF] text-white rounded-br-sm"
                    : "bg-[#E9F1FF] text-zinc-800 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>

              {msg.card_recommendation && (
                <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs">
                  <span>💳</span>
                  <span className="font-semibold text-[#1F78FF]">
                    {msg.card_recommendation}
                  </span>
                </div>
              )}

              {msg.app_action && (
                <a
                  href={msg.app_action.route}
                  className="rounded-xl bg-[#1F78FF] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {msg.app_action.label} →
                </a>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-[#E9F1FF] px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#1F78FF] opacity-60 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#1F78FF] opacity-60 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[#1F78FF] opacity-60 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {showSuggestedPrompts && (
        <div className="px-6 pb-3">
          <p className="mb-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Try asking
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-blue-200 bg-[#E9F1FF] px-3 py-1.5 text-xs text-[#1F78FF] transition-colors hover:bg-[#D5E5FF]"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white px-6 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about cards, subscriptions, or rewards..."
            className="flex-1 rounded-full border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-[#1F78FF] focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1F78FF] text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
