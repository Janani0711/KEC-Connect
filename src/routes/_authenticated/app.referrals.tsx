import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo, useDirectory, useProfile } from "@/lib/kec";
import { FileCheck, CheckCircle2, Clock, XCircle, Send, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/referrals")({
  head: () => ({
    meta: [
      { title: "Referral Requests & Status — KEC Connect" },
      {
        name: "description",
        content: "Track student referral requests and alumni responses.",
      },
      { property: "og:title", content: "Referral Requests — KEC Connect" },
      { property: "og:description", content: "Your referral request dashboard." },
    ],
  }),
  component: ReferralInbox,
});

const NEXT: Record<string, { label: string; status: "accepted" | "declined" | "referred" }[]> = {
  requested: [
    { label: "Accept Request", status: "accepted" },
    { label: "Decline", status: "declined" },
  ],
  accepted: [{ label: "Mark as Referred", status: "referred" }],
};

function ReferralInbox() {
  const { data: me } = useProfile();
  const { data: dir } = useDirectory();
  const qc = useQueryClient();

  const isAlumni = me?.role === "alumni";

  // Incoming requests for Alumni
  const incomingRequests = useQuery({
    queryKey: ["referral_requests", "inbox"],
    enabled: !!me && isAlumni,
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

  // Sent requests for Students
  const myRequests = useQuery({
    queryKey: ["referral_requests", "mine"],
    enabled: !!me && !isAlumni,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_requests")
        .select("*")
        .eq("student_id", me!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("referral_requests")
        .update({ status: status as "accepted" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      const label = variables.status === "accepted" ? "accepted" : variables.status === "referred" ? "marked as referred" : "declined";
      toast.success(`Referral request ${label}. Student will see the update on their dashboard!`);
      qc.invalidateQueries({ queryKey: ["referral_requests"] });
    },
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

  function getStatusBadge(status: string) {
    switch (status) {
      case "accepted":
        return (
          <Badge className="bg-blue-600 text-white font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Accepted by Alumni
          </Badge>
        );
      case "referred":
        return (
          <Badge className="bg-emerald-600 text-white font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Referred Successfully!
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Declined
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending Review
          </Badge>
        );
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <FileCheck className="w-8 h-8 text-blue-600" />
          <span>{isAlumni ? "Referral Requests Inbox" : "My Referral Requests"}</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          {isAlumni
            ? "Review and respond to referral requests from KEC students."
            : "Track the real-time status of your referral requests submitted to KEC alumni."}
        </p>
      </header>

      {/* Alumni View: Inbox of incoming student requests */}
      {isAlumni ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Incoming Requests</h2>
          {incomingRequests.data?.length ? (
            incomingRequests.data.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 text-base">{dir?.[r.student_id]?.name ?? "Student"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {dir?.[r.student_id]?.branch ?? ""}
                      {dir?.[r.student_id]?.year ? ` · Year ${dir[r.student_id]!.year}` : ""} ·{" "}
                      {timeAgo(r.created_at)}
                    </p>
                  </div>
                  {getStatusBadge(r.status)}
                </div>

                <p className="whitespace-pre-wrap text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {r.why_note}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {r.resume_url && (
                    <Button size="sm" variant="outline" className="text-xs rounded-xl" onClick={() => openResume(r.resume_url!)}>
                      View Resume
                    </Button>
                  )}
                  {(NEXT[r.status] ?? []).map((a) => (
                    <Button
                      key={a.status}
                      size="sm"
                      variant={a.status === "declined" ? "ghost" : "default"}
                      className={a.status === "accepted" ? "bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl" : a.status === "referred" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl" : "text-rose-600 hover:bg-rose-50 text-xs rounded-xl"}
                      onClick={() => updateStatus.mutate({ id: r.id, status: a.status })}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="bg-white p-8 rounded-2xl border border-slate-200 text-sm text-slate-500 text-center">
              No referral requests received yet.
            </p>
          )}
        </div>
      ) : (
        /* Student View: Status of sent referral requests */
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Your Submitted Requests</h2>
          {myRequests.data?.length ? (
            myRequests.data.map((r) => {
              const alumniProfile = dir?.[r.alumni_id];
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-blue-600" />
                        <p className="font-bold text-slate-900">
                          Request to {alumniProfile?.name ?? "Alumni"}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {alumniProfile?.company ? `Company: ${alumniProfile.company}` : "KEC Alumni Network"} · {timeAgo(r.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{r.why_note}"
                  </p>

                  {r.status === "accepted" && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-800 font-medium">
                      🎉 Great news! {alumniProfile?.name || "The alumnus"} accepted your referral request and is preparing to refer your application!
                    </div>
                  )}

                  {r.status === "referred" && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Congratulations! {alumniProfile?.name || "The alumnus"} has officially referred you for the role!</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="bg-white p-8 rounded-2xl border border-slate-200 text-sm text-slate-500 text-center">
              You haven't requested any job referrals yet. Go to Job Openings or Alumni Directory to request a referral!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
