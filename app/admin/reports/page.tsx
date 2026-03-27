import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin-access";
import { updateReportStatusAction } from "./actions";

type ReportRow = {
  id: string;
  reason: string;
  status: "open" | "reviewed" | "dismissed" | "actioned";
  created_at: string;
  experience_id: string;
  user_id: string;
  experiences?: {
    company_name?: string | null;
    role_name?: string | null;
    company_location?: string | null;
    hiring_year?: number | null;
  } | null;
};

export const metadata: Metadata = {
  title: "Admin Reports",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminReportsPage() {
  const session = await requireAdminSession();
  if (!session.ok) {
    redirect("/feed");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("reports")
    .select("id,reason,status,created_at,experience_id,user_id,experiences(company_name,role_name,company_location,hiring_year)")
    .order("created_at", { ascending: false })
    .limit(250);

  const rows = ((data as ReportRow[] | null) ?? []).filter(Boolean);
  const openRows = rows.filter((r) => r.status === "open");
  const reviewedRows = rows.filter((r) => r.status === "reviewed");
  const actionedRows = rows.filter((r) => r.status === "actioned");
  const dismissedRows = rows.filter((r) => r.status === "dismissed");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-14">
      <section className="frost-strong rounded-[32px] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Moderation Reports</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Review community flags and update case status.</p>
          </div>
          <Link
            href="/feed"
            className="soft-pill rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900"
          >
            Back to Feed
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <StatCard label="Open" value={openRows.length} />
          <StatCard label="Reviewed" value={reviewedRows.length} />
          <StatCard label="Actioned" value={actionedRows.length} />
          <StatCard label="Dismissed" value={dismissedRows.length} />
        </div>
        {error ? (
          <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
            Could not load reports: {error.message}
          </p>
        ) : null}
      </section>

      <section className="mt-8 space-y-6">
        <ReportSection title="Open Reports" reports={openRows} />
        <ReportSection title="Reviewed" reports={reviewedRows} />
        <ReportSection title="Actioned" reports={actionedRows} />
        <ReportSection title="Dismissed" reports={dismissedRows} />
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="frost rounded-2xl border px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function ReportSection({ title, reports }: { title: string; reports: ReportRow[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{title}</h2>
      {reports.length === 0 ? (
        <div className="frost rounded-2xl border px-5 py-4 text-xs font-medium text-slate-500">No reports in this bucket.</div>
      ) : (
        <div className="grid gap-3">
          {reports.map((report) => (
            <article key={report.id} className="frost rounded-2xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {report.experiences?.company_name || "Unknown Company"} - {report.experiences?.role_name || "Unknown Role"}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {report.experiences?.company_location || "Unknown Location"} {report.experiences?.hiring_year ? `• ${report.experiences.hiring_year}` : ""}
                  </p>
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{report.reason}</p>
                  <Link
                    href={`/feed/${report.experience_id}`}
                    className="inline-flex text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-slate-900 hover:underline"
                  >
                    View Experience
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusButton reportId={report.id} status="open" />
                  <StatusButton reportId={report.id} status="reviewed" />
                  <StatusButton reportId={report.id} status="actioned" />
                  <StatusButton reportId={report.id} status="dismissed" />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusButton({
  reportId,
  status,
}: {
  reportId: string;
  status: "open" | "reviewed" | "actioned" | "dismissed";
}) {
  return (
    <form action={updateReportStatusAction.bind(null, reportId, status)}>
      <button
        type="submit"
        className="soft-pill rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-800 hover:bg-slate-900 hover:text-white"
      >
        {status}
      </button>
    </form>
  );
}
