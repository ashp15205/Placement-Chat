"use client";

import Link from "next/link";
import { ArrowLeft, Users, Pencil, Slash, FileUser, ListChecks, UserMinus, Shield, Info, Scale, RefreshCw } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "1. Who Can Use PlacementChat",
      icon: <Users className="h-4 w-4" />,
      points: [
        "PlacementChat is built primarily for engineering students",
        "A valid Google account is required to contribute",
        "Browsing is open to everyone without an account"
      ]
    },
    {
      title: "2. What You Can Do",
      icon: <Pencil className="h-4 w-4" />,
      points: [
        "Browse all experiences freely without logging in",
        "Share your genuine personal interview experiences",
        "Like and save experiences from the community",
        "Post anonymously if you prefer privacy",
        "Report any content you find inappropriate — we will review it and take necessary action"
      ]
    },
    {
      title: "3. What You Cannot Do",
      icon: <Slash className="h-4 w-4" />,
      points: [
        "Post fake or fabricated interview experiences",
        "Impersonate another student or company",
        "Share confidential company information covered under NDA",
        "Spam, harass or abuse other users in any form",
        "Use the platform for any commercial purpose",
        "Scrape, copy or reproduce data from the platform",
        "Post content that is offensive, hateful or discriminatory"
      ]
    },
    {
      title: "4. Your Content",
      icon: <FileUser className="h-4 w-4" />,
      points: [
        "You own the experiences you share on PlacementChat",
        "By posting, you grant PlacementChat a license to display your content on the platform",
        "We reserve the right to remove content that violates these terms without prior notice"
      ]
    },
    {
      title: "5. Accuracy of Experiences",
      icon: <ListChecks className="h-4 w-4" />,
      points: [
        "Share only experiences you personally went through",
        "Do not exaggerate or misrepresent what happened",
        "PlacementChat is not responsible for any decisions made based on shared experiences"
      ]
    },
    {
      title: "6. Account Termination",
      icon: <UserMinus className="h-4 w-4" />,
      points: [
        "We reserve the right to suspend or delete accounts that violate these terms",
        "You can delete your own account anytime from your profile page"
      ]
    },
    {
      title: "7. Intellectual Property",
      icon: <Shield className="h-4 w-4" />,
      points: [
        "The PlacementChat name, logo and design are our property",
        "Do not copy or replicate the platform",
        "Content shared by users belongs to the respective users"
      ]
    },
    {
      title: "8. Disclaimer",
      icon: <Info className="h-4 w-4" />,
      points: [
        "PlacementChat is a community-driven platform",
        "We do not guarantee any job or internship outcomes",
        "Experiences shared are personal opinions of individual students",
        "We are not affiliated with any company, college or recruiter mentioned on the platform"
      ]
    },
    {
      title: "9. Limitation of Liability",
      icon: <Scale className="h-4 w-4" />,
      points: [
        "PlacementChat is not liable for any decisions made based on content shared on this platform",
        "We are not responsible for the practices of third party services including Google, Supabase and Vercel"
      ]
    },
    {
      title: "10. Updates to These Terms",
      icon: <RefreshCw className="h-4 w-4" />,
      points: [
        "These terms may be updated anytime",
        "Continued use of PlacementChat means you accept the latest version"
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
          <p className="inline-block rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">Platform Governance</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Terms of Service</h1>
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
              <ul className="space-y-2 list-disc pl-4 marker:text-slate-400">
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
