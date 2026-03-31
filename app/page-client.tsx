"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, ListChecks, User, ShieldCheck, BookOpen, Users, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

import { Skeleton } from "@/components/skeleton";

export default function LandingClient() {
  const [stats, setStats] = useState<{ experiences: number; companies: number; students: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Hide intro after 4 seconds
    const timer = setTimeout(() => setShowIntro(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      const supabase = createClient();

      try {
        const [expRes, companiesRes] = await Promise.all([
          supabase.from("experiences").select("*", { count: "exact", head: true }),
          supabase.from("experiences").select("company_name"),
        ]);

        const experiencesCount = expRes.count ?? 0;
        if (!companiesRes.data) return;

        const uniqueCompanies = new Set(
          companiesRes.data.map((e) => e.company_name.toLowerCase().trim())
        ).size;

        const studentsRes = await supabase
          .from("experiences")
          .select("author_name, college")
          .eq("anonymous", false);

        const uniqueStudents = studentsRes.data
          ? new Set(
            studentsRes.data.map(
              (e) =>
                `${(e.author_name ?? "").toLowerCase().trim()}|${(e.college ?? "").toLowerCase().trim()}`
            )
          ).size
          : 0;

        if (experiencesCount >= 1) {
          setStats({ experiences: experiencesCount, companies: uniqueCompanies, students: uniqueStudents });
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const showStats = stats !== null && !loadingStats;

  return (
    <>
      {/* ── EMBEDDED INTRO ANIMATION ── */}
      <AnimatePresence mode="wait">
        {showIntro && (
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

      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-start px-4 text-center transition-all overflow-hidden py-12 md:pt-15">
        {/* ── Hero Section ── */}
        <section className="frost-strong animate-in fade-in slide-in-from-bottom-4 duration-1000 rounded-[44px] px-8 py-12 sm:px-14 sm:py-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
            Placement Chat
          </h1>
          <p className="mx-auto mt-6 max-w-2xl px-4 text-sm text-slate-500 leading-relaxed sm:text-base">
            Placement Chat is a community-driven platform where engineering students share and
            discover placement and internship interview experiences <br /><b>Interview Stories: By Students, For Students</b>
          </p>
          <section className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <Link
              href="/feed"
              className="soft-button w-full sm:w-auto rounded-full px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Explore Experiences
            </Link>
            <Link
              href="/share"
              className="soft-pill w-full sm:w-auto rounded-full px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center justify-center gap-3"
            >
              Share Experience <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </section>
        </section>

        {/* Conditional Stats Section — Only visible if >= 10 experiences exist */}
        {!loadingStats && stats && stats.experiences >= 10 && (
          <section className="mt-10 w-full px-4 animate-in fade-in zoom-in duration-700">
            <div className="frost flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-6 rounded-[32px] sm:rounded-full px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
              <div className="flex flex-col sm:flex-row items-center gap-2 px-1 text-center font-bold tracking-tight">
                <span className="text-3xl sm:text-2xl font-semibold tracking-tighter text-slate-900 leading-none">{stats.experiences}+</span>
                <span className="opacity-70">Interviews Shared</span>
              </div>
              <span className="hidden sm:block text-slate-300">&middot;</span>
              <div className="flex flex-col sm:flex-row items-center gap-2 px-1 text-center font-bold tracking-tight">
                <span className="text-3xl sm:text-2xl font-semibold tracking-tighter text-slate-900 leading-none">{stats.companies}+</span>
                <span className="opacity-70">Companies</span>
              </div>
              <span className="hidden sm:block text-slate-300">&middot;</span>
              <div className="flex flex-col sm:flex-row items-center gap-2 px-1 text-center font-bold tracking-tight">
                <span className="text-3xl sm:text-2xl font-semibold tracking-tighter text-slate-900 leading-none">{stats.students}+</span>
                <span className="opacity-70">Students</span>
              </div>
            </div>
          </section>
        )}

        {/* ── Feature Cards ── */}
        <section className="mt-8 grid gap-8 sm:grid-cols-3 w-full max-w-6xl">
          <div className="frost group relative rounded-[32px] p-8 space-y-6 text-left border-transparent transition-all hover:bg-white/80">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                <Search className="h-5 w-5" />
              </div>
              <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-slate-900">Precise Search</h2>
            </div>
            <p className="text-xs font-semibold text-slate-900 leading-tight">Effortless navigation by company, branch, or results.</p>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Stop digging through unorganized threads. Our tactical filtering helps you find relevant experiences in seconds.
            </p>
          </div>

          <div className="frost group relative rounded-[32px] p-8 space-y-6 text-left border-transparent transition-all hover:bg-white/80">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                <ListChecks className="h-5 w-5" />
              </div>
              <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-slate-900">Technical Logs</h2>
            </div>
            <p className="text-xs font-semibold text-slate-900 leading-tight">Every interview round, broken down with precision.</p>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Detailed logs of questions, round duration, and difficulty. No guesswork-just solid data for your preparation.
            </p>
          </div>

          <div className="frost group relative rounded-[32px] p-8 space-y-6 text-left border-transparent transition-all hover:bg-white/80">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-[12px] font-black uppercase tracking-[0.25em] text-slate-900">Student Centric</h2>
            </div>
            <p className="text-xs font-semibold text-slate-900 leading-tight">Insights directly from the source. 100% Student-first.</p>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Students who gave the interviews. Unfiltered, and strictly community-driven.
            </p>
          </div>
        </section>

        {/* ── About This Application (Google Verification Requirement) ── */}
        <section id="about" className="mt-16 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="frost-strong rounded-[40px] p-8 sm:p-14 space-y-10 text-left">
            <div className="space-y-3 text-center">
              <p className="inline-block rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">About Placement Chat</p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">What is Placement Chat?</h2>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 text-[13px] leading-relaxed text-slate-600">
              {/* Purpose */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">Purpose</h3>
                </div>
                <p>
                  Placement Chat is a space where engineering students share their placement and internship interview experiences. You can browse detailed interview breakdowns and get practical tips directly from your seniors and peers to prepare for what lies ahead.
                </p>
              </div>

              {/* How It Works */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">How It Works</h3>
                </div>
                <p>
                  The entire feed is open to browse — you don't even need an account to read experiences. You only have to sign in with your Google account when you want to share your own interview experience or save posts. It's built for students, by students.
                </p>
              </div>

              {/* Google Data Usage */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">Google Data Usage</h3>
                </div>
                <p>
                  We use Google Sign-In simply so you don't have to remember another password. We access your basic email and name just to set up your profile. We do not look at your contacts or files. Your privacy is respected and your data is never tracked or sold.
                </p>
              </div>

              {/* Who It's For */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                    <Users className="h-4 w-4" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900">Who It&apos;s For</h3>
                </div>
                <p>
                  Whether you're from CS, ECE, Mechanical, Civil, or any other branch, this platform is for you. It's designed to help you prepare for campus placements, off-campus drives, or internship interviews across all engineering roles.
                </p>
              </div>
            </div>

            {/* Key Highlights */}
            <div className="mt-4 rounded-[24px] bg-slate-50/80 border border-slate-200/50 p-6 sm:p-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 mb-5">What you can find</h3>
              <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2 text-[13px] text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-black mt-0.5">→</span>
                  <span className="leading-relaxed text-balance">Read round-by-round interview breakdowns</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-black mt-0.5">→</span>
                  <span className="leading-relaxed text-balance">Find out the exact questions asked and overall difficulty</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-black mt-0.5">→</span>
                  <span className="leading-relaxed text-balance">Pick up actual tips from students who just gave the interview</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-black mt-0.5">→</span>
                  <span className="leading-relaxed text-balance">Discover what companies look for in specific roles</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-black mt-0.5">→</span>
                  <span className="leading-relaxed text-balance">Find experiences across all engineering branches</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-black mt-0.5">→</span>
                  <span className="leading-relaxed text-balance">100% free with no ads or tracking</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
