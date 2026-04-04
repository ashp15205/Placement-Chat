"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { CommunityPost, CommunityComment } from "@/lib/types";
import { getRelativeTime, cn } from "@/lib/utils";
import { Toast, type ToastType } from "@/components/toast";
import { ReportModal } from "@/components/report-modal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Bookmark,
  Share2,
  Flag,
  Clock,
  User,
  GraduationCap,
  ArrowLeft,
  Send,
  Eye,
  EyeOff,
  Ghost,
  MessageCircle,
  CornerDownRight,
  X,
} from "lucide-react";

// ─── Comment block (top-level + nested replies) ───────────────────────────
interface CommentItemProps {
  comment: CommunityComment;
  isReply?: boolean;
  likedComments: Set<string>;
  onLike: (id: string) => void;
  onReply: (comment: CommunityComment) => void;
  onReport: (id: string) => void;
  user: { id: string } | null;
  requireLogin: (next?: string) => boolean;
  postId: string;
}

function CommentItem({
  comment,
  isReply = false,
  likedComments,
  onLike,
  onReply,
  onReport,
  user,
  requireLogin,
  postId,
}: CommentItemProps) {
  const isLiked = likedComments.has(comment.id);
  const initial = comment.is_anonymous ? "?" : (comment.author_name?.[0] || "S").toUpperCase();

  return (
    <div className={cn("group", isReply && "ml-10 sm:ml-14")}>
      <div className={cn("frost rounded-[20px] p-4", isReply && "border-l-2 border-violet-200")}>
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
              comment.is_anonymous
                ? "bg-violet-100 text-violet-600"
                : "bg-slate-900 text-white"
            )}
          >
            {comment.is_anonymous ? <Ghost className="h-3.5 w-3.5" /> : initial}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
              {comment.is_anonymous ? (
                <span className="text-violet-500">Anonymous Student</span>
              ) : (
                comment.author_name || "Student"
              )}
            </span>
            <span className="text-[9px] font-medium text-slate-400 ml-2">
              {getRelativeTime(comment.created_at)}
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 font-normal leading-relaxed pl-10 sm:pl-[42px] mb-2">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 pl-10 sm:pl-[42px] text-[8.5px] font-black uppercase tracking-widest">
          <button
            onClick={() => onLike(comment.id)}
            className={cn(
              "flex items-center gap-1 transition-colors hover:text-rose-500",
              isLiked ? "text-rose-500" : "text-slate-400"
            )}
          >
            <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
            {comment.likes_count > 0 ? comment.likes_count : ""}
          </button>
          {/* Only show Reply on top-level comments */}
          {!isReply && (
            <button
              onClick={() => {
                if (!requireLogin(`/community/${postId}`)) return;
                onReply(comment);
              }}
              className="flex items-center gap-1 text-slate-400 transition-colors hover:text-slate-900"
            >
              <CornerDownRight className="h-3 w-3" />
              Reply
            </button>
          )}
          <button
            onClick={() => {
              if (!requireLogin(`/community/${postId}`)) return;
              onReport(comment.id);
            }}
            className="flex items-center gap-1 text-slate-400 transition-colors hover:text-amber-600"
          >
            <Flag className="h-3 w-3" />
            Report
          </button>
        </div>
      </div>

      {/* Replies to this comment */}
      {!isReply && comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply
              likedComments={likedComments}
              onLike={onLike}
              onReply={onReply}
              onReport={onReport}
              user={user}
              requireLogin={requireLogin}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post Detail Client ────────────────────────────────────────────────────
export function PostDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile, requireLogin, isReady } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Comment form
  const [commentText, setCommentText] = useState("");
  const [commentAnonymous, setCommentAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reply-to state
  const [replyTarget, setReplyTarget] = useState<CommunityComment | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Post interactions
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Comment likes (set of comment IDs liked by this user)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  // Report
  const [reportPostOpen, setReportPostOpen] = useState(false);
  const [reportCommentId, setReportCommentId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: ToastType; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  });
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = (msg: string, type: ToastType = "success", durationMs = 3000) => {
    setToast({ message: msg, type, visible: true });
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(
      () => setToast((prev) => ({ ...prev, visible: false })),
      durationMs
    );
  };

  // Build nested comment tree from flat list
  const buildCommentTree = (flat: CommunityComment[]): CommunityComment[] => {
    const map: Record<string, CommunityComment> = {};
    const roots: CommunityComment[] = [];
    for (const c of flat) {
      map[c.id] = { ...c, replies: [] };
    }
    for (const c of flat) {
      if (c.parent_comment_id && map[c.parent_comment_id]) {
        map[c.parent_comment_id].replies!.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    }
    return roots;
  };

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  // Fetch post + comments
  const fetchPost = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/community/posts/${id}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "Post not found");
      setPost(data.post);
      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isReady) return;
    fetchPost();
  }, [isReady, fetchPost]);

  // Load post like/save and comment likes for the current user
  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      const [{ data: likeData }, { data: saveData }, { data: commentLikesData }] =
        await Promise.all([
          supabase
            .from("community_likes")
            .select("user_id")
            .eq("user_id", user.id)
            .eq("post_id", id)
            .maybeSingle(),
          supabase
            .from("community_saves")
            .select("user_id")
            .eq("user_id", user.id)
            .eq("post_id", id)
            .maybeSingle(),
          supabase
            .from("community_comment_likes")
            .select("comment_id")
            .eq("user_id", user.id),
        ]);
      setIsLiked(!!likeData);
      setIsSaved(!!saveData);
      if (commentLikesData) {
        setLikedComments(new Set(commentLikesData.map((r) => r.comment_id)));
      }
    };
    load();
  }, [user, id, supabase]);

  // Toggle post like
  const handleLike = async () => {
    if (!requireLogin(`/community/${id}`)) return;
    if (!post) return;
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setPost((p) => (p ? { ...p, likes_count: Math.max(0, p.likes_count + (wasLiked ? -1 : 1)) } : p));
    try {
      const res = await fetch(`/api/community/posts/${id}/like`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
    } catch {
      setIsLiked(wasLiked);
      setPost((p) => (p ? { ...p, likes_count: Math.max(0, p.likes_count + (wasLiked ? 1 : -1)) } : p));
      showFlash("Could not update like", "error");
    }
  };

  // Toggle post save
  const handleSave = async () => {
    if (!requireLogin(`/community/${id}`)) return;
    const wasSaved = isSaved;
    setIsSaved(!wasSaved);
    try {
      const res = await fetch(`/api/community/posts/${id}/save`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      showFlash(wasSaved ? "Removed from saved" : "Saved!", "success");
    } catch {
      setIsSaved(wasSaved);
      showFlash("Could not update save", "error");
    }
  };

  // Share link
  const handleShare = async () => {
    const url = `${window.location.origin}/community/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      showFlash("Link copied!", "success");
    } catch {
      showFlash("Could not copy link", "error");
    }
  };

  // Toggle comment like
  const handleCommentLike = async (commentId: string) => {
    if (!requireLogin(`/community/${id}`)) return;
    const wasLiked = likedComments.has(commentId);
    setLikedComments((prev) => {
      const next = new Set(prev);
      wasLiked ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, likes_count: Math.max(0, c.likes_count + (wasLiked ? -1 : 1)) }
          : c
      )
    );
    try {
      const res = await fetch(`/api/community/comments/${commentId}/like`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error();
    } catch {
      setLikedComments((prev) => {
        const next = new Set(prev);
        wasLiked ? next.add(commentId) : next.delete(commentId);
        return next;
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, likes_count: Math.max(0, c.likes_count + (wasLiked ? 1 : -1)) }
            : c
        )
      );
      showFlash("Could not update like", "error");
    }
  };

  // Set reply target and focus input
  const handleReplyTarget = (comment: CommunityComment) => {
    setReplyTarget(comment);
    setTimeout(() => commentInputRef.current?.focus(), 50);
  };

  // Submit comment or reply
  const handleComment = async () => {
    if (!requireLogin(`/community/${id}`)) return;
    if (submitting) return;

    const content = commentText.trim();
    if (!content) {
      showFlash("Comment cannot be empty.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/community/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          is_anonymous: commentAnonymous,
          parent_comment_id: replyTarget?.id ?? null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        showFlash(data.message || "Could not add comment.", "error");
        return;
      }

      const newComment: CommunityComment = {
        ...data.comment,
        parent_comment_id: data.comment.parent_comment_id ?? null,
        likes_count: 0,
        author_name: commentAnonymous
          ? null
          : profile?.full_name || profile?.display_name || null,
        user_id: commentAnonymous ? "anonymous" : data.comment.user_id,
      };
      setComments((prev) => [...prev, newComment]);
      setPost((p) => (p ? { ...p, comments_count: p.comments_count + 1 } : p));
      setCommentText("");
      setCommentAnonymous(false);
      setReplyTarget(null);
      showFlash("Comment added!", "success");
    } catch {
      showFlash("Something went wrong.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Report post
  const submitPostReport = async (reason: string) => {
    try {
      const res = await fetch(`/api/community/posts/${id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!data.ok) { showFlash(data.message || "Could not report", "error"); return; }
      showFlash("Report submitted. Thank you.", "success");
    } catch {
      showFlash("Could not submit report", "error");
    }
  };

  // Report comment
  const submitCommentReport = async (reason: string) => {
    if (!reportCommentId) return;
    try {
      const res = await fetch(`/api/community/comments/${reportCommentId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!data.ok) { showFlash(data.message || "Could not report", "error"); return; }
      showFlash("Report submitted. Thank you.", "success");
    } catch {
      showFlash("Could not submit report", "error");
    } finally {
      setReportCommentId(null);
    }
  };

  useEffect(() => {
    return () => { if (flashTimerRef.current) clearTimeout(flashTimerRef.current); };
  }, []);

  if (!isReady) return null;

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-10 md:pt-12 md:pb-16">
        <div className="frost-strong rounded-[34px] p-6 animate-pulse mb-4">
          <div className="h-4 w-24 rounded-full bg-slate-200 mb-4" />
          <div className="h-6 w-3/4 rounded-full bg-slate-200 mb-3" />
          <div className="h-4 w-full rounded-full bg-slate-100 mb-2" />
          <div className="h-4 w-full rounded-full bg-slate-100 mb-2" />
          <div className="h-4 w-2/3 rounded-full bg-slate-100 mb-6" />
          <div className="flex gap-4">
            <div className="h-3 w-16 rounded-full bg-slate-100" />
            <div className="h-3 w-16 rounded-full bg-slate-100" />
            <div className="h-3 w-12 rounded-full bg-slate-100" />
          </div>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="frost rounded-[20px] p-4 animate-pulse mb-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
              <div className="h-3 w-28 rounded-full bg-slate-200" />
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 ml-10" />
          </div>
        ))}
      </main>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error || !post) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-10 md:pt-12 md:pb-16">
        <div className="frost flex flex-col items-center justify-center rounded-[48px] border border-rose-200 bg-rose-50/50 p-10 text-center sm:p-20">
          <p className="text-xl font-bold tracking-tight text-rose-700">{error || "Post not found"}</p>
          <Link href="/community" className="soft-button mt-6 rounded-full px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90">
            Back to Community
          </Link>
        </div>
      </main>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-16 md:pt-12 transition-all">
      {/* Back */}
      <button
        onClick={() => router.push("/community")}
        className="soft-pill flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest mb-4 transition-all hover:bg-slate-900 hover:text-white"
      >
        <ArrowLeft className="h-3 w-3" />
        Community
      </button>

      {/* ── Post ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="frost-strong rounded-[34px] p-6 mb-4">
        {/* Author row */}
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[8.5px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-3">
          <span className="flex items-center gap-1.5">
            {post.is_anonymous ? (
              <><Ghost className="h-3 w-3 text-violet-500" /><span className="text-violet-500">Anonymous Student</span></>
            ) : (
              <><User className="h-3 w-3 text-slate-900" /><span>{post.author_name || "Student"}</span></>
            )}
          </span>
          {!post.is_anonymous && post.author_college && (
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3 text-slate-900" />
              <span>{post.author_college}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 ml-auto">
            <Clock className="h-3 w-3" />
            {getRelativeTime(post.created_at)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug mb-3 sm:text-3xl">
          {post.title}
        </h1>

        {/* Content */}
        <div className="text-sm text-slate-700 font-normal leading-relaxed whitespace-pre-wrap mb-5">
          {post.content}
        </div>

        {/* Post actions */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-5 border-t border-slate-200/60 pt-4 text-[8.5px] font-black uppercase tracking-widest text-slate-500">
          <button
            onClick={() => void handleLike()}
            className={cn("flex items-center gap-1.5 transition-colors hover:text-rose-500", isLiked ? "text-rose-500" : "")}
          >
            <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
            {post.likes_count} {post.likes_count === 1 ? "Like" : "Likes"}
          </button>
          <span className="flex items-center gap-1.5 text-slate-400">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.comments_count} {post.comments_count === 1 ? "Comment" : "Comments"}
          </span>
          <button
            onClick={() => void handleSave()}
            className={cn("flex items-center gap-1.5 transition-colors hover:text-slate-900", isSaved ? "text-slate-900" : "")}
          >
            <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
            {isSaved ? "Saved" : "Save"}
          </button>
          <button onClick={() => void handleShare()} className="flex items-center gap-1.5 transition-colors hover:text-slate-900">
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
          <button
            onClick={() => { if (requireLogin(`/community/${id}`)) setReportPostOpen(true); }}
            className="flex items-center gap-1.5 transition-colors hover:text-amber-600"
          >
            <Flag className="h-3.5 w-3.5" />
            Report
          </button>
        </div>
      </motion.div>

      {/* ── Comment input ─────────────────────────────────────────────── */}
      <div className="frost-strong rounded-[28px] p-5 mb-4">
        {/* Reply banner */}
        <AnimatePresence>
          {replyTarget && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-3 rounded-2xl bg-violet-50 border border-violet-200 px-4 py-2"
            >
              <CornerDownRight className="h-3.5 w-3.5 text-violet-500 shrink-0" />
              <p className="text-[10px] font-bold text-violet-700 flex-1 min-w-0 truncate">
                Replying to{" "}
                <span className="font-black">
                  {replyTarget.is_anonymous ? "Anonymous Student" : replyTarget.author_name || "Student"}
                </span>
              </p>
              <button onClick={() => setReplyTarget(null)} className="shrink-0 text-violet-400 hover:text-violet-700 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold tracking-tight text-slate-900">
            {replyTarget ? "Write a reply" : "Add a Comment"}
          </h2>
          {user && (
            <button
              type="button"
              onClick={() => setCommentAnonymous(!commentAnonymous)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all border ml-auto",
                commentAnonymous
                  ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                  : "bg-white/60 text-slate-400 border-slate-200 hover:border-violet-400 hover:text-violet-600"
              )}
            >
              {commentAnonymous ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {commentAnonymous ? "Anonymous" : "As You"}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <input
            ref={commentInputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? (replyTarget ? `Reply to ${replyTarget.is_anonymous ? "Anonymous" : replyTarget.author_name || "Student"}...` : "Write a comment...") : "Sign in to comment..."}
            disabled={!user}
            maxLength={2000}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleComment();
              }
              if (e.key === "Escape") setReplyTarget(null);
            }}
            className="soft-input flex-1 rounded-full px-4 py-3 text-sm font-normal disabled:opacity-50"
          />
          <button
            onClick={() => void handleComment()}
            disabled={submitting || !user || !commentText.trim()}
            className="soft-button flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        {!user && (
          <p className="text-[9px] text-slate-400 font-medium mt-2 text-center">
            <Link href="/login" className="underline hover:text-slate-700">Sign in</Link> to join the discussion.
          </p>
        )}
      </div>

      {/* ── Comments ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <AnimatePresence>
          {commentTree.map((comment, idx) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <CommentItem
                comment={comment}
                likedComments={likedComments}
                onLike={(cid) => void handleCommentLike(cid)}
                onReply={handleReplyTarget}
                onReport={(cid) => setReportCommentId(cid)}
                user={user}
                requireLogin={requireLogin}
                postId={id}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {commentTree.length === 0 && !loading && (
          <div className="frost flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 p-8 text-center">
            <MessageCircle className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-bold tracking-tight text-slate-400">
              No comments yet. Be the first!
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <ReportModal
        isOpen={reportPostOpen}
        onClose={() => setReportPostOpen(false)}
        onConfirm={(msg) => void submitPostReport(msg)}
      />
      <ReportModal
        isOpen={!!reportCommentId}
        onClose={() => setReportCommentId(null)}
        onConfirm={(msg) => void submitCommentReport(msg)}
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
