import { createClient } from "@/lib/supabase/server";

const ADMIN_STATUSES = ["open", "reviewed", "dismissed", "actioned"] as const;

export type ReportStatus = (typeof ADMIN_STATUSES)[number];

export function isReportStatus(value: string): value is ReportStatus {
  return (ADMIN_STATUSES as readonly string[]).includes(value);
}

function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const admins = getAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(email.trim().toLowerCase());
}

export async function requireAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return { ok: false as const };
  }

  return { ok: true as const, user };
}
