"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import { safeNextPath } from "@/lib/safe-next";
import { deleteAccountAction } from "@/app/profile/actions";

type AuthContextType = {
  isReady: boolean;
  user: User | null;
  profile: Profile | null;
  liked: string[];
  saved: string[];
  loginWithGoogle: (next?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (p: Partial<Profile>) => Promise<void>;
  requireLogin: (next?: string) => boolean;
  toggleLike: (id: string) => Promise<void>;
  toggleSave: (id: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
  refreshAuthState: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function sanitizeLinkedinUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const isLinkedIn = host === "linkedin.com" || host === "www.linkedin.com";
    if (parsed.protocol !== "https:" || !isLinkedIn) {
      throw new Error("LinkedIn URL must be a valid https://linkedin.com profile URL.");
    }
    return parsed.toString();
  } catch (err) {
    if (err instanceof Error && err.message.includes("linkedin.com")) throw err;
    throw new Error("LinkedIn URL is invalid. Use https://linkedin.com/in/yourprofile");
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const clearLocalAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setLiked([]);
    setSaved([]);
  }, []);

  const syncPostedIdentity = useCallback(async (currentUser: User, currentProfile: Profile | null) => {
    if (!currentProfile) return;
    const preferredName = currentProfile.full_name || currentProfile.display_name || null;
    if (!preferredName) return;

    await supabase
      .from("experiences")
      .update({ author_name: preferredName, college: currentProfile.college_name })
      .eq("user_id", currentUser.id)
      .eq("anonymous", false);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    const loadUserState = async (currentUser: User | null) => {
      try {
        if (cancelled) return;
        setUser(currentUser);

        if (!currentUser) {
          setProfile(null);
          setLiked([]);
          setSaved([]);
          return;
        }

        const [{ data: profileData }, { data: likesData }, { data: savesData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", currentUser.id).maybeSingle(),
          supabase.from("likes").select("experience_id").eq("user_id", currentUser.id),
          supabase.from("saves").select("experience_id").eq("user_id", currentUser.id),
        ]);

        if (cancelled) return;
        const resolvedProfile = (profileData as Profile | null) ?? null;
        setProfile(resolvedProfile);
        if (likesData) setLiked(likesData.map((l) => l.experience_id));
        if (savesData) setSaved(savesData.map((s) => s.experience_id));

      } finally {
        if (!cancelled) setIsReady(true);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data }) => {
        void loadUserState(data.session?.user ?? null);
      })
      .catch(() => {
        void loadUserState(null);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Keep callback synchronous; running awaited Supabase calls here can deadlock auth lock handling.
      queueMicrotask(() => {
        void loadUserState(session?.user ?? null);
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const loginWithGoogle = useCallback(async (next?: string) => {
    const origin = window.location.origin;
    const safeNext = safeNextPath(next, "/share");
    const redirectTo = next 
      ? `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`
      : `${origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
  }, [supabase]);

  const logout = useCallback(async () => {
    clearLocalAuthState();
    router.replace("/");
    router.refresh();
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // UI is already transitioned to signed-out state.
    }
  }, [supabase, clearLocalAuthState, router]);

  const updateProfile = useCallback(async (nextProfile: Partial<Profile>) => {
    if (!user) {
      throw new Error("Session expired. Please sign in again.");
    }

    const linkedinSafe = sanitizeLinkedinUrl(nextProfile.linkedin_url ?? null);

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        ...nextProfile,
        linkedin_url: linkedinSafe,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    if (data) {
      const savedProfile = data as Profile;
      setProfile(savedProfile);

      // Keep previously shared non-anonymous posts aligned with onboarding identity.
      await syncPostedIdentity(user, savedProfile);
    }
  }, [user, supabase, syncPostedIdentity]);

  const requireLogin = useCallback((next = pathname || "/") => {
    const target = encodeURIComponent(next);

    if (!user) {
      router.push(`/login?next=${target}`);
      return false;
    }

    if (!profile) {
      router.push(`/onboarding?next=${target}`);
      return false;
    }

    return true;
  }, [user, profile, pathname, router]);

  const toggleLike = useCallback(async (id: string) => {
    if (!requireLogin()) return;
    if (!user) return;

    const isLiked = liked.includes(id);
    if (isLiked) {
      setLiked(prev => prev.filter(x => x !== id));
      const { error } = await supabase.from("likes").delete().eq("user_id", user.id).eq("experience_id", id);
      if (error) {
        setLiked(prev => (prev.includes(id) ? prev : [id, ...prev]));
        throw new Error(error.message);
      }
    } else {
      setLiked(prev => (prev.includes(id) ? prev : [id, ...prev]));
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: user.id, experience_id: id });
      if (error) {
        const maybeCode = (error as { code?: string }).code;
        const maybeMessage = error.message?.toLowerCase() ?? "";
        const isDuplicate = maybeCode === "23505" || maybeMessage.includes("duplicate key");
        if (isDuplicate) return;
        setLiked(prev => prev.filter(x => x !== id));
        throw new Error(error.message);
      }
    }
  }, [requireLogin, user, liked, supabase]);

  const toggleSave = useCallback(async (id: string) => {
    if (!requireLogin()) return;
    if (!user) return;

    const isSaved = saved.includes(id);
    if (isSaved) {
      setSaved(prev => prev.filter(x => x !== id));
      const { error } = await supabase.from("saves").delete().eq("user_id", user.id).eq("experience_id", id);
      if (error) {
        setSaved(prev => (prev.includes(id) ? prev : [id, ...prev]));
        throw new Error(error.message);
      }
    } else {
      setSaved(prev => (prev.includes(id) ? prev : [id, ...prev]));
      const { error } = await supabase
        .from("saves")
        .insert({ user_id: user.id, experience_id: id });
      if (error) {
        const maybeCode = (error as { code?: string }).code;
        const maybeMessage = error.message?.toLowerCase() ?? "";
        const isDuplicate = maybeCode === "23505" || maybeMessage.includes("duplicate key");
        if (isDuplicate) return;
        setSaved(prev => prev.filter(x => x !== id));
        throw new Error(error.message);
      }
    }
  }, [requireLogin, user, saved, supabase]);

  const deleteAccount = useCallback(async () => {
    if (!user) return;

    const result = await deleteAccountAction();
    if (!result.ok) {
      throw new Error(result.message || "Could not delete account.");
    }

    try {
      await supabase.auth.signOut({ scope: "global" });
    } finally {
      clearLocalAuthState();
      router.replace("/?account_deleted=1");
      router.refresh();
    }
  }, [user, supabase, clearLocalAuthState, router]);

  const deleteExperience = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("experiences").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw new Error(error.message);
  }, [supabase, user]);

  const refreshAuthState = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (!currentUser) {
      setProfile(null);
      setLiked([]);
      setSaved([]);
      return;
    }

    const [{ data: profileData }, { data: likesData }, { data: savesData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", currentUser.id).maybeSingle(),
      supabase.from("likes").select("experience_id").eq("user_id", currentUser.id),
      supabase.from("saves").select("experience_id").eq("user_id", currentUser.id),
    ]);

    const resolvedProfile = (profileData as Profile | null) ?? null;
    setProfile(resolvedProfile);
    setLiked((likesData ?? []).map((l) => l.experience_id));
    setSaved((savesData ?? []).map((s) => s.experience_id));
  }, [supabase]);

  const value = useMemo<AuthContextType>(
    () => ({
      isReady,
      user,
      profile,
      liked,
      saved,
      loginWithGoogle,
      logout,
      updateProfile,
      requireLogin,
      toggleLike,
      toggleSave,
      deleteAccount,
      deleteExperience,
      refreshAuthState,
    }),
    [isReady, user, profile, liked, saved, loginWithGoogle, logout, updateProfile, requireLogin, toggleLike, toggleSave, deleteAccount, deleteExperience, refreshAuthState],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider.");
  return ctx;
}
