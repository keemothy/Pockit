"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function AuthForm() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsError(false);
    setIsSubmitting(true);
    const supabase = createClient();

    const result = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() },
            emailRedirectTo: window.location.origin,
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);

    if (result.error) {
      setMessage(result.error.message);
      setIsError(true);
      return;
    }
    if (isSignUp && !result.data.session) {
      setMessage("Check your email to confirm your account, then sign in.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#030916] px-4">
      {/* Aurora blobs */}
      <div
        className="pointer-events-none absolute left-[-15%] top-[-20%] h-[700px] w-[700px] rounded-full bg-[#1F78FF]/20 blur-[120px]"
        style={{ animation: "aurora-1 14s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute bottom-[-25%] right-[-10%] h-[650px] w-[650px] rounded-full bg-[#57BEFE]/16 blur-[100px]"
        style={{ animation: "aurora-2 18s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute right-[10%] top-[25%] h-[500px] w-[500px] rounded-full bg-[#6d28d9]/12 blur-[130px]"
        style={{ animation: "aurora-3 11s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute bottom-[10%] left-[20%] h-[450px] w-[450px] rounded-full bg-[#0891b2]/14 blur-[110px]"
        style={{ animation: "aurora-4 21s ease-in-out infinite" }}
      />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div
          className="rounded-3xl p-8"
          style={{
            background: "rgba(255,255,255,0.055)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.15)",
          }}
        >
          {/* Logo */}
          <div className="mb-7 flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #1F78FF, #57BEFE)" }}
            >
              P
            </div>
            <span
              className="bg-clip-text text-2xl font-bold text-transparent"
              style={{ backgroundImage: "linear-gradient(90deg, #7ec8ff, #ffffff 65%)" }}
            >
              Pockit
            </span>
          </div>

          <h1 className="text-[22px] font-bold text-white">
            {isSignUp ? "Create account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-white/45">
            {isSignUp
              ? "Start managing your money smarter."
              : "Sign in to your Pockit dashboard."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <label className="block text-sm font-medium text-white/60">
                  Full name
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all duration-200 focus:border-[#1F78FF]/50 focus:bg-white/10 focus:ring-2 focus:ring-[#1F78FF]/20"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                  />
                </label>
              </motion.div>
            )}

            <label className="block text-sm font-medium text-white/60">
              Email
              <input
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all duration-200 focus:border-[#1F78FF]/50 focus:bg-white/10 focus:ring-2 focus:ring-[#1F78FF]/20"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-medium text-white/60">
              Password
              <div className="relative mt-1.5">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 pr-11 text-sm text-white placeholder-white/25 outline-none transition-all duration-200 focus:border-[#1F78FF]/50 focus:bg-white/10 focus:ring-2 focus:ring-[#1F78FF]/20"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            {message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
                className={`rounded-xl border px-4 py-3 text-sm ${
                  isError
                    ? "border-red-500/20 bg-red-500/10 text-red-300"
                    : "border-white/10 bg-white/[0.07] text-white/65"
                }`}
              >
                {message}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="mt-2 w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #1F78FF 0%, #57BEFE 100%)",
                boxShadow: "0 4px 24px rgba(31,120,255,0.38)",
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Please wait…
                </span>
              ) : isSignUp ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </motion.button>
          </form>

          <button
            type="button"
            onClick={() => {
              setIsSignUp((v) => !v);
              setMessage(null);
            }}
            className="mt-5 w-full text-center text-sm text-white/35 transition-colors hover:text-white/60"
          >
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <span className="font-medium text-[#57BEFE]">
              {isSignUp ? "Sign in" : "Create one"}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
