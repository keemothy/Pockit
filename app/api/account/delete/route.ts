import { NextRequest, NextResponse } from "next/server";
import { decryptAccessToken } from "@/lib/plaid-crypto";
import { hasPlaidCredentials, plaidClient } from "@/lib/plaid";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type DeleteBody = { confirmation?: unknown };

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as DeleteBody | null;
  if (body?.confirmation !== "confirm") return NextResponse.json({ error: "Type confirm to delete your account." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to delete your account." }, { status: 401 });

  try {
    const admin = createAdminClient();
    const { data: plaidItems, error: plaidItemsError } = await admin.from("plaid_items")
      .select("access_token_ciphertext, access_token_iv, access_token_auth_tag")
      .eq("user_id", user.id);
    if (plaidItemsError) throw plaidItemsError;

    if ((plaidItems ?? []).length > 0 && !hasPlaidCredentials()) {
      return NextResponse.json({ error: "Plaid must be configured before linked accounts can be safely removed." }, { status: 503 });
    }
    for (const item of plaidItems ?? []) {
      const accessToken = decryptAccessToken({ ciphertext: item.access_token_ciphertext, iv: item.access_token_iv, authTag: item.access_token_auth_tag });
      await plaidClient.itemRemove({ access_token: accessToken });
    }

    const avatarPaths: string[] = [];
    let avatarOffset = 0;
    while (true) {
      const { data: avatarFiles, error: avatarListError } = await admin.storage
        .from("avatars")
        .list(user.id, { limit: 100, offset: avatarOffset });
      if (avatarListError) throw avatarListError;
      avatarPaths.push(...(avatarFiles ?? []).map((file) => `${user.id}/${file.name}`));
      if (!avatarFiles || avatarFiles.length < 100) break;
      avatarOffset += avatarFiles.length;
    }
    if (avatarPaths.length) {
      const { error: avatarDeleteError } = await admin.storage.from("avatars").remove(avatarPaths);
      if (avatarDeleteError) throw avatarDeleteError;
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteUserError) throw deleteUserError;
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Unable to delete account", error);
    return NextResponse.json({ error: "Unable to complete account deletion. Please try again." }, { status: 502 });
  }
}
