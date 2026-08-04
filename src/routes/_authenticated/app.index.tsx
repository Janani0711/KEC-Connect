import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DAYS, labelFor, CONNECT_TOPICS, timeAgo, useDirectory, useProfile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — KEC Connect" },
      { name: "description", content: "Your KEC Connect home: questions, office hours and requests." },
      { property: "og:title", content: "Dashboard — KEC Connect" },
      { property: "og:description", content: "Your KEC Connect home." },
    ],
  }),
  component: HomePage,
});

function QuickLink({ to, title, body }: { to: string; title: string; body: string }) {
  return (
    <Link to={to} className="panel block p-5 transition-colors hover:bg-secondary">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}

function HomePage() {
  const { data: profile } = useProfile();
  const isAlumni = profile?.role === "alumni";
  return isAlumni ? <AlumniHome /> : <StudentHome />;
}

function StudentHome() {
  const { data: profile } = useProfile();
  const { data: dir } = useDirectory();

  const questions = useQuery({
    queryKey: ["questions", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const slots = useQuery({
    queryKey: ["slots", "open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_hour_slots")
        .select("*")
        .eq("status", "open")
        .order("start_time", { ascending: true })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header>
        <h1 className="text-3xl">Welcome, {profile?.name?.split(" ")[0] || "there"}.</h1>
        <p className="mt-2 text-muted-foreground">
          {profile?.branch ? `${profile.branch} · Year ${profile.year ?? "-"}` : "Student"} — pick
          one thing to move forward today.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <QuickLink to="/app/forum" title="Ask a question" body="Get answers from seniors and alumni." />
        <QuickLink
          to="/app/office-hours"
          title="Book office hours"
          body="Short, focused time with a mentor."
        />
        <QuickLink
          to="/app/opportunities"
          title="Browse opportunities"
          body="Openings and referrals from alumni."
        />
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl">Recent questions</h2>
          <Link to="/app/forum" className="text-sm text-primary hover:underline">
            View forum
          </Link>
        </div>
        <div className="panel mt-4 divide-y divide-border">
          {questions.data?.length ? (
            questions.data.map((q) => (
              <Link
                key={q.id}
                to="/app/forum/$id"
                params={{ id: q.id }}
                className="flex items-start justify-between gap-4 p-4 hover:bg-secondary"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{q.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dir?.[q.author_id]?.name ?? "Member"} · {timeAgo(q.created_at)}
                  </p>
                </div>
                <Badge variant={q.status === "solved" ? "default" : "secondary"}>{q.status}</Badge>
              </Link>
            ))
          ) : (
            <p className="p-6 text-sm text-muted-foreground">
              No questions yet — be the first to ask.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl">Open office-hour slots</h2>
          <Link to="/app/office-hours" className="text-sm text-primary hover:underline">
            See all
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {slots.data?.length ? (
            slots.data.map((s) => (
              <div key={s.id} className="panel p-5">
                <p className="font-medium">{s.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dir?.[s.host_id]?.name ?? "Mentor"} · {s.duration_minutes} min
                </p>
                <p className="mt-2 text-sm">
                  {s.is_recurring
                    ? `Every ${DAYS[s.day_of_week ?? 0]}`
                    : s.start_time
                      ? new Date(s.start_time).toLocaleString()
                      : "Time to be confirmed"}
                </p>
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link to="/app/office-hours">Book</Link>
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No open slots this week. Check back soon.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function AlumniHome() {
  const { data: profile } = useProfile();
  const { data: dir } = useDirectory();

  const connects = useQuery({
    queryKey: ["connect_requests", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connect_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const referrals = useQuery({
    queryKey: ["referral_requests", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referral_requests")
        .select("*")
        .eq("status", "requested")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header>
        <h1 className="text-3xl">Welcome, {profile?.name?.split(" ")[0] || "there"}.</h1>
        <p className="mt-2 text-muted-foreground">
          {[profile?.job_title, profile?.company].filter(Boolean).join(" at ") ||
            "Alumnus of Kongu Engineering College"}
          {profile?.batch ? ` · Batch ${profile.batch}` : ""}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          to="/app/office-hours"
          title="Set office hours"
          body="Offer a slot or two this week."
        />
        <QuickLink
          to="/app/opportunities"
          title="Post an opening or offer a referral"
          body="Share something real from your company."
        />
        <QuickLink to="/app/stories" title="Write a story" body="What you wish you'd known." />
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl">Pending connect requests</h2>
          <Link to="/app/chat" className="text-sm text-primary hover:underline">
            Go to chat
          </Link>
        </div>
        <div className="panel mt-4 divide-y divide-border">
          {connects.data?.length ? (
            connects.data.map((c) => (
              <div key={c.id} className="p-4">
                <p className="font-medium">
                  {dir?.[c.from_user_id]?.name ?? "A student"}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {labelFor(CONNECT_TOPICS, c.topic)}
                  </span>
                </p>
                {c.note && <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>}
                <Button asChild size="sm" variant="outline" className="mt-3">
                  <Link to="/app/chat">Review request</Link>
                </Button>
              </div>
            ))
          ) : (
            <p className="p-6 text-sm text-muted-foreground">No pending requests.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl">Pending referral requests</h2>
          <Link to="/app/referrals" className="text-sm text-primary hover:underline">
            Open inbox
          </Link>
        </div>
        <div className="panel mt-4 divide-y divide-border">
          {referrals.data?.length ? (
            referrals.data.map((r) => (
              <div key={r.id} className="p-4">
                <p className="font-medium">{dir?.[r.student_id]?.name ?? "A student"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.why_note}</p>
              </div>
            ))
          ) : (
            <p className="p-6 text-sm text-muted-foreground">No pending referral requests.</p>
          )}
        </div>
      </section>
    </div>
  );
}
