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
   MapPin,
   Globe,
   Wallet
} from "lucide-react";
import { ReportModal } from "@/components/report-modal";
import { Toast, type ToastType } from "@/components/toast";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const DETAIL_COLUMNS =
   "id,author_name,college,company_name,company_location,role_name,opportunity_type,recruitment_route,compensation,branch,hiring_year,month_label,selection_status,difficulty_score,difficulty_label,rounds_count,total_rounds,topics,sources,overview,rounds_summary,rounds_detail,prep_tips,likes_count,created_at,anonymous,linkedin_url" as const;

export default function ExperienceDetailClient() {
   const params = useParams<{ id: string }>();
   const router = useRouter();
   const { liked, saved, toggleLike, toggleSave, user, isReady, requireLogin } = useAuth();
   const supabase = useMemo(() => createClient(), []);
   const [item, setItem] = useState<Experience | null>(null);
   const [copied, setCopied] = useState(false);
   const [isReporting, setIsReporting] = useState(false);
   const [loading, setLoading] = useState(true);
   const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
      message: "",
      type: "success",
      visible: false,
   });
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

   const showFlash = (msg: string, type: ToastType = "success", durationMs = 3000) => {
      setToast({ message: msg, type, visible: true });
      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), durationMs);
   };

   const handleShare = async () => {
      try {
         await navigator.clipboard.writeText(window.location.href);
         setCopied(true);
         showFlash("Link copied to clipboard", "success");
         setTimeout(() => setCopied(false), 2000);
      } catch {
         showFlash("Could not copy link", "error");
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
            showFlash(data.message || "Could not submit report", "error");
            return;
         }
         showFlash("Report submitted successfully", "success");
      } catch {
         showFlash("Could not submit report", "error");
      }
   };

   if (!item && !loading) {
      return (
         <main className="mx-auto flex min-h-[60vh] w-full max-w-5xl flex-col items-center justify-center px-4 py-20">
            <HelpCircle className="h-10 w-10 text-muted-foreground mb-6" />
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Post Not Found.</h2>
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
            <div className="flex flex-col gap-8">
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
                              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-500/10"><Wallet className="h-3.5 w-3.5" /> {item.compensation}</div>
                           )}
                           {item.sources && item.sources.length > 0 && (
                              <div className="flex items-center gap-2 text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-black/5">
                                 <Globe className="h-3.5 w-3.5" /> Source: {item.anonymous ? item.sources.filter(s => !s.toLowerCase().includes('linkedin.com/in/')).join(", ") : item.sources.join(", ")}
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="flex w-full flex-wrap items-center justify-center gap-2 md:w-auto md:flex-nowrap md:gap-3">
                     <button
                        onClick={async () => {
                           if (!requireLogin()) return;
                           const currentlyLiked = isLiked;
                           setLikesCount((prev) => Math.max(0, prev + (currentlyLiked ? -1 : 1)));
                           try {
                              await toggleLike(item.id);
                           } catch {
                              setLikesCount((prev) => Math.max(0, prev + (currentlyLiked ? 1 : -1)));
                              showFlash("Could not update like", "error");
                           }
                        }}
                        className={cn(
                           "flex h-12 items-center gap-3 rounded-full border px-4 transition-all active:scale-95 shadow-sm md:px-6",
                           isLiked ? "bg-rose-50 text-rose-500 border-rose-500/20" : "bg-white/80 text-slate-900 border-slate-200 hover:border-slate-500"
                        )}
                     >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-rose-500")} />
                        <span className="text-[10px] font-black uppercase whitespace-nowrap tracking-wider">
                           {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                        </span>
                     </button>
                     <button
                        onClick={() => {
                           if (!requireLogin()) return;
                           void toggleSave(item.id).catch(() => {
                              showFlash("Could not update save", "error");
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
                        <div className="space-y-4 rounded-[40px] border-2 border-black bg-white p-5 shadow-2xl md:space-y-6 md:p-8">
                           <div className="space-y-4">
                              <div className="space-y-1.5 text-center md:text-left">
                                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Profile</p>
                                 <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                                    <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center font-black text-2xl tracking-tighter shadow-lg">
                                       {item.anonymous ? "?" : (item.author_name?.[0] || 'S')}
                                    </div>
                                    <div className="space-y-0.5 text-left">
                                       <h3 className="text-lg font-black text-black tracking-tight">{item.anonymous ? "Anonymous Student" : (item.author_name || "Student")}</h3>
                                       {item.linkedin_url && !item.anonymous && (
                                          <a
                                             href={item.linkedin_url}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
                                          >
                                             View LinkedIn Profile
                                          </a>
                                       )}
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-4 pt-4 border-t border-zinc-100">
                                 <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-2 text-muted-foreground"><Layers className="h-4 w-4 text-black" /> Branch</span>
                                    <span className="text-black text-right">{item.branch}</span>
                                 </div>
                                 <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-2 text-muted-foreground"><Timer className="h-4 w-4 text-black" /> Hiring Period</span>
                                    <span className="text-black text-right">{item.month_label || item.hiring_year}</span>
                                 </div>
                                 <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-2 text-muted-foreground"><ShieldCheck className="h-4 w-4 text-black" /> Qualified</span>
                                    <span className="text-black text-right">{item.rounds_count} / {item.total_rounds || item.rounds_count} Rounds</span>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-4 rounded-[32px] border border-zinc-100 bg-zinc-50 p-5 md:p-6 border-t border-zinc-100/50">
                              <div className="flex items-center gap-3">
                                 <Timer className="h-5 w-5 text-black" />
                                 <h3 className="text-[10px] font-black uppercase tracking-widest text-black">TIPS</h3>
                              </div>
                              <p className="text-sm italic font-medium leading-relaxed text-muted-foreground opacity-80">
                                 &ldquo;{item.prep_tips}&rdquo;
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Intelligence Narrative */}
                  <div className="space-y-3 lg:col-span-8">
                     {/* 1. Overview Box */}
                     <section className="frost-strong overflow-hidden rounded-[24px] border border-black/5 bg-white/95 p-3.5 shadow-sm transition-all duration-300 hover:border-black/20 hover:shadow-lg md:p-5">
                        <div className="flex items-center gap-3 mb-2.5">
                           <div className="h-9 w-9 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-900 shrink-0">
                              <Building2 className="h-5 w-5" />
                           </div>
                           <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 md:text-2xl">Overview</h2>
                        </div>
                        <p className="text-base font-semibold leading-relaxed tracking-tight whitespace-pre-line text-slate-600 md:text-lg pl-1">
                           {item.overview || item.rounds_summary}
                        </p>
                     </section>

                     {/* 2. Topics Covered Box */}
                     <section className="frost-strong overflow-hidden rounded-[24px] border border-black/5 bg-white/95 p-3.5 shadow-sm transition-all duration-300 hover:border-black/20 hover:shadow-lg md:p-5">
                        <div className="flex items-center gap-3 mb-3">
                           <div className="h-9 w-9 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-900 shrink-0">
                              <Layers className="h-5 w-5" />
                           </div>
                           <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 md:text-2xl">Topics Covered</h2>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-1">
                           {item.topics?.map(t => (
                              <span key={t} className="rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-900 transition-all hover:border-slate-900 hover:bg-slate-900 hover:text-white cursor-default">
                                 {t}
                              </span>
                           ))}
                        </div>
                     </section>

                     {/* 3. Interview Rounds Box */}
                     <section className="frost-strong overflow-hidden rounded-[24px] border border-black/5 bg-white/95 p-3.5 shadow-sm transition-all duration-300 hover:border-black/20 hover:shadow-lg md:p-5">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="h-9 w-9 rounded-xl bg-slate-900/5 flex items-center justify-center text-slate-900 shrink-0">
                              <Zap className="h-5 w-5" />
                           </div>
                           <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 md:text-2xl">Interview Rounds</h2>
                        </div>

                        <div className="relative space-y-4">
                           {item.rounds_detail?.map((round, idx) => (
                              <div key={idx} className="relative group/round">
                                 {/* Perfectly Centered Timeline Path */}
                                 <div className="absolute left-0 top-0 bottom-0 flex w-[1px] justify-center ml-[5px]">
                                    <div className="w-full bg-slate-100 group-hover/round:bg-black/20 transition-all" />
                                 </div>
                                 
                                 <div className="relative pl-8 pb-3">
                                    {/* Precisely Aligned Timeline Node */}
                                    <div className="absolute left-0 top-1.5 h-2.5 w-2.5 translate-x-0 rounded-full border-2 border-white bg-slate-300 group-hover/round:bg-black group-hover/round:scale-125 transition-all shadow-sm z-10" />

                                    <div className="space-y-2.5">
                                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                          <div className="flex items-center gap-3">
                                             <span className="text-[10px] font-black opacity-20 group-hover/round:opacity-100 transition-opacity">R{idx + 1}</span>
                                             <h3 className="text-xl font-black tracking-tighter text-slate-900 uppercase leading-none">{round.title}</h3>
                                          </div>
                                          <div className="flex w-fit items-center gap-1.5 rounded-full bg-slate-900/5 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-slate-500">
                                             <Clock className="h-3 w-3" />
                                             {round.duration}
                                          </div>
                                       </div>

                                       <div className="rounded-[24px] border border-slate-100 bg-slate-50/20 p-4 transition-all duration-500 group-hover/round:border-black/10 group-hover/round:bg-white group-hover/round:shadow-sm">
                                          <p className="text-base font-medium leading-relaxed text-slate-600 lg:text-lg">
                                             {round.summary}
                                          </p>

                                          {round.questions?.length > 0 && (
                                             <div className="mt-5 space-y-3">
                                                <div className="flex items-center gap-3">
                                                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Questions Asked</p>
                                                   <div className="flex-1 h-[1px] bg-slate-100" />
                                                </div>
                                                <div className="grid gap-2">
                                                   {round.questions.map((q, qidx) => (
                                                      <div key={qidx} className="group/q flex gap-4 rounded-xl border border-transparent bg-white/60 p-3 transition-all hover:border-black/5 hover:bg-slate-50">
                                                         <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-black/5 text-[9px] font-black group-hover/q:bg-black group-hover/q:text-white transition-all">
                                                            {qidx + 1}
                                                         </div>
                                                         <p className="text-sm font-bold tracking-tight leading-snug text-slate-800 lg:text-base">{q}</p>
                                                      </div>
                                                   ))}
                                                </div>
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              </div>
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
         <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.visible}
            onClose={() => setToast(prev => ({ ...prev, visible: false }))}
         />
      </main>
   );
}
