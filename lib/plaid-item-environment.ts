import { decryptAccessToken } from "@/lib/plaid-crypto";
import { hasPlaidCredentials, plaidClient, type PlaidEnvironment } from "@/lib/plaid";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Legacy connected Items predate the per-environment marker. Verify an Item
 * against the current Plaid environment before marking it, so Sandbox and
 * Production accounts can never be mixed in the Wallet.
 */
export async function restoreLegacyPlaidItemEnvironment(
  userId: string,
  itemIds: string[],
  environment: PlaidEnvironment,
  existing: Record<string, PlaidEnvironment>,
) {
  // Also repair a stale/wrong marker. A token must validate against the
  // current environment before its marker can be changed.
  const candidateIds = [...new Set(itemIds.filter((id) => existing[id] !== environment))];
  if (!hasPlaidCredentials() || candidateIds.length === 0) return existing;

  const admin = createAdminClient();
  const { data: items, error } = await admin
    .from("plaid_items")
    .select("id, access_token_ciphertext, access_token_iv, access_token_auth_tag")
    .eq("user_id", userId)
    .in("id", candidateIds);
  if (error || !items?.length) return existing;

  const restoredIds = (await Promise.all(items.map(async (item) => {
    try {
      const accessToken = decryptAccessToken({
        ciphertext: item.access_token_ciphertext,
        iv: item.access_token_iv,
        authTag: item.access_token_auth_tag,
      });
      await plaidClient.accountsGet({ access_token: accessToken });
      return item.id;
    } catch {
      return null;
    }
  }))).filter((itemId): itemId is string => Boolean(itemId));

  if (restoredIds.length === 0) return existing;
  const updated = { ...existing, ...Object.fromEntries(restoredIds.map((itemId) => [itemId, environment])) };
  await admin.auth.admin.updateUserById(userId, { user_metadata: { plaid_item_environments: updated } });
  return updated;
}
