import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Award, 
  Users, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  Inbox, 
  Newspaper, 
  Calendar, 
  ArrowRight, 
  Star, 
  Heart, 
  CheckCircle2, 
  FileText,
  Clock,
  Briefcase
} from "lucide-react";
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
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

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

  const recentStories = useQuery({
    queryKey: ["stories", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return data;
    },
  });

  const unansweredQuestions = useQuery({
    queryKey: ["questions", "unanswered"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("status", "unanswered")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const openings = useQuery({
    queryKey: ["openings", "my-posts", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("openings")
        .select("*")
        .eq("alumni_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return data;
    },
  });

  const hostSlots = useQuery({
    queryKey: ["slots", "my-slots", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("office_hour_slots")
        .select("*")
        .eq("host_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(2);
      if (error) throw error;
      return data;
    },
  });

  const handlePlayToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => console.log("Video play failed:", err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Top Welcome Bar */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Good Morning, {profile?.name?.split(" ")[0] || "Alumni"}! 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Great to see you making a difference in our community today.
            </p>
          </div>
      </header>

      {/* Hero Video Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl aspect-[21/9] w-full bg-slate-900 group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
        {/* Background Image / Video Player */}
        <div className="absolute inset-0 bg-slate-900">
          <video
            ref={videoRef}
            src="/video.mp4"
            loop
            muted={isMuted}
            playsInline
            onClick={handlePlayToggle}
            className={`h-full w-full object-cover transition-opacity duration-700 ${isPlaying ? "opacity-100" : "opacity-40"}`}
            poster="/images/hero_bg.jpg"
          />
          {!isPlaying && (
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
              style={{ backgroundImage: `url('/images/hero_bg.jpg')` }}
            />
          )}
          {/* Subtle gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/50 to-transparent pointer-events-none transition-opacity duration-700 ${isPlaying ? "opacity-0" : "opacity-100"}`} />
        </div>

        {/* Banner Content Overlay */}
        <div className={`absolute inset-0 flex flex-col justify-between p-6 md:p-10 transition-all duration-700 ${isPlaying ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0 pointer-events-auto"}`}>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md border border-white/20 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              KEC Memories
            </div>
            <h2 className="mt-5 text-3xl font-extrabold text-white md:text-5xl leading-tight drop-shadow-xl max-w-lg">
              A Walk Down Memory Lane
            </h2>
            <p className="mt-4 text-sm md:text-base text-slate-200 max-w-md drop-shadow-md leading-relaxed">
              Relive the moments that made our college life unforgettable at Kongu Engineering College.
            </p>
          </div>
        </div>

        {/* Floating Controls Docked at Bottom */}
        <div className={`absolute bottom-6 left-6 right-6 flex items-center justify-between z-10 transition-transform duration-500`}>
          {/* Play Button */}
          <button
            onClick={handlePlayToggle}
            className="flex items-center gap-3 rounded-full bg-white/95 hover:bg-white text-slate-900 px-6 py-3 text-sm font-bold shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-inner">
              {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
            </span>
            {isPlaying ? "Pause Video" : "Play 1 Min Video"}
          </button>

          {/* Mute/Audio Toggle */}
          <button
            onClick={handleMuteToggle}
            className="flex items-center gap-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white px-5 py-3 text-xs font-semibold backdrop-blur-xl transition-all hover:scale-105 active:scale-95 border border-white/20 shadow-lg"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {isMuted ? "Click to Play Audio" : "Audio Playing"}
          </button>
        </div>
      </section>



      {/* Middle Grid */}
      <section className="grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
        {/* Column 1: Next Office Hours */}
        <div className="panel flex flex-col justify-between p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Your Next Office Hours
              </h3>
              <Link to="/app/office-hours" className="text-[11px] text-primary hover:underline font-medium">
                View Calendar →
              </Link>
            </div>
            <div className="space-y-3">
              {hostSlots.data?.length ? (
                hostSlots.data.map((s) => {
                  const date = s.start_time ? new Date(s.start_time) : new Date();
                  const dayStr = date.getDate().toString().padStart(2, '0');
                  const monthStr = date.toLocaleString('default', { month: 'short' }).toUpperCase();
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-blue-500/5 text-blue-600 font-bold border border-blue-500/10">
                          <span className="text-sm leading-none">{dayStr}</span>
                          <span className="text-[9px] uppercase mt-0.5">{monthStr}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{s.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes} mins
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/10">
                        Confirmed
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground p-4 text-center">No office hours scheduled.</p>
              )}
            </div>
          </div>
          <Link to="/app/office-hours" className="text-xs text-primary font-medium hover:underline mt-4">
            Manage Availability →
          </Link>
        </div>

        {/* Column 2: Openings You Posted */}
        <div className="panel flex flex-col justify-between p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-emerald-500" />
                Openings You Posted
              </h3>
              <Link to="/app/opportunities" className="text-[11px] text-primary hover:underline font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {openings.data?.length ? (
                openings.data.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3 hover:bg-muted/10 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{o.role}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{o.company}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-border bg-muted/40 font-medium">
                      Active
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground p-4 text-center">No openings posted yet.</p>
              )}
            </div>
          </div>
          <Link to="/app/opportunities" className="text-xs text-primary font-medium hover:underline mt-4">
            Post New Opening →
          </Link>
        </div>

        {/* Column 3: Referral Requests */}
        <div className="panel flex flex-col justify-between p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Inbox className="h-4 w-4 text-purple-500" />
                Referral Requests
              </h3>
              <Link to="/app/referrals" className="text-[11px] text-primary hover:underline font-medium">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {referrals.data?.length ? (
                referrals.data.slice(0, 2).map((r) => {
                  const student = dir?.[r.student_id];
                  const initialStr = student?.name ? student.name.substring(0, 2).toUpperCase() : "ST";
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border border-border/60 p-3 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 font-bold text-xs">
                          {initialStr}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{student?.name || "Student"}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{student?.branch || "CSE"} · Year {student?.year || 4}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600 border-none hover:bg-amber-500/10">
                        Pending
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground p-4 text-center">No pending referral requests.</p>
              )}
            </div>
          </div>
          <Link to="/app/referrals" className="text-xs text-primary font-medium hover:underline mt-4">
            Review Requests →
          </Link>
        </div>
      </section>

      {/* Bottom Grid */}
      <section className="grid gap-6 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both">
        {/* Column 1: Recent Stories */}
        <div className="panel p-5 shadow-sm md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-orange-500" />
              Recent Stories
            </h3>
            <Link to="/app/stories" className="text-[11px] text-primary hover:underline font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentStories.data?.length ? (
              recentStories.data.map((story) => {
                const author = dir?.[story.alumni_id];
                return (
                  <Link
                    key={story.id}
                    to={`/app/stories`}
                    className="flex gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/10 transition-colors"
                  >
                    <div 
                      className="h-12 w-16 rounded-md bg-cover bg-center shrink-0 border border-border/60 transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: `url('/images/story1.jpg')` }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground line-clamp-1 leading-snug">{story.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        By {author?.name || "Alumni"} · Batch {author?.batch || "2022"}
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground p-4 text-center">No stories shared yet.</p>
            )}
          </div>
        </div>

        {/* Column 2: Unanswered Questions */}
        <div className="panel p-5 shadow-sm md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              Unanswered Questions
            </h3>
            <Link to="/app/forum" className="text-[11px] text-primary hover:underline font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-2">
            {unansweredQuestions.data?.length ? (
              unansweredQuestions.data.map((q) => (
                <Link
                  key={q.id}
                  to={`/app/forum/$id`}
                  params={{ id: q.id }}
                  className="block rounded-lg border border-border/60 p-3 hover:bg-muted/10 transition-colors"
                >
                  <p className="text-xs font-semibold text-foreground line-clamp-1 leading-snug">{q.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <span>{timeAgo(q.created_at)}</span>
                    <span>•</span>
                    <span className="text-indigo-600 font-medium">Be the first to answer</span>
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-4 text-center">All questions have been answered!</p>
            )}
          </div>
        </div>

        {/* Column 3: Quick Links */}
        <div className="panel p-5 shadow-sm md:col-span-1">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-500" />
            Quick Links
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Link
              to="/app/chat"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 hover:bg-blue-500/5 transition-all group"
            >
              <Inbox className="h-5 w-5 text-blue-500 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-medium text-foreground mt-1.5">Chat</span>
            </Link>
            <Link
              to="/app/forum"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 hover:bg-emerald-500/5 transition-all group"
            >
              <MessageSquare className="h-5 w-5 text-emerald-500 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-medium text-foreground mt-1.5">Forum</span>
            </Link>
            <Link
              to="/app/resources"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 hover:bg-purple-500/5 transition-all group"
            >
              <BookOpen className="h-5 w-5 text-purple-500 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-medium text-foreground mt-1.5">Resources</span>
            </Link>
            <Link
              to="/app/office-hours"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 hover:bg-amber-500/5 transition-all group"
            >
              <Calendar className="h-5 w-5 text-amber-500 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-medium text-foreground mt-1.5">Sessions</span>
            </Link>
            <Link
              to="/app/stories"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 hover:bg-rose-500/5 transition-all group"
            >
              <Heart className="h-5 w-5 text-rose-500 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-medium text-foreground mt-1.5">Saved</span>
            </Link>
            <Link
              to="/app/profile"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 hover:bg-slate-500/5 transition-all group"
            >
              <Settings className="h-5 w-5 text-slate-500 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-medium text-foreground mt-1.5">Settings</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

