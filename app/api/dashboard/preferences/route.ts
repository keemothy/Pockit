import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const WIDGETS = ["total-balance", "monthly-spending", "subscription-spending", "category", "trend", "recent-transactions"] as const;
type WidgetId = typeof WIDGETS[number];
function widgetList(value: unknown) {
  return Array.isArray(value) && value.every((item): item is WidgetId => typeof item === "string" && WIDGETS.includes(item as WidgetId)) ? value : null;
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to save your dashboard." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const order = widgetList(body?.widgetOrder);
  const hidden = widgetList(body?.hiddenWidgets);
  if (!order || !hidden || new Set(order).size !== WIDGETS.length || order.length !== WIDGETS.length || hidden.includes("total-balance")) return NextResponse.json({ error: "Invalid dashboard layout." }, { status: 400 });
  const { error } = await supabase.from("dashboard_preferences").upsert({ user_id: user.id, widget_order: order, hidden_widgets: hidden, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) {
    const metadata = user.user_metadata as Record<string, unknown>;
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        ...metadata,
        dashboard_preferences: { widget_order: order, hidden_widgets: hidden },
      },
    });
    if (metadataError) return NextResponse.json({ error: "Unable to save dashboard preferences." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
