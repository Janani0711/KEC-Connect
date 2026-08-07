import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initials, useProfile } from "@/lib/kec";
import {
  Home,
  Users,
  Calendar,
  Briefcase,
  BookOpen,
  MessageSquare,
  Bookmark,
  LogOut,
  Menu,
  X,
  FileCheck,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

const NAV_ITEMS = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/connect", label: "Alumni Directory", icon: Users },
  { to: "/app/office-hours", label: "Schedule Availability", icon: Calendar },
  { to: "/app/opportunities", label: "Job Openings", icon: Briefcase },
  { to: "/app/referrals", label: "Referrals", icon: FileCheck },
  { to: "/app/stories", label: "Alumni Stories", icon: Bookmark },
  { to: "/app/resources", label: "Resources", icon: BookOpen },
  { to: "/app/forum", label: "Discussion Forum", icon: MessageSquare },
];

function AppLayout() {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" } });
  }

  return (
    <div className="flex min-h-screen bg-[#FAF9F6] font-sans antialiased text-slate-800">
      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 md:static md:translate-x-0 ${
          mobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Exact Original KEC Logo Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <Link to="/app" className="block">
            <img
              src="/kec-logo.jpg"
              alt="Kongu Engineering College - Transform Yourself"
              className="h-16 w-auto object-contain"
            />
          </Link>
          <button
            className="md:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 p-3.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              onClick={() => setMobileNavOpen(false)}
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
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between md:justify-end border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-md">
          {/* Mobile KEC Logo */}
          <button
            className="md:hidden text-slate-600 hover:text-slate-900"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Profile Menu */}
          <div className="flex items-center gap-3">
            <Link
              to="/app/profile"
              className="flex items-center gap-2.5 rounded-full bg-slate-50 p-1 pr-3 hover:bg-slate-100 transition-colors border border-slate-200/60"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0F2847] text-xs font-bold text-white">
                  {initials(profile?.name)}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {profile?.name || "Profile"}
              </span>
            </Link>

            <button
              onClick={handleSignOut}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Page View Outlet */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
