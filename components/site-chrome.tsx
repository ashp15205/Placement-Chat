"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  MessageSquare,
  User,
  LogOut,
  LayoutGrid,
  PlusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Logo({ className, variant = "default" }: { className?: string, variant?: "default" | "white" }) {
  return (
    <div className={cn(
      "flex items-center justify-center rounded-[12px] sm:rounded-[14px] shadow-sm",
      variant === "default" ? "bg-slate-900 text-white" : "bg-white text-slate-900",
      className
    )}>
      <MessageSquare className="h-[60%] w-[60%] fill-current" strokeWidth={3} />
    </div>
  );
}

import { LinkedInIcon, GithubIcon, StarIcon } from "@/components/icons";

export function Navbar() {
  const { user, profile, requireLogin, logout, isReady } = useAuth();
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  function handleShareClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (user) return;
    event.preventDefault();
    requireLogin("/share");
  }

  const navLinks = [
    { name: "Feed", href: "/feed", icon: LayoutGrid },
    { name: "Share", href: "/share", icon: PlusCircle, onClick: handleShareClick },
  ];

  const avatarLetter = (
    profile?.full_name?.trim()?.[0] ||
    profile?.display_name?.trim()?.[0] ||
    (user?.user_metadata?.full_name as string | undefined)?.trim()?.[0] ||
    user?.email?.trim()?.[0] ||
    "A"
  )
    .toUpperCase();

  const isOnboarded = Boolean(isReady && user && profile);

  return (
    <header className="fixed top-2 left-0 right-0 z-50 flex justify-center px-2 sm:top-4 sm:px-4">
      <nav className="frost-strong grid h-13 w-full max-w-4xl grid-cols-3 items-center gap-2 rounded-full border p-1.5 transition-all sm:h-14 sm:gap-4">
        {/* Left: Logo & Brandname */}
        <div className="flex justify-start">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 group transition-opacity active:opacity-70"
          >
            <Logo className="h-7 w-7 sm:h-8 sm:w-8" variant="default" />
            <span className="hidden text-sm font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-slate-700 sm:inline sm:text-base">
              Placement Chat
            </span>
          </Link>
        </div>

        {/* Middle: Simple Nav Links */}
        <div className="flex justify-center">
          <div className="flex items-center mb-2 sm:mb-0 gap-1 bg-white/50 backdrop-blur-md rounded-full p-1 border border-slate-200/50 shadow-sm">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={link.onClick}
                  className={cn(
                    "rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all sm:px-5 sm:text-[10px]",
                    active
                      ? "bg-slate-900 text-white shadow-md scale-105"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Account */}
        <div className="flex justify-end px-1">
          {!isOnboarded ? (
            user ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href="/onboarding?next=/feed"
                    className="soft-button flex h-10 items-center justify-center rounded-full px-3 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm sm:px-4 sm:text-[10px]"
                  >
                    Complete Profile
                  </Link>
                  <button
                    onClick={async () => {
                      if (isSigningOut) return;
                      setIsSigningOut(true);
                      try {
                        await logout();
                      } finally {
                        setIsSigningOut(false);
                      }
                    }}
                    disabled={isSigningOut}
                    className="soft-pill flex h-10 items-center justify-center rounded-full px-3 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm sm:px-4 sm:text-[10px]"
                  >
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
                <div className="relative sm:hidden">
                  <button
                    onClick={() => setOpen((x) => !x)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-white shadow-lg transition-all active:scale-95 ring-1 ring-slate-200",
                      open && "ring-slate-900",
                    )}
                    aria-label="Account menu"
                  >
                    <User className="h-4 w-4" />
                  </button>
                  <AnimatePresence>
                    {open && (
                      <>
                        <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="frost absolute right-0 mt-3 w-52 overflow-hidden rounded-[24px] border-2 border-white p-1.5 shadow-2xl"
                        >
                          <Link
                            href="/onboarding?next=/feed"
                            onClick={() => setOpen(false)}
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-800 hover:bg-slate-100/70 transition-colors"
                          >
                            <User className="h-4 w-4" />
                            Complete Profile
                          </Link>
                          <button
                            onClick={async () => {
                              if (isSigningOut) return;
                              setOpen(false);
                              setIsSigningOut(true);
                              try {
                                await logout();
                              } finally {
                                setIsSigningOut(false);
                              }
                            }}
                            disabled={isSigningOut}
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50/80 transition-colors"
                          >
                            <LogOut className="h-4 w-4" />
                            {isSigningOut ? "Signing out..." : "Sign Out"}
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                href="/login"
                className="soft-button flex h-9 items-center justify-center rounded-full px-3 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm sm:h-10 sm:px-6 sm:text-[10px]"
              >
                Sign In
              </Link>
            )
          ) : (
            <div className="relative">
              <button
                onClick={() => setOpen((x) => !x)}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-[18px] font-black uppercase tracking-tighter text-white shadow-lg transition-all active:scale-95 hover:bg-slate-800 ring-1 ring-slate-200",
                  open && "ring-slate-900"
                )}
              >
                {avatarLetter}
              </button>

              <AnimatePresence>
                {open && (
                  <>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="frost absolute right-0 mt-3 w-48 overflow-hidden rounded-[28px] border-2 border-white p-1.5 shadow-2xl"
                    >
                      <button
                        onClick={() => {
                          setOpen(false);
                          router.push("/profile");
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-800 hover:bg-slate-100/70 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </button>
                      <button
                        onClick={async () => {
                          if (isSigningOut) return;
                          setOpen(false);
                          setIsSigningOut(true);
                          try {
                            await logout();
                          } finally {
                            setIsSigningOut(false);
                          }
                        }}
                        disabled={isSigningOut}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50/80 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {isSigningOut ? "Signing out..." : "Sign Out"}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    // Check localStorage cache first
    const cached = localStorage.getItem("gh_stars");
    const cachedAt = localStorage.getItem("gh_stars_at");
    const oneHour = 60 * 60 * 1000;

    if (cached && cachedAt && Date.now() - Number(cachedAt) < oneHour) {
      setStars(Number(cached));
      return;
    }

    // Fetch fresh
    fetch("https://api.github.com/repos/ashp15205/Placement-Chat")
      .then((res) => res.json())
      .then((data) => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
          localStorage.setItem("gh_stars", String(data.stargazers_count));
          localStorage.setItem("gh_stars_at", String(Date.now()));
        }
      })
      .catch(() => {
        // Use cached even if expired on failure
        if (cached) setStars(Number(cached));
      });
  }, []);

  return (
    <footer className="relative z-10 w-full bg-transparent pb-3">
      <div className="mx-auto max-w-7xl px-6">
        {/* Blending Separator Line */}
        <div className="mb-3 h-px w-full bg-gradient-to-r from-transparent via-slate-200/60 to-transparent" />

        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Left: Brand */}
          <div className="flex w-full items-center justify-center md:w-1/3 md:justify-start">
            <Link href="/" className="group flex items-center gap-2">
              <Logo className="h-6 w-6 transition-transform group-hover:scale-110" />
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-800">
                Placement Chat
              </span>
            </Link>
          </div>

          {/* Middle: Star the repo (Real-time Custom Badge) */}
          <div className="flex w-full items-center justify-center md:w-1/3">
            <a
              href="https://github.com/ashp15205/Placement-Chat"
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 group-hover:text-slate-800 transition-colors">
                Star on GitHub
              </span>
              <div className="flex h-7 items-center overflow-hidden rounded-[6px] bg-slate-900 px-3 text-[10px] font-black uppercase tracking-widest text-white shadow-sm ring-1 ring-inset ring-white/10 group-hover:bg-black transition-colors">
                <div className="mr-3 flex items-center gap-2 border-r border-white/10 pr-3">
                  <GithubIcon className="h-4 w-4" />
                  <span>GitHub</span>
                </div>
                <div className="flex items-center gap-1.5 pl-0">
                  <StarIcon className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{stars !== null ? stars : "—"}</span>
                </div>
              </div>
            </a>
          </div>

          {/* Right: Credits */}
          <div className="flex w-full items-center justify-center gap-3 md:w-1/3 md:justify-end">
            <div className="text-center text-[10px] font-black uppercase tracking-[0.16em] text-slate-800 md:text-right">
              Developed by Ashish Patil
            </div>
            <a
              href="https://www.linkedin.com/in/ashishpatil2005/"
              target="_blank"
              rel="noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/70 bg-white/40 shadow-sm transition-all hover:bg-slate-900 hover:text-white md:h-9 md:w-9"
            >
              <LinkedInIcon className="h-4 w-4 md:h-4.5 md:w-4.5" />
            </a>
          </div>
        </div>

        <div className="mt-1 flex flex-col items-center justify-center gap-1">
          <div className="text-[10px] font-black tracking-[0.14em] text-slate-500 opacity-60">
            © 2026 Placement Chat
          </div>
          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <span className="opacity-40">&middot;</span>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

