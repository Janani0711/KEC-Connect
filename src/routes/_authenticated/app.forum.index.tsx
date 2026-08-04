import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { timeAgo, useDirectory, useProfile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/forum/")({
  head: () => ({
    meta: [
      { title: "Q&A forum — KEC Connect" },
      {
        name: "description",
        content: "Ask placement, project and career questions and get answers from KEC seniors.",
      },
      { property: "og:title", content: "Q&A forum — KEC Connect" },
      { property: "og:description", content: "Questions answered by KEC seniors and alumni." },
    ],
  }),
  component: ForumPage,
});

function ForumPage() {
  const { data: profile } = useProfile();
  const { data: dir } = useDirectory();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("latest");
  const [tag, setTag] = useState("");
  const [asking, setAsking] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");

  const questions = useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const allTags = useMemo(() => {
    const set = new Set<string>();
    questions.data?.forEach((q) => q.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [questions.data]);

  const visible = (questions.data ?? []).filter((q) => {
    if (filter === "solved" && q.status !== "solved") return false;
    if (filter === "unanswered" && q.status !== "unanswered") return false;
    if (filter === "mine" && q.author_id !== profile?.id) return false;
    if (tag && !q.tags.includes(tag)) return false;
    return true;
  });

  const ask = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Not signed in");
      if (title.trim().length < 8) throw new Error("Give your question a clearer title.");
      const { error } = await supabase.from("questions").insert({
        author_id: profile.id,
        title: title.trim().slice(0, 200),
        body: body.trim().slice(0, 4000),
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 5),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Question posted.");
      setTitle("");
      setBody("");
      setTags("");
      setAsking(false);
      qc.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Q&amp;A forum</h1>
          <p className="mt-2 text-muted-foreground">
            Ask once, clearly. Answers come from people who sat the same interviews.
          </p>
        </div>
        <Button onClick={() => setAsking((v) => !v)} variant={asking ? "outline" : "default"}>
          {asking ? "Cancel" : "Ask a question"}
        </Button>
      </header>

      {asking && (
        <div className="panel space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="q-title">Title</Label>
            <Input
              id="q-title"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="How do I prepare for Zoho's second round?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="q-body">Details</Label>
            <Textarea
              id="q-body"
              rows={5}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What you've tried, what you're stuck on."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="q-tags">Tags (comma separated, max 5)</Label>
            <Input
              id="q-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="placement, zoho, dsa"
            />
          </div>
          <Button onClick={() => ask.mutate()} disabled={ask.isPending}>
            {ask.isPending ? "Posting…" : "Post question"}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
            <TabsTrigger value="solved">Solved</TabsTrigger>
            <TabsTrigger value="mine">My questions</TabsTrigger>
          </TabsList>
        </Tabs>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTag("")}
              className={`rounded-full border px-3 py-1 text-xs ${!tag ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
            >
              All tags
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t === tag ? "" : t)}
                className={`rounded-full border px-3 py-1 text-xs ${tag === t ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="panel divide-y divide-border">
        {visible.length ? (
          visible.map((q) => (
            <Link
              key={q.id}
              to="/app/forum/$id"
              params={{ id: q.id }}
              className="block p-5 hover:bg-secondary"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium">{q.title}</p>
                <Badge variant={q.status === "solved" ? "default" : "secondary"}>{q.status}</Badge>
              </div>
              {q.body && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{q.body}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {dir?.[q.author_id]?.name ?? "Member"} · {timeAgo(q.created_at)}
                {q.tags.length ? ` · ${q.tags.join(", ")}` : ""}
              </p>
            </Link>
          ))
        ) : (
          <p className="p-8 text-sm text-muted-foreground">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
}
