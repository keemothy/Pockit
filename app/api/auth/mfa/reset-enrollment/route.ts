import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to manage two-factor authentication." }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.mfa.listFactors({ userId: user.id });
    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Unable to check two-factor authentication." }, { status: 502 });
    }

    const abandonedTotpFactors = data.factors.filter(
      (factor) => factor.factor_type === "totp" && factor.status !== "verified",
    );
    const results = await Promise.all(
      abandonedTotpFactors.map((factor) =>
        admin.auth.admin.mfa.deleteFactor({ userId: user.id, id: factor.id }),
      ),
    );
    const deleteError = results.find((result) => result.error)?.error;
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 502 });
    }

    return NextResponse.json({ removed: abandonedTotpFactors.length });
  } catch (error) {
    console.error("Unable to reset MFA enrollment", error);
    return NextResponse.json({ error: "Unable to reset the incomplete two-factor setup." }, { status: 500 });
  }
}
