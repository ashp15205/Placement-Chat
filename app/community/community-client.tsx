"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { CommunityPost } from "@/lib/types";
import { getRelativeTime, cn } from "@/lib/utils";
import { Toast, type ToastType } from "@/components/toast";
import { ReportModal } from "@/components/report-modal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Flag,
  Clock,
  User,
  GraduationCap,
  PlusCircle,
  X,
  Eye,
  EyeOff,
  TrendingUp,
  Sparkles,
  Send,
  Ghost,
  Search,
} from "lucide-react";

const PAGE_SIZE = 15;

export function CommunityClient() {
  const router = useRouter();
  const { user, profile, requireLogin, isReady } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<"newest" | "popular">("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Create post modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAnonymous, setNewAnonymous] = useState(false);
  const [creating, setCreating] = useState(false);

  // Report
  const [reportId, setReportId] = useState<string | null>(null);

  // Community interaction state (likes/saves tracked per-session)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  });
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = (msg: string, type: ToastType = "success", durationMs = 3000) => {
    setToast({ message: msg, type, visible: true });
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), durationMs);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setActiveSearch(val), 400);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Load user's liked/saved community posts on mount
  useEffect(() => {
    if (!user) return;
    const loadInteractions = async () => {
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from("community_likes").select("post_id").eq("user_id", user.id),
        supabase.from("community_saves").select("post_id").eq("user_id", user.id),
      ]);
      if (likes) setLikedPosts(new Set(likes.map((l) => l.post_id)));
      if (saves) setSavedPosts(new Set(saves.map((s) => s.post_id)));
    };
    loadInteractions();
  }, [user, supabase]);

  // Fetch posts
  const fetchPosts = useCallback(
    async (p: number) => {
      const q = encodeURIComponent(activeSearch);
      const res = await fetch(`/api/community/posts?page=${p}&sort=${sort}&q=${q}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Failed to load");
      return data.posts as CommunityPost[];
    },
    [sort, activeSearch]
  );

  useEffect(() => {
    if (!isReady) return;
    const init = async () => {
      setLoading(true);
      setLoadError("");
      setPage(0);
      try {
        const items = await fetchPosts(0);
        setPosts(items);
        setHasMore(items.length === PAGE_SIZE);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [sort, activeSearch, isReady, fetchPosts]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const items = await fetchPosts(nextPage);
      setPosts((prev) => [...prev, ...items]);
      setPage(nextPage);
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      showFlash("Failed to load more", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  // Create post handler
  const handleCreatePost = async () => {
    if (!requireLogin("/community")) return;
    if (creating) return;

    const title = newTitle.trim();
    const content = newContent.trim();

    if (title.length < 3) {
      showFlash("Title must be at least 3 characters.", "error");
      return;
    }
    if (content.length < 10) {
      showFlash("Content must be at least 10 characters.", "error");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, is_anonymous: newAnonymous }),
      });
      const data = await res.json();
      if (!data.ok) {
        showFlash(data.message || "Could not create post.", "error");
        return;
      }

      // Add the new post to the top of the feed
      const newPost: CommunityPost = {
        ...data.post,
        author_name: newAnonymous ? null : (profile?.full_name || profile?.display_name || null),
        author_college: newAnonymous ? null : (profile?.college_name || null),
        user_id: newAnonymous ? "anonymous" : data.post.user_id,
      };
      setPosts((prev) => [newPost, ...prev]);

      // Reset form
      setNewTitle("");
      setNewContent("");
      setNewAnonymous(false);
      setShowCreate(false);
      showFlash("Post published! 🎉", "success");
    } catch {
      showFlash("Something went wrong.", "error");
    } finally {
      setCreating(false);
    }
  };

  // Toggle like
  const handleLike = async (postId: string) => {
    if (!requireLogin("/community")) return;
    const isLiked = likedPosts.has(postId);

    // Optimistic
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? -1 : 1)) }
          : p
      )
    );

    try {
      const res = await fetch(`/api/community/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
    } catch {
      // Revert
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? 1 : -1)) }
            : p
        )
      );
      showFlash("Could not update like", "error");
    }
  };

  // Toggle save
  const handleSave = async (postId: string) => {
    if (!requireLogin("/community")) return;
    const isSaved = savedPosts.has(postId);

    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(postId);
      else next.add(postId);
      return next;
    });

    try {
      const res = await fetch(`/api/community/posts/${postId}/save`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      showFlash(isSaved ? "Removed from saved" : "Saved!", "success");
    } catch {
      setSavedPosts((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(postId);
        else next.delete(postId);
        return next;
      });
      showFlash("Could not update save", "error");
    }
  };

  // Share link
  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/community/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      showFlash("Link copied!", "success");
    } catch {
      showFlash("Could not copy link", "error");
    }
  };

  // Report
  const submitReport = async (postId: string, reason: string) => {
    try {
      const res = await fetch(`/api/community/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!data.ok) {
        showFlash(data.message || "Could not submit report", "error");
        return;
      }
      showFlash("Report submitted. Thank you.", "success");
    } catch {
      showFlash("Could not submit report", "error");
    }
  };

  if (!isReady) return null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pt-8 pb-1 md:pt-12 md:pb-16 transition-all">
      <div className="frost-strong mb-1 rounded-[34px] p-6 pb-4 text-left">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-violet-500 md:h-10 md:w-10" />
              Community
            </h1>
            <p className="mt-2 text-base text-slate-500 font-normal">
              Discuss, ask, share — your placement prep community.
            </p>
          </div>
          <button
            onClick={() => {
              if (!requireLogin("/community")) return;
              setShowCreate(true);
            }}
            className="soft-button flex h-12 items-center gap-2 rounded-full px-6 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            New Thread
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:flex-nowrap">
          <form
            className="relative w-full md:flex-[3]"
            onSubmit={(e) => {
              e.preventDefault();
              setActiveSearch(searchQuery);
            }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search company, location, role, college..."
              className="soft-input w-full rounded-full pl-10 pr-20 py-3 text-xs font-normal transition-all h-[44px]"
            />
            <button
              type="submit"
              className="absolute right-[3px] top-[3px] bottom-[3px] flex items-center justify-center bg-slate-100/50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-full px-5 text-[9px] font-black uppercase tracking-widest transition-all"
            >
              Find
            </button>
          </form>

          <div className="soft-pill flex h-[44px] w-full items-center gap-1 rounded-full p-1 md:w-auto md:flex-[1.1] md:min-w-[150px]">
            <button
              onClick={() => setSort("newest")}
              className={cn("flex-1 px-2.5 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-widest transition-all", sort === "newest" ? "bg-slate-900 py-2.5 text-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
            >
              Latest
            </button>
            <button
              onClick={() => setSort("popular")}
              className={cn("flex-1 px-2.5 py-1.5 rounded-full text-[8.5px] font-black uppercase tracking-widest transition-all", sort === "popular" ? "bg-slate-900 py-2.5 text-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
            >
              Trending
            </button>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreate(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="frost-strong w-full max-w-lg rounded-[32px] p-6 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">Start a Thread</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100/50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Thread title..."
                maxLength={300}
                className="soft-input w-full rounded-2xl px-4 py-3 text-sm font-semibold mb-3"
              />

              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Share your thoughts, questions, or advice..."
                maxLength={5000}
                rows={5}
                className="soft-input w-full rounded-2xl px-4 py-3 text-sm font-normal resize-none mb-3"
              />

              <div className="flex items-center gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setNewAnonymous(!newAnonymous)}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all border",
                    newAnonymous
                      ? "bg-violet-600 text-white border-violet-600 shadow-md"
                      : "bg-white/60 text-slate-500 border-slate-200 hover:border-violet-400 hover:text-violet-600"
                  )}
                >
                  {newAnonymous ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {newAnonymous ? "Anonymous" : "Post as You"}
                </button>
                {newAnonymous && (
                  <span className="text-[10px] text-violet-500 font-medium">
                    Your identity will be hidden from others
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-400 font-medium">
                  {newContent.length}/5000
                </div>
                <button
                  onClick={handleCreatePost}
                  disabled={creating}
                  className="soft-button flex h-11 items-center gap-2 rounded-full px-6 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  {creating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Publish
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts Feed */}
      <div className="grid gap-[6px]">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="frost rounded-[34px] p-5 animate-pulse"
              >
                <div className="h-3 w-32 rounded-full bg-slate-200 mb-3" />
                <div className="h-5 w-3/4 rounded-full bg-slate-200 mb-2" />
                <div className="h-3 w-full rounded-full bg-slate-100 mb-1" />
                <div className="h-3 w-2/3 rounded-full bg-slate-100 mb-4" />
                <div className="flex gap-4">
                  <div className="h-3 w-12 rounded-full bg-slate-100" />
                  <div className="h-3 w-16 rounded-full bg-slate-100" />
                  <div className="h-3 w-10 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </>
        ) : loadError ? (
          <div className="frost flex flex-col items-center justify-center rounded-[34px] border border-rose-200 bg-rose-50/50 p-10 text-center sm:p-14">
            <p className="text-xl font-bold tracking-tight text-rose-700">
              Could not load community
            </p>
            <p className="text-sm font-medium mt-2 text-rose-600">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="soft-button mt-6 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90"
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="frost flex flex-col items-center justify-center rounded-[34px] border border-dashed border-slate-200 p-10 text-center sm:p-14">
            <Sparkles className="h-12 w-12 text-violet-400 mb-4" />
            {activeSearch ? (
              <>
                <p className="text-xl font-bold tracking-tight">No threads found.</p>
                <p className="text-sm font-medium mt-2 text-slate-500">
                  No results for &ldquo;{activeSearch}&rdquo;. Try a different keyword.
                </p>
                <button
                  onClick={() => { setSearchQuery(""); setActiveSearch(""); }}
                  className="soft-button mt-6 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90"
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <p className="text-xl font-bold tracking-tight">No threads yet.</p>
                <p className="text-sm font-medium mt-2 text-slate-500">
                  Be the first to start a discussion!
                </p>
                <button
                  onClick={() => {
                    if (!requireLogin("/community")) return;
                    setShowCreate(true);
                  }}
                  className="soft-button mt-6 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90"
                >
                  Start a Thread
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="frost elevate group block border p-5 rounded-[34px] transition-all duration-300 active:scale-[0.99] hover:bg-white/70 text-left cursor-pointer"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest("button")) return;
                  router.push(`/community/${post.id}`);
                }}
              >
                {/* Author row */}
                <div className="mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[8.5px] font-black uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-1.5 shrink-0">
                    {post.is_anonymous ? (
                      <>
                        <Ghost className="h-2.5 w-2.5 text-violet-500" />
                        <span className="text-violet-500">Anonymous</span>
                      </>
                    ) : (
                      <>
                        <User className="h-2.5 w-2.5 text-slate-900" />
                        <span>{post.author_name || "Student"}</span>
                      </>
                    )}
                  </span>
                  {!post.is_anonymous && post.author_college && (
                    <span className="flex items-center gap-1.5 shrink-0">
                      <GraduationCap className="h-2.5 w-2.5 text-slate-900" />
                      <span>{post.author_college}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 shrink-0 ml-auto">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{getRelativeTime(post.created_at)}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug mb-1.5 sm:text-xl line-clamp-2">
                  {post.title}
                </h3>

                {/* Content preview */}
                <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-2 mb-3">
                  {post.content}
                </p>

                {/* Action bar */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 text-[8.5px] font-black uppercase tracking-widest text-slate-500">
                  <button
                    onClick={() => void handleLike(post.id)}
                    className={cn(
                      "flex items-center gap-1.5 transition-colors hover:text-rose-500",
                      likedPosts.has(post.id) ? "text-rose-500" : "text-slate-500"
                    )}
                  >
                    <Heart
                      className={cn("h-3 w-3", likedPosts.has(post.id) && "fill-current")}
                    />
                    {post.likes_count} {post.likes_count === 1 ? "Like" : "Likes"}
                  </button>
                  <button
                    onClick={() => router.push(`/community/${post.id}`)}
                    className="flex items-center gap-1.5 transition-colors hover:text-slate-900"
                  >
                    <MessageCircle className="h-3 w-3" />
                    {post.comments_count}{" "}
                    {post.comments_count === 1 ? "Comment" : "Comments"}
                  </button>
                  <button
                    onClick={() => void handleSave(post.id)}
                    className={cn(
                      "flex items-center gap-1.5 transition-colors hover:text-slate-900",
                      savedPosts.has(post.id) ? "text-slate-900" : "text-slate-500"
                    )}
                  >
                    <Bookmark
                      className={cn("h-3 w-3", savedPosts.has(post.id) && "fill-current")}
                    />
                    {savedPosts.has(post.id) ? "Saved" : "Save"}
                  </button>
                  <button
                    onClick={() => void handleShare(post.id)}
                    className="flex items-center gap-1.5 transition-colors hover:text-slate-900"
                  >
                    <Share2 className="h-3 w-3" />
                    Share
                  </button>
                  <button
                    onClick={() => {
                      if (requireLogin("/community")) setReportId(post.id);
                    }}
                    className="flex items-center gap-1.5 transition-colors hover:text-amber-600 ml-auto"
                  >
                    <Flag className="h-3 w-3" />
                    Report
                  </button>
                </div>
              </motion.div>
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
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </main>
  );
}
