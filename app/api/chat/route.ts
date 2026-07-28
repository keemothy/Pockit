import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, type ChatMessage, type ChatResponse } from "@/lib/chatbot-context";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { message, history } = (await req.json()) as {
    message: string;
    history: ChatMessage[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: buildSystemPrompt(),
    messages,
  });

  const raw = (response.content[0] as Anthropic.TextBlock).text;

  let parsed: ChatResponse;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { message: raw, card_recommendation: null, app_action: null };
  }

  return NextResponse.json(parsed);
}
