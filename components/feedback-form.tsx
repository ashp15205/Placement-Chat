"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Star,
  Loader2,
  CheckCircle2,
  Lock,
  X,
  AlertCircle
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user, profile, requireLogin } = useAuth();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "limited">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const formspreeId = process.env.NEXT_PUBLIC_FORMSPREE_ID;

  // Check 24hr limit on open
  useEffect(() => {
    if (isOpen && user) {
      const lastSubmit = localStorage.getItem(`last_feedback_${user.id}`);
      if (lastSubmit) {
        const timePassed = Date.now() - parseInt(lastSubmit);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (timePassed < twentyFourHours) {
          setStatus("limited");
        } else {
          setStatus("idle");
        }
      }
    }
  }, [isOpen, user]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      requireLogin();
      return;
    }

    if (!message.trim()) return;

    if (!formspreeId) {
      setStatus("error");
      setErrorMessage("Feedback system ID missing. Check .env");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch(`https://formspree.io/f/${formspreeId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          rating,
          message,
          userEmail: user.email,
          userId: user.id,
          userName: profile?.full_name || profile?.display_name || "Anonymous",
        }),
      });

      if (response.ok) {
        setStatus("success");
        // Set 24hr limit timestamp
        localStorage.setItem(`last_feedback_${user.id}`, Date.now().toString());

        setTimeout(() => {
          setStatus("idle");
          setMessage("");
          setRating(5);
          onClose();
        }, 3000);
      } else {
        const data = await response.json();
        setErrorMessage(data.errors?.[0]?.message || "Something went wrong.");
        setStatus("error");
      }
    } catch (err) {
      setErrorMessage("Connection error.");
      setStatus("error");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[36px] border-4 border-white bg-white/95 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.25)]"
          >
            <div className="flex flex-col gap-8 p-8 sm:p-10">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-900 text-white shadow-xl ring-4 ring-slate-100">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900">
                      Feedback Form
                    </h3>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest opacity-80">
                      We value your feedback
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition-all hover:bg-slate-900 hover:text-white group"
                >
                  <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
                </button>
              </div>

              {status === "limited" ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center animate-in fade-in zoom-in duration-300">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black uppercase tracking-[0.2em] text-slate-900">Submission Limit Reached</h4>
                    <p className="mt-2 text-[14px] leading-relaxed text-slate-500 max-w-[280px]">
                      Thank you for your review!<br /> You can submit another one after 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="mt-4 h-11 w-40 rounded-full border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-slate-900 hover:text-slate-900 transition-all"
                  >
                    Got it
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="flex flex-col gap-8">
                  {/* Rating Section */}
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-60">Overall Rating</span>
                    <div className="flex gap-2.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="group relative transition-transform hover:scale-125 active:scale-95"
                        >
                          <Star
                            className={cn(
                              "h-10 w-10 transition-all duration-300",
                              s <= rating ? "fill-amber-400 text-amber-400 drop-shadow-md" : "text-slate-100"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Message */}
                  <div className="relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share your review or suggestions for improvement..."
                      required
                      rows={5}
                      className="w-full resize-none rounded-[28px] border-2 border-slate-50 bg-slate-50/30 p-5 text-sm font-medium text-slate-900 transition-all focus:border-slate-200 focus:bg-white focus:outline-none focus:ring-8 focus:ring-slate-100/30"
                      disabled={status === "submitting" || status === "success"}
                    />

                    {!user && (
                      <div
                        className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center rounded-[28px] bg-white/90 backdrop-blur-[4px] transition-opacity hover:bg-white/70"
                        onClick={() => {
                          onClose();
                          requireLogin();
                        }}
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl">
                          <Lock className="h-5 w-5" />
                        </div>
                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-900">
                          Sign in to Review
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Submit Status */}
                  <div className="flex flex-col gap-4">
                    <div className="text-center text-[10px] font-black uppercase tracking-widest min-h-[16px]">
                      {status === "error" && <span className="text-rose-500">{errorMessage}</span>}
                      {status === "success" && (
                        <span className="flex items-center justify-center gap-2 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Testimonial Received!
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!message.trim() || status === "submitting" || status === "success" || !user}
                      className={cn(
                        "flex h-14 w-40 mx-auto items-center justify-center gap-3 rounded-full text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98]",
                        status === "success"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-900 text-white hover:bg-black hover:shadow-2xl disabled:opacity-30 disabled:grayscale"
                      )}
                    >
                      {status === "submitting" ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : status === "success" ? (
                        "Submitted"
                      ) : (
                        "Submit Review"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
