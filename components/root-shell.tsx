"use client";

import { useAuth } from "@/components/auth-provider";
import { Navbar, Footer } from "@/components/site-chrome";
import { PageLoader } from "@/components/page-loader";
import { NeonTrails } from "@/components/neon-trails";
import { IntroAnimation } from "@/components/intro-animation";
import { motion, AnimatePresence } from "framer-motion";

export function RootShell({ children }: { children: React.ReactNode }) {
  const { isIntroActive } = useAuth();

  return (
    <>
      <IntroAnimation />
      <PageLoader />
      <NeonTrails />
      
      {/* Navbar fades in only after intro */}
      <AnimatePresence>
        {!isIntroActive && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-[60]"
          >
            <Navbar />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex min-h-dvh flex-col overflow-x-hidden">
        <div className="flex-1 pt-15 md:pt-10">
          <AnimatePresence mode="wait">
            {!isIntroActive ? (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {children}
              </motion.div>
            ) : (
              <div key="spacer" className="min-h-screen" />
            )}
          </AnimatePresence>
        </div>
        
        {!isIntroActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Footer />
          </motion.div>
        )}
      </main>
    </>
  );
}
