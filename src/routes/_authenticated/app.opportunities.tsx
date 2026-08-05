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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  OPENING_CATEGORIES,
  labelFor,
  timeAgo,
  useDirectory,
  useProfile,
} from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — KEC Connect" },
      {
        name: "description",
        content: "Real openings and referral offers shared by Kongu Engineering College alumni.",
      },
      { property: "og:title", content: "Opportunities — KEC Connect" },
      { property: "og:description", content: "Jobs, internships and referrals from KEC alumni." },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const { data: me } = useProfile();
  const { data: dir } = useDirectory();
  const qc = useQueryClient();
  const isAlumni = me?.role === "alumni";

  const openings = useQuery({
    queryKey: ["openings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("openings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const offers = useQuery({
    queryKey: ["referral_offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_offers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // --- Alumni: post an opening ---
  const [op, setOp] = useState({
    company: "",
    role: "",
    eligibility: "",
    package: "",
    deadline: "",
    apply_link: "",
    category: "job",
  });

  const postOpening = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Not signed in");
      if (!op.company.trim() || !op.role.trim()) throw new Error("Company and role are required.");
      const { error } = await supabase.from("openings").insert({
        alumni_id: me.id,
        company: op.company.trim(),
        role: op.role.trim(),
        eligibility: op.eligibility.trim() || null,
        package: op.package.trim() || null,
        deadline: op.deadline || null,
        apply_link: op.apply_link.trim() || null,
        category: op.category as "job",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Opening posted.");
      setOp({ company: "", role: "", eligibility: "", package: "", deadline: "", apply_link: "", category: "job" });
      qc.invalidateQueries({ queryKey: ["openings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Alumni: offer a referral ---
  const [offer, setOffer] = useState({ company: me?.company ?? "", domain: "", note: "" });
  const postOffer = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Not signed in");
      const company = (offer.company || me.company || "").trim();
      if (!company) throw new Error("Add a company.");
      const { error } = await supabase.from("referral_offers").insert({
        alumni_id: me.id,
        company,
        domain: offer.domain.trim() || null,
        note: offer.note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Referral offer published.");
      setOffer({ company: me?.company ?? "", domain: "", note: "" });
      qc.invalidateQueries({ queryKey: ["referral_offers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Student: request a referral ---
  const [reqOffer, setReqOffer] = useState<{ id: string; alumni_id: string; company: string } | null>(null);
  const [why, setWhy] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const requestReferral = useMutation({
    mutationFn: async () => {
      if (!me || !reqOffer) throw new Error("Not ready");
      if (why.trim().length < 20)
        throw new Error("Write at least a couple of sentences on why they should refer you.");
      let resumeUrl: string | null = null;
      if (file) {
        const path = `${me.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("resumes").upload(path, file);
        if (upErr) throw upErr;
        resumeUrl = path;
      }
      const { error } = await supabase.from("referral_requests").insert({
        offer_id: reqOffer.id,
        student_id: me.id,
        alumni_id: reqOffer.alumni_id,
        resume_url: resumeUrl,
        why_note: why.trim().slice(0, 1500),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Referral request sent.");
      setReqOffer(null);
      setWhy("");
      setFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl">Opportunities</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Roles and referrals shared by alumni who actually know the team.
        </p>
      </header>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6 space-y-6">
          {isAlumni && (
            <div className="panel space-y-4 p-5">
              <div>
                <h2 className="text-lg">Post an opening</h2>
                <p className="text-sm text-muted-foreground">
                  Only use this if you have a real role to share.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="o-company">Company</Label>
                  <Input id="o-company" value={op.company} onChange={(e) => setOp({ ...op, company: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="o-role">Role</Label>
                  <Input id="o-role" value={op.role} onChange={(e) => setOp({ ...op, role: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={op.category} onValueChange={(v) => setOp({ ...op, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENING_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="o-package">Package</Label>
                  <Input id="o-package" value={op.package} onChange={(e) => setOp({ ...op, package: e.target.value })} placeholder="6 LPA" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="o-elig">Eligibility</Label>
                  <Input id="o-elig" value={op.eligibility} onChange={(e) => setOp({ ...op, eligibility: e.target.value })} placeholder="2026 batch, CSE/IT, no standing arrears" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="o-dead">Deadline</Label>
                  <Input id="o-dead" type="date" value={op.deadline} onChange={(e) => setOp({ ...op, deadline: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="o-link">Apply link</Label>
                  <Input id="o-link" value={op.apply_link} onChange={(e) => setOp({ ...op, apply_link: e.target.value })} placeholder="https://" />
                </div>
              </div>
              <Button onClick={() => postOpening.mutate()} disabled={postOpening.isPending}>
                {postOpening.isPending ? "Posting…" : "Post opening"}
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {openings.data?.length ? (
              openings.data.map((o) => (
                <div key={o.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {o.role} · {o.company}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Shared by {dir?.[o.alumni_id]?.name ?? "an alumnus"} · {timeAgo(o.created_at)}
                      </p>
                    </div>
                    <Badge variant="secondary">{labelFor(OPENING_CATEGORIES, o.category)}</Badge>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                    {o.eligibility && (
                      <div>
                        <dt className="text-muted-foreground">Eligibility</dt>
                        <dd>{o.eligibility}</dd>
                      </div>
                    )}
                    {o.package && (
                      <div>
                        <dt className="text-muted-foreground">Package</dt>
                        <dd>{o.package}</dd>
                      </div>
                    )}
                    {o.deadline && (
                      <div>
                        <dt className="text-muted-foreground">Deadline</dt>
                        <dd>{new Date(o.deadline).toLocaleDateString()}</dd>
                      </div>
                    )}
                  </dl>
                  {o.apply_link && (
                    <Button asChild size="sm" variant="outline" className="mt-4">
                      <a href={o.apply_link} target="_blank" rel="noreferrer noopener">
                        Apply
                      </a>
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No openings posted yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="referrals" className="mt-6 space-y-6">
          {isAlumni && (
            <div className="panel space-y-4 p-5">
              <div>
                <h2 className="text-lg">Offer a referral</h2>
                <p className="text-sm text-muted-foreground">
                  You don't need to be in HR to do this — most companies let any employee refer.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="r-company">Company</Label>
                  <Input
                    id="r-company"
                    value={offer.company}
                    onChange={(e) => setOffer({ ...offer, company: e.target.value })}
                    placeholder={me?.company ?? "Your company"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-domain">Domain / function</Label>
                  <Input
                    id="r-domain"
                    value={offer.domain}
                    onChange={(e) => setOffer({ ...offer, domain: e.target.value })}
                    placeholder="Backend engineering"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="r-note">Short note</Label>
                  <Textarea
                    id="r-note"
                    rows={3}
                    value={offer.note}
                    onChange={(e) => setOffer({ ...offer, note: e.target.value })}
                    placeholder="Happy to refer 2026 grads with solid DSA and one shipped project."
                  />
                </div>
              </div>
              <Button onClick={() => postOffer.mutate()} disabled={postOffer.isPending}>
                {postOffer.isPending ? "Publishing…" : "Publish referral offer"}
              </Button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {offers.data?.length ? (
              offers.data.map((o) => (
                <div key={o.id} className="panel flex flex-col p-5">
                  <p className="font-medium">{o.company}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dir?.[o.alumni_id]?.name ?? "Alumnus"}
                    {o.domain ? ` · ${o.domain}` : ""}
                  </p>
                  {o.note && <p className="mt-3 text-sm">{o.note}</p>}
                  {!isAlumni && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4 self-start"
                      onClick={() => setReqOffer({ id: o.id, alumni_id: o.alumni_id, company: o.company })}
                    >
                      Request referral
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No referral offers yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!reqOffer} onOpenChange={(o) => !o && setReqOffer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a referral at {reqOffer?.company}</DialogTitle>
            <DialogDescription>
              Attach your resume and explain, concretely, why you're a fit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rr-file">Resume (PDF)</Label>
              <Input
                id="rr-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rr-why">Why should they refer you?</Label>
              <Textarea
                id="rr-why"
                rows={5}
                maxLength={1500}
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="What you've built, what you're strong at, and the role you're targeting."
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => requestReferral.mutate()} disabled={requestReferral.isPending}>
              {requestReferral.isPending ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
