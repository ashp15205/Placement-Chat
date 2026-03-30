"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Lock,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BRANCH_OPTIONS, type Experience } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { useAuth } from "@/components/auth-provider";
import { useCommunityData } from "@/lib/use-community-data";
import { upsertExperienceAction } from "./actions";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

type RoundDraft = {
  roundType: string;
  duration: string;
  summary: string;
  questions: string[];
};

const TOPICS = [
  "DSA", "System Design", "OOP", "DBMS", "OS", "CN", "VLSI", "Embedded", "HR", "Aptitude"
];

const countWords = (str: string) => {
  return str.trim().split(/\s+/).filter(Boolean).length;
};

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 10;

const NEXT_STEP: Record<1 | 2 | 3 | 4 | 5, 1 | 2 | 3 | 4 | 5> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 5 };
const PREV_STEP: Record<1 | 2 | 3 | 4 | 5, 1 | 2 | 3 | 4 | 5> = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 4 };

export function ShareForm() {
  const { user, profile } = useAuth();
  const community = useCommunityData();
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [anonymous, setAnonymous] = useState(false);

  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("");
  const [type, setType] = useState<"Internship" | "Placement">("Internship");
  const [access, setAccess] = useState<"On-Campus" | "Off-Campus">("On-Campus");
  const [compensation, setCompensation] = useState("");
  const [branch, setBranch] = useState("Computer Science");
  const [result, setResult] = useState<"Selected" | "Rejected" | "Waitlisted">("Selected");
  const [month, setMonth] = useState("January");
  const [year, setYear] = useState((profile?.grad_year ?? 2025).toString());
  const [rounds, setRounds] = useState<RoundDraft[]>([
    { roundType: "Technical Interview", duration: "45 mins", summary: "", questions: [""] },
  ]);
  const [totalRounds, setTotalRounds] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [overview, setOverview] = useState("");
  const [tips, setTips] = useState("");
  const [source, setSource] = useState("");
  const [showOther, setShowOther] = useState(false);
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const parsedTotalRounds = useMemo(() => {
    const n = Number(totalRounds);
    if (!totalRounds || !Number.isFinite(n)) return MAX_ROUNDS;
    return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Math.floor(n)));
  }, [totalRounds]);
  const maxRoundsAllowed = parsedTotalRounds;

  useEffect(() => {
    if (rounds.length <= maxRoundsAllowed) return;
    setRounds((prev) => prev.slice(0, maxRoundsAllowed));
    setMessage(`Reduced rounds to ${maxRoundsAllowed} based on total process rounds.`);
  }, [maxRoundsAllowed, rounds.length]);

  useEffect(() => {
    if (!editId || !user) return;
    const fetchExp = async () => {
      const { data: exp } = await supabase
        .from("experiences")
        .select(
          "id, user_id, company_name, company_location, role_name, opportunity_type, recruitment_route, compensation, branch, selection_status, month_label, hiring_year, rounds_detail, total_rounds, topics, sources, difficulty_label, overview, prep_tips, anonymous",
        )
        .eq("id", editId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!exp) return;

      setCompany(exp.company_name || "");
      setCity(exp.company_location || "");
      setRole(exp.role_name || "");
      setType(exp.opportunity_type === "Placement" ? "Placement" : "Internship");
      setAccess(exp.recruitment_route === "Off-Campus" ? "Off-Campus" : "On-Campus");
      setCompensation(exp.compensation || "");
      setBranch(exp.branch || "Computer Science");
      setResult(exp.selection_status === "Waitlisted" || exp.selection_status === "Rejected" ? exp.selection_status : "Selected");
      setMonth(exp.month_label?.split(" ")[0] || "January");
      setYear(exp.hiring_year?.toString() || "2025");
      if (Array.isArray(exp.rounds_detail) && exp.rounds_detail.length > 0) {
        setRounds(
          exp.rounds_detail
            .map((r) => {
              if (!r || typeof r !== "object") return null;
              const candidate = r as Partial<{ title: string; duration: string; summary: string; questions: string[] }>;
              return {
                roundType: candidate.title || "Technical Round",
                duration: candidate.duration || "45 mins",
                summary: candidate.summary || "",
                questions: Array.isArray(candidate.questions) ? candidate.questions : [""],
              };
            })
            .filter((r): r is RoundDraft => r !== null),
        );
      }
      const safeTotalRounds = Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Number(exp.total_rounds || 3)));
      setTotalRounds(safeTotalRounds.toString());
      setTopics(exp.topics || []);
      setSource(exp.sources?.[0] || "");
      setDifficulty(exp.difficulty_label === "Easy" || exp.difficulty_label === "Hard" ? exp.difficulty_label : "Medium");
      setOverview(exp.overview || "");
      setTips(exp.prep_tips || "");
      setAnonymous(!!exp.anonymous);
    };
    fetchExp();
  }, [editId, supabase, user]);

  useEffect(() => {
    if (editId) return;
    if (!profile?.grad_year) return;
    setYear(profile.grad_year.toString());
  }, [editId, profile?.grad_year]);

  const updateRound = (index: number, data: Partial<RoundDraft>) => {
    const next = [...rounds];
    next[index] = { ...next[index], ...data };
    setRounds(next);
  };

  const addRound = () => {
    if (rounds.length >= maxRoundsAllowed) {
      setMessage(`You can add up to ${maxRoundsAllowed} rounds.`);
      return;
    }
    setMessage("");
    setRounds([...rounds, { roundType: "Technical Interview", duration: "45 mins", summary: "", questions: [""] }]);
  };

  const removeRound = (index: number) => {
    if (rounds.length <= 1) {
      setMessage("At least one round is required.");
      return;
    }
    setMessage("");
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const addQuestion = (index: number) => {
    const next = [...rounds];
    next[index].questions.push("");
    setRounds(next);
  };

  const validateStep = (s: number) => {
    if (s === 1) {
      if (!company.trim() || !role.trim() || !city.trim()) {
        setMessage("Please fill Company, Location and Role (*)");
        return false;
      }
      if (!totalRounds) {
        setMessage("Please enter the total number of hiring rounds.");
        return false;
      }
      const tr = Number(totalRounds);
      if (tr < 1) {
        setMessage("Total Hiring Rounds must be at least 1.");
        return false;
      }
      if (tr > 10) {
        setMessage("Maximum 10 rounds allowed. Please enter a proper number.");
        return false;
      }
    }
    if (s === 2) {
      if (rounds.length < 1) {
        setMessage("Please add at least one interview round.");
        return false;
      }
      if (rounds.length > maxRoundsAllowed) {
        setMessage(`You can add up to ${maxRoundsAllowed} rounds.`);
        return false;
      }
      const invalidRound = rounds.find(r => !r.roundType.trim() || !r.duration.trim() || !r.summary.trim());
      if (invalidRound) {
        setMessage("Please fill Title, Duration and Summary for all rounds (*)");
        return false;
      }
    }
    if (s === 3) {
      if (topics.length === 0 && !customTopic.trim()) {
        setMessage("Please select at least one topic.");
        return false;
      }
    }
    if (s === 4) {
      if (!overview.trim() || !tips.trim()) {
        setMessage("Please provide an overview and prep tips (*)");
        return false;
      }
    }
    setMessage("");
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => NEXT_STEP[prev]);
    }
  };

  const [hp, setHp] = useState("");
  const withTimeout = async <T,>(promise: Promise<T>, ms = 30000): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out after 30 seconds. Please try again.")), ms);
      }),
    ]);
  };

  const handlePublish = async () => {
    if (!user) {
      setMessage("Authenticated session required.");
      return;
    }

    if (hp) {
      setMessage("Bot activity detected. Form rejected.");
      return;
    }

    if (!validateStep(4)) return;

    setPending(true);
    setMessage("");

    if (rounds.length < 1) {
      setMessage("At least one round is required.");
      setPending(false);
      return;
    }
    const finalTopics = [...new Set([...topics, customTopic.trim()].filter(Boolean))];

    const entry = {
      author_name: anonymous ? "Anonymous" : (profile?.full_name || profile?.display_name || "Member"),
      college: profile?.college_name || "Unknown Institution",
      company_name: company.trim(),
      company_location: city.trim(),
      role_name: role.trim(),
      opportunity_type: type,
      recruitment_route: access,
      compensation: compensation.trim() || undefined,
      sources: access === "Off-Campus" && source.trim() ? [source.trim()] : undefined,
      branch: branch as Experience["branch"],
      hiring_year: Number.isFinite(Number(year)) ? Number(year) : new Date().getFullYear(),
      month_label: `${month} ${year}`,
      rounds_count: rounds.length,
      total_rounds: parsedTotalRounds,
      topics: finalTopics,
      selection_status: result,
      difficulty_score: difficulty === "Easy" ? 2 : difficulty === "Medium" ? 3 : 5,
      difficulty_label: difficulty,
      overview: overview.trim(),
      rounds_summary: overview.trim(),
      rounds_detail: rounds.map((r) => ({
        title: r.roundType.trim(),
        duration: r.duration || "N/A",
        summary: r.summary.trim(),
        questions: r.questions.map((q) => q.trim()).filter(Boolean).slice(0, 20),
      })),
      prep_tips: tips.trim(),
      anonymous,
    };

    try {
      const result = await withTimeout(upsertExperienceAction(entry, editId), 30000);
      if (!result.ok) {
        setMessage(`Error: ${result.message || "Could not publish right now. Please try again."}`);
        setOk(false);
      } else {
        setOk(true);
        setMessage(result.message || "Successfully published.");
        setTimeout(() => { window.location.href = "/feed"; }, 3000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Check connection";
      setMessage(`Unexpected error: ${message}`);
      setOk(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-12 animate-in fade-in duration-700">
      <div className="mb-6 px-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Share your experience</h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">Contribute to the community</p>
      </div>

      <div className="mb-6 flex items-center gap-1.5 h-1 px-1">
        {[1, 2, 3, 4, 5].map((s, i) => (
          <div key={i} className={cn("h-full flex-1 rounded-full transition-all duration-700", step >= i + 1 ? "bg-slate-900" : "bg-slate-200")} />
        ))}
      </div>

      <AnimatePresence>
        {ok && step === 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="frost-strong w-full max-w-sm rounded-[40px] p-8 text-center shadow-2xl border-white"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">Thank You!</h3>
              <p className="mt-3 text-sm font-medium text-slate-500 leading-relaxed">
                Your experience has been shared with the community. You're helping thousands of students prepare better.
              </p>
              <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="h-1 w-12 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 2, ease: "linear" }}
                    className="h-full w-full bg-emerald-500"
                  />
                </div>
                Redirecting to feed...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn("frost-strong rounded-[32px] border p-4 transition-all duration-300 md:p-8", step === 5 ? "min-h-0" : "min-h-[420px] md:min-h-[500px]")}
        >
          {/* Honeypot for simple boat detection */}
          <div className="absolute opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true">
            <input
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={e => setHp(e.target.value)}
              placeholder="Fax Number"
            />
          </div>
          {step === 1 && (
            <div className="space-y-6 text-left">
              <div className="grid gap-4 sm:grid-cols-2">
                <AutocompleteInput
                  label="Company *"
                  placeholder="Company Name"
                  value={company}
                  onChange={setCompany}
                  suggestions={community.companies}
                />
                <AutocompleteInput
                  label="Location *"
                  placeholder="City"
                  value={city}
                  onChange={setCity}
                  suggestions={community.cities}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AutocompleteInput
                  label="Role / Position *"
                  placeholder="e.g. SDE"
                  value={role}
                  onChange={setRole}
                  suggestions={community.roles}
                />
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Branch *</p>
                  <select value={branch} onChange={e => setBranch(e.target.value)} className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none appearance-none cursor-pointer">
                    {BRANCH_OPTIONS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Opportunity Type *</p>
                  <div className="flex h-11 soft-pill rounded-xl p-1">
                    {(["Internship", "Placement"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setType(t)} className={cn("flex-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", type === t ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900")}> {t} </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-2">{type === 'Internship' ? 'Stipend/month (Optional)' : 'CTC (Optional)'}</p>
                  <input value={compensation} onChange={e => setCompensation(e.target.value)} placeholder={type === 'Internship' ? "eg: 40k/month" : "eg: 8/LPA "} className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Recruitment Route *</p>
                  <div className="flex h-11 soft-pill rounded-xl p-1">
                    {(["On-Campus", "Off-Campus"] as const).map((a) => (
                      <button key={a} type="button" onClick={() => setAccess(a)} className={cn("flex-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", access === a ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900")}> {a} </button>
                    ))}
                  </div>
                </div>

                {access === "Off-Campus" && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-right-1 duration-200">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Source (Where did you find it?)</p>
                    <input
                      value={source}
                      onChange={e => setSource(e.target.value)}
                      placeholder="e.g. LinkedIn, Referral, Company Portal"
                      className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Interview Month *</p>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none appearance-none cursor-pointer"
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Year *</p>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none appearance-none cursor-pointer"
                  >
                    {Array.from({ length: 21 }, (_, i) => 2020 + i).map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Total Hiring Rounds *</p>
                  <input
                    type="number"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(e.target.value)}
                    placeholder="e.g. 3"
                    className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all"
                  />
                  {totalRounds && Number(totalRounds) >= 7 && Number(totalRounds) <= 10 && (
                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 animate-in fade-in slide-in-from-top-1 ml-1 font-bold">
                      That's a lot of rounds — are you sure?
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-black/5 pb-4">
                <div className="space-y-1 text-left">
                  <h3 className="text-xl font-bold tracking-tight text-slate-900">Interview Rounds</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Detail the specifics of each evaluation round.</p>
                </div>
              </div>

              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center px-1">
                <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
                  <button type="button" onClick={addRound} disabled={rounds.length >= maxRoundsAllowed} className="flex items-center gap-2 soft-button rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"> <Plus className="h-3 w-3" /> Add Round </button>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-bold">
                    You can add up to {maxRoundsAllowed} rounds and click on add round to add rounds.
                  </p>
                </div>
              </div>

              <div className="custom-scrollbar max-h-[450px] space-y-6 overflow-y-auto pr-0 md:pr-2">
                {rounds.map((round, idx) => (
                  <div key={idx} className="group relative space-y-4 rounded-2xl border-2 border-zinc-100 bg-zinc-50/30 p-5 transition-all hover:border-black/20">
                    <button type="button" onClick={() => removeRound(idx)} disabled={rounds.length === 1} className="absolute right-4 top-4 text-muted-foreground hover:text-rose-500 transition-all disabled:opacity-40 disabled:hover:text-muted-foreground"> <Trash2 className="h-4 w-4" /> </button>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Round Title *</p>
                        <input value={round.roundType} onChange={e => updateRound(idx, { roundType: e.target.value })} placeholder="Round Name" className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Duration *</p>
                        <input value={round.duration} onChange={e => updateRound(idx, { duration: e.target.value })} placeholder="eg: 45 mins" className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between ml-1">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-700">Round Summary *</p>
                        <span className={cn("text-[8px] font-black uppercase", countWords(round.summary) > 100 ? "text-red-500" : "text-slate-400")}>
                          {countWords(round.summary)}/100 Words
                        </span>
                      </div>
                      <textarea value={round.summary} onChange={e => updateRound(idx, { summary: e.target.value })} placeholder="Describe the evaluation criteria and complexity..." rows={3} className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all resize-none" />
                    </div>


                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Questions Asked</p>
                      <div className="space-y-2">
                        {round.questions.map((q, qi) => (
                          <div key={qi} className="group relative flex flex-col gap-1">
                            <div className="relative flex items-center">
                              <input value={q} onChange={e => { const qs = [...round.questions]; qs[qi] = e.target.value; updateRound(idx, { questions: qs }); }} placeholder={`Question ${qi + 1}`} className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all" />
                              {round.questions.length > 1 && (<button type="button" onClick={() => { const qs = round.questions.filter((_, i) => i !== qi); updateRound(idx, { questions: qs }); }} className="absolute right-3 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"> <Trash2 className="h-3.5 w-3.5" /> </button>)}
                            </div>
                            <span className={cn("text-[7px] font-black uppercase ml-2", countWords(q) > 50 ? "text-red-500" : "text-slate-400")}>
                              {countWords(q)}/50 Words
                            </span>
                          </div>
                        ))}
                      </div>

                      <button type="button" onClick={() => addQuestion(idx)} className="text-[8px] font-black uppercase tracking-widest text-black hover:opacity-70 px-3 py-1.5 bg-zinc-100 rounded-lg transition-all ml-1 border border-black/5">+ Add Line</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Evaluation Topics</p>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(t => (
                    <button key={t} type="button" onClick={() => setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} className={cn("rounded-lg px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all border-2", topics.includes(t) ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white/80 border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white")}> {t} </button>
                  ))}
                  <button type="button" onClick={() => setShowOther(!showOther)} className={cn("rounded-lg px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all border-2", showOther ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white/80 border-slate-300 text-slate-900 hover:bg-slate-900 hover:text-white")}> Other </button>
                </div>
                {showOther && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <input value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="Specify other topic..." className="soft-input w-full max-w-sm rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all" />
                  </div>
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Selection Result *</p>
                  <div className="grid gap-2">
                    {(["Selected", "Waitlisted", "Rejected"] as const).map((res) => (
                      <button key={res} type="button" onClick={() => setResult(res)} className={cn("flex items-center justify-between rounded-xl border-2 px-4 py-3 text-[9px] font-black uppercase tracking-widest transition-all", result === res ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white border-black text-black hover:bg-zinc-50")}> {res} {result === res && <CheckCircle2 className="h-4 w-4" />} </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700 ml-1">Difficulty *</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Easy", "Medium", "Hard"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={cn(
                          "rounded-xl border-2 px-3 py-3 text-[9px] font-black uppercase tracking-widest transition-all",
                          difficulty === level ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-black border-black hover:bg-zinc-50",
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700">Overall Experience Overview *</p>
                  <span className={cn("text-[8px] font-black uppercase", countWords(overview) > 100 ? "text-red-500" : "text-slate-400")}>
                    {countWords(overview)}/100 Words
                  </span>
                </div>
                <textarea value={overview} onChange={e => setOverview(e.target.value)} placeholder="Summarize your entire journey in a few paragraphs..." rows={3} className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all resize-none shadow-sm" />
              </div>


              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-700">Preparation Tips *</p>
                  <span className={cn("text-[8px] font-black uppercase", countWords(tips) > 100 ? "text-red-500" : "text-slate-400")}>
                    {countWords(tips)}/100 Words
                  </span>
                </div>
                <textarea value={tips} onChange={e => setTips(e.target.value)} placeholder="Strategies, resources, or advice for future candidates..." rows={6} className="soft-input w-full rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all resize-none shadow-sm" />
              </div>

            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 flex flex-col items-center justify-center py-4">
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold tracking-tight">Preview & Publish</h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Review your experience before publishing.</p>
              </div>

              <div className="frost w-full rounded-2xl border p-5 space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Preview</p>
                <h4 className="text-xl font-bold">{company} - {role}</h4>
                <p className="text-xs text-muted-foreground">{branch} | {result} | {difficulty}</p>
                <p className="text-xs font-medium line-clamp-3">{overview}</p>
                <p className="text-[10px] text-muted-foreground">Rounds: {rounds.length} | Topics: {[...topics, customTopic.trim()].filter(Boolean).length}</p>
              </div>

              <div className="grid gap-4 w-full max-w-md">
                <button
                  type="button"
                  onClick={() => setAnonymous(false)}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all text-left",
                    !anonymous ? "bg-black border-black shadow-xl scale-[1.02]" : "bg-white border-black/10 hover:border-black"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-black text-xs", !anonymous ? "bg-white text-black" : "bg-zinc-100 text-zinc-400 uppercase")}>
                    {(profile?.full_name?.[0] || profile?.display_name?.[0] || user?.email?.[0] || 'U')}
                  </div>
                  <div>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", !anonymous ? "text-white" : "text-black")}>Post as {(profile?.full_name || profile?.display_name || "Student").split(" ")[0]}</p>
                    <p className={cn("text-[8px] font-bold uppercase tracking-widest transition-all", !anonymous ? "text-white/40" : "text-muted-foreground")}>Community profile visible</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAnonymous(true)}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all text-left",
                    anonymous ? "bg-black border-black shadow-xl scale-[1.02]" : "bg-white border-black/10 hover:border-black"
                  )}
                >
                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-black text-xs", anonymous ? "bg-white text-black" : "bg-zinc-100 text-zinc-400")}> <Lock className="h-4 w-4" /> </div>
                  <div>
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", anonymous ? "text-white" : "text-black")}>Post Anonymously</p>
                    <p className={cn("text-[8px] font-bold uppercase tracking-widest transition-all", anonymous ? "text-white/40" : "text-muted-foreground")}>Hide identity from community</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={() => setStep((prev) => PREV_STEP[prev])} disabled={step === 1 || pending} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 disabled:opacity-0 transition-all"> <ChevronLeft className="h-4 w-4" /> Previous </button>
            <div className="flex gap-3 sm:gap-4">
              {step < 5 ? (
                <button type="button" onClick={handleNext} className="flex items-center gap-2 soft-button rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:opacity-90 active:scale-95 transition-all shadow-xl"> Next Step <ChevronRight className="h-4 w-4" /> </button>
              ) : (
                <button type="button" disabled={pending || ok} onClick={handlePublish} className="flex items-center gap-2 soft-button rounded-xl px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-xl"> {pending ? "Posting..." : ok ? "Published" : "Post Experience"} </button>
              )}
            </div>
          </div>
          {message && <p className={cn("mt-6 text-center text-[9px] font-black uppercase tracking-widest animate-in fade-in duration-300", ok ? "text-emerald-600" : "text-rose-500")}> {message} </p>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
