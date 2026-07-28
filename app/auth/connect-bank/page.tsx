import { redirect } from "next/navigation";
import ConnectBank from "@/app/components/plaid/connect-bank";
import { createClient } from "@/lib/supabase/server";

export default async function ConnectBankPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <ConnectBank />
    </main>
  );
}
