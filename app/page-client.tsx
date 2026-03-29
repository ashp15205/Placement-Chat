"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, ListChecks, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Skeleton } from "@/components/skeleton";

export default function LandingClient() {
  const [stats, setStats] = useState<{ experiences: number; companies: number; students: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

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
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-start px-4 text-center transition-all overflow-hidden py-12 md:pt-15">
      <section className="frost-strong animate-in fade-in slide-in-from-bottom-4 duration-1000 rounded-[44px] px-8 py-12 sm:px-14 sm:py-8">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-6xl md:text-7xl">
          Placement Chat
        </h1>
        <p className="mx-auto mt-6 max-w-2xl px-4 text-sm text-slate-500 leading-relaxed sm:text-base">
          Placement Chat is a community-driven platform where engineering students share and
          discover placement and internship interview experiences
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
            Students who gave the interviews<br /> Unfiltered, and strictly community-driven.
          </p>
        </div>
      </section>
    </main>
  );
}
