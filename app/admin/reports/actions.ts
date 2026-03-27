"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isReportStatus, requireAdminSession } from "@/lib/admin-access";

export async function updateReportStatusAction(reportId: string, nextStatus: string) {
  const session = await requireAdminSession();
  if (!session.ok) {
    return;
  }

  if (!reportId?.trim() || !isReportStatus(nextStatus)) {
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({ status: nextStatus })
    .eq("id", reportId);

  if (error) {
    return;
  }

  revalidatePath("/admin/reports");
}
