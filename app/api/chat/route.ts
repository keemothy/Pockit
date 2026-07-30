import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildSystemPrompt, type ChatMessage, type ChatResponse } from "@/lib/chatbot-context";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Chatbot is not configured. Add OPENAI_API_KEY to your local .env.local file and restart the dev server.",
      },
      { status: 503 },
    );
  }

  const client = new OpenAI({ apiKey });
  const { message, history } = (await req.json()) as {
    message: string;
    history: ChatMessage[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt() },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    messages,
  });

  const raw = response.choices[0].message.content ?? "";

  let parsed: ChatResponse;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { message: raw, card_recommendation: null, app_action: null };
  }

  return NextResponse.json(parsed);
}
