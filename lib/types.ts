export const BRANCH_OPTIONS = [
  "Computer Science",
  "Information Technology",
  "Electronics and Communication",
  "Electrical",
  "Mechanical",
  "Civil",
  "Chemical",
  "Production",
  "Other",
] as const;

export const ROUND_TYPES = [
  "Online Assessment",
  "Technical Interview",
  "Managerial Interview",
  "HR Interview",
  "Group Discussion",
  "Case Study",
] as const;

export type Branch = (typeof BRANCH_OPTIONS)[number];
export type RoundType = (typeof ROUND_TYPES)[number];

export type Experience = {
  id: string;
  user_id: string;
  author_name?: string;
  college?: string;
  company_location?: string;
  company_name: string;
  role_name: string;
  opportunity_type?: string;
  recruitment_route?: "On-Campus" | "Off-Campus";
  compensation?: string;
  branch: Branch;
  hiring_year: number;
  selection_status: "Selected" | "Rejected" | "Waitlisted";
  difficulty_score: number;
  difficulty_label?: "Easy" | "Medium" | "Hard";
  rounds_count?: number;
  total_rounds?: number;
  topics?: string[];
  overview?: string;
  relative_time?: string;
  month_label?: string;
  rounds_summary: string;
  prep_tips: string;
  linkedin_url?: string;
  likes_count?: number;
  anonymous?: boolean;
  rounds_detail?: Array<{
    title: string;
    duration: string;
    summary: string;
    questions: string[];
  }>;
  created_at: string;
};

export type Profile = {
  user_id: string;
  full_name?: string;
  display_name?: string;
  college_name: string;
  degree: string;
  branch: Branch;
  grad_year: number;
  linkedin_url?: string;
  created_at: string;
};
