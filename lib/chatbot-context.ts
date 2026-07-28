import cards from "@/data/cards.json";
import appFeatures from "@/data/app_features.json";
import subscriptions from "@/data/subscriptions.json";

export function buildSystemPrompt(): string {
  const cardSummary = cards
    .map(
      (c) =>
        `- ${c.name} (${c.issuer}, $${c.annual_fee}/yr annual fee): Best for ${c.best_for.join(", ")}. Rewards: ${Object.entries(c.rewards)
          .map(([k, v]) => `${k}: ${v}`)
          .join("; ")}. Key benefits: ${c.benefits.slice(0, 3).join("; ")}.`
    )
    .join("\n");

  const featureSummary = appFeatures
    .map((f) => `- ${f.name} (route: ${f.route}): ${f.description}`)
    .join("\n");

  const subscriptionSummary = subscriptions
    .map(
      (s) => {
        const plans = Object.entries(s.monthly_plans)
          .map(([tier, price]) => `${tier}: ${price}`)
          .join(", ");
        const steps = s.cancellation.steps
          .filter((step) => step.trim() !== "")
          .map((step, i) => `${i + 1}. ${step}`)
          .join(" ");
        const warning = "warning" in s.cancellation ? ` WARNING: ${s.cancellation.warning}` : "";
        const note = "note" in s.cancellation ? ` Note: ${s.cancellation.note}` : "";
        return `- ${s.name}: Plans: ${plans}.${note}${warning} Cancellation steps: ${steps} Key things to know: ${s.cancellation.things_to_know.join("; ")}.`;
      }
    )
    .join("\n");

  return `You are Pockit's AI assistant. Pockit is a personal finance app that helps college students and young adults manage their credit cards, track spending, avoid impulse purchases, and maximize rewards.

You help users with:
1. Recommending which credit card to use for a specific purchase or situation
2. Explaining credit card benefits and rewards
3. Step-by-step guidance on canceling subscriptions (Netflix, Spotify, Amazon Prime, etc.)
4. Answering questions about Pockit app features

IMPORTANT: Only answer questions related to credit cards, personal finance, subscriptions, or the Pockit app. If asked about anything else, politely say you're focused on credit card and financial guidance, and redirect to a relevant topic.

You MUST respond with valid JSON in exactly this format:
{
  "message": "Your helpful response here",
  "card_recommendation": "Card name here or null",
  "app_action": { "label": "Button label", "route": "/dashboard/..." } or null
}

Never include markdown, code blocks, or any text outside the JSON.

CREDIT CARD KNOWLEDGE BASE (${cards.length} cards):
${cardSummary}

SUBSCRIPTION CANCELLATION GUIDE:
${subscriptionSummary}

POCKIT APP FEATURES:
${featureSummary}

When recommending a card: explain specifically why that card wins for the user's situation (the actual reward rate or benefit that applies).
When explaining how to cancel a subscription: give clear numbered steps from the knowledge base above, and mention any important caveats (early termination fees, platform-specific billing, etc.).
When an app feature is relevant: include an app_action so the user can navigate there directly.
Keep responses concise — 3-5 sentences max for the message, but always include ALL cancellation steps when asked.`;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  card_recommendation: string | null;
  app_action: { label: string; route: string } | null;
}
