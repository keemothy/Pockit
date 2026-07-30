"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface GlassPressProps {
  children: React.ReactNode;
  className?: string;
  rounded?: string;
}

/**
 * Wraps children in a liquid-glass press effect.
 * On pointer-down: a frosted-glass bubble expands from the center,
 * the content scales up slightly (magnification through glass).
 * On release: bubble springs back out.
 */
export function GlassPress({
  children,
  className = "",
  rounded = "rounded-xl",
}: GlassPressProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
    >
      {/* Glass bubble overlay */}
      <AnimatePresence>
        {pressed && (
          <motion.span
            key="glass"
            className={`pointer-events-none absolute z-20 ${rounded}`}
            style={{ inset: "-3px" }}
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 720, damping: 34, mass: 0.55 }}
          >
            <span
              className={`block h-full w-full ${rounded}`}
              style={{
                background: "rgba(255,255,255,0.24)",
                backdropFilter: "blur(20px) saturate(200%) brightness(1.07)",
                WebkitBackdropFilter: "blur(20px) saturate(200%) brightness(1.07)",
                border: "1px solid rgba(255,255,255,0.62)",
                boxShadow: [
                  "inset 0 1.5px 0 rgba(255,255,255,0.82)",
                  "inset 0 -1px 0 rgba(0,0,0,0.05)",
                  "0 6px 28px rgba(0,0,0,0.07)",
                ].join(", "),
              }}
            />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Content — scales up slightly through the "glass" */}
      <motion.div
        className="relative z-10"
        animate={pressed ? { scale: 1.05 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 520, damping: 24 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
