"use client";

import { useAuth } from "@/components/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { safeNextPath } from "@/lib/safe-next";

function LoginContent() {
  const { loginWithGoogle, user, profile, isReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);

  const next = safeNextPath(searchParams.get("next"), "/feed");

  useEffect(() => {
    if (!isReady) return;
    if (!user) return;
    if (!profile) {
      router.replace(`/onboarding?next=${encodeURIComponent(next)}`);
      return;
    }
    router.replace(next);
  }, [isReady, user, profile, next, router]);

  if (!isReady) return null;
  if (user) return null;

  const handleGoogleLogin = async () => {
    setPending(true);
    try {
      await loginWithGoogle(next);
    } catch {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] w-full flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="frost-strong w-full max-w-lg rounded-[48px] p-12 text-center space-y-12 shadow-2xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-900 text-white shadow-xl">
          <MessageSquare className="h-9 w-9 fill-current" strokeWidth={3} />
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Placement Chat</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Access the global placement network</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={pending}
          className="soft-pill flex w-full items-center justify-center gap-2 rounded-full h-14 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-slate-900 hover:text-white active:scale-95 disabled:opacity-50 shadow-xl"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {pending ? "Authenticating..." : "Login with Google"}
        </button>

        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-8">
          By continuing, you participate in a network of peer-to-peer student insights
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
