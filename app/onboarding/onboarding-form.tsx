"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BRANCH_OPTIONS, type Branch } from "@/lib/types";
import { motion } from "framer-motion";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { useCommunityData } from "@/lib/use-community-data";
import { completeOnboardingAction } from "./actions";
import { useAuth } from "@/components/auth-provider";

const isValidLinkedInUrl = (url: string) => {
  if (!url) return true;
  // Allows https, http, www, or direct linkedin.com/in/
  // Must contain /in/ to be a profile
  const regex = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?.*$/;
  return regex.test(url);
};


export function OnboardingForm({ next }: { next: string }) {
  const router = useRouter();
  const { refreshAuthState } = useAuth();
  const community = useCommunityData();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  const [collegeName, setCollegeName] = useState("");
  const [displayName, setDisplayName] = useState("");

  function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const degree = String(formData.get("degree") ?? "").trim();
    const branch = String(formData.get("branch") ?? "").trim();
    const gradYear = Number(formData.get("grad_year"));
    const linkedin_url = String(formData.get("linkedin_url") ?? "").trim();
    const fromFormFullName = String(formData.get("full_name") ?? "").trim();
    const finalFullName = fromFormFullName || displayName;

    if (!collegeName || !degree || !branch || !gradYear) {
      setMessage("Please complete all required fields (*)");
      return;
    }

    if (linkedin_url && !isValidLinkedInUrl(linkedin_url)) {
      setMessage("Please enter a valid LinkedIn profile URL (must be /in/...)");
      return;
    }


    setPending(true);
    setMessage("");
    try {
      const result = await withTimeout(
        completeOnboardingAction({
          full_name: finalFullName || undefined,
          college_name: collegeName,
          degree,
          branch: branch as Branch,
          grad_year: gradYear,
          linkedin_url: linkedin_url || undefined,
        }),
        60000,
        "Request timed out. Please try once more.",
      );
      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      await refreshAuthState();
      router.replace(next);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setMessage(text);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center transition-all">
      <motion.form
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full rounded-[32px] border-2 border-black p-8 bg-white shadow-2xl space-y-8"
      >
        <div className="space-y-1 text-center md:text-left mb-4">
          <h2 className="text-2xl font-bold text-black tracking-tight">Establish Identity</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-black ml-1">Full Name *</p>
            <input
              name="full_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none focus:bg-black focus:text-white transition-all"
            />
          </div>

          <div className="sm:col-span-2">
            <AutocompleteInput
              label="Institution *"
              placeholder="University Name"
              value={collegeName}
              onChange={setCollegeName}
              suggestions={community.colleges}
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-black ml-1">Degree *</p>
            <input name="degree" required placeholder="Course Name" className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none focus:bg-black focus:text-white transition-all" />
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-black ml-1">Branch *</p>
            <select name="branch" required className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none focus:border-black appearance-none cursor-pointer">
              {BRANCH_OPTIONS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-black ml-1">Graduation Year *</p>
            <input name="grad_year" type="number" min={2020} max={2030} defaultValue={2025} required className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none focus:bg-black focus:text-white transition-all" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-black ml-1">LinkedIn URL</p>
            <input name="linkedin_url" type="url" placeholder="https://linkedin.com/in/yourprofile" className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-xs font-bold outline-none focus:bg-black focus:text-white transition-all" />
          </div>

          <div className="sm:col-span-2 pt-4">
            {message && <p className="text-center text-[10px] font-black text-rose-500 mb-6 uppercase tracking-widest">{message}</p>}
            <button disabled={pending} className="w-full flex items-center justify-center rounded-xl bg-black h-12 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-xl">
              {pending ? "Establishing Identity..." : "Finish Onboarding"}
            </button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
