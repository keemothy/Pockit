"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

/* ── Realistic card data ────────────────────────────────── */
const CARDS = [
  {
    gradient: "linear-gradient(145deg, #0B1F4A 0%, #1B3568 52%, #0B1F4A 100%)",
    sheen: "linear-gradient(125deg, transparent 30%, rgba(255,255,255,0.07) 50%, transparent 70%)",
    name: "SAPPHIRE RESERVE",
    number: "•••• •••• •••• 4847",
    holder: "JAMES CHEN",
    expiry: "09/28",
    network: "visa" as const,
    chipLight: true,
    pos: { top: "-6%", left: "-14%", transform: "rotate(-19deg)" },
    opacity: 0.42,
  },
  {
    gradient: "linear-gradient(145deg, #8B8B8B 0%, #D8D8D8 38%, #ACACAC 68%, #C6C6C6 100%)",
    sheen: "linear-gradient(130deg, transparent 20%, rgba(255,255,255,0.22) 48%, transparent 68%)",
    name: "THE PLATINUM CARD",
    number: "•••• •••••• •1004",
    holder: "SARAH PARK",
    expiry: "03/27",
    network: "amex" as const,
    chipLight: true,
    pos: { top: "9%", left: "22%", transform: "rotate(-5deg)" },
    opacity: 0.38,
  },
  {
    gradient: "linear-gradient(145deg, #7B5519 0%, #C9A227 44%, #A07820 74%, #D4AF37 100%)",
    sheen: "linear-gradient(130deg, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 72%)",
    name: "GOLD CARD",
    number: "•••• •••••• •8832",
    holder: "MIKE WILSON",
    expiry: "11/26",
    network: "amex" as const,
    chipLight: false,
    pos: { top: "42%", right: "-10%", transform: "rotate(13deg)" },
    opacity: 0.40,
  },
  {
    gradient: "linear-gradient(145deg, #141428 0%, #1E2040 52%, #0F1230 100%)",
    sheen: "linear-gradient(125deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)",
    name: "VENTURE X",
    number: "•••• •••• •••• 7739",
    holder: "EMMA DAVIS",
    expiry: "07/29",
    network: "mc" as const,
    chipLight: true,
    pos: { bottom: "20%", left: "-10%", transform: "rotate(-11deg)" },
    opacity: 0.44,
  },
  {
    gradient: "linear-gradient(145deg, #E4E4E4 0%, #F5F5F7 48%, #DCDCDC 100%)",
    sheen: "linear-gradient(130deg, transparent 20%, rgba(255,255,255,0.5) 50%, transparent 75%)",
    name: "TITANIUM",
    number: "•••• •••• •••• 2291",
    holder: "ALEX KIM",
    expiry: "05/28",
    network: "mc" as const,
    chipLight: false,
    pos: { bottom: "3%", left: "26%", transform: "rotate(6deg)" },
    opacity: 0.36,
  },
  {
    gradient: "linear-gradient(145deg, #004875 0%, #006DAA 52%, #004875 100%)",
    sheen: "linear-gradient(125deg, transparent 28%, rgba(255,255,255,0.08) 50%, transparent 72%)",
    name: "DOUBLE CASH",
    number: "•••• •••• •••• 3456",
    holder: "RYAN LEE",
    expiry: "12/27",
    network: "mc" as const,
    chipLight: true,
    pos: { top: "28%", right: "-6%", transform: "rotate(-14deg)" },
    opacity: 0.40,
  },
];

type Network = "visa" | "mc" | "amex";

function NetworkBadge({ network, dark }: { network: Network; dark: boolean }) {
  if (network === "visa") {
    return (
      <span className={`font-serif italic font-black text-lg tracking-tight ${dark ? "text-[#1A1F71]" : "text-white/80"}`}>
        VISA
      </span>
    );
  }
  if (network === "amex") {
    return (
      <span className={`font-bold text-xs tracking-[0.3em] ${dark ? "text-gray-600/80" : "text-white/70"}`}>
        AMEX
      </span>
    );
  }
  return (
    <div className="flex items-center">
      <div className="h-7 w-7 rounded-full bg-[#EB001B] opacity-90" />
      <div className="h-7 w-7 rounded-full bg-[#F79E1B] opacity-90 -ml-3.5" />
    </div>
  );
}

