"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";

export function InsightLink({ href, children }: { href: string; children: ReactNode }) {
  const className = "hidden whitespace-nowrap text-xs font-semibold text-[#247dff] hover:underline sm:block";

  function highlightTarget(event: MouseEvent<HTMLAnchorElement>) {
    if (!href.startsWith("#")) return;
    event.preventDefault();
    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.remove("is-highlighted");
    // Restart the animation even when the user clicks the same insight twice.
    void target.offsetWidth;
    target.classList.add("is-highlighted");
    window.setTimeout(() => target.classList.remove("is-highlighted"), 1700);
    window.history.replaceState(null, "", href);
  }

  if (href.startsWith("#")) return <a href={href} onClick={highlightTarget} className={className}>{children}</a>;
  return <Link href={href} className={className}>{children}</Link>;
}
