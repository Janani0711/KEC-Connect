import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Briefcase,
  CalendarClock,
  MessagesSquare,
  ShieldCheck,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KEC Connect — Kongu student & alumni network" },
      {
        name: "description",
        content:
          "Learn from those who were once where you are. Connect with seniors, book office hours, and discover opportunities and referrals shared by KEC alumni.",
      },
      { property: "og:title", content: "KEC Connect" },
      {
        property: "og:description",
        content:
          "One trusted network for Kongu Engineering College students and alumni.",
      },
    ],
  }),
  component: Landing,
});

const pillars = [
  {
    icon: Users,
    title: "Connect with seniors",
    body: "Browse alumni and final-year students by branch, batch and company. Send a request with a clear topic — not a cold DM.",
  },
  {
    icon: CalendarClock,
    title: "Book office hours",
    body: "Mentors publish short, specific slots: resume review, placement prep, core-domain doubts. You pick one and show up.",
  },
  {
    icon: Briefcase,
    title: "Opportunities & referrals",
    body: "Real openings with eligibility and deadlines, plus alumni who are open to referring juniors into their teams.",
  },
  {
    icon: MessagesSquare,
    title: "A calm Q&A forum",
    body: "Ask once, get answered by people who wrote the same exams and sat the same interviews.",
  },
  {
    icon: BookOpen,
    title: "Shared resources",
    body: "Aptitude sets, coding sheets, resume templates, past interview questions and department notes in one library.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Chat only opens after a request is accepted. No feeds, no streaks, no leaderboards. Threads archive after 45 quiet days.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold">KEC Connect</span>
            <span className="hidden text-xs uppercase tracking-widest text-muted-foreground sm:inline">
              Kongu Engineering College
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/auth" search={{ mode: "signin" }}>
                Sign in
              </Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Join the network
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          A private network — invitation by college email
        </p>
        <h1 className="mt-6 max-w-3xl text-4xl leading-[1.1] md:text-6xl">
          Learn from those who were once where you are.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Connect with seniors. Book office hours. Discover opportunities and referrals shared by
          KEC alumni. One trusted network. Only for Kongu Engineering College.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Create your account
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth" search={{ mode: "signin" }}>
              I already have an account
            </Link>
          </Button>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          Students sign up with their college email (e.g. 23ecr085@kongu.edu). Alumni join with any
          email and mark themselves as alumni.
        </p>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-px bg-border px-0 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="bg-surface p-8">
              <p.icon className="h-5 w-5 text-primary" strokeWidth={1.6} />
              <h3 className="mt-4 text-lg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl">This is not social media.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              There is no follower count here, nothing to farm, nothing to scroll. Every
              conversation starts with a stated topic, every mentor sets their own limits, and every
              thread quietly closes when it has run its course.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-8 self-center">
            <div>
              <dt className="text-sm text-muted-foreground">Who can join</dt>
              <dd className="mt-1 text-lg">KEC students &amp; alumni</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Mentors</dt>
              <dd className="mt-1 text-lg">Alumni &amp; 4th years</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Chat opens</dt>
              <dd className="mt-1 text-lg">Only once accepted</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Threads archive</dt>
              <dd className="mt-1 text-lg">After 45 quiet days</dd>
            </div>
          </dl>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>KEC Connect · Kongu Engineering College, Perundurai</span>
          <span>Built by students, for students.</span>
        </div>
      </footer>
    </main>
  );
}
