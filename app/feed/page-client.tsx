"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { BRANCH_OPTIONS, type Experience } from "@/lib/types";
import {
   Search,
   Heart,
   Bookmark,
   Share2,
   Zap,
   Clock,
   Building2,
   MapPin,
   User,
   GraduationCap,
   Briefcase,
   Layers,
   Flag
} from "lucide-react";
import { ReportModal } from "@/components/report-modal";

import { getRelativeTime, cn } from "@/lib/utils";

function ArrowUpRight(props: React.SVGProps<SVGSVGElement>) {
   return (
      <svg
         {...props}
         xmlns="http://www.w3.org/2000/svg"
         width="24"
         height="24"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         strokeWidth="2"
         strokeLinecap="round"
         strokeLinejoin="round"
      >
         <path d="M7 7h10v10" />
         <path d="M7 17 17 7" />
      </svg>
   );
}

import { ExperienceSkeleton } from "@/components/skeleton";
import { createClient } from "@/lib/supabase/client";

const FEED_COLUMNS =
   "id,author_name,college,company_name,company_location,role_name,opportunity_type,recruitment_route,compensation,branch,hiring_year,selection_status,difficulty_score,difficulty_label,rounds_count,total_rounds,topics,sources,overview,rounds_summary,likes_count,created_at" as const;

