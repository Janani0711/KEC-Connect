import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarClock,
  ChevronRight,
  Clock,
  HelpCircle,
  Inbox,
  MessagesSquare,
  Newspaper,
  Users,
} from "lucide-react";
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

  const opportunities = useQuery({
    queryKey: ["opportunities", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Welcome Hero Banner Card */}
      <section className="relative overflow-hidden rounded-3xl border border-[#D5EADF]/60 bg-gradient-to-r from-[#EBF7F2] via-[#F2FAF6] to-[#E9F6F0] p-7 md:p-9 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
          <div className="max-w-xl">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              Welcome back,{" "}
              <span className="text-sky-500 font-extrabold">
                {profile?.name?.split(" ")[0] || "Kiruthiya"}!
              </span>{" "}
              👋
            </h1>
            <p className="mt-2.5 text-sm md:text-base text-slate-600 leading-relaxed font-normal">
              Learn, connect and grow with our vibrant students & alumni community.
            </p>
          </div>

          {/* Campus Vector Illustration */}
          <div className="w-full md:w-80 shrink-0 flex justify-center">
            <svg className="w-full h-auto max-h-44" viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="150" y="70" width="100" height="70" rx="4" fill="#FFFFFF" stroke="#475569" strokeWidth="2" />
              <path d="M140 70 L200 40 L260 70 Z" fill="#FFFFFF" stroke="#475569" strokeWidth="2" />
              <rect x="180" y="48" width="40" height="12" rx="2" fill="#FFFFFF" stroke="#475569" strokeWidth="1.5" />
              <text x="200" y="57" fill="#1D8249" fontSize="8" fontWeight="bold" textAnchor="middle">KEC</text>
              <rect x="165" y="80" width="15" height="15" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
              <rect x="220" y="80" width="15" height="15" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
              <rect x="165" y="105" width="15" height="15" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
              <rect x="220" y="105" width="15" height="15" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
              <rect x="190" y="115" width="20" height="25" fill="#475569" />

              <circle cx="268" cy="35" r="16" fill="#3B82F6" />
              <path d="M260 35 L268 30 L276 35 L268 40 Z" fill="#FFFFFF" />
              <path d="M263 36.5 V41 C263 43 273 43 273 41 V36.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />

              <circle cx="295" cy="80" fill="#22C55E" r="14" />
              <rect x="288" y="75" width="14" height="10" rx="1.5" fill="#FFFFFF" />
              <path d="M292 75 V73 C292 72 298 72 298 73 V75" stroke="#FFFFFF" strokeWidth="1.5" />

              <circle cx="315" cy="40" stroke="#1D8249" strokeWidth="1.5" fill="#EBF7F2" r="12" />
              <circle cx="311" cy="40" r="1.5" fill="#1D8249" />
              <circle cx="315" cy="40" r="1.5" fill="#1D8249" />
              <circle cx="319" cy="40" r="1.5" fill="#1D8249" />

              <circle cx="358" cy="78" fill="#2563EB" r="14" />
              <path d="M352 74 H364 C366 74 366 80 364 80 H356 L352 84 V80 C350 80 350 74 352 74 Z" fill="#FFFFFF" />

              <circle cx="105" cy="115" r="10" fill="#FCA5A5" stroke="#475569" strokeWidth="1.5" />
              <path d="M95 140 C95 130 115 130 115 140 V155 H95 Z" fill="#4CAE30" stroke="#475569" strokeWidth="1.5" />
              
              <circle cx="280" cy="110" r="10" fill="#FCD34D" stroke="#475569" strokeWidth="1.5" />
              <path d="M270 135 C270 125 290 125 290 135 V155 H270 Z" fill="#1D4ED8" stroke="#475569" strokeWidth="1.5" />
              <rect x="290" y="132" width="22" height="14" rx="2" fill="#FFFFFF" stroke="#475569" strokeWidth="1.5" />

              <path d="M50 155 H380" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>
        </div>
      </section>

      {/* Quick Action Cards */}
      <section className="grid gap-5 sm:grid-cols-3">
        {/* Card 1: Ask a Question */}
        <Link
          to="/app/forum"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E2F5EA] text-[#1F9054]">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#1F9054] transition-colors">
              Ask a Question
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Get answers from experienced seniors and alumni.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#1F9054] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Card 2: Book Office Hours */}
        <Link
          to="/app/office-hours"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBF3FE] text-[#2563EB]">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#2563EB] transition-colors">
              Book Office Hours
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Short, focused time with a mentor.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#2563EB] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Card 3: Browse Opportunities */}
        <Link
          to="/app/opportunities"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF7E5] text-[#65A30D]">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#65A30D] transition-colors">
              Browse Opportunities
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Find internships, jobs, and referrals from alumni.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#65A30D] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* Middle 2-Column Section */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Left: Recent questions */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs min-h-[260px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-base">Recent questions</h2>
              <Link to="/app/forum" className="text-xs font-semibold text-[#1F9054] hover:underline">
                View all
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {questions.data?.length ? (
                questions.data.slice(0, 3).map((q) => (
                  <Link
                    key={q.id}
                    to="/app/forum/$id"
                    params={{ id: q.id }}
                    className="flex items-center gap-3.5 py-4 hover:bg-slate-50 transition-colors rounded-lg px-2"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                      {q.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-slate-800 text-sm">{q.title}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {dir?.[q.author_id]?.name ?? "Student"} · {timeAgo(q.created_at)}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10 my-auto">
                  <p className="text-sm font-semibold text-slate-700">No questions asked yet.</p>
                  <p className="text-xs text-slate-500 mt-1">Be the first to ask a question to the community!</p>
                  <Link
                    to="/app/forum"
                    className="mt-4 rounded-lg bg-[#4CAE30] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#429C28] shadow-xs"
                  >
                    Ask a Question
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center mt-2">
            <Link to="/app/forum" className="text-xs font-semibold text-[#1F9054] hover:underline">
              See all questions
            </Link>
          </div>
        </div>

        {/* Right: Open office-hour slots */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs min-h-[260px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base">Open office-hour slots</h2>
            <Link to="/app/office-hours" className="text-xs font-semibold text-[#1F9054] hover:underline">
              See all
            </Link>
          </div>

          {slots.data?.length ? (
            <div className="py-4 space-y-3">
              {slots.data.slice(0, 2).map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{s.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {dir?.[s.host_id]?.name ?? "Mentor"} · {s.duration_minutes} mins
                    </p>
                  </div>
                  <Button asChild size="sm" className="bg-[#4CAE30] hover:bg-[#429C28] text-white text-xs">
                    <Link to="/app/office-hours">Book</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-8 my-auto">
              <div className="relative mb-3 flex items-center justify-center">
                <div className="h-20 w-20 rounded-2xl bg-[#F0FAF4] border border-[#D5EADF] flex flex-col items-center justify-center p-3 shadow-xs">
                  <div className="w-full h-3.5 bg-[#4CAE30] rounded-t-md mb-2 flex items-center justify-around px-2">
                    <span className="h-1 w-1 rounded-full bg-white" />
                    <span className="h-1 w-1 rounded-full bg-white" />
                  </div>
                  <div className="grid grid-cols-3 gap-1 w-full">
                    <div className="h-2 bg-[#67C58A] rounded-xs" />
                    <div className="h-2 bg-[#67C58A] rounded-xs" />
                    <div className="h-2 bg-[#67C58A] rounded-xs" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center border-2 border-white shadow-xs">
                  <Clock className="h-4 w-4" />
                </div>
              </div>

              <h3 className="font-bold text-slate-800 text-sm">No open slots this week.</h3>
              <p className="text-xs text-slate-500 mt-1">Check back soon for new availability!</p>
            </div>
          )}
        </div>
      </section>

      {/* Bottom 2-Column Section */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Left: Upcoming events */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base">Upcoming events</h2>
            <Link to="/app/stories" className="text-xs font-semibold text-[#1F9054] hover:underline">
              See all
            </Link>
          </div>

          <div className="mt-4 flex flex-col items-center justify-center text-center py-7 px-4 rounded-2xl border border-slate-100 bg-[#F9FCFA]">
            <p className="text-sm font-semibold text-slate-700">No upcoming events scheduled.</p>
            <p className="text-xs text-slate-500 mt-1">Check back later for new workshops and alumni meetups.</p>
          </div>
        </div>

        {/* Right: Latest opportunities */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-base">Latest opportunities</h2>
            <Link to="/app/opportunities" className="text-xs font-semibold text-[#1F9054] hover:underline">
              See all
            </Link>
          </div>

          {opportunities.data?.length ? (
            <div className="mt-4 space-y-3">
              {opportunities.data.map((opp) => (
                <div key={opp.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-[#F9FCFA] p-4 shadow-2xs">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-800 text-xs">
                      {opp.company?.substring(0, 3)?.toUpperCase() || "JOB"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{opp.title}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{opp.company} • {opp.role_type}</p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="text-xs">
                    <Link to="/app/opportunities">View</Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center justify-center text-center py-7 px-4 rounded-2xl border border-slate-100 bg-[#F9FCFA]">
              <p className="text-sm font-semibold text-slate-700">No active opportunities posted.</p>
              <p className="text-xs text-slate-500 mt-1">Browse all opportunities or check back soon!</p>
            </div>
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
    <div className="mx-auto max-w-6xl space-y-7">
      {/* Welcome Hero Banner Card */}
      <section className="relative overflow-hidden rounded-3xl border border-[#D5EADF]/60 bg-gradient-to-r from-[#EBF7F2] via-[#F2FAF6] to-[#E9F6F0] p-7 md:p-9 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 z-10 relative">
          <div className="max-w-xl">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              Welcome back,{" "}
              <span className="text-sky-500 font-extrabold">
                {profile?.name?.split(" ")[0] || "there"}!
              </span>{" "}
              👋
            </h1>
            <p className="mt-2.5 text-sm md:text-base text-slate-600 leading-relaxed font-normal">
              {[profile?.job_title, profile?.company].filter(Boolean).join(" at ") ||
                "Alumnus of Kongu Engineering College"}
              {profile?.batch ? ` · Batch ${profile.batch}` : ""}
            </p>
          </div>

          {/* Campus Vector Illustration */}
          <div className="w-full md:w-80 shrink-0 flex justify-center">
            <svg className="w-full h-auto max-h-44" viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="150" y="70" width="100" height="70" rx="4" fill="#FFFFFF" stroke="#475569" strokeWidth="2" />
              <path d="M140 70 L200 40 L260 70 Z" fill="#FFFFFF" stroke="#475569" strokeWidth="2" />
              <rect x="180" y="48" width="40" height="12" rx="2" fill="#FFFFFF" stroke="#475569" strokeWidth="1.5" />
              <text x="200" y="57" fill="#1D8249" fontSize="8" fontWeight="bold" textAnchor="middle">KEC</text>
              <rect x="165" y="80" width="15" height="15" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
              <rect x="220" y="80" width="15" height="15" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
              <rect x="165" y="105" width="15" height="15" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
              <rect x="220" y="105" width="15" height="15" rx="2" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
              <rect x="190" y="115" width="20" height="25" fill="#475569" />

              <circle cx="268" cy="35" r="16" fill="#3B82F6" />
              <path d="M260 35 L268 30 L276 35 L268 40 Z" fill="#FFFFFF" />
              <path d="M263 36.5 V41 C263 43 273 43 273 41 V36.5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />

              <circle cx="295" cy="80" fill="#22C55E" r="14" />
              <rect x="288" y="75" width="14" height="10" rx="1.5" fill="#FFFFFF" />
              <path d="M292 75 V73 C292 72 298 72 298 73 V75" stroke="#FFFFFF" strokeWidth="1.5" />

              <circle cx="358" cy="78" fill="#2563EB" r="14" />
              <path d="M352 74 H364 C366 74 366 80 364 80 H356 L352 84 V80 C350 80 350 74 352 74 Z" fill="#FFFFFF" />

              <path d="M50 155 H380" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
            </svg>
          </div>
        </div>
      </section>

      {/* Quick Action Cards */}
      <section className="grid gap-5 sm:grid-cols-3">
        {/* Card 1: Set Office Hours */}
        <Link
          to="/app/office-hours"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBF3FE] text-[#2563EB]">
            <CalendarClock className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#2563EB] transition-colors">
              Set Office Hours
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Offer a slot or two to mentor KEC students this week.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#2563EB] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Card 2: Post Opening & Referral */}
        <Link
          to="/app/opportunities"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E2F5EA] text-[#1F9054]">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#1F9054] transition-colors">
              Post an Opening
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Share career opportunities or offer job referrals.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#1F9054] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>

        {/* Card 3: Write a Story */}
        <Link
          to="/app/stories"
          className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF7E5] text-[#65A30D]">
            <Newspaper className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm group-hover:text-[#65A30D] transition-colors">
              Write a Story
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Share advice and experiences you wish you'd known.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-[#65A30D] self-end opacity-80 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>

      {/* Middle 2-Column Section */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Left: Pending connect requests */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs min-h-[240px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-base">Pending connect requests</h2>
              <Link to="/app/chat" className="text-xs font-semibold text-[#1F9054] hover:underline">
                Go to chat
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {connects.data?.length ? (
                connects.data.map((c) => (
                  <div key={c.id} className="py-4">
                    <p className="font-semibold text-slate-800 text-sm">
                      {dir?.[c.from_user_id]?.name ?? "A student"}{" "}
                      <span className="font-normal text-xs text-slate-500">
                        · {labelFor(CONNECT_TOPICS, c.topic)}
                      </span>
                    </p>
                    {c.note && <p className="mt-1 text-xs text-slate-600">{c.note}</p>}
                    <Button asChild size="sm" variant="outline" className="mt-3 text-xs">
                      <Link to="/app/chat">Review request</Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10 my-auto">
                  <p className="text-sm font-semibold text-slate-700">No pending connect requests.</p>
                  <p className="text-xs text-slate-500 mt-1">Students can reach out to connect with you.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Pending referral requests */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs min-h-[240px]">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-base">Pending referral requests</h2>
              <Link to="/app/referrals" className="text-xs font-semibold text-[#1F9054] hover:underline">
                Open inbox
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {referrals.data?.length ? (
                referrals.data.map((r) => (
                  <div key={r.id} className="py-4">
                    <p className="font-semibold text-slate-800 text-sm">{dir?.[r.student_id]?.name ?? "A student"}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">{r.why_note}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10 my-auto">
                  <p className="text-sm font-semibold text-slate-700">No pending referral requests.</p>
                  <p className="text-xs text-slate-500 mt-1">Referral requests from students will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

