"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useAuth } from "@/components/auth-provider";
import { ArrowLeft } from "lucide-react";
import { ShareForm } from "./share-form";

function ShareContent() {
  const router = useRouter();
  const { user, profile, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/login?next=/share");
      return;
    }
    if (!profile) {
      router.replace("/onboarding?next=/share");
    }
  }, [isReady, profile, router, user]);

  if (!isReady) return null;
  if (!user || !profile) return null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4">
      <div className="rounded-[24px] px-4 py-3 mt-6">
        <Link href="/feed" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
          Back to feed
        </Link>
      </div>
      <ShareForm />
    </main>
  );
}

export default function ShareClient() {
  return (
    <Suspense fallback={null}>
      <ShareContent />
    </Suspense>
  );
}
