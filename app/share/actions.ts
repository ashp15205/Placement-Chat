"use server";

import { createClient } from "@/lib/supabase/server";
import type { Experience } from "@/lib/types";

type ExperienceDraft = {
  author_name: string;
  college: string;
  company_name: string;
  company_location: string;
  role_name: string;
  opportunity_type: "Internship" | "Placement";
  recruitment_route: "On-Campus" | "Off-Campus";
  compensation?: string;
  branch: Experience["branch"];
  hiring_year: number;
  month_label: string;
  rounds_count: number;
  total_rounds: number;
  topics: string[];
  sources?: string[];
  selection_status: "Selected" | "Rejected" | "Waitlisted";
  difficulty_score: number;
  difficulty_label: "Easy" | "Medium" | "Hard";
  overview: string;
  rounds_summary: string;
  rounds_detail: Array<{
    title: string;
    duration: string;
    summary: string;
    questions: string[];
  }>;
  prep_tips: string;
  anonymous: boolean;
};

export async function upsertExperienceAction(payload: ExperienceDraft, editId?: string | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Session expired. Please sign in again." };
  }

  // Fetch the user's linkedin_url from their profile if they are not posting anonymously
  let linkedin_url: string | null = null;
  if (!payload.anonymous) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("linkedin_url")
      .eq("user_id", user.id)
      .maybeSingle();
    linkedin_url = profile?.linkedin_url || null;
  }

  const entry = {
    ...payload,
    user_id: user.id,
    linkedin_url,
  };

  if (editId) {
    const { error } = await supabase
      .from("experiences")
      .update(entry)
      .eq("id", editId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, message: "Updated successfully." };
  }

  const { error } = await supabase.from("experiences").insert([entry]);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Published successfully." };
}

