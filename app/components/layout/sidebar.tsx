"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

/* icon imports from lucide; idk why the comment got deleted before
- wallet/subscriptions/chatbot icons WILL differ from the original figma design
- no EXACT matches; should be fine since they're still distinguisable icons
*/
import {
  Bot,
  ChartPie,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  WalletCards,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { GlassPress } from "@/app/components/ui/glass-press";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: WalletCards },
  { href: "/analytics", label: "Analytics", icon: ChartPie },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/chatbot", label: "Chatbot", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

const W_OPEN = 272;
const W_CLOSED = 68;
const PX_OPEN = 14;
const PX_CLOSE = 10;

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const px = isOpen ? PX_OPEN : PX_CLOSE;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <nav
      className="pockit-sidebar relative transition-all duration-300"
      style={{
        /* CSS Grid: top-section | scrollable-links | sign-out */
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        width: isOpen ? W_OPEN : W_CLOSED,
        flexShrink: 0,
        height: "100%",
        minHeight: 0,
        background: "#ffffff",
        boxShadow: "2px 0 16px rgba(31,120,255,0.04)",
      }}
    >
      {/* SIDEBAR TOGGLE BUTTON (<, >) */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="absolute -right-3 top-6 z-30 flex h-6 w-6 items-center justify-center rounded-full cursor-pointer border bg-white shadow-sm transition-shadow hover:shadow-md"
        style={{ borderColor: "rgba(31,120,255,0.14)" }}
      >
        {isOpen ? (
          <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>

      {/* LOGO DESIGN FOR POCKIT */}
      <div style={{ padding: `20px ${px}px 8px ${px}px` }}>
        <div
          className={`flex items-center gap-2.5 ${!isOpen ? "justify-center" : ""}`}
        >
          <Image
            src="/pockit_logo.png"
            alt="Pockit"
            width={418}
            height={464}
            className="h-auto w-9 shrink-0 rounded-lg"
          />
          {isOpen && (
            <span
              className="truncate text-[21px] font-black tracking-[-0.03em]"
              style={{
                background:
                  "linear-gradient(135deg, #1F78FF 0%, #a855f7 55%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Pockit
            </span>
          )}
        </div>

        {isOpen && (
          <p className="mt-5 pl-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Menu
          </p>
        )}
      </div>

      {/* NAV LINKS FOR THE MENU */}
      <div className="overflow-y-auto" style={{ padding: `4px ${px}px` }}>
        <ul className="space-y-0.5">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href ||
                  pathname.startsWith(link.href + "/");
            const Icon = link.icon;

            return (
              <li key={link.href}>
                <GlassPress rounded="rounded-xl" className="block">
                  <Link
                    href={link.href}
                    title={!isOpen ? link.label : undefined}
                    className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13.5px] font-medium transition-colors duration-150 ${
                      isActive
                        ? "text-white"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    } ${!isOpen ? "justify-center" : ""}`}
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(135deg, #1F78FF, #4f9dff)",
                            boxShadow: "0 2px 10px rgba(31,120,255,0.28)",
                          }
                        : {}
                    }
                  >
                    <Icon className="h-[17px] w-[17px] shrink-0" />
                    {isOpen && <span className="truncate">{link.label}</span>}
                  </Link>
                </GlassPress>
              </li>
            );
          })}
        </ul>
      </div>

      {/* SIGN OUT BUTTON */}
      <div
        className="border-t border-slate-100"
        style={{ padding: `12px ${px}px 20px ${px}px` }}
      >
        <GlassPress rounded="rounded-xl" className="block">
          <button
            type="button"
            onClick={() => void signOut()}
            title={!isOpen ? "Sign out" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[13px] text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 ${
              !isOpen ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-[17px] w-[17px] shrink-0" />
            {isOpen && <span>Sign out</span>}
          </button>
        </GlassPress>
      </div>
    </nav>
  );
}