export function FeedClient() {
   const { liked, saved, toggleLike, toggleSave, isReady, requireLogin } = useAuth();
   const supabase = useMemo(() => createClient(), []);
   const [all, setAll] = useState<Experience[]>([]);
   const [page, setPage] = useState(0);
   const [hasMore, setHasMore] = useState(true);
   const [q, setQ] = useState("");
   // Debounced query — only fires the actual fetch after 300 ms of no typing
   const [debouncedQ, setDebouncedQ] = useState("");
   const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
   const [branch, setBranch] = useState("");
   const [result, setResult] = useState("");
   const [sort, setSort] = useState<"newest" | "popular">("newest");
   const [reportId, setReportId] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);
   const [loadingMore, setLoadingMore] = useState(false);
   const [loadError, setLoadError] = useState("");
   const [flash, setFlash] = useState("");
   const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

   const PAGE_SIZE = 12;

   // Debounce search input — clear previous timer on each keystroke
   const handleSearchChange = (value: string) => {
      setQ(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setDebouncedQ(value), 300);
   };

   // Cleanup debounce timer on unmount
   useEffect(() => {
      return () => {
         if (debounceRef.current) clearTimeout(debounceRef.current);
         if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      };
   }, []);

   const showFlash = (msg: string, durationMs = 1800) => {
      setFlash(msg);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlash(""), durationMs);
   };

   const fetchItems = useCallback(async (p: number, filters: { q: string; branch: string; result: string }) => {
      let query = supabase.from("experiences").select(FEED_COLUMNS);

      if (filters.q) {
         // Use separate chained filters instead of .or() string interpolation
         // to prevent PostgREST filter injection via special characters
         const sanitized = filters.q.replace(/[%_\\\/]/g, "\\$&");
         query = query.or(
            `company_name.ilike.%${sanitized}%,role_name.ilike.%${sanitized}%,college.ilike.%${sanitized}%`
         );
      }
      if (filters.branch) {
         query = query.eq("branch", filters.branch);
      }
      if (filters.result) {
         query = query.eq("selection_status", filters.result);
      }

      const from = p * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const orderCol = "created_at";
      const { data, error } = await query.order(orderCol, { ascending: false }).range(from, to);

      if (error) throw error;
      return (data as Experience[]) || [];
   }, [supabase]);

   useEffect(() => {
      if (!isReady) return;
      const initFetch = async () => {
         setLoading(true);
         setLoadError("");
         setPage(0);
         try {
            const items = await fetchItems(0, { q: debouncedQ, branch, result });
            setAll(items);
            setHasMore(items.length === PAGE_SIZE);
         } catch (err) {
            setLoadError(err instanceof Error ? err.message : "Failed to load");
         } finally {
            setLoading(false);
         }
      };
      initFetch();
   }, [debouncedQ, branch, result, isReady, fetchItems]);

   const loadMore = async () => {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
      const nextPage = page + 1;
      try {
         const items = await fetchItems(nextPage, { q: debouncedQ, branch, result });
         setAll((prev) => [...prev, ...items]);
         setPage(nextPage);
         setHasMore(items.length === PAGE_SIZE);
      } catch {
         showFlash("Failed to load more");
      } finally {
         setLoadingMore(false);
      }
   };

   const list = useMemo(() => {
      const items = [...all];
      if (sort === "popular") {
         items.sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
      }
      return items;
   }, [all, sort]);

   const copyExperienceLink = async (id: string) => {
      const url = `${window.location.origin}/feed/${id}`;
      try {
         await navigator.clipboard.writeText(url);
         showFlash("Link copied");
      } catch {
         showFlash("Could not copy link");
      }
   };

   const handleToggleLike = async (id: string) => {
      if (!requireLogin()) return;
      const isLiked = liked.includes(id);
      setAll(prev =>
         prev.map(exp =>
            exp.id === id
               ? { ...exp, likes_count: Math.max(0, (exp.likes_count ?? 0) + (isLiked ? -1 : 1)) }
               : exp
         )
      );
      try {
         await toggleLike(id);
      } catch (err) {
         setAll(prev =>
            prev.map(exp =>
               exp.id === id
                  ? { ...exp, likes_count: Math.max(0, (exp.likes_count ?? 0) + (isLiked ? 1 : -1)) }
                  : exp
            )
         );
         showFlash(err instanceof Error ? err.message : "Could not update like");
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
            showFlash(data.message || "Could not submit report");
            return;
         }
         showFlash("Report submitted");
      } catch {
         showFlash("Could not submit report");
      }
   };

   if (!isReady) return null;

   return (
      <main className="mx-auto w-full max-w-4xl px-4 pt-8 pb-10 md:pt-12 md:pb-16 transition-all">
         <div className="frost-strong mb-5 rounded-[34px] p-6 text-left">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">Experiences</h1>
            <p className="mt-2 text-base text-slate-500 font-normal">Directly shared by the students who took the interviews</p>

            <div className="mt-6 grid gap-3 md:flex md:items-center md:gap-3 md:flex-nowrap">
               <div className="relative w-full md:flex-[3] md:min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                     value={q}
                     onChange={e => handleSearchChange(e.target.value)}
                     placeholder="Search company, role, or college"
                     className="soft-input w-full rounded-full pl-10 pr-4 py-3 text-xs font-normal transition-all h-[44px]"
                  />
               </div>
               <select
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="soft-pill h-[44px] w-full rounded-full px-3 py-2 text-[9px] font-bold uppercase tracking-wider outline-none md:w-auto md:flex-[0.8] md:min-w-[100px] cursor-pointer"
               >
                  <option value="">Branch</option>
                  {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
               <select
                  value={result}
                  onChange={e => setResult(e.target.value)}
                  className="soft-pill h-[44px] w-full rounded-full px-3 py-2 text-[9px] font-bold uppercase tracking-wider outline-none md:w-auto md:flex-[0.6] md:min-w-[85px] cursor-pointer"
               >
                  <option value="">Result</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Waitlisted">Waitlisted</option>
               </select>
               <div className="soft-pill flex h-[44px] w-full items-center gap-1 rounded-full p-1 md:w-auto md:flex-[1.1] md:min-w-[150px]">
                  <button
                     onClick={() => setSort("newest")}
                     className={cn("flex-1 px-2.5 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-widest transition-all", sort === 'newest' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900')}
                  >
                     Newest
                  </button>
                  <button
                     onClick={() => setSort("popular")}
                     className={cn("flex-1 px-2.5 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-widest transition-all", sort === 'popular' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900')}
                  >
                     Popular
                  </button>
               </div>
            </div>
         </div>

         <div className="grid gap-4">
            {loading ? (
               <>
                  <ExperienceSkeleton />
                  <ExperienceSkeleton />
                  <ExperienceSkeleton />
               </>
            ) : loadError ? (
               <div className="frost flex flex-col items-center justify-center rounded-[48px] border border-rose-200 bg-rose-50/50 p-10 text-center sm:p-20">
                  <p className="text-xl font-bold tracking-tight text-rose-700">Could not load feed</p>
                  <p className="text-sm font-medium mt-2 text-rose-600">{loadError}</p>
                  <button
                     onClick={() => window.location.reload()}
                     className="soft-button mt-6 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90"
                  >
                     Retry
                  </button>
               </div>
            ) : list.length === 0 ? (
               <div className="frost flex flex-col items-center justify-center rounded-[48px] border border-dashed border-slate-200 p-10 text-center sm:p-20">
                  <p className="text-xl font-bold tracking-tight">No posts yet.</p>
                  <p className="text-sm font-medium mt-2">Be the first to share an interview experience.</p>
                  <Link
                     href="/share"
                     className="soft-button mt-6 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90"
                  >
                     Share Experience
                  </Link>
               </div>
            ) : (
               <>
                  {list.map((item) => (
                     <Link
                        key={item.id}
                        href={`/feed/${item.id}`}
                        className="frost elevate group block border p-4 sm:p-5 rounded-[28px] transition-all duration-300 active:scale-[0.99] hover:bg-white/70 text-left"
                     >
                        {/* Header: Author Info */}
                        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-slate-200/50 pb-3 text-[8.5px] font-black uppercase tracking-widest text-slate-500">
                           <User className="h-2.5 w-2.5 text-slate-900" />
                           <span>{item.author_name || "Student"}</span>
                           <span className="opacity-40">&middot;</span>
                           <GraduationCap className="h-2.5 w-2.5 text-slate-900" />
                           <span>{item.college}</span>
                           <span className="opacity-40">&middot;</span>
                           <span>{item.branch}</span>
                        </div>

                        {/* Row: Company & Outcome */}
                        <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-4">
                           <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                 <Building2 className="h-4 w-4 text-slate-900 shrink-0" />
                                 <h3 className="text-lg font-bold text-slate-900 tracking-tight sm:text-x1 md:text-2xl leading-none">{item.company_name}</h3>
                                 <div className="ml-0 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 sm:ml-2">
                                    <MapPin className="h-3 w-3" /> {item.company_location}
                                 </div>
                              </div>
                           </div>
                           <div className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0",
                              item.selection_status === 'Selected' ? 'text-emerald-500 border-emerald-500/10 bg-emerald-50/10' : item.selection_status === 'Waitlisted' ? 'text-amber-500 border-amber-500/10 bg-amber-50/10' : 'text-rose-500 border-rose-500/10 bg-rose-50/10'
                           )}>
                              {item.selection_status}
                           </div>
                        </div>

                        {/* Details: Role / Type / Comp */}
                        <div className="flex flex-wrap items-center gap-4 mb-3.5">
                           <div className="flex items-center gap-2">
                              <Briefcase className="h-3.5 w-3.5 text-slate-900" />
                              <span className="text-xs font-semibold">{item.role_name}</span>
                           </div>
                           <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-normal uppercase tracking-widest font-black">
                              <Layers className="h-3.5 w-3.5" />
                              {item.opportunity_type}
                              <span className="opacity-40">&middot;</span>
                              {item.recruitment_route}
                           </div>
                           {item.compensation && (
                              <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600">
                                 <Zap className="h-3.5 w-3.5" />
                                 {item.compensation}
                              </div>
                           )}
                        </div>

                        {/* Metrics */}
                        <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                           <div className="max-w-full flex-1 rounded-2xl border border-slate-200 bg-white/65 p-2 px-3.5 sm:max-w-[140px]">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Process</p>
                              <p className="text-[11px] font-bold text-slate-900">{item.rounds_count} / {item.total_rounds} Rounds</p>
                           </div>
                           <div className="max-w-full flex-1 rounded-2xl border border-slate-200 bg-white/65 p-2 px-3.5">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Topics</p>
                              <div className="flex flex-wrap gap-1">
                                 {item.topics?.map(t => (
                                    <span key={t} className="px-1.5 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider">
                                       {t}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Narrative Snippet */}
                        <div className="mb-2 space-y-1.5 border-t border-slate-100 pt-3">
                           <p className="text-xs font-normal text-slate-500 leading-relaxed line-clamp-1 italic opacity-80">
                              &ldquo;{item.overview || item.rounds_summary}&rdquo;
                           </p>
                           <div className="flex justify-end items-center gap-1 text-[9px] font-black uppercase tracking-widest text-accent hover:underline">
                              Read Full Story <ArrowUpRight className="h-2.5 w-2.5" />
                           </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-1 flex flex-col items-start justify-between gap-4 border-t border-slate-200/50 pt-4 sm:flex-row sm:items-center">
                           <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                              <button
                                 onClick={(e) => { e.preventDefault(); void handleToggleLike(item.id); }}
                                 className={cn(
                                    "flex h-10 px-4 items-center gap-2.5 rounded-full border transition-all active:scale-95 shadow-sm",
                                    liked.includes(item.id) ? "bg-rose-50 text-rose-500 border-rose-500/20" : "bg-white/80 text-slate-900 border-slate-200 hover:border-slate-400"
                                 )}
                              >
                                 <Heart className={cn("h-3.5 w-3.5", liked.includes(item.id) && "fill-rose-500")} />
                                 <span className="text-[9px] font-black uppercase tracking-widest">
                                    {item.likes_count ?? 0}
                                 </span>
                              </button>
                              <button
                                 onClick={(e) => {
                                    e.preventDefault();
                                    if (!requireLogin()) return;
                                    void toggleSave(item.id).catch(() => showFlash("Could not update save"));
                                 }}
                                 className={cn("flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest transition-colors hover:text-accent", saved.includes(item.id) ? "text-accent" : "text-slate-500")}
                              >
                                 <Bookmark className={cn("h-3.5 w-3.5", saved.includes(item.id) && "fill-current")} />
                                 {saved.includes(item.id) ? "Saved" : "Save"}
                              </button>
                              <button onClick={(e) => { e.preventDefault(); copyExperienceLink(item.id); }} className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">
                                 <Share2 className="h-3.5 w-3.5" />
                                 Share
                              </button>
                              <button
                                 onClick={(e) => { e.preventDefault(); if (requireLogin()) setReportId(item.id); }}
                                 className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest text-slate-500 hover:text-amber-600 transition-colors"
                              >
                                 <Flag className="h-3.5 w-3.5" />
                                 Report
                              </button>
                           </div>
                           <div className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest text-slate-400 sm:self-auto">
                              <Clock className="h-3 w-3" />
                              {getRelativeTime(item.created_at)}
                           </div>
                        </div>
                     </Link>
                  ))}

                  {hasMore && !loading && (
                     <div className="mt-8 flex justify-center pb-12">
                        <button
                           onClick={loadMore}
                           disabled={loadingMore}
                           className="soft-pill group relative flex h-[50px] items-center gap-3 rounded-full border-2 border-slate-900/5 px-10 text-[10px] font-black uppercase tracking-[0.18em] text-slate-900 transition-all hover:bg-slate-900 hover:text-white disabled:opacity-50 sm:h-[54px] sm:px-14 sm:tracking-[0.25em]"
                        >
                           {loadingMore ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-slate-900" />
                           ) : (
                              "Load More"
                           )}
                        </button>
                     </div>
                  )}
               </>
            )}
         </div>
         <ReportModal
            isOpen={!!reportId}
            onClose={() => setReportId(null)}
            onConfirm={(msg) => {
               if (!reportId) return;
               void submitReport(reportId, msg);
            }}
         />
         {flash ? <p className="fixed bottom-6 right-6 rounded-full bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">{flash}</p> : null}
      </main>
   );
}
