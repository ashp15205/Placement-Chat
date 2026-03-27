"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip loader for landing page as it has its own cinematic intro
    if (pathname === "/") return;

    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="top-bar-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed left-0 right-0 top-0 z-[100000] h-[3px] overflow-hidden bg-black/5"
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1, ease: "easeInOut", repeat: Infinity }}
            className="h-full w-full bg-gradient-to-r from-transparent via-slate-900 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
