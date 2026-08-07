import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

export const BRANCHES = [
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "AIDS",
  "AIML",
  "CSD",
  "AUTO",
  "CHEM",
  "MTS",
  "FT",
  "BIOTECH",
  "EIE",
] as const;

export const ALUMNI_BATCHES = [
  "2020-2024",
  "2019-2023",
  "2018-2022",
  "2017-2021",
  "2016-2020",
  "2015-2019",
  "2014-2018",
  "2013-2017",
  "2012-2016",
  "2011-2015",
  "2010-2014",
  "2021-2025",
] as const;

export const ALUMNI_ROLES = [
  "Software Development Engineer (SDE)",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Scientist / Data Engineer",
  "AI / ML Engineer",
  "DevOps / Cloud Engineer",
  "Product Manager",
  "UI/UX Designer",
  "System Engineer",
  "Business Analyst",
  "Consultant / Technical Lead",
  "Founder / Entrepreneur",
  "Researcher / Higher Studies",
  "Other",
] as const;

export const CONNECT_TOPICS = [
  { value: "internship", label: "Internship guidance" },
  { value: "resume", label: "Resume review" },
  { value: "placement", label: "Placement prep" },
  { value: "project", label: "Project help" },
  { value: "other", label: "Something else" },
] as const;

export const STORY_TAGS = [
  { value: "placement_journey", label: "Placement journey" },
  { value: "career_advice", label: "Career advice" },
  { value: "life_at_company", label: "Life at a company" },
  { value: "higher_studies", label: "Higher studies" },
] as const;

export const OPENING_CATEGORIES = [
  { value: "internship", label: "Internship" },
  { value: "job", label: "Job" },
  { value: "hackathon", label: "Hackathon" },
  { value: "research", label: "Research" },
] as const;

export const RESOURCE_CATEGORIES = [
  { value: "aptitude", label: "Aptitude" },
  { value: "coding_sheet", label: "Coding sheets" },
  { value: "resume_template", label: "Resume templates" },
  { value: "interview_questions", label: "Past interview questions" },
  { value: "department_notes", label: "Department notes" },
] as const;

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function labelFor(list: readonly { value: string; label: string }[], value: string) {
  return list.find((i) => i.value === value)?.label ?? value;
}

/** Loose college-email shape check, e.g. 23ecr085@kongu.edu */
export const COLLEGE_EMAIL_RE = /^[a-z0-9._-]+@([a-z0-9-]+\.)*kongu\.edu$/i;

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });
}

export function canHost(p: Profile | null | undefined) {
  if (!p) return false;
  return p.role === "alumni" || (p.year ?? 0) >= 4;
}

export function initials(name: string | null | undefined) {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]!.toUpperCase())
    .join("");
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Directory of every member, keyed by id. Small enough for an MVP college network. */
export function useDirectory() {
  return useQuery({
    queryKey: ["directory"],
    queryFn: async (): Promise<Record<string, Profile>> => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
    },
    staleTime: 60_000,
  });
}
