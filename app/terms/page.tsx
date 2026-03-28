"use client";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-slate-900">
      <div className="frost-strong rounded-[48px] p-12 space-y-8">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Platform Governance</p>
          <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Effective Date: March 28, 2026</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-slate-700 font-medium">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">1. Community Standards</h2>
            <p>PlacementChat is a professional community of students. All interview experiences shared must be truthful, constructive, and respectful to the companies and interviewers involved. We do not tolerate hate speech or harassment.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">2. Content Ownership</h2>
            <p>You retain ownership of the content you share. However, by sharing it, you grant PlacementChat a license to display and distribute it within the platform. Content that violates our guidelines may be moderated or removed.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">3. Acceptable Use</h2>
            <p>The platform is for interview preparation only. Any attempt to scrape data, automate submissions, or use the information for commercial purposes is strictly prohibited.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">4. Platform Integrity</h2>
            <p>Access to certain features requires Google authentication and a verified profile. We take reasonable steps to ensure data integrity but are not responsible for any inaccuracies in user-submitted experiences.</p>
          </section>

          <div className="pt-8 border-t border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Violations of these terms may result in account termination and content removal.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
