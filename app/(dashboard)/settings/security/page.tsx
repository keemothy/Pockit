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
      <div className="mb-6">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Settings
        </p>
        <h1 className="mt-0.5 text-[28px] font-black tracking-tight text-slate-900">
          Security
        </h1>
      </div>
      <SecuritySettings email={user.email} initialFactorId={verifiedFactor?.id ?? null} />
    </section>
  );
}
