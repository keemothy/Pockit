"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const stats = [
  { value: "48", label: "credit cards" },
  { value: "26", label: "subscriptions" },
  { value: "AI", label: "powered" },
];

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

  /* Shared input class — intentionally calm, no colored rings */
  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors duration-200 focus:border-white/25 focus:bg-white/[0.09]";

  return (
    <div className="flex min-h-screen bg-[#020617]">

      {/* ── Left brand panel ── */}
      <div className="noise-bg relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-14 lg:py-16">
        {/* Aurora blobs — vivid, saturated */}
        <div className="pointer-events-none absolute left-[-25%] top-[-20%] h-[640px] w-[640px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(31,120,255,0.5) 0%, transparent 68%)", animation: "aurora-1 16s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute bottom-[-25%] right-[-15%] h-[580px] w-[580px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 68%)", animation: "aurora-2 20s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute right-[5%] top-[30%] h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 68%)", animation: "aurora-3 13s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute bottom-[10%] left-[25%] h-[360px] w-[360px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.28) 0%, transparent 68%)", animation: "aurora-4 24s ease-in-out infinite" }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-white text-sm"
              style={{ background: "linear-gradient(135deg, #1F78FF, #a855f7)" }}>
              P
            </div>
            <span className="text-lg font-semibold text-white/80 tracking-tight">Pockit</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight">
            <span className="animated-gradient-text">Smart money</span>
            <br />
            <span className="text-white">for smart</span>
            <br />
            <span className="text-white">spenders.</span>
          </h1>

          <p className="mt-5 text-base text-white/40 leading-relaxed max-w-xs">
            Pick the right card, maximize rewards, and manage every subscription — all in one place.
          </p>

          {/* Stats row */}
          <div className="mt-12 flex items-center gap-8">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-white/35 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#030d1f] px-6 py-12">
        {/* Subtle ambient glows */}
        <div className="pointer-events-none absolute right-[-15%] top-[-10%] h-[420px] w-[420px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-[-15%] left-[-5%] h-[320px] w-[320px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(31,120,255,0.4) 0%, transparent 70%)" }} />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[360px]"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg, #1F78FF, #a855f7)" }}>P</div>
            <span className="text-lg font-semibold text-white/80">Pockit</span>
          </div>

          {/* Gradient border card */}
          <div className="gradient-border-card">
            <div className="rounded-[27px] px-7 py-8"
              style={{
                background: "rgba(8,15,35,0.9)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
              }}
            >
              <h2 className="text-[22px] font-bold text-white">
                {isSignUp ? "Create account" : "Welcome back"}
              </h2>
              <p className="mt-1.5 text-sm text-white/35">
                {isSignUp ? "Start managing your money smarter." : "Sign in to your Pockit dashboard."}
              </p>

              <form className="mt-6 space-y-4" onSubmit={submit}>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.22 }}
                  >
                    <label className="block">
                      <span className="text-xs font-medium text-white/40">Full name</span>
                      <input
                        className={`mt-1.5 ${inputCls}`}
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

                <label className="block">
                  <span className="text-xs font-medium text-white/40">Email</span>
                  <input
                    className={`mt-1.5 ${inputCls}`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-white/40">Password</span>
                  <div className="relative mt-1.5">
                    <input
                      className={`${inputCls} pr-11`}
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
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 transition-colors hover:text-white/50"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                        : "border-white/8 bg-white/[0.05] text-white/55"
                    }`}
                  >
                    {message}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.012 }}
                  whileTap={{ scale: 0.975 }}
                  className="mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #1F78FF 0%, #a855f7 55%, #ec4899 100%)",
                    boxShadow: "0 4px 28px rgba(31,120,255,0.28)",
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Please wait…
                    </span>
                  ) : isSignUp ? "Create account" : "Sign in"}
                </motion.button>
              </form>

              <button
                type="button"
                onClick={() => { setIsSignUp((v) => !v); setMessage(null); }}
                className="mt-5 w-full text-center text-sm text-white/25 transition-colors hover:text-white/50"
              >
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <span className="font-semibold text-[#57BEFE]">
                  {isSignUp ? "Sign in" : "Create one"}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
