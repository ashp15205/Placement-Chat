"use client";

import Link from "next/link";
import { ArrowLeft, UserCheck, ShieldOff, Database, Fingerprint, EyeOff, Lock, Cookie, Server, RefreshCw } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. What We Collect",
      icon: <UserCheck className="h-4 w-4" />,
      points: [
        "Name and email (via Google OAuth)",
        "College, branch, graduation year (from onboarding)",
        "LinkedIn URL (only if you choose to provide it)",
        "Interview experiences you choose to share",
        "Likes and saves activity"
      ]
    },
    {
      title: "2. What We Do Not Collect",
      icon: <ShieldOff className="h-4 w-4" />,
      points: [
        "Passwords — Google handles authentication entirely",
        "Payment information",
        "Location data",
        "Device tracking or fingerprinting"
      ]
    },
    {
      title: "3. How We Use Your Data",
      icon: <Database className="h-4 w-4" />,
      points: [
        "To display your profile and shared experiences",
        "To enable community features (likes, saves)",
        "Your Google profile name and email are used exclusively for account creation and session management",
        <span key="never-sell" className="font-bold text-slate-900">We never sell your data to anyone. Ever.</span>
      ]
    },
    {
      title: "4. Anonymous Posts",
      icon: <EyeOff className="h-4 w-4" />,
      points: [
        "If you post anonymously, your name is completely hidden from all other users",
        "Your identity is stored internally only to enable account management",
        "It is never shown publicly under any circumstance"
      ]
    },
    {
      title: "5. Data Storage",
      icon: <Server className="h-4 w-4" />,
      points: [
        "All data is stored securely on Supabase",
        "Data is never shared with any third parties"
      ]
    },
    {
      title: "6. Your Rights",
      icon: <Lock className="h-4 w-4" />,
      points: [
        "Delete your account anytime from your profile — this permanently removes all your data from our database",
        "Edit your profile information anytime"
      ]
    },
    {
      title: "7. Cookies",
      icon: <Cookie className="h-4 w-4" />,
      points: [
        "We use only essential cookies required for authentication",
        "No advertising cookies",
        "No third party tracking of any kind"
      ]
    },
    {
      title: "8. Third Party Services",
      icon: <Fingerprint className="h-4 w-4" />,
      points: [
        "Google OAuth — used for login only",
        "Supabase — used for database and authentication",
        "Vercel — used for hosting",
        "We do not control the privacy practices of these services"
      ]
    },
    {
      title: "9. Updates to This Policy",
      icon: <RefreshCw className="h-4 w-4" />,
      points: [
        "This policy may be updated from time to time",
        "Continued use of Placement Chat means you accept the latest version"
      ]
    }
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 text-slate-900">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="h-3 w-3" />
          Back to Home
        </Link>
      </div>

      <div className="frost-strong rounded-[40px] p-8 sm:p-14 space-y-10">
        <div className="space-y-3">
          <p className="inline-block rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">Trust & Data</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Privacy Policy</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Effective Date: April 2026</p>
        </div>

        <div className="grid gap-x-12 gap-y-10 text-[13px] leading-relaxed text-slate-600 sm:grid-cols-2">
          {sections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                  {section.icon}
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">{section.title}</h2>
              </div>
              <ul className="space-y-2.5 list-disc pl-4 marker:text-slate-400">
                {section.points.map((point, pIdx) => (
                  <li key={pIdx}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
