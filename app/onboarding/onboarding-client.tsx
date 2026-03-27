"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useAuth } from "@/components/auth-provider";
import { OnboardingForm } from "./onboarding-form";
import { UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { safeNextPath } from "@/lib/safe-next";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, isReady } = useAuth();
  const next = safeNextPath(searchParams.get("next"));

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (profile) {
      router.replace(next);
    }
  }, [isReady, next, profile, router, user]);

  if (!isReady) return null;
  if (!user || profile) return null;

  return (
    <div className="flex min-h-[calc(100vh-140px)] w-full flex-col items-center justify-center px-6 py-1 py-10">
      <div className="relative w-full max-w-2xl">
        <div className="absolute -left-32 -top-32 h-64 w-64 bg-sky-300/30 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -right-32 -bottom-32 h-64 w-64 bg-indigo-300/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 border border-sky-200"
          >
            <UserCheck className="h-6 w-6 text-sky-600" />
          </motion.div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight mt-4">One Final Step</h1>
        </div>

        <div className="mt-5">
          <OnboardingForm next={next} />
        </div>
      </div>
    </div>
  );
}

export default function OnboardingClient() {
  return (
    <Suspense fallback={null}>
      <OnboardingContent />
    </Suspense>
  );
}
