"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Experience } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import {
   ChevronLeft,
   Building2,
   GraduationCap,
   Layers,
   Clock,
   Share2,
   Heart,
   Bookmark,
   HelpCircle,
   Flag,
   Timer,
   Zap,
   ShieldCheck,
   Briefcase,
   MapPin
} from "lucide-react";
import { ReportModal } from "@/components/report-modal";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const DETAIL_COLUMNS =
  "id,author_name,college,company_name,company_location,role_name,opportunity_type,recruitment_route,compensation,branch,hiring_year,selection_status,difficulty_score,difficulty_label,rounds_count,total_rounds,topics,sources,overview,rounds_summary,rounds_detail,prep_tips,likes_count,created_at" as const;

export default function ExperienceDetailClient() {
   const params = useParams<{ id: string }>();
   const router = useRouter();
   const { liked, saved, toggleLike, toggleSave, user, isReady, requireLogin } = useAuth();
   const supabase = useMemo(() => createClient(), []);
   const [item, setItem] = useState<Experience | null>(null);
   const [copied, setCopied] = useState(false);
   const [isReporting, setIsReporting] = useState(false);
   const [loading, setLoading] = useState(true);
   const [flash, setFlash] = useState("");
   const [likesCount, setLikesCount] = useState(0);

   useEffect(() => {
      // Allow public viewing of individual experience pages.
      // Interactions are protected by requireLogin() inside click handlers.
   }, []);

   useEffect(() => {
     if (!isReady) return;
     const fetchItem = async () => {
        const { data } = await supabase.from("experiences").select(DETAIL_COLUMNS).eq("id", params.id).single();
        if (data) {
          const typed = data as Experience;
          setItem(typed);
          setLikesCount(typed.likes_count ?? 0);
        }
        setLoading(false);
      };
     fetchItem();
   }, [params.id, supabase, isReady, user]);

   if (!isReady) return null;

   const handleShare = async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setFlash("Could not copy link");
        setTimeout(() => setFlash(""), 2000);
      }
   };

   const submitReport = async (experienceId: string, reason: string) => {
      try {
         const response = await fetch("/api/reports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ experienceId, message: reason }),
         });
         const data = (await response.json()) as { ok?: boolean; message?: string };
         if (!response.ok || !data.ok) {
            setFlash(data.message || "Could not submit report");
            return;
         }
         setFlash("Report submitted");
      } catch {
         setFlash("Could not submit report");
      }
      setTimeout(() => setFlash(""), 2000);
   };

   if (!item && !loading) {
      return (
         <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col items-center justify-center px-4 py-20">
            <HelpCircle className="h-10 w-10 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Case Study Not Found.</h2>
            <Link href="/feed" className="soft-pill mt-8 text-slate-900 rounded-full px-10 py-3.5 text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl">Return to Feed</Link>
         </main>
      );
   }

   const isLiked = item ? liked.includes(item.id) : false;
   const isSaved = item ? saved.includes(item.id) : false;

   return (
      <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-12 animate-in fade-in duration-700 md:px-5 md:pt-16 lg:px-6 lg:pt-15 lg:pb-24">
         {loading || !item ? (
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
               <div className="lg:col-span-4 space-y-8">
                  <div className="h-[400px] w-full bg-zinc-50 rounded-[40px] border border-black/5 animate-pulse" />
               </div>
               <div className="lg:col-span-8 space-y-10">
                  <div className="h-20 w-3/4 bg-zinc-50 rounded-2xl animate-pulse" />
                  <div className="h-[600px] w-full bg-zinc-50 rounded-[40px] animate-pulse" />
               </div>
            </div>
         ) : (
            <div className="flex flex-col gap-12">
               {/* Fixed Header Bar for Desktop / Static Top Bar */}
               <div className="frost-strong flex flex-col items-center justify-between gap-4 rounded-[32px] p-5 md:flex-row md:gap-8 md:p-8">
                  <div className="flex flex-col items-center md:items-start gap-3">
                     <button
                        onClick={() => router.back()}
                        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all"
                     >
                        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Feed
                     </button>
                     <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                           <h1 className="text-3xl font-semibold leading-none tracking-tighter text-slate-900 uppercase md:text-5xl">{item.company_name}</h1>
                           <span className={cn(
                              "px-4 py-1.5 rounded-full border-2 text-[9px] font-black uppercase tracking-widest",
                              item.selection_status === 'Selected' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-50' : 'text-rose-500 border-rose-500/20 bg-rose-50'
                           )}>
                              {item.selection_status}
                           </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 md:justify-start md:gap-x-6 md:tracking-[0.2em]">
                           <div className="flex items-center gap-2 transition-colors hover:text-slate-900"><MapPin className="h-3.5 w-3.5 text-slate-900" /> {item.company_location || "Off-Campus"}</div>
                           <div className="flex items-center gap-2 transition-colors hover:text-slate-900"><Briefcase className="h-3.5 w-3.5 text-slate-900" /> {item.role_name}</div>
                           <div className="flex items-center gap-2 transition-colors hover:text-slate-900"><Building2 className="h-3.5 w-3.5 text-slate-900" /> {item.opportunity_type}</div>
                           <div className="flex items-center gap-2 transition-colors hover:text-slate-900"><ShieldCheck className="h-3.5 w-3.5 text-slate-900" /> {item.recruitment_route || "On-Campus"}</div>
                           {item.compensation && (
                              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-500/10"><Zap className="h-3.5 w-3.5" /> {item.compensation}</div>
                           )}
                           {item.sources && item.sources.length > 0 && (
                              <div className="flex items-center gap-2 text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-black/5"><HelpCircle className="h-3.5 w-3.5" /> Source: {item.sources.join(", ")}</div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="flex w-full flex-wrap items-center justify-center gap-2 md:w-auto md:gap-3">
                     <button
                        onClick={async () => {
                          if (!requireLogin()) return;
                          const currentlyLiked = isLiked;
                          setLikesCount((prev) => Math.max(0, prev + (currentlyLiked ? -1 : 1)));
                          try {
                            await toggleLike(item.id);
                          } catch {
                            setLikesCount((prev) => Math.max(0, prev + (currentlyLiked ? 1 : -1)));
                            setFlash("Could not update like");
                            setTimeout(() => setFlash(""), 2000);
                          }
                        }}
                        className={cn(
                           "flex h-12 items-center gap-3 rounded-full border px-4 transition-all active:scale-95 shadow-sm md:px-6",
                           isLiked ? "bg-rose-50 text-rose-500 border-rose-500/20" : "bg-white/80 text-slate-900 border-slate-200 hover:border-slate-500"
                        )}
                     >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-rose-500")} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                           {likesCount} Likes
                        </span>
                     </button>
                     <button
                        onClick={() => {
                          if (!requireLogin()) return;
                          void toggleSave(item.id).catch(() => {
                            setFlash("Could not update save");
                            setTimeout(() => setFlash(""), 2000);
                          });
                        }}
                        className={cn(
                           "flex h-12 w-12 items-center justify-center rounded-full border transition-all active:scale-95 shadow-sm",
                           isSaved ? "bg-slate-900 text-white border-slate-900" : "bg-white/80 text-slate-900 border-slate-200 hover:border-slate-500"
                        )}
                     >
                        <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                     </button>
                     <button
                        onClick={handleShare}
                        className="soft-button flex h-12 items-center gap-3 rounded-full px-5 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-xl md:px-8"
                     >
                        <Share2 className="h-4 w-4" />
                        {copied ? "Copied" : "Share"}
                     </button>
                     <button
                        onClick={() => { if (requireLogin()) setIsReporting(true); }}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-all active:scale-95"
                     >
                        <Flag className="h-4 w-4" />
                     </button>
                  </div>
               </div>

               {/* Split Case Study Content */}
               <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
                  {/* Left Column: Institutional Metrics */}
                  <div className="lg:col-span-4 space-y-8">
                     <div className="space-y-6 lg:sticky lg:top-28 lg:space-y-8">
                        {/* Summary Metrics */}
                        <div className="space-y-6 rounded-[40px] border-2 border-black bg-white p-5 shadow-2xl md:space-y-8 md:p-8">
                           <div className="space-y-6">
                              <div className="space-y-1.5 text-center md:text-left">
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Candidate Profile</p>
                                 <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                                    <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center font-black text-2xl tracking-tighter shadow-lg">
                                       {item.author_name?.[0] || 'S'}
                                    </div>
                                     <div className="space-y-0.5 text-left">
                                        <h3 className="text-lg font-black text-black tracking-tight">{item.author_name || "Anonymous"}</h3>
                                     </div>
                                  </div>
                               </div>

                              <div className="space-y-4 pt-6 border-t border-zinc-100">
                                 <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-2 text-muted-foreground"><GraduationCap className="h-4 w-4 text-black" /> College</span>
                                    <span className="text-black text-right">{item.college || "Nexus"}</span>
                                 </div>
                                 <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-2 text-muted-foreground"><Layers className="h-4 w-4 text-black" /> Branch</span>
                                    <span className="text-black text-right">{item.branch}</span>
                                 </div>
                                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-2 text-muted-foreground"><Timer className="h-4 w-4 text-black" /> Hiring Year</span>
                                    <span className="text-black text-right">{item.hiring_year}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest pt-2 border-t border-zinc-100/50">
                                    <span className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4 text-black" /> Process Progress</span>
                                    <span className="text-black text-right">{item.rounds_count} / {item.total_rounds || item.rounds_count} Rounds</span>
                                  </div>
                                </div>
                           </div>

                           <div className="space-y-4 rounded-[32px] border border-zinc-100 bg-zinc-50 p-5 md:p-6">
                              <div className="flex items-center gap-3">
                                 <Timer className="h-5 w-5 text-black" />
                                 <h3 className="text-[10px] font-black uppercase tracking-widest text-black">Strategic Advice</h3>
                              </div>
                              <p className="text-sm italic font-medium leading-relaxed text-muted-foreground opacity-80">
                                 &ldquo;{item.prep_tips}&rdquo;
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Intelligence Narrative */}
                  <div className="space-y-10 lg:col-span-8 lg:space-y-12">
                     <section className="space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 rounded-2xl bg-black/5 flex items-center justify-center text-black">
                              <Building2 className="h-5 w-5" />
                           </div>
                           <h2 className="text-2xl font-black uppercase tracking-widest text-black">Overview</h2>
                        </div>
                        <p className="text-base font-medium leading-[1.8] tracking-tight whitespace-pre-line text-zinc-600 md:text-lg">
                           {item.overview || item.rounds_summary}
                        </p>
                     </section>

                     <section className="space-y-8">
                        <div className="flex items-center gap-4">
                           <h2 className="text-xl font-black uppercase tracking-widest text-black md:text-2xl">Interview Rounds</h2>
                           <div className="flex-1 h-[1px] bg-black/5" />
                        </div>

                        <div className="relative space-y-10 md:space-y-16">
                           {item.rounds_detail?.map((round, idx) => (
                              <div key={idx} className="relative group">
                                 {/* Animated Timeline Element */}
                                 <div className="absolute -left-6 top-0 bottom-0 w-0.5 bg-zinc-100 group-hover:bg-black transition-colors" />
                                 <div className="absolute -left-[30px] top-1 h-3 w-3 rounded-full border-2 border-white bg-zinc-100 group-hover:bg-black transition-all group-hover:scale-125 shadow-sm" />

                                 <div className="space-y-6 pl-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                       <div className="space-y-1">
                                          <h3 className="text-2xl font-black tracking-tighter text-black uppercase md:text-3xl">{round.title}</h3>
                                       </div>
                                       <div className="flex items-center gap-2 rounded-full bg-zinc-50 border border-zinc-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                                          <Clock className="h-4 w-4 text-black" />
                                          {round.duration}
                                       </div>
                                    </div>

                                    <div className="rounded-[32px] border border-zinc-100 bg-white p-5 shadow-sm transition-all duration-500 group-hover:border-black group-hover:shadow-2xl md:p-8">
                                       <p className="mb-6 text-sm font-medium leading-relaxed text-zinc-600 md:mb-8 md:text-base">
                                          {round.summary}
                                       </p>

                                       {round.questions?.length > 0 && (
                                          <div className="space-y-4">
                                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b border-zinc-100 pb-2">Questions Asked</p>
                                             <div className="grid gap-3">
                                                {round.questions.map((q, qidx) => (
                                                   <div key={qidx} className="group/q flex gap-3 rounded-2xl border border-transparent bg-zinc-50 p-3 transition-all hover:border-black hover:bg-black hover:text-white md:gap-4 md:p-5">
                                                      <span className="text-[10px] font-black opacity-30">0{qidx + 1}</span>
                                                      <p className="text-sm font-bold tracking-tight">{q}</p>
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </section>

                     <section className="space-y-6">
                        <h2 className="text-base font-black uppercase tracking-[0.3em] text-zinc-400">Topics</h2>
                        <div className="flex flex-wrap gap-3">
                           {item.topics?.map(t => (
                              <span key={t} className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black transition-all hover:border-black hover:shadow-xl md:px-6 md:py-3">
                                 {t}
                              </span>
                           ))}
                        </div>
                     </section>
                  </div>
               </div>
            </div>
         )}

         {item && (
            <ReportModal
               isOpen={isReporting}
               onClose={() => setIsReporting(false)}
               onConfirm={(msg) => {
                  void submitReport(item.id, msg);
               }}
            />
         )}
         {flash ? <p className="fixed bottom-6 right-6 rounded-full bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">{flash}</p> : null}
      </main>
   );
}
