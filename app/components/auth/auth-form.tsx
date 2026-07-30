"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Eye, EyeOff, Check } from "lucide-react";

const features = [
  "48 credit cards with real reward rates",
  "AI-powered card recommendations",
  "Step-by-step subscription cancellation",
];

function FloatingCard({
  style,
  rotate,
  delay,
}: {
  style: React.CSSProperties;
  rotate: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="absolute w-[200px] rounded-2xl border border-white/10 p-4"
      style={{
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
        transform: `rotate(${rotate})`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        ...style,
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="h-5 w-7 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 opacity-80" />
        <div className="text-[9px] font-semibold tracking-widest text-white/40">VISA</div>
      </div>
      <div className="font-mono text-[11px] tracking-[0.2em] text-white/50">
        **** **** **** 4242
      </div>
      <div className="mt-2 text-xs font-semibold text-white/60">Pockit Card</div>
    </motion.div>
  );
}

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
    <div className="flex min-h-screen bg-[#020617]">
      {/* ── Left brand panel ── */}
      <div className="noise-bg relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[55%]">
        {/* Vivid mesh gradient blobs */}
        <div
          className="pointer-events-none absolute left-[-20%] top-[-20%] h-[700px] w-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(31,120,255,0.45) 0%, transparent 70%)",
            animation: "aurora-1 14s ease-in-out infinite",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-[-30%] right-[-10%] h-[650px] w-[650px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)",
            animation: "aurora-2 18s ease-in-out infinite",
          }}
        />
        <div
          className="pointer-events-none absolute right-[10%] top-[35%] h-[500px] w-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(236,72,153,0.28) 0%, transparent 70%)",
            animation: "aurora-3 11s ease-in-out infinite",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-[5%] left-[30%] h-[400px] w-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)",
            animation: "aurora-4 21s ease-in-out infinite",
          }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-base font-black text-white"
              style={{ background: "linear-gradient(135deg, #1F78FF, #a855f7)" }}
            >
              P
            </div>
            <span className="text-xl font-bold text-white/90 tracking-tight">Pockit</span>
          </div>

          {/* Hero text */}
          <div className="mt-16">
            <h1 className="text-[56px] font-black leading-[1.05] tracking-tight">
              <span className="animated-gradient-text">Smart money</span>
              <br />
              <span className="text-white">for smart</span>
              <br />
              <span className="text-white">spenders.</span>
            </h1>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-white/45">
              Pockit helps you pick the right credit card, maximize rewards, and manage every subscription — all in one place.
            </p>
          </div>

          {/* Feature list */}
          <ul className="mt-10 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-white/55">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1F78FF]/20">
                  <Check size={11} className="text-[#57BEFE]" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Floating decorative cards */}
        <div className="relative z-10 h-[220px]">
          <FloatingCard
            style={{ bottom: "20px", left: "40px" }}
            rotate="-6deg"
            delay={0.4}
          />
          <FloatingCard
            style={{ bottom: "50px", left: "180px" }}
            rotate="4deg"
            delay={0.6}
          />
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#030d1f] px-6 py-12">
        {/* Subtle right-side glow */}
        <div
          className="pointer-events-none absolute right-[-20%] top-[-20%] h-[500px] w-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(31,120,255,0.4) 0%, transparent 70%)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[360px]"
        >
          {/* Mobile logo (only shown when left panel hidden) */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg, #1F78FF, #a855f7)" }}
            >
              P
            </div>
            <span className="text-lg font-bold text-white/90">Pockit</span>
          </div>

          {/* Gradient border card */}
          <div className="gradient-border-card">
            <div
              className="rounded-[27px] p-7"
              style={{
                background: "rgba(255,255,255,0.03)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
              }}
            >
              <h2 className="text-2xl font-bold text-white">
                {isSignUp ? "Create account" : "Welcome back"}
              </h2>
              <p className="mt-1.5 text-sm text-white/40">
                {isSignUp
                  ? "Start managing your money smarter."
                  : "Sign in to your Pockit dashboard."}
              </p>

              <form className="mt-6 space-y-4" onSubmit={submit}>
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                  >
                    <label className="block text-xs font-medium text-white/50">
                      Full name
                      <input
                        className="mt-1.5 w-full rounded-xl border border-white/8 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:border-[#a855f7]/50 focus:ring-2 focus:ring-[#a855f7]/15"
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

                <label className="block text-xs font-medium text-white/50">
                  Email
                  <input
                    className="mt-1.5 w-full rounded-xl border border-white/8 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:border-[#1F78FF]/50 focus:ring-2 focus:ring-[#1F78FF]/15"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="block text-xs font-medium text-white/50">
                  Password
                  <div className="relative mt-1.5">
                    <input
                      className="w-full rounded-xl border border-white/8 bg-white/[0.06] px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none transition-all duration-200 focus:border-[#1F78FF]/50 focus:ring-2 focus:ring-[#1F78FF]/15"
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
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/55"
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
                        : "border-white/8 bg-white/[0.05] text-white/60"
                    }`}
                  >
                    {message}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-2 w-full overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{
                    background:
                      "linear-gradient(135deg, #1F78FF 0%, #a855f7 60%, #ec4899 100%)",
                    boxShadow:
                      "0 4px 32px rgba(31,120,255,0.3), 0 0 0 0 rgba(168,85,247,0)",
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
                className="mt-5 w-full text-center text-sm text-white/30 transition-colors hover:text-white/55"
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
