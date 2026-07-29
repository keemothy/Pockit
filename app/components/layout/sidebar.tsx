"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: WalletCards },
  { href: "/analytics", label: "Analytics", icon: ChartPie },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/chatbot", label: "Chatbot", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <nav
      className={`relative flex min-h-screen flex-col border-r border-gray-200 bg-[#E9F1FF] p-4 transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className={`mb-6 flex items-center gap-3 ${!isOpen ? "justify-center" : ""}`}>
        <Image
          src="/pockit_logo.png"
          alt="Pockit"
          width={64}
          height={64}
          className="shrink-0 rounded-lg"
        />
        {isOpen && <span className="truncate text-4xl font-semibold text-[#57befe]">Pockit</span>}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute -right-3 top-6 rounded-full border border-gray-200 bg-white p-1 shadow-sm transition-colors hover:bg-gray-100"
      >
        {isOpen ? <ChevronLeft className="h-4 w-4 text-[#1F78FF]" /> : <ChevronRight className="h-4 w-4 text-[#1F78FF]" />}
      </button>

      <ul className="mt-10 space-y-5">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                title={!isOpen ? link.label : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                  isActive ? "font-medium text-[#1F78FF]" : "text-gray-700 hover:bg-[#D5E5FF]"
                } ${!isOpen ? "justify-center" : ""}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {isOpen && <span className="truncate">{link.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => void signOut()}
        title={!isOpen ? "Sign out" : undefined}
        className={`mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-[#D5E5FF] ${
          !isOpen ? "justify-center" : ""
        }`}
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {isOpen && <span>Sign out</span>}
      </button>
    </nav>
  );
}
