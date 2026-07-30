import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SecuritySettings from "./security-settings";

export default async function SecuritySettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/auth/login");

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedFactor = factors?.totp.find((factor) => factor.status === "verified");

  return (
    <section className="mx-auto w-full max-w-6xl pb-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-600">Manage your account, preferences, and privacy.</p>
      </div>
      <SecuritySettings email={user.email} initialFactorId={verifiedFactor?.id ?? null} />
    </section>
  );
}
