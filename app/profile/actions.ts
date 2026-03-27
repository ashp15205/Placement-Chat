"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteExperienceAction(experienceId: string) {
  if (!experienceId) {
    return { ok: false, message: "Invalid post id." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Session expired. Please sign in again." };
  }

  const { error } = await supabase
    .from("experiences")
    .delete()
    .eq("id", experienceId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function deleteAccountAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Session expired. Please sign in again." };
  }

  const userId = user.id;

  const [likesRes, savesRes, expRes, profileRes] = await Promise.all([
    supabase.from("likes").delete().eq("user_id", userId),
    supabase.from("saves").delete().eq("user_id", userId),
    supabase.from("experiences").delete().eq("user_id", userId),
    supabase.from("profiles").delete().eq("user_id", userId),
  ]);

  const rowDeleteError = likesRes.error || savesRes.error || expRes.error || profileRes.error;
  if (rowDeleteError) {
    return { ok: false, message: rowDeleteError.message };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return { ok: false, message: error.message };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Could not complete account deletion.";
    return { ok: false, message };
  }

  return { ok: true };
}
