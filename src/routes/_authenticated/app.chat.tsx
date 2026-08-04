import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Flag, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONNECT_TOPICS, labelFor, timeAgo, useDirectory, useProfile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/chat")({
  head: () => ({
    meta: [
      { title: "Chat — KEC Connect" },
      {
        name: "description",
        content: "Private conversations that open only after a connect request is accepted.",
      },
      { property: "og:title", content: "Chat — KEC Connect" },
      { property: "og:description", content: "Focused, topic-pinned conversations." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { data: me } = useProfile();
  const { data: dir } = useDirectory();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const requests = useQuery({
    queryKey: ["connect_requests", "mine"],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connect_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const pending = (requests.data ?? []).filter(
    (r) => r.status === "pending" && r.to_user_id === me?.id,
  );
  const threads = (requests.data ?? []).filter((r) => r.status === "accepted" && !r.archived);
  const active = threads.find((t) => t.id === activeId) ?? null;

  const messages = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("connect_request_id", activeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`messages-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `connect_request_id=eq.${activeId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["messages", activeId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length]);

  const respond = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "declined" }) => {
      const { error } = await supabase.from("connect_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connect_requests"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!me || !activeId || !text.trim()) return;
      const { error } = await supabase.from("messages").insert({
        connect_request_id: activeId,
        sender_id: me.id,
        body: text.trim().slice(0, 2000),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["messages", activeId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const report = useMutation({
    mutationFn: async () => {
      if (!me || !active) return;
      const { error } = await supabase.from("reports").insert({
        reporter_id: me.id,
        connect_request_id: active.id,
        reason: "Reported from chat",
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Reported. Thank you — we'll review this thread."),
    onError: (e: Error) => toast.error(e.message),
  });

  function other(t: { from_user_id: string; to_user_id: string }) {
    const id = t.from_user_id === me?.id ? t.to_user_id : t.from_user_id;
    return dir?.[id];
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl">Chat</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Conversations open only after a connect request is accepted, and archive after 45 days of
          quiet.
        </p>
      </header>

      {pending.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl">Requests waiting on you</h2>
          <div className="panel divide-y divide-border">
            {pending.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">
                    {dir?.[r.from_user_id]?.name ?? "A student"}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {labelFor(CONNECT_TOPICS, r.topic)}
                    </span>
                  </p>
                  {r.note && <p className="mt-1 text-sm text-muted-foreground">{r.note}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => respond.mutate({ id: r.id, status: "accepted" })}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => respond.mutate({ id: r.id, status: "declined" })}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className="panel h-fit divide-y divide-border">
          {threads.length ? (
            threads.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveId(t.id)}
                className={`block w-full px-4 py-3 text-left text-sm hover:bg-secondary ${
                  activeId === t.id ? "bg-secondary" : ""
                }`}
              >
                <span className="block font-medium">{other(t)?.name ?? "Member"}</span>
                <span className="block text-xs text-muted-foreground">
                  {labelFor(CONNECT_TOPICS, t.topic)}
                </span>
              </button>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">No open conversations yet.</p>
          )}
        </aside>

        <section className="panel flex min-h-[420px] flex-col">
          {active ? (
            <>
              <div className="flex items-center justify-between gap-4 border-b border-border p-4">
                <div>
                  <p className="font-medium">{other(active)?.name ?? "Member"}</p>
                  <Badge variant="outline" className="mt-1">
                    {labelFor(CONNECT_TOPICS, active.topic)}
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={() => report.mutate()}>
                  <Flag className="h-4 w-4" /> Report
                </Button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.data?.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      m.sender_id === me?.id
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-1 text-[10px] opacity-70">{timeAgo(m.created_at)}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form
                className="flex gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  send.mutate();
                }}
              >
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={2000}
                  placeholder="Write a message"
                />
                <Button type="submit" size="icon" disabled={!text.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <p className="m-auto p-6 text-sm text-muted-foreground">
              Select a conversation to start reading.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
