"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/wallet", label: "Wallet" },
  { href: "/analytics", label: "Analytics" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/chatbot", label: "Chatbot" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <nav className="w-64 min-h-screen p-4 border-r border-gray-200">
      <ul className="space-y-2">
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-500 text-white font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-8 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
      >
        Sign out
      </button>
    </nav>
  );
}
