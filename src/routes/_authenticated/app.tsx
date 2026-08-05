import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Briefcase,
  CalendarClock,
  Home,
  Inbox,
  LogOut,
  MessagesSquare,
  Newspaper,
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

  const nav = profile?.role === "alumni" ? ALUMNI_NAV : STUDENT_NAV;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="px-6 py-6 flex justify-center">
          <Link to="/app" className="block mb-6 w-full">
            <img src="/images/logo.webp" alt="KEC Logo" className="h-16 w-full object-contain drop-shadow-md" />
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {nav.map((item) => (
            <Link
              key={item.to + item.label}
              to={item.to}
              activeOptions={{ exact: item.to === "/app" }}
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            >
              <item.icon className="h-4 w-4" strokeWidth={1.7} />
              {item.label}
            </Link>
          ))}
        </nav>

      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Header */}
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <Link to="/app" className="block">
            <img src="/images/logo.webp" alt="KEC Logo" className="h-8 w-auto object-contain" />
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-end border-b border-border/40 px-10 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-white shadow-sm">
                {initials(profile?.name)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground leading-none">{profile?.name || "Your profile"}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  {profile?.role === "alumni"
                    ? profile?.company || "Alumnus"
                    : profile?.branch
                      ? `${profile.branch}`
                      : "Student"}
                </span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-border"></div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" /> 
              Sign out
            </Button>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={"m" + item.to + item.label}
              to={item.to}
              activeOptions={{ exact: item.to === "/app" }}
              activeProps={{ className: "bg-secondary font-medium" }}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">
          {isLoading ? <Skeleton className="h-64 w-full" /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
