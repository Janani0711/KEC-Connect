import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRANCHES, PRESET_AVATARS, useProfile, initials } from "@/lib/kec";
import { User, Check, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — KEC Connect" },
      { name: "description", content: "Keep your KEC Connect profile current so seniors and students know who they're talking to." },
      { property: "og:title", content: "Your Profile — KEC Connect" },
      { property: "og:description", content: "Manage your KEC Connect profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [form, setForm] = useState({
    name: "",
    branch: "",
    year: "",
    batch: "",
    company: "",
    job_title: "",
    skills: "",
    bio: "",
  });

  useEffect(() => {
    if (!profile) return;
    setAvatarUrl(profile.avatar_url ?? PRESET_AVATARS[0]);
    setForm({
      name: profile.name ?? "",
      branch: profile.branch ?? "",
      year: profile.year ? String(profile.year) : "",
      batch: profile.batch ?? "",
      company: profile.company ?? "",
      job_title: profile.job_title ?? "",
      skills: (profile.skills ?? []).join(", "),
      bio: profile.bio ?? "",
    });
  }, [profile]);

  const isAlumni = profile?.role === "alumni";

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl || null,
          name: form.name.trim().slice(0, 100),
          branch: form.branch || null,
          year: form.year ? Number(form.year) : null,
          batch: form.batch.trim() || null,
          company: form.company.trim() || null,
          job_title: form.job_title.trim() || null,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 12),
          bio: form.bio.trim().slice(0, 600) || null,
        })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile & avatar updated successfully!");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-blue-600" />
          <span>Your Profile & Avatar</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Customize your profile and choose an avatar to represent you across the KEC network.
        </p>
      </header>

      {/* Avatar Selection Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Select Your Avatar</span>
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Current Selected Avatar Preview */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24 rounded-full border-4 border-blue-500/20 p-1 shadow-md overflow-hidden bg-slate-100 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Selected Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-slate-700">{initials(form.name)}</span>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-500">Current Avatar</span>
          </div>

          {/* Preset Avatars Grid */}
          <div className="flex-1 space-y-2">
            <p className="text-xs font-semibold text-slate-700">Choose from preset avatars:</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PRESET_AVATARS.map((url, idx) => {
                const isSelected = avatarUrl === url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`relative w-11 h-11 rounded-full p-0.5 border-2 transition-all cursor-pointer hover:scale-105 ${
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-500/30 scale-110"
                        : "border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full rounded-full object-cover" />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Avatar URL Input */}
            <div className="pt-2">
              <Label htmlFor="custom-avatar" className="text-xs text-slate-500">
                Or paste custom avatar image URL:
              </Label>
              <Input
                id="custom-avatar"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="mt-1 h-9 rounded-xl text-xs bg-slate-50 border-slate-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p-name" className="text-xs font-semibold text-slate-700">Full Name</Label>
          <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700">Department / Branch</Label>
          <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
            <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 z-50 max-h-48 overflow-y-auto">
              {BRANCHES.map((b) => (
                <SelectItem key={b} value={b} className="text-sm">
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAlumni ? (
          <div className="space-y-1.5">
            <Label htmlFor="p-batch" className="text-xs font-semibold text-slate-700">Graduation Batch</Label>
            <Input id="p-batch" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="e.g. 2020-2024" className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm" />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Current Year</Label>
            <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
              <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200 z-50">
                {["1", "2", "3", "4"].map((y) => (
                  <SelectItem key={y} value={y} className="text-sm">
                    Year {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isAlumni && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="p-company" className="text-xs font-semibold text-slate-700">Company</Label>
              <Input id="p-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Cognizant" className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-role" className="text-xs font-semibold text-slate-700">Job Title / Role</Label>
              <Input id="p-role" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} placeholder="Software Engineer" className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm" />
            </div>
          </>
        )}

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p-skills" className="text-xs font-semibold text-slate-700">Skills (comma separated)</Label>
          <Input id="p-skills" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Python, Machine Learning, System Design" className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm" />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="p-bio" className="text-xs font-semibold text-slate-700">Bio</Label>
          <Textarea id="p-bio" rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell junior students or fellow alumni about yourself..." className="rounded-xl bg-slate-50 border-slate-200 text-sm" />
        </div>

        <div className="sm:col-span-2 pt-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="h-11 px-8 bg-[#0F2847] hover:bg-[#163861] text-white font-semibold rounded-xl shadow-md transition-all">
            {save.isPending ? "Saving..." : "Save Profile & Avatar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
