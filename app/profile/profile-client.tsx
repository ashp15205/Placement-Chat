"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { BRANCH_OPTIONS, type Experience, type Profile, type CommunityPost } from "@/lib/types";
import {
  User,
  Trash2,
  Edit3,
  ArrowUpRight,
  Building2,
  GraduationCap,
  Layers,
  Calendar,
  Heart,
  Bookmark,
  CheckCircle2,
  Clock,
  Wallet,
  Globe,
  ShieldCheck,
  Flag,
  Share2,
  MapPin,
  Briefcase,
  Sparkles,
  Ghost,
  MessageCircle
} from "lucide-react";
import { ExperienceSkeleton } from "@/components/skeleton";

const isValidLinkedInUrl = (url: string) => {
  if (!url) return true;
  const regex = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?.*$/;
  return regex.test(url);
};

import { LinkedInIcon } from "@/components/icons";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { useCommunityData } from "@/lib/use-community-data";
import { deleteExperienceAction } from "@/app/profile/actions";
import { Toast, type ToastType } from "@/components/toast";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { getRelativeTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export default function ProfileClient() {
  const { user, profile, saved, toggleLike, toggleSave, updateProfile, deleteAccount, logout } = useAuth();
  const community = useCommunityData();
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<"contributions" | "saved posts" | "threads" | "saved_threads">("contributions");

  const [showEditModal, setShowEditModal] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [deletePostTarget, setDeletePostTarget] = useState<Experience | null>(null);
  const [deletePostConfirmText, setDeletePostConfirmText] = useState("");
  const [deletePostBusy, setDeletePostBusy] = useState(false);
  const [cardError, setCardError] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = (msg: string, type: ToastType = "success", durationMs = 3000) => {
    setToast({ message: msg, type, visible: true });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(prev => ({ ...prev, visible: false })), durationMs);
  };

  const [editData, setEditData] = useState<{
    full_name: string;
    college_name: string;
    branch: Profile["branch"];
    linkedin_url: string;
    grad_year: number;
  }>({
    full_name: "",
    college_name: "",
    branch: BRANCH_OPTIONS[0],
    linkedin_url: "",
    grad_year: 2025
  });

  const [sharedPosts, setSharedPosts] = useState<Experience[]>([]);
  const [savedPosts, setSavedPosts] = useState<Experience[]>([]);
  const [myThreads, setMyThreads] = useState<CommunityPost[]>([]);
  const [savedThreads, setSavedThreads] = useState<CommunityPost[]>([]);
  const [communityLiked, setCommunityLiked] = useState<Set<string>>(new Set());
  const [communitySaved, setCommunitySaved] = useState<Set<string>>(new Set());

  const profileName = profile?.full_name || profile?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const profileAvatarLetter = (
    profile?.full_name?.trim()?.[0] ||
    profile?.display_name?.trim()?.[0] ||
    user?.user_metadata?.full_name?.trim()?.[0] ||
    user?.email?.trim()?.[0] ||
    "U"
  ).toUpperCase();

  useEffect(() => {
    if (profile) {
      setEditData({
        full_name: profile.full_name || "",
        college_name: profile.college_name || "",
        branch: profile.branch || BRANCH_OPTIONS[0],
        linkedin_url: profile.linkedin_url || "",
        grad_year: profile.grad_year || 2025
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const fetchProfileData = async () => {
      const experienceColumns =
        "id,user_id,author_name,college,company_name,company_location,role_name,opportunity_type,recruitment_route,compensation,branch,hiring_year,selection_status,difficulty_score,difficulty_label,rounds_count,total_rounds,topics,sources,overview,rounds_summary,likes_count,month_label,anonymous,created_at" as const;

      const { data: contributions } = await supabase
        .from("experiences")
        .select(experienceColumns)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (contributions) setSharedPosts(contributions as Experience[]);

      if (saved.length > 0) {
        const { data: savedExps } = await supabase.from("experiences").select(experienceColumns).in("id", saved);
        if (savedExps) setSavedPosts(savedExps as Experience[]);
      } else {
        setSavedPosts([]);
      }

      // Community threads
      const { data: threadsData } = await supabase
        .from("community_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (threadsData) setMyThreads(threadsData as CommunityPost[]);

      const [{ data: communityLikesData }, { data: communitySavesData }] = await Promise.all([
        supabase.from("community_likes").select("post_id").eq("user_id", user.id),
        supabase.from("community_saves").select("post_id").eq("user_id", user.id)
      ]);

      const cl = new Set<string>();
      if (communityLikesData) communityLikesData.forEach(l => cl.add(l.post_id));
      setCommunityLiked(cl);

      const cs = new Set<string>();
      if (communitySavesData) communitySavesData.forEach(s => cs.add(s.post_id));
      setCommunitySaved(cs);

      if (cs.size > 0) {
        const { data: sThreadsData } = await supabase.from("community_posts").select("*").in("id", Array.from(cs));
        if (sThreadsData) setSavedThreads(sThreadsData as CommunityPost[]);
      } else {
        setSavedThreads([]);
      }
    };
    fetchProfileData();
  }, [user, saved, supabase]);

  const handleSaveProfile = async () => {
    setProfileError("");
    setProfileSuccess(false);

    if (editData.linkedin_url && !isValidLinkedInUrl(editData.linkedin_url)) {
      setProfileError("Please enter a valid LinkedIn profile URL (must be /in/...)");
      return;
    }

    setIsSavingProfile(true);
    try {
      const profilePatch: Partial<Profile> = {
        ...profile,
        ...editData,
        degree: profile?.degree || "B.Tech",
      };
      await updateProfile(profilePatch);
      setProfileSuccess(true);
      setTimeout(() => setShowEditModal(false), 800);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col items-center justify-center px-6 pt-10 md:pt-10 text-black">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="frost-strong rounded-[48px] border p-12 text-center max-w-md">
          <div className="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-white">
            <User className="h-10 w-10" />
          </div>
          <h2 className="text-4xl font-semibold text-slate-900 tracking-tight">Access Restricted.</h2>
          <p className="mt-4 text-sm font-normal text-muted-foreground leading-relaxed">Please authenticate to view your professional identity and shared intelligence.</p>
          <Link href="/login?next=/profile" className="soft-button mt-12 inline-flex h-14 items-center justify-center rounded-full px-12 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95">Authenticate Profile</Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-10 pb-6 md:pt-12 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6">
        <div className="frost-strong flex flex-col items-center justify-between gap-6 rounded-[32px] p-6 md:flex-row">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="h-24 w-24 rounded-[32px] border border-slate-200 bg-white/85 shadow-xl flex items-center justify-center overflow-hidden shrink-0 uppercase">
              <div className="h-full w-full bg-slate-900 text-white flex items-center justify-center font-black text-3xl tracking-tighter">
                {profileAvatarLetter}
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-0.5">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">{profileName}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-slate-900" /> {profile?.college_name || "No College"}</span>
                  <span className="opacity-10">|</span>
                  <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5 text-slate-900" /> {profile?.branch || "No Branch"}</span>
                  <span className="opacity-10">|</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-900" /> Batch {profile?.grad_year || "---"}</span>
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                {profile?.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-[#0077B5] transition-all hover:bg-[#0077B5] hover:text-white active:scale-90 shadow-sm">
                    <LinkedInIcon className="h-4 w-4" />
                  </a>
                )}
                <button onClick={() => setShowEditModal(true)} className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-5 text-[9px] font-black uppercase tracking-widest text-slate-900 transition-all hover:border-slate-400 active:scale-95 shadow-sm">
                  <Edit3 className="h-3 w-3" /> Edit Identity
                </button>
                <button
                  disabled={isLoggingOut}
                  onClick={async () => {
                    setIsLoggingOut(true);
                    try { await logout(); } finally { setIsLoggingOut(false); }
                  }}
                  className="soft-pill rounded-full border px-8 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 transition-all active:scale-95 whitespace-nowrap"
                >
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 rounded-[24px] bg-slate-100/50 p-1 self-center border border-slate-200">
          {(["contributions", "saved posts", "threads", "saved_threads"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={cn("rounded-full px-5 sm:px-8 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all", activeTab === tab ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900")}>
              {tab === "contributions" ? "Experiences" : tab === "saved posts" ? "Saved EXPs" : tab === "threads" ? "My Threads" : "Saved Threads"}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid gap-4">
              {activeTab === "contributions" ? (
                sharedPosts.length === 0 ? (
                  <div className="frost flex flex-col items-center justify-center py-24 text-center rounded-[48px] border-2 border-dashed border-slate-200 bg-white/30">
                    <Building2 className="mb-4 h-12 w-12 text-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deep dive into a process</p>
                    <Link href="/share" className="mt-6 text-sm font-bold text-slate-900 hover:underline">Share First Experience &rarr;</Link>
                  </div>
                ) : (
                  sharedPosts.map(item => (
                    <ExperienceCard key={item.id} item={item} isOwner={true} cardError={cardError[item.id]} onDelete={() => setDeletePostTarget(item)} onShowToast={showFlash} />
                  ))
                )
              ) : activeTab === "saved posts" ? (
                savedPosts.length === 0 ? (
                  <div className="frost flex flex-col items-center justify-center py-24 text-center rounded-[48px] border-2 border-dashed border-slate-200 bg-white/30">
                    <Bookmark className="mb-4 h-12 w-12 text-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intelligence bank is empty</p>
                    <Link href="/feed" className="mt-6 text-sm font-bold text-slate-900 hover:underline">Explore the Feed &rarr;</Link>
                  </div>
                ) : (
                  savedPosts.map(item => (
                    <ExperienceCard
                      key={item.id}
                      item={item}
                      isSavedPage={true}
                      onShowToast={showFlash}
                      onRemove={async () => {
                        try {
                          await toggleSave(item.id);
                          setSavedPosts(p => p.filter(x => x.id !== item.id));
                        } catch (err) {
                          setCardError(prev => ({ ...prev, [item.id]: err instanceof Error ? err.message : "Error" }));
                        }
                      }}
                    />
                  ))
                )
              ) : activeTab === "threads" ? (
                myThreads.length === 0 ? (
                  <div className="frost flex flex-col items-center justify-center py-24 text-center rounded-[48px] border-2 border-dashed border-slate-200 bg-white/30">
                    <MessageCircle className="mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No discussions yet</p>
                    <Link href="/community" className="mt-6 text-sm font-bold text-slate-900 hover:underline">Start a Thread &rarr;</Link>
                  </div>
                ) : (
                  myThreads.map(item => (
                    <ThreadCard key={item.id} post={item} isOwner={true} onDelete={async () => {
                      const { error } = await supabase.from("community_posts").delete().eq("id", item.id);
                      if (error) showFlash(error.message, "error");
                      else { setMyThreads(p => p.filter(x => x.id !== item.id)); showFlash("Thread deleted", "success"); }
                    }} />
                  ))
                )
              ) : (
                savedThreads.length === 0 ? (
                  <div className="frost flex flex-col items-center justify-center py-24 text-center rounded-[48px] border-2 border-dashed border-slate-200 bg-white/30">
                    <Bookmark className="mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No saved threads</p>
                    <Link href="/community" className="mt-6 text-sm font-bold text-slate-900 hover:underline">Explore Discussions &rarr;</Link>
                  </div>
                ) : (
                  savedThreads.map(item => (
                    <ThreadCard key={item.id} post={item} isOwner={false} onRemove={async () => {
                      await fetch(`/api/community/posts/${item.id}/save`, { method: "POST" });
                      setSavedThreads(p => p.filter(x => x.id !== item.id));
                    }} isSavedPage={true} />
                  ))
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.visible}
          onClose={() => setToast(prev => ({ ...prev, visible: false }))}
        />

        <div className="mt-12 mb-8 border-t border-slate-200 pt-12 flex flex-col items-center gap-6">
          <div className="text-center space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-tight text-slate-900">Account Governance</h3>
            <p className="text-[9px] font-medium text-slate-400">Permanently remove your digital identity and all shared intellectual assets.</p>
          </div>
          {deleteError && <p className="text-[10px] text-rose-500 font-bold">{deleteError}</p>}
          <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 rounded-full border border-red-100 bg-red-100 px-6 py-3 text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 group">
            <Trash2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" /> Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-2xl p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-white border-2 border-black rounded-[32px] shadow-2xl p-8 space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50"><Trash2 className="h-6 w-6 text-rose-500" /></div>
            <div>
              <h2 className="text-xl font-black text-black tracking-tight">Erase Identity?</h2>
              <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">This action is permanent. All your contributions, saves, and profile data will be purged from the core database.</p>
            </div>
            {deleteError && <p className="text-xs text-rose-500 font-bold">{deleteError}</p>}
            <div className="space-y-1.5 text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Type DELETE to continue</p>
              <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="w-full rounded-xl border-2 border-black px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeletingAccount} className="flex-1 rounded-full border-2 border-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-zinc-50 transition-all active:scale-95">Cancel</button>
              <button
                disabled={isDeletingAccount || deleteConfirmText.toUpperCase() !== "DELETE"}
                onClick={async () => {
                  setDeleteError("");
                  setIsDeletingAccount(true);
                  try { await deleteAccount(); } catch (err) { setDeleteError(err instanceof Error ? err.message : "Error"); } finally { setIsDeletingAccount(false); }
                }}
                className="flex-1 rounded-full bg-rose-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-rose-600 transition-all active:scale-95 shadow-xl"
              >
                {isDeletingAccount ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Experience Modal */}
      {deletePostTarget && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-black/60 backdrop-blur-2xl p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-white border-2 border-black rounded-[32px] shadow-2xl p-8 space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50"><Trash2 className="h-6 w-6 text-rose-500" /></div>
            <div>
              <h2 className="text-xl font-black text-black tracking-tight">Delete Intellectual Asset?</h2>
              <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">This will permanently remove your shared experience from the community feed.</p>
            </div>
            <div className="space-y-1.5 text-left">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Type DELETE POST to continue</p>
              <input value={deletePostConfirmText} onChange={e => setDeletePostConfirmText(e.target.value)} placeholder="DELETE POST" className="w-full rounded-xl border-2 border-black px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setDeletePostTarget(null); setDeletePostConfirmText(""); }} disabled={deletePostBusy} className="flex-1 rounded-full border-2 border-black px-4 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-zinc-50 transition-all active:scale-95">Cancel</button>
              <button
                disabled={deletePostBusy || deletePostConfirmText.toUpperCase() !== "DELETE POST"}
                onClick={async () => {
                  setDeletePostBusy(true);
                  try {
                    const res = await deleteExperienceAction(deletePostTarget.id);
                    if (!res.ok) throw new Error(res.message);
                    setSharedPosts(p => p.filter(x => x.id !== deletePostTarget.id));
                    setDeletePostTarget(null);
                    setDeletePostConfirmText("");
                  } catch (err) {
                    setCardError(prev => ({ ...prev, [deletePostTarget.id]: err instanceof Error ? err.message : "Error" }));
                  } finally { setDeletePostBusy(false); }
                }}
                className="flex-1 rounded-full bg-rose-500 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-rose-600 transition-all active:scale-95"
              >
                {deletePostBusy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Identity Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-2xl p-4 pt-15">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-lg bg-white border-2 border-black rounded-[32px] shadow-2xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-black tracking-tight">Edit Identity</h2>
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-black ml-1">Full Name</p>
                <input value={editData.full_name} onChange={e => setEditData({ ...editData, full_name: e.target.value })} className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none focus:bg-black focus:text-white transition-all text-black" />
              </div>
              <AutocompleteInput label="Institution" value={editData.college_name} onChange={v => setEditData({ ...editData, college_name: v })} suggestions={community.colleges} placeholder="University Name" className="w-full" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-black ml-1">Branch</p>
                  <select value={editData.branch} onChange={e => setEditData({ ...editData, branch: e.target.value as Profile["branch"] })} className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none appearance-none">{BRANCH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-black ml-1">Graduation Year</p>
                  <select value={editData.grad_year} onChange={e => setEditData({ ...editData, grad_year: parseInt(e.target.value) })} className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none appearance-none">{[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}</select>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-black ml-1">LinkedIn (Optional)</p>
                <input value={editData.linkedin_url} onChange={e => setEditData({ ...editData, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none focus:bg-black focus:text-white transition-all" />
              </div>
            </div>
            {profileError && <p className="text-center text-xs text-rose-500 font-bold">{profileError}</p>}
            <div className="flex gap-3 pt-4">
              <button disabled={isSavingProfile} onClick={handleSaveProfile} className={cn("flex-1 rounded-full py-3.5 text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl active:scale-95", profileSuccess ? "bg-emerald-500" : "bg-black")}>
                {isSavingProfile ? "Syncing..." : profileSuccess ? "Saved ✓" : "Sync Changes"}
              </button>
              <button onClick={() => setShowEditModal(false)} className="rounded-full border border-black px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-black hover:bg-zinc-50 transition-all active:scale-95">Cancel</button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

type ExperienceCardProps = {
  item: Experience;
  onDelete?: () => void;
  onRemove?: () => void;
  isOwner?: boolean;
  isSavedPage?: boolean;
  cardError?: string;
};

function ExperienceCard({ item, onDelete, onRemove, isOwner = false, isSavedPage = false, cardError, onShowToast }: ExperienceCardProps & { onShowToast: (m: string, t: ToastType) => void }) {
  const router = useRouter();
  const { liked, saved, toggleLike, toggleSave, profile } = useAuth();
  const [likesCount, setLikesCount] = useState(item.likes_count ?? 0);
  const [actionBusy, setActionBusy] = useState(false);

  const authorDisplay = item.anonymous ? "Anonymous" : (isOwner ? (profile?.full_name || item.author_name || "Member") : (item.author_name || "Member"));

  const copyExperienceLink = async (id: string) => {
    const url = `${window.location.origin}/feed/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      onShowToast("Link copied to clipboard", "success");
    } catch {
      onShowToast("Could not copy link", "error");
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if the user clicked an action button or link
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;

    router.push(`/feed/${item.id}`);
  };

  return (
    <div className="relative">
      <div
        onClick={handleCardClick}
        className="frost elevate group block border p-4 sm:p-5 rounded-[24px] transition-all duration-300 active:scale-[0.99] hover:bg-white/70 text-left cursor-pointer"
      >
        {/* Header: Author Info */}
        <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b border-slate-200/50 pb-2 text-[8.5px] font-black uppercase tracking-widest text-slate-500 overflow-hidden">
          <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5">
            <span className="flex items-center gap-1.5 shrink-0">
              <User className="h-2.5 w-2.5 text-slate-900" />
              <span>{authorDisplay}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <GraduationCap className="h-2.5 w-2.5 text-slate-900" />
              <span>{item.college}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0">
              <Layers className="h-2.5 w-2.5 text-slate-900" />
              <span>{item.branch}</span>
            </span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {isOwner && (
              <Link
                href={`/share?edit=${item.id}`}
                className="flex items-center gap-1.5 transition-colors hover:text-slate-900"
              >
                <Edit3 className="h-3 w-3 text-slate-900" />
                <span>Edit Post</span>
              </Link>
            )}
            {isOwner && onDelete && (
              <button
                onClick={(e) => { e.preventDefault(); onDelete(); }}
                className="flex items-center gap-1.5 transition-colors hover:text-rose-500"
              >
                <Trash2 className="h-3 w-3 text-rose-500" />
                <span>Delete</span>
              </button>
            )}
            {isSavedPage && onRemove && (
              <button
                onClick={(e) => { e.preventDefault(); onRemove(); }}
                className="flex items-center gap-1.5 transition-colors hover:text-rose-500"
              >
                <Trash2 className="h-3 w-3 text-rose-500" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Row: Company & Outcome */}
        <div className="mb-2 flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-4">
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
        <div className="flex flex-wrap items-center gap-4 mb-2.5">
          <div className="flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5 text-slate-900" />
            <span className="text-xs font-semibold">{item.role_name}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-normal uppercase tracking-widest font-black">
            <Building2 className="h-3.5 w-3.5" />
            {item.opportunity_type}
            <span className="opacity-40">&middot;</span>
            <ShieldCheck className="h-3.5 w-3.5" />
            {item.recruitment_route}
          </div>
          {item.compensation && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <Wallet className="h-3.5 w-3.5" />
              {item.compensation}
            </div>
          )}
        </div>

        {/* Metrics */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:gap-2.5">
          <div className="max-w-full flex-1 rounded-2xl border border-slate-200 bg-white/65 p-1.5 px-3 sm:max-w-[140px]">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Process</p>
            <p className="text-[11px] font-bold text-slate-900">{item.rounds_count || item.total_rounds || 0} Rounds</p>
          </div>
          <div className="w-fit rounded-2xl border border-slate-200 bg-white/65 p-1.5 px-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Topics</p>
            <div className="flex flex-wrap gap-1">
              {item.topics?.slice(0, 5).map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider">
                  {t}
                </span>
              ))}
              {item.topics && item.topics.length > 5 && (
                <span className="text-[9px] font-bold text-slate-400">+{item.topics.length - 5}</span>
              )}
            </div>
          </div>
        </div>

        {/* Narrative Snippet */}
        <div className="mb-1.5 space-y-1 border-t border-slate-100 pt-2.5">
          <p className="text-xs font-normal text-slate-500 leading-relaxed line-clamp-1 italic opacity-80">
            &ldquo;{item.overview || item.rounds_summary}&rdquo;
          </p>
        </div>

        {/* Footer */}
        <div className="mt-1 flex flex-col items-start justify-between gap-4 border-t border-slate-200/50 pt-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[8.5px] font-black uppercase tracking-widest text-slate-500">
            <button
              onClick={async (e) => {
                e.preventDefault(); if (actionBusy) return;
                const curLiked = liked.includes(item.id);
                setLikesCount(p => Math.max(0, p + (curLiked ? -1 : 1))); setActionBusy(true);
                try { await toggleLike(item.id); } catch { setLikesCount(p => Math.max(0, p + (curLiked ? 1 : -1))); } finally { setActionBusy(false); }
              }}
              className={cn("flex items-center gap-1.5 transition-colors hover:text-rose-500", liked.includes(item.id) ? "text-rose-500" : "text-slate-500")}
            >
              <Heart className={cn("h-3 w-3", liked.includes(item.id) && "fill-current")} />
              {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
            </button>

            {isSavedPage ? (
              <button
                onClick={(e) => { e.preventDefault(); onRemove?.(); }}
                className="flex items-center gap-1.5 transition-colors hover:text-rose-500 text-slate-500"
              >
                <Trash2 className="h-3 w-3" /> Remove Save
              </button>
            ) : (
              <button
                onClick={async (e) => { e.preventDefault(); setActionBusy(true); try { await toggleSave(item.id); } finally { setActionBusy(false); } }}
                className={cn("flex items-center gap-1.5 transition-colors hover:text-slate-900", saved.includes(item.id) ? "text-slate-900" : "text-slate-500")}
              >
                <Bookmark className={cn("h-3 w-3", saved.includes(item.id) && "fill-current")} />
                {saved.includes(item.id) ? "Saved" : "Save"}
              </button>
            )}

            <button onClick={(e) => { e.preventDefault(); copyExperienceLink(item.id); }} className="flex items-center gap-1.5 transition-colors hover:text-slate-900">
              <Share2 className="h-3 w-3" />
              Share
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[8.5px] font-black uppercase tracking-widest text-slate-400 sm:self-auto">
            <Clock className="h-3 w-3" />
            {getRelativeTime(item.created_at)}
          </div>
        </div>
      </div>

      {cardError && <p className="mt-2 text-[8px] font-black uppercase tracking-widest text-rose-500 px-6">{cardError}</p>}
    </div>
  );
}

// ----------------

function ThreadCard({ post, isOwner, onDelete, isSavedPage, onRemove }: { post: CommunityPost, isOwner?: boolean, onDelete?: () => void, isSavedPage?: boolean, onRemove?: () => void }) {
  const router = useRouter();
  const { profile } = useAuth();
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
  const [liked, setLiked] = useState(false);  // Simplification for profile view

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    router.push(`/community/${post.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="frost elevate group block border p-5 rounded-[34px] transition-all duration-300 active:scale-[0.99] hover:bg-white/70 text-left cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[8.5px] font-black uppercase tracking-widest text-slate-500">
        <span className="flex items-center gap-1.5 shrink-0">
          {post.is_anonymous ? (
            <><Ghost className="h-2.5 w-2.5 text-violet-500" /><span className="text-violet-500">Anonymous</span></>
          ) : (
            <><User className="h-2.5 w-2.5 text-slate-900" /><span>{isOwner ? (profile?.full_name || profile?.display_name || "Me") : (post.author_name || "Student")}</span></>
          )}
        </span>
        <span className="flex items-center gap-1.5 shrink-0 ml-auto">
          <Clock className="h-2.5 w-2.5" />
          <span>{getRelativeTime(post.created_at)}</span>
        </span>
      </div>

      <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug mb-1.5 sm:text-xl line-clamp-2">
        {post.title}
      </h3>
      <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2 mb-3">
        {post.content}
      </p>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-[8.5px] font-black uppercase tracking-widest text-slate-500">
        <button onClick={async (e) => { e.preventDefault(); setLiked(!liked); setLikesCount(p => liked ? p - 1 : p + 1); await fetch(`/api/community/posts/${post.id}/like`, { method: "POST" }); }} className={cn("flex items-center gap-1.5 transition-colors", liked ? "text-rose-500" : "hover:text-rose-500")}>
          <Heart className={cn("h-3 w-3", liked && "fill-current")} />
          {likesCount} {likesCount === 1 ? "Like" : "Likes"}
        </button>
        <button onClick={() => router.push(`/community/${post.id}`)} className="flex items-center gap-1.5 transition-colors hover:text-slate-900">
          <MessageCircle className="h-3 w-3" />
          {post.comments_count} {post.comments_count === 1 ? "Comment" : "Comments"}
        </button>

        {isOwner && onDelete && (
          <button onClick={(e) => { e.preventDefault(); onDelete(); }} className="flex items-center gap-1.5 transition-colors text-rose-500 ml-auto sm:ml-0">
            <Trash2 className="h-3 w-3" /> Delete Thread
          </button>
        )}

        {isSavedPage && onRemove && (
          <button onClick={(e) => { e.preventDefault(); onRemove(); }} className="flex items-center gap-1.5 transition-colors text-rose-500 ml-auto sm:ml-0">
            <Trash2 className="h-3 w-3" /> Remove Save
          </button>
        )}
      </div>
    </motion.div>
  );
}