function CreditCard({ card, index }: { card: typeof CARDS[number]; index: number }) {
  const isDark = card.gradient.includes("E4E4") || card.gradient.includes("D8D8") || card.gradient.includes("8B8B");
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 0 }}
      animate={{ opacity: card.opacity, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="absolute w-[252px] h-[158px] rounded-[14px] overflow-hidden select-none"
      style={{
        background: card.gradient,
        boxShadow: "0 24px 56px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)",
        filter: "blur(0.6px) saturate(0.7)",
        ...card.pos,
      }}
    >
      <div className="absolute inset-0" style={{ background: card.sheen }} />
      <div className={`relative h-full flex flex-col justify-between p-4 ${isDark ? "text-zinc-800" : "text-white"}`}>
        <div className="flex items-start justify-between">
          <span className={`text-[10px] font-semibold tracking-widest ${isDark ? "text-zinc-500" : "text-white/50"}`}>
            {card.name}
          </span>
          <NetworkBadge network={card.network} dark={isDark} />
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className="relative h-7 w-9 rounded overflow-hidden"
            style={{
              background: card.chipLight
                ? "linear-gradient(135deg, #c8a200, #f0d060, #a88000, #e8c840)"
                : "linear-gradient(135deg, #a0a0a0, #d8d8d8, #888888, #c0c0c0)",
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.2) 3px,rgba(0,0,0,0.2) 4px),repeating-linear-gradient(90deg,transparent,transparent 3px,rgba(0,0,0,0.2) 3px,rgba(0,0,0,0.2) 4px)",
              }}
            />
          </div>
          <span className={`text-base leading-none ${isDark ? "text-zinc-400" : "text-white/40"}`}>)))</span>
        </div>
        <div>
          <p className={`font-mono text-[11px] tracking-[0.15em] ${isDark ? "text-zinc-600" : "text-white/70"}`}>
            {card.number}
          </p>
          <div className={`mt-1 flex items-end justify-between text-[9px] ${isDark ? "text-zinc-500" : "text-white/45"}`}>
            <span className="font-semibold tracking-wider">{card.holder}</span>
            <span>{card.expiry}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const STATS = [
  { value: "48", label: "credit cards" },
  { value: "26", label: "subscriptions" },
  { value: "AI", label: "powered" },
];

/* ── Main component ─────────────────────────────────────── */
export default function AuthForm() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

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

    if (!isSignUp) {
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) {
        setMessage(assuranceError.message);
        setIsError(true);
        return;
      }
      if (assurance.currentLevel === "aal1" && assurance.nextLevel === "aal2") {
        setRequiresTwoFactor(true);
        setMessage(null);
        return;
      }
    }

    router.replace("/");
    router.refresh();
  }

  async function verifyTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp.find((item) => item.status === "verified");
    if (factorsError || !factor) {
      setIsSubmitting(false);
      setMessage(factorsError?.message ?? "No verified authenticator was found for this account.");
      setIsError(true);
      return;
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: verificationCode.trim(),
    });
    setIsSubmitting(false);
    if (error) {
      setMessage(error.message);
      setIsError(true);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors duration-200 focus:border-white/22 focus:bg-white/[0.09]";

  return (
    <div className="flex min-h-screen bg-[#020617]">

      {/* ── Left panel — card scatter background ── */}
      <div className="noise-bg relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:px-12 lg:py-14">
        <div className="absolute inset-0 bg-[#060d1f]" />
        {CARDS.map((card, i) => (
          <CreditCard key={i} card={card} index={i} />
        ))}
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 30% 60%, rgba(31,120,255,0.18) 0%, transparent 55%)" }} />
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 70% 20%, rgba(168,85,247,0.14) 0%, transparent 50%)" }} />
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 90%, rgba(236,72,153,0.10) 0%, transparent 50%)" }} />
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(4,9,22,0.92) 0%, rgba(4,9,22,0.30) 28%, rgba(4,9,22,0.30) 62%, rgba(4,9,22,0.94) 100%)" }} />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-white text-sm"
            style={{ background: "linear-gradient(135deg, #1F78FF, #a855f7)" }}>
            P
          </div>
          <span className="text-lg font-semibold text-white/80 tracking-tight">Pockit</span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <h1 className="text-[50px] font-extrabold leading-[1.07] tracking-tight">
            <span className="animated-gradient-text">Smart money</span>
            <br />
            <span className="text-white">for smart</span>
            <br />
            <span className="text-white">spenders.</span>
          </h1>
          <p className="mt-4 text-sm text-white/40 leading-relaxed max-w-[280px]">
            Pick the right card, maximize rewards, and manage every subscription.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex items-center gap-8"
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-[26px] font-extrabold text-white leading-none">{s.value}</p>
              <p className="text-[11px] text-white/30 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#030d1f] px-6 py-12">
        <div className="pointer-events-none absolute right-[-15%] top-[-10%] h-[400px] w-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-[-15%] left-[-5%] h-[320px] w-[320px] rounded-full opacity-18"
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
                background: "rgba(8,15,35,0.92)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
              }}
            >
              {requiresTwoFactor ? (
                /* ── 2FA challenge screen ── */
                <>
                  <h2 className="text-[22px] font-bold text-white">Two-factor check</h2>
                  <p className="mt-1.5 text-sm text-white/35">
                    Enter the 6-digit code from your authenticator app.
                  </p>
                  <form className="mt-6 space-y-4" onSubmit={verifyTwoFactor}>
                    <label className="block">
                      <span className="text-xs font-medium text-white/40">Verification code</span>
                      <input
                        className={`mt-1.5 ${inputCls} tracking-[0.25em] text-center text-lg`}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        required
                        autoFocus
                        placeholder="000000"
                      />
                    </label>
                    {message && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        role="status"
                        className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
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
                          Verifying…
                        </span>
                      ) : "Verify and sign in"}
                    </motion.button>
                  </form>
                  <button
                    type="button"
                    onClick={() => { setRequiresTwoFactor(false); setMessage(null); setVerificationCode(""); }}
                    className="mt-5 w-full text-center text-sm text-white/25 transition-colors hover:text-white/50"
                  >
                    Back to sign in
                  </button>
                </>
              ) : (
                /* ── Normal sign in / sign up ── */
                <>
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
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
