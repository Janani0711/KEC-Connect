import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo, useDirectory, useProfile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/referrals")({
  head: () => ({
    meta: [
      { title: "Referral requests — KEC Connect" },
      {
        name: "description",
        content: "Review referral requests from KEC students, with resume and context attached.",
      },
      { property: "og:title", content: "Referral requests — KEC Connect" },
      { property: "og:description", content: "Your referral request inbox." },
    ],
  }),
  component: ReferralInbox,
});

const NEXT: Record<string, { label: string; status: "accepted" | "declined" | "referred" }[]> = {
  requested: [
    { label: "Accept", status: "accepted" },
    { label: "Decline", status: "declined" },
  ],
  accepted: [{ label: "Mark as referred", status: "referred" }],
};

function ReferralInbox() {
  const { data: me } = useProfile();
  const { data: dir } = useDirectory();
  const qc = useQueryClient();

  const requests = useQuery({
    queryKey: ["referral_requests", "inbox"],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_requests")
        .select("*")
        .eq("alumni_id", me!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("referral_requests")
        .update({ status: status as "accepted" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["referral_requests"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  async function openResume(path: string) {
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 300);
    if (error || !data) {
      toast.error("Couldn't open that resume.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl">Referral requests</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Read the note first. A referral is your name on the line — decline freely.
        </p>
      </header>

      <div className="space-y-4">
        {requests.data?.length ? (
          requests.data.map((r) => (
            <div key={r.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{dir?.[r.student_id]?.name ?? "Student"}</p>
                  <p className="text-sm text-muted-foreground">
                    {dir?.[r.student_id]?.branch ?? ""}
                    {dir?.[r.student_id]?.year ? ` · Year ${dir[r.student_id]!.year}` : ""} ·{" "}
                    {timeAgo(r.created_at)}
                  </p>
                </div>
                <Badge variant="secondary">{r.status}</Badge>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{r.why_note}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.resume_url && (
                  <Button size="sm" variant="outline" onClick={() => openResume(r.resume_url!)}>
                    View resume
                  </Button>
                )}
                {(NEXT[r.status] ?? []).map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    variant={a.status === "declined" ? "ghost" : "default"}
                    onClick={() => update.mutate({ id: r.id, status: a.status })}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="panel p-8 text-sm text-muted-foreground">No referral requests yet.</p>
        )}
      </div>
    </div>
  );
}
