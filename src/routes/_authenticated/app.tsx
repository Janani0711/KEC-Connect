import { useState } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  Briefcase,
  CalendarClock,
  ChevronDown,
  Home,
  Inbox,
  LogOut,
  MessagesSquare,
  Newspaper,
  User,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { initials, useProfile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

type NavItem = { to: string; label: string; icon: typeof Home };

const STUDENT_NAV: NavItem[] = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/forum", label: "Q&A forum", icon: MessagesSquare },
  { to: "/app/connect", label: "Connect with seniors", icon: Users },
  { to: "/app/office-hours", label: "Office hours", icon: CalendarClock },
  { to: "/app/chat", label: "Chat", icon: Inbox },
  { to: "/app/opportunities", label: "Opportunities", icon: Briefcase },
  { to: "/app/stories", label: "Stories", icon: Newspaper },
  { to: "/app/resources", label: "Resources", icon: BookOpen },
];

const ALUMNI_NAV: NavItem[] = [
  { to: "/app", label: "Home", icon: Home },
  { to: "/app/office-hours", label: "Set office hours", icon: CalendarClock },
  { to: "/app/opportunities", label: "Openings & referrals", icon: Briefcase },
  { to: "/app/referrals", label: "Referral requests", icon: Inbox },
  { to: "/app/stories", label: "Stories", icon: Newspaper },
  { to: "/app/forum", label: "Q&A forum", icon: MessagesSquare },
  { to: "/app/chat", label: "Chat", icon: MessagesSquare },
  { to: "/app/resources", label: "Resources", icon: BookOpen },
];

function AppLayout() {
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const nav = profile?.role === "alumni" ? ALUMNI_NAV : STUDENT_NAV;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAF9] text-slate-800 font-sans antialiased">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white md:flex">
        {/* KEC Logo Header */}
        <div className="px-6 pt-6 pb-4">
          <Link to="/app" className="block">
            <img
              src="/kec-logo.jpg"
              alt="Kongu Engineering College - Transform Yourself"
              className="h-16 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1 px-3.5 py-2">
          {nav.map((item) => (
            <Link
              key={item.to + item.label}
              to={item.to}
              activeOptions={{ exact: item.to === "/app" }}
              activeProps={{
                className:
                  "bg-[#F0F7F2] text-[#1B7B3A] font-semibold flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm transition-all shadow-xs",
              }}
              inactiveProps={{
                className:
                  "flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 font-medium",
              }}
            >
              <item.icon className="h-4.5 w-4.5" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Sidebar Box */}
        <div className="mx-3.5 mb-5 rounded-2xl bg-[#EBF6F0] p-4 border border-[#D8EDE0] relative overflow-hidden shadow-xs">
          <h4 className="font-bold text-slate-800 text-sm leading-snug">
            Give back. Inspire.<br />Grow together.
          </h4>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed pr-6">
            Become a mentor and help the next generation achieve their dreams.
          </p>
          <button className="mt-3.5 rounded-lg bg-[#4CAE30] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#429C28] shadow-xs cursor-pointer">
            Join as a Mentor
          </button>
          
          {/* Hands Illustration SVG */}
          <svg className="absolute bottom-1 right-1 h-14 w-14 opacity-80" viewBox="0 0 100 100" fill="none">
            <path d="M30 75 C 30 60, 42 42, 48 38 C 50 36, 53 38, 51 42 C 46 50, 44 60, 40 75 Z" fill="#67C58A" />
            <path d="M52 80 C 52 62, 64 40, 70 36 C 72 34, 75 36, 73 40 C 67 50, 64 62, 60 80 Z" fill="#3D9B5E" />
            <circle cx="48" cy="28" r="2.5" fill="#4CAE30" />
            <circle cx="62" cy="24" r="2" fill="#67C58A" />
            <circle cx="36" cy="26" r="2" fill="#3D9B5E" />
          </svg>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between md:justify-end border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-md">
          {/* Mobile KEC Logo */}
          <Link to="/app" className="block md:hidden">
            <img src="/kec-logo.jpg" alt="KEC Logo" className="h-10 w-auto object-contain" />
          </Link>

          {/* Right Header Section (Notifications & Profile) */}
          <div className="flex items-center gap-4">
            {/* Bell Notification Button */}
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#4CAE30] ring-2 ring-white" />
            </button>

            {/* Profile Section */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-3 rounded-full p-1 transition-colors hover:bg-slate-100"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white shadow-xs">
                  {initials(profile?.name || "Kiruthiya S")}
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-xs font-bold text-sky-500 font-[#poppins] leading-tight">
                    {profile?.name || "Kiruthiya S"}
                  </p>
                  <p className="text-[11px] text-slate-500 capitalize">
                    {profile?.role === "alumni" ? "Alumnus" : "Student"}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50">
                  <Link
                    to="/app/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      signOut();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Bar */}
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={"m" + item.to + item.label}
              to={item.to}
              activeOptions={{ exact: item.to === "/app" }}
              activeProps={{ className: "bg-[#F0F7F2] text-[#1B7B3A] font-semibold" }}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-slate-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Main View Area */}
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-3xl" />
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

