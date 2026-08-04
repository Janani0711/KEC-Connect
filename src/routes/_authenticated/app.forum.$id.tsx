import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { timeAgo, useDirectory, useProfile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/forum/$id")({
  head: () => ({
    meta: [
      { title: "Question — KEC Connect" },
      { name: "description", content: "A question and its answers on the KEC Connect forum." },
      { property: "og:title", content: "Question — KEC Connect" },
      { property: "og:description", content: "Answers from KEC seniors and alumni." },
    ],
  }),
  component: QuestionDetail,
});

function QuestionDetail() {
  const { id } = Route.useParams();
  const { data: profile } = useProfile();
  const { data: dir } = useDirectory();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const question = useQuery({
    queryKey: ["question", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const answers = useQuery({
    queryKey: ["answers", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("answers")
        .select("*")
        .eq("question_id", id)
        .order("upvotes", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const myVotes = useQuery({
    queryKey: ["answer_votes", id, profile?.id],
    enabled: !!profile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("answer_votes")
        .select("answer_id")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return new Set((data ?? []).map((v) => v.answer_id));
    },
  });

  const answer = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Not signed in");
      if (body.trim().length < 5) throw new Error("Write a little more.");
      const { error } = await supabase
        .from("answers")
        .insert({ question_id: id, author_id: profile.id, body: body.trim().slice(0, 4000) });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["answers", id] });
      toast.success("Answer posted.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const vote = useMutation({
    mutationFn: async (answerId: string) => {
      if (!profile) throw new Error("Not signed in");
      if (myVotes.data?.has(answerId)) {
        const { error } = await supabase
          .from("answer_votes")
          .delete()
          .eq("answer_id", answerId)
          .eq("user_id", profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("answer_votes")
          .insert({ answer_id: answerId, user_id: profile.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["answers", id] });
      qc.invalidateQueries({ queryKey: ["answer_votes", id, profile?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleSolved = useMutation({
    mutationFn: async () => {
      const next = question.data?.status === "solved" ? "unanswered" : "solved";
      const { error } = await supabase.from("questions").update({ status: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["question", id] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const q = question.data;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link to="/app/forum" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to forum
      </Link>

      {q ? (
        <>
          <article className="panel p-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl">{q.title}</h1>
              <Badge variant={q.status === "solved" ? "default" : "secondary"}>{q.status}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {dir?.[q.author_id]?.name ?? "Member"} · {timeAgo(q.created_at)}
            </p>
            {q.body && <p className="mt-4 whitespace-pre-wrap leading-relaxed">{q.body}</p>}
            {q.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {q.tags.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            {q.author_id === profile?.id && (
              <Button
                size="sm"
                variant="outline"
                className="mt-5"
                onClick={() => toggleSolved.mutate()}
              >
                {q.status === "solved" ? "Reopen question" : "Mark as solved"}
              </Button>
            )}
          </article>

          <section className="space-y-4">
            <h2 className="text-xl">
              {answers.data?.length ?? 0} {answers.data?.length === 1 ? "answer" : "answers"}
            </h2>
            {answers.data?.map((a) => (
              <div key={a.id} className="panel flex gap-4 p-5">
                <button
                  onClick={() => vote.mutate(a.id)}
                  className={`flex h-fit flex-col items-center rounded-md border px-2 py-1 text-xs transition-colors ${
                    myVotes.data?.has(a.id)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-secondary"
                  }`}
                  aria-label="Upvote answer"
                >
                  <ChevronUp className="h-4 w-4" />
                  {a.upvotes}
                </button>
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap leading-relaxed">{a.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {dir?.[a.author_id]?.name ?? "Member"}
                    {dir?.[a.author_id]?.company ? ` · ${dir[a.author_id]!.company}` : ""} ·{" "}
                    {timeAgo(a.created_at)}
                  </p>
                </div>
              </div>
            ))}

            <div className="panel space-y-3 p-5">
              <Textarea
                rows={4}
                maxLength={4000}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share what actually worked for you."
              />
              <Button onClick={() => answer.mutate()} disabled={answer.isPending}>
                {answer.isPending ? "Posting…" : "Post answer"}
              </Button>
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Loading question…</p>
      )}
    </div>
  );
}
