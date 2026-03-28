"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";

export function IntroAnimation() {
  const [show, setShow] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Show on the landing page on every mount/refresh
  useEffect(() => {
    setIsMounted(true);
    if (pathname === "/") {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!isMounted) return null;

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05,
            filter: "blur(40px) brightness(1.2)",
            transition: { duration: 1.2, ease: [0.4, 0, 0.2, 1] },
          }}
          className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden bg-white"
        >
          {/* Bold Technical Mesh Grid Layer (Black Borders) */}
          <div className="absolute inset-0 z-0 opacity-[0.12]">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hex-mesh-final" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M25 0L50 12.5V37.5L25 50L0 37.5V12.5L25 0Z" fill="none" stroke="black" strokeWidth="1.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hex-mesh-final)" />
            </svg>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-1 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_0%,rgba(255,255,255,1)_90%)]"
          />

          <div className="relative z-10 flex flex-col items-center justify-center pt-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div
                className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[20px] bg-slate-900 text-white shadow-[0_30px_80px_-15px_rgba(0,0,0,0.35)] sm:h-36 sm:w-36 sm:rounded-[28px]"
              >
                {/* The icon — always rendered, revealed by the curtain sweeping away */}
                <MessageSquare className="h-[60%] w-[60%] fill-current" strokeWidth={3} />

                {/* The curtain: same color as container, sweeps left → right to expose the icon */}
                <motion.div
                  initial={{ x: "0%" }}
                  animate={{ x: "101%" }}
                  transition={{ duration: 0.65, delay: 0.7, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-0 bg-slate-900"
                />
              </div>
            </motion.div>

            {/* Premium Typography (Matching Landing Hero Scale) */}
            <div className="mt-2 flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4, duration: 1.2 }}
              >
                <h1 className="text-4xl font-[1000] tracking-[0.5em] text-black sm:text-7xl">
                  Placement Chat
                </h1>

                <div className="mt-5 flex items-center justify-center gap-10">
                  <div className="h-[2px] w-12 bg-black/15" />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.8] }}
                    transition={{ duration: 2, delay: 2.2 }}
                    className="text-[12px] font-black uppercase tracking-[0.45em] text-black sm:text-base"
                  >
                    Decode the Interview
                  </motion.p>
                  <div className="h-[2px] w-12 bg-black/15" />
                </div>
              </motion.div>

              {/* Bold Technical Loader */}
              <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-black/5">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="h-full w-full bg-gradient-to-r from-transparent via-black/40 to-transparent"
                />
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 2.8 }}
                className="mt-3 text-[11px] font-[1000] uppercase tracking-[0.3em] text-black"
              >
                Synchronizing Platform ...
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
