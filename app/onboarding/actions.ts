"use server";

import { createClient } from "@/lib/supabase/server";
import { BRANCH_OPTIONS, type Branch } from "@/lib/types";

type OnboardingPayload = {
  full_name?: string;
  college_name: string;
  degree: string;
  branch: string;
  grad_year: number;
  linkedin_url?: string;
};

function normalizeLinkedInUrl(raw: string | undefined) {
  if (!raw) return null;

  const value = raw.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const isLinkedIn = host === "linkedin.com" || host === "www.linkedin.com";
    if (parsed.protocol !== "https:" || !isLinkedIn) {
      return { ok: false as const, message: "LinkedIn URL must be a valid https://linkedin.com profile URL." };
    }
    return { ok: true as const, value: parsed.toString() };
  } catch {
    return { ok: false as const, message: "LinkedIn URL is invalid." };
  }
}

export async function completeOnboardingAction(payload: OnboardingPayload) {
  const branchSet = new Set<string>(BRANCH_OPTIONS);
  const collegeName = payload.college_name?.trim();
  const degree = payload.degree?.trim();
  const branch = payload.branch?.trim();
  const fullName = payload.full_name?.trim();
  const linkedin = normalizeLinkedInUrl(payload.linkedin_url);
  const gradYear = Number(payload.grad_year);

  if (!collegeName || !degree || !branch || !Number.isInteger(gradYear)) {
    return { ok: false, message: "Please complete all required fields (*)" };
  }
  if (!branchSet.has(branch)) {
    return { ok: false, message: "Invalid branch selected." };
  }
  if (gradYear < 2020 || gradYear > 2040) {
    return { ok: false, message: "Enter a valid batch year." };
  }
  if (linkedin && !linkedin.ok) {
    return { ok: false, message: linkedin.message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Session expired. Please sign in again." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({
      user_id: user.id,
      full_name: fullName || null,
      college_name: collegeName,
      degree,
      branch: branch as Branch,
      grad_year: gradYear,
      linkedin_url: linkedin?.ok ? linkedin.value : null,
    })
    .select("user_id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  const preferredName = fullName || null;
  if (preferredName) {
    await supabase
      .from("experiences")
      .update({ author_name: preferredName, college: collegeName })
      .eq("user_id", user.id)
      .eq("anonymous", false);
  }

  return { ok: true, message: "Onboarding complete." };
}
