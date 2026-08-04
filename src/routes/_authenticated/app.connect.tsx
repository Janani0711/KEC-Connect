import { createFileRoute, Link } from "@tanstack/react-router";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRANCHES, CONNECT_TOPICS, initials, useProfile, type Profile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/connect")({
  head: () => ({
    meta: [
      { title: "Connect with seniors — KEC Connect" },
      {
        name: "description",
        content: "Browse KEC alumni and final-year students, see what they help with, and request a conversation.",
      },
      { property: "og:title", content: "Connect with seniors — KEC Connect" },
      { property: "og:description", content: "Find a senior who has been where you are." },
    ],
  }),
  component: ConnectPage,
});

function ConnectPage() {
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const [branch, setBranch] = useState("all");
  const [company, setCompany] = useState("");
  const [batch, setBatch] = useState("");
  const [target, setTarget] = useState<Profile | null>(null);
  const [topic, setTopic] = useState<string>("internship");
  const [note, setNote] = useState("");

  const mentors = useQuery({
    queryKey: ["mentors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).filter((p) => p.role === "alumni" || (p.year ?? 0) >= 4);
    },
  });

  const slots = useQuery({
    queryKey: ["slots", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_hour_slots")
        .select("host_id")
        .eq("status", "open");
      if (error) throw error;
      return new Set((data ?? []).map((s) => s.host_id));
    },
  });

  const sendRequest = useMutation({
    mutationFn: async () => {
      if (!me || !target) throw new Error("Not ready");
      const { error } = await supabase.from("connect_requests").insert({
        from_user_id: me.id,
        to_user_id: target.id,
        topic: topic as "internship",
        note: note.trim().slice(0, 500) || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request sent. You'll be able to chat once it's accepted.");
      setTarget(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["connect_requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const visible = (mentors.data ?? []).filter((p) => {
    if (p.id === me?.id) return false;
    if (branch !== "all" && p.branch !== branch) return false;
    if (company && !(p.company ?? "").toLowerCase().includes(company.toLowerCase())) return false;
    if (batch && !(p.batch ?? "").toLowerCase().includes(batch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="text-3xl">Connect with seniors</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Alumni and final-year students who have offered to help. Send a short, specific request —
          chat opens once they accept.
        </p>
      </header>

      <div className="panel grid gap-4 p-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Branch</Label>
          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {BRANCHES.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-company">Company</Label>
          <Input
            id="f-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Zoho, TCS…"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="f-batch">Batch</Label>
          <Input
            id="f-batch"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="2021"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((p) => (
          <div key={p.id} className="panel flex flex-col p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                {initials(p.name)}
              </span>
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.role === "alumni"
                    ? [p.job_title, p.company].filter(Boolean).join(" at ") || "Alumnus"
                    : `Final year · ${p.branch ?? ""}`}
                  {p.batch ? ` · ${p.batch}` : ""}
                </p>
              </div>
            </div>

            {p.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>}

            {p.skills?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.skills.slice(0, 6).map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            )}

            <p className="mt-3 text-xs text-muted-foreground">
              {slots.data?.has(p.id)
                ? "Has open office hours this week"
                : "No open office hours right now"}
            </p>

            <div className="mt-4 flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/app/office-hours">View office hours</Link>
              </Button>
              <Button size="sm" onClick={() => setTarget(p)}>
                Send connect request
              </Button>
            </div>
          </div>
        ))}
        {!visible.length && (
          <p className="text-sm text-muted-foreground">No one matches those filters yet.</p>
        )}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect with {target?.name}</DialogTitle>
            <DialogDescription>
              Keep it short and specific. Mentors accept requests they can actually help with.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONNECT_TOPICS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-note">Note (optional)</Label>
              <Textarea
                id="c-note"
                rows={4}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="I'm preparing for on-campus placements and would like feedback on my approach."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => sendRequest.mutate()} disabled={sendRequest.isPending}>
              {sendRequest.isPending ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
