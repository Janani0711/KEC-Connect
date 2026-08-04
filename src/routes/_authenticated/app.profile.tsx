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
import { BRANCHES, useProfile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — KEC Connect" },
      { name: "description", content: "Keep your KEC Connect profile current so seniors and students know who they're talking to." },
      { property: "og:title", content: "Your profile — KEC Connect" },
      { property: "og:description", content: "Manage your KEC Connect profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile } = useProfile();
  const qc = useQueryClient();
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
      toast.success("Profile updated.");
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["directory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-3xl">Your profile</h1>
        <p className="mt-2 text-muted-foreground">
          This is what seniors and students see before they reply to you.
        </p>
      </header>

      <div className="panel grid gap-4 p-6 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="p-name">Name</Label>
          <Input id="p-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Branch</Label>
          <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {BRANCHES.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isAlumni ? (
          <div className="space-y-2">
            <Label htmlFor="p-batch">Batch</Label>
            <Input id="p-batch" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="2021" />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Year</Label>
            <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {["1", "2", "3", "4"].map((y) => (
                  <SelectItem key={y} value={y}>
                    Year {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {isAlumni && (
          <>
            <div className="space-y-2">
              <Label htmlFor="p-company">Company</Label>
              <Input id="p-company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-role">Job title</Label>
              <Input id="p-role" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
            </div>
          </>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="p-skills">Skills / helping with (comma separated)</Label>
          <Input
            id="p-skills"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="DSA, resume review, embedded systems"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="p-bio">Bio</Label>
          <Textarea
            id="p-bio"
            rows={4}
            maxLength={600}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
