"use client";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20 text-slate-900">
      <div className="frost-strong rounded-[48px] p-12 space-y-8">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Legal Architecture</p>
          <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Effective Date: March 28, 2026</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-slate-700 font-medium">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">1. Information We Collect</h2>
            <p>We collect information directly from you when you sign in via Google and share interview experiences. This includes your name, email address, college, and any details you provide about your professional journey.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">2. How We Use Your Data</h2>
            <p>Your data is used to maintain a verified community of students. Non-anonymous posts display your name and college to build trust. Anonymous posts hide your identity while preserving the professional value of the shared experience.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">3. Data Sovereignty</h2>
            <p>You have full control over your data. You can edit or delete your shared experiences at any time from your profile. You can also permanently delete your account and all associated data from the profile settings.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase tracking-[0.1em]">4. Authentication</h2>
            <p>Authentication is handled securely via Supabase and Google OAuth. We do not store your passwords. Your session data is encrypted and handled according to industry standards.</p>
          </section>

          <div className="pt-8 border-t border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              For privacy-related inquiries, contact the developer via the official repository.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
