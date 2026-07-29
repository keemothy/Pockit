"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);
    const supabase = createClient();

    const result = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (isSignUp && !result.data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
      return;
    }

    // Pockit sign-in always opens the dashboard. Plaid Link is only opened
    // later when the user chooses "Connect bank" from the Wallet page.
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-blue-600">Pockit</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{isSignUp ? "Create your account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-slate-600">{isSignUp ? "Start managing your money in one place." : "Sign in to view your Pockit dashboard."}</p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} autoComplete={isSignUp ? "new-password" : "current-password"} />
          </label>
          {message && <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
            {isSubmitting ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>
        <button type="button" onClick={() => { setIsSignUp((value) => !value); setMessage(null); }} className="mt-5 text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
          {isSignUp ? "Already have an account? Sign in" : "Need an account? Create one"}
        </button>
      </section>
    </main>
  );
}
