import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
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
import { STORY_TAGS, labelFor, timeAgo, useDirectory, useProfile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/stories")({
  head: () => ({
    meta: [
      { title: "Stories — KEC Connect" },
      {
        name: "description",
        content: "Placement journeys, career advice and higher-studies notes written by KEC alumni.",
      },
      { property: "og:title", content: "Stories — KEC Connect" },
      { property: "og:description", content: "What alumni wish they'd known." },
    ],
  }),
  component: StoriesPage,
});

function StoriesPage() {
  const { data: me } = useProfile();
  const { data: dir } = useDirectory();
  const qc = useQueryClient();
  const isAlumni = me?.role === "alumni";

  const [tagFilter, setTagFilter] = useState("all");
  const [draft, setDraft] = useState({ title: "", tag: "placement_journey", body: "" });
  const [writing, setWriting] = useState(false);

  const stories = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Not signed in");
      if (draft.title.trim().length < 5 || draft.body.trim().length < 50)
        throw new Error("Add a title and at least a few sentences.");
      const { error } = await supabase.from("stories").insert({
        alumni_id: me.id,
        title: draft.title.trim().slice(0, 200),
        tag: draft.tag as "career_advice",
        body: draft.body.trim().slice(0, 20000),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Story published.");
      setDraft({ title: "", tag: "placement_journey", body: "" });
      setWriting(false);
      qc.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = (stories.data ?? []).filter((s) => tagFilter === "all" || s.tag === tagFilter);
  const mine = (stories.data ?? []).filter((s) => s.alumni_id === me?.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Stories</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Honest accounts from people a few years ahead of you.
          </p>
        </div>
        {isAlumni && (
          <Button variant={writing ? "outline" : "default"} onClick={() => setWriting((v) => !v)}>
            {writing ? "Cancel" : "Write a story"}
          </Button>
        )}
      </header>

      {writing && (
        <div className="panel space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="s-title">Title</Label>
            <Input
              id="s-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="How I got placed after three rejections"
            />
          </div>
          <div className="space-y-2">
            <Label>Tag</Label>
            <Select value={draft.tag} onValueChange={(v) => setDraft({ ...draft, tag: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STORY_TAGS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-body">Story</Label>
            <Textarea
              id="s-body"
              rows={10}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="Start where you were, not where you ended up."
            />
          </div>
          <Button onClick={() => publish.mutate()} disabled={publish.isPending}>
            {publish.isPending ? "Publishing…" : "Publish"}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[{ value: "all", label: "All" }, ...STORY_TAGS].map((t) => (
          <button
            key={t.value}
            onClick={() => setTagFilter(t.value)}
            className={`rounded-full border px-3 py-1 text-xs ${
              tagFilter === t.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {visible.length ? (
          visible.map((s) => (
            <article key={s.id} className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl">{s.title}</h2>
                <Badge variant="outline">{labelFor(STORY_TAGS, s.tag)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {dir?.[s.alumni_id]?.name ?? "Alumnus"}
                {dir?.[s.alumni_id]?.company ? ` · ${dir[s.alumni_id]!.company}` : ""} ·{" "}
                {timeAgo(s.created_at)}
              </p>
              <p className="mt-4 whitespace-pre-wrap leading-relaxed">{s.body}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No stories under this tag yet.</p>
        )}
      </div>

      {isAlumni && mine.length > 0 && (
        <section>
          <h2 className="text-xl">Your published stories</h2>
          <ul className="panel mt-3 divide-y divide-border">
            {mine.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <span>{s.title}</span>
                <span className="text-muted-foreground">{timeAgo(s.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
