"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

// icons imports for dashboard
// notes: similar "Subscription" icon missing from lucide so using another card-like icon
import {
  LayoutDashboard,
  WalletCards,
  ChartPie,
  CreditCard,
  Bot,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: WalletCards },
  { href: "/analytics", label: "Analytics", icon: ChartPie },
  { href: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/chatbot", label: "Chatbot", icon: Bot },
  { href: "/settings", label: "Setting", icon: Settings },
];

export default function Sidebar() {
  // set default sidebar to open
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  return (
    // using ternary op. --> if sidebar is open then make width 64, o/w use width of 20 w/ icons
    <nav
      className={`relative min-h-screen p-4 border-r bg-[#E9F1FF] border-gray-200 transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div
        className={`flex items-center gap-3 mb-6 ${!isOpen ? "justify-center" : ""}`}
      >
        <Image
          src="/pockit_logo.png"
          alt="Pockit"
          width={64}
          height={64}
          className="rounded-lg shrink-0"
        />

        {isOpen && (
          <span className="font-semibold text-4xl text-[#57befe] truncate">
            Pockit
          </span>
        )}
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-100 transition-colors shadow-sm"
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4 text-[#1F78FF]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[#1F78FF]" />
        )}
      </button>

      <ul className="space-y-5 mt-10">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                title={!isOpen ? link.label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "text-[#1F78FF] font-medium"
                    : "text-gray-700 hover:bg-[#D5E5FF]"
                } ${!isOpen ? "justify-center" : ""}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {isOpen && <span className="truncate">{link.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
