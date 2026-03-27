"use client";

import { motion } from "framer-motion";

type BrandMarkProps = {
  className?: string;
  animated?: boolean;
};

export function BrandMark({ className, animated = false }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <motion.rect
        x="12"
        y="12"
        width="96"
        height="96"
        rx="28"
        stroke="currentColor"
        strokeWidth="9"
        initial={animated ? { pathLength: 0, opacity: 0 } : false}
        animate={animated ? { pathLength: 1, opacity: 1 } : false}
        transition={animated ? { duration: 0.75, ease: "easeInOut" } : undefined}
      />
      <motion.path
        d="M36 72V48L60 78V48L84 72"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0, opacity: 0 } : false}
        animate={animated ? { pathLength: 1, opacity: 1 } : false}
        transition={animated ? { duration: 0.95, delay: 0.2, ease: "easeInOut" } : undefined}
      />
    </svg>
  );
}

