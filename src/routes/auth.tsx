import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRANCHES, COLLEGE_EMAIL_RE } from "@/lib/kec";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Pencil,
  CheckCircle2,
  GraduationCap,
  Building2,
  Briefcase,
  Calendar,
  MessageSquare,
  ChevronLeft,
  Send,
  IdCard,
  Laptop,
  Users,
  BookOpen,
  Sparkles,
} from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).catch("signup"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — KEC Connect" },
      {
        name: "description",
        content: "Sign in or create your KEC Connect account as a student or alumnus.",
      },
      { property: "og:title", content: "Sign in — KEC Connect" },
      { property: "og:description", content: "Access the Kongu student and alumni network." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "alumni">("student");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [batch, setBatch] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");

  async function handleSignIn(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/app" });
  }

  async function handleSignUp(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (role === "student" && !COLLEGE_EMAIL_RE.test(email.trim())) {
      toast.error("Students must sign up with a college email, e.g. 23ecr085@kongu.edu");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          role,
          name: name.trim(),
          branch: branch || null,
          year: role === "student" ? year : "",
          batch: batch || null,
          company: role === "alumni" ? company : null,
          job_title: role === "alumni" ? jobTitle : null,
          bio,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F4F8FC] font-sans antialiased text-slate-800 flex flex-col justify-between selection:bg-[#2563EB]/15 selection:text-[#1D4ED8] relative">
      
      {/* ================= 1. PERFECTLY COLOR-SYNCED FULL-WIDTH HEADER BANNER ================= */}
      <header className="w-full max-w-full overflow-hidden bg-[#0A2647] border-b border-slate-200/80 shadow-sm z-30">
        <Link to="/" className="block w-full">
          <img
            src="/header.jpg"
            alt="Kongu Engineering College Header Banner"
            className="w-full w-screen max-w-full h-16 sm:h-20 md:h-24 lg:h-26 object-fill block"
          />
        </Link>
      </header>

      {/* ================= 2. BACK TO HOME BUTTON BELOW HEADER ================= */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-1 z-20 flex items-center justify-between">
        <Link
          to="/"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#2563EB] bg-white hover:bg-slate-50 px-4 py-2 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-x-0.5"
        >
          <ChevronLeft className="h-4 w-4 text-[#2563EB] transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* ================= 3. CREATIVE ANIMATED BACKGROUND & SIDE ARTWORK ================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 mt-16">
        {/* Soft Sky Blue Glow Blobs */}
        <div className="absolute top-10 right-10 w-[650px] h-[650px] bg-[#E0F2FE]/70 rounded-full blur-[100px] animate-pulse duration-10000" />
        <div className="absolute bottom-10 left-10 w-[650px] h-[650px] bg-[#DCFCE7]/50 rounded-full blur-[100px] animate-pulse duration-8000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/80 rounded-full blur-[120px]" />

        {/* Dotted Overlay Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#0F172A 1.5px, transparent 1.5px)`,
            backgroundSize: `28px 28px`,
          }}
        />

        {/* LEFT SIDE CREATIVE ANIMATIONS */}
        <div className="absolute left-2 xl:left-8 bottom-4 hidden md:block w-[300px] lg:w-[380px] h-[480px]">
          {/* Flying Paper Plane Animation */}
          <div className="absolute top-4 left-12 animate-bounce duration-7000">
            <div className="relative">
              <Send className="h-9 w-9 text-[#2563EB] -rotate-45 drop-shadow-md animate-pulse" />
              <Sparkles className="h-4 w-4 text-amber-400 absolute -top-2 -right-2 animate-ping" />
            </div>
          </div>

          {/* Drifting Clouds */}
          <div className="absolute top-14 right-6 opacity-60 animate-pulse duration-9000">
            <div className="w-16 h-6 bg-white rounded-full shadow-xs" />
          </div>

          {/* SVG Dotted Motion Trails & Line-Art Clock Tower */}
          <svg className="absolute inset-0 w-full h-full opacity-70" viewBox="0 0 380 480" fill="none">
            <path
              d="M 50 70 C 140 130, 70 230, 180 300"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="animate-pulse"
            />

            <text x="20" y="140" fill="#93C5FD" fontSize="16" fontWeight="bold">+</text>
            <text x="300" y="100" fill="#86EFAC" fontSize="14">△</text>
            <circle cx="70" cy="200" r="4" fill="#60A5FA" className="animate-ping" />

            {/* Line Art Clock Tower & Campus Building */}
            <g stroke="#3B82F6" strokeWidth="1.75" fill="none">
              <rect x="110" y="220" width="95" height="210" rx="6" stroke="#2563EB" />
              <polygon points="157,135 110,220 205,220" stroke="#1D4ED8" strokeWidth="2" />
              <line x1="157" y1="135" x2="157" y2="85" stroke="#2563EB" strokeWidth="2.5" />
              
              <circle cx="157" cy="180" r="17" stroke="#1E40AF" strokeWidth="2" fill="#FFFFFF" />
              <line x1="157" y1="180" x2="157" y2="168" stroke="#2563EB" strokeWidth="2" />
              <line x1="157" y1="180" x2="166" y2="180" stroke="#2563EB" strokeWidth="2" />

              <rect x="128" y="250" width="20" height="30" rx="2" fill="#EFF6FF" stroke="#3B82F6" />
              <rect x="165" y="250" width="20" height="30" rx="2" fill="#EFF6FF" stroke="#3B82F6" />
              <rect x="128" y="300" width="20" height="30" rx="2" fill="#EFF6FF" stroke="#3B82F6" />
              <rect x="165" y="300" width="20" height="30" rx="2" fill="#EFF6FF" stroke="#3B82F6" />

              <rect x="45" y="300" width="65" height="130" rx="4" stroke="#60A5FA" />
              <rect x="205" y="300" width="65" height="130" rx="4" stroke="#60A5FA" />

              <rect x="62" y="330" width="28" height="28" rx="2" fill="#F0FDF4" stroke="#4ADE80" />
              <rect x="222" y="330" width="28" height="28" rx="2" fill="#F0FDF4" stroke="#4ADE80" />

              <path d="M 10 450 Q 190 420 370 460" stroke="#94A3B8" strokeWidth="2" />
            </g>
          </svg>
        </div>

        {/* RIGHT SIDE CREATIVE ANIMATIONS */}
        <div className="absolute right-2 xl:right-8 bottom-4 hidden md:block w-[320px] lg:w-[400px] h-[500px]">
          {/* 1. Floating 3D Chat Bubble */}
          <div className="absolute top-6 right-8 p-3 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white shadow-xl animate-bounce duration-6000 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping delay-150" />
            </div>
          </div>

          {/* 2. Floating Glass ID Card */}
          <div className="absolute top-24 left-2 px-3.5 py-2.5 rounded-2xl bg-white/95 border border-blue-200 shadow-xl backdrop-blur-md flex items-center gap-2.5 animate-pulse duration-7000">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shadow-xs">
              <IdCard className="h-5 w-5" />
            </div>
            <div>
              <div className="w-14 h-2 bg-blue-500 rounded-full mb-1" />
              <div className="w-8 h-1.5 bg-slate-300 rounded-full" />
            </div>
          </div>

          {/* 3. Floating Graduation Cap Badge */}
          <div className="absolute top-44 right-2 p-3 rounded-full bg-blue-600 text-white shadow-2xl animate-bounce duration-8000">
            <GraduationCap className="h-6 w-6" />
          </div>

          {/* Animated Connecting Motion Paths */}
          <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 400 500" fill="none">
            <path
              d="M 80 120 C 200 70, 320 160, 340 280"
              stroke="#2563EB"
              strokeWidth="2"
              strokeDasharray="6 6"
              className="animate-pulse"
            />
            <path
              d="M 50 320 C 150 380, 260 360, 360 420"
              stroke="#16A34A"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            <circle cx="340" cy="120" r="5" fill="#3B82F6" className="animate-ping" />
            <circle cx="370" cy="240" r="4" fill="#22C55E" />
          </svg>

          {/* Interactive Students & Alumni Study Illustration */}
          <div className="absolute bottom-4 right-2 flex items-end gap-4">
            {/* Student 1 (Green Shirt) */}
            <div className="flex flex-col items-center animate-pulse duration-8000">
              <div className="w-28 lg:w-32 h-40 lg:h-44 bg-white/90 rounded-3xl border border-emerald-200 shadow-xl backdrop-blur-md p-3 flex flex-col items-center justify-between">
                <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md">
                  <User className="h-5 w-5" />
                </div>
                <div className="w-full bg-emerald-50 rounded-xl p-1.5 border border-emerald-100 flex items-center justify-center gap-1.5">
                  <Laptop className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">Student</span>
                </div>
                <div className="w-full flex items-center justify-center gap-1 text-slate-500">
                  <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[10px] font-semibold text-slate-600">3rd Year</span>
                </div>
              </div>
            </div>

            {/* Student 2 (Alumnus) */}
            <div className="flex flex-col items-center animate-bounce duration-9000">
              <div className="mb-1.5 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold shadow-md animate-pulse">
                Mentorship Accepted ✨
              </div>
              <div className="w-28 lg:w-32 h-44 lg:h-48 bg-gradient-to-b from-blue-600 to-indigo-700 rounded-3xl border border-blue-400 shadow-2xl p-3 text-white flex flex-col items-center justify-between">
                <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-1.5 flex items-center justify-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-xs font-bold text-white">Alumnus</span>
                </div>
                <span className="text-[9px] font-semibold text-blue-100">Cognizant · SDE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. CENTERED CLEAN WHITE AUTH CARD ================= */}
      <main className="w-full max-w-md mx-auto px-4 py-4 sm:py-8 z-10 my-auto animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/10 p-6 sm:p-8 space-y-6 relative overflow-hidden">
          
          {sent ? (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Check your email</h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                We sent a confirmation link to <span className="font-semibold text-slate-900">{email}</span>. Click it to activate your account.
              </p>
              <Button
                className="mt-2 w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl py-2.5 font-semibold text-sm shadow-sm"
                onClick={() => {
                  setSent(false);
                  navigate({ to: "/auth", search: { mode: "signin" } });
                }}
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <div>
              {/* Mode Tabs */}
              <div className="flex border-b border-slate-200 mb-6">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
                  className={`flex-1 py-3 text-center text-sm font-bold transition-all relative ${
                    mode === "signin"
                      ? "text-[#2563EB] border-b-2 border-[#2563EB]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                  className={`flex-1 py-3 text-center text-sm font-bold transition-all relative ${
                    mode === "signup"
                      ? "text-[#2563EB] border-b-2 border-[#2563EB]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Title & Subtitle */}
              <div className="mb-6 space-y-1">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {mode === "signin" ? "Welcome back 👋" : "Create your account 👋"}
                </h1>
                <p className="text-sm text-slate-600 font-normal">
                  {mode === "signin"
                    ? "Sign in to access the KEC student & alumni portal."
                    : "Join the official Kongu Engineering College network."}
                </p>
              </div>

              {/* SIGN IN FORM */}
              {mode === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      College Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="23ecr085@kongu.edu"
                        className="pl-10 h-10.5 rounded-xl text-sm border-slate-200 bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-10.5 rounded-xl text-sm border-slate-200 bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      <span className="text-xs text-slate-600 font-medium">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => toast.info("Contact admin or check Supabase settings to reset password.")}
                      className="text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 mt-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>

                  {/* Switch Link */}
                  <div className="pt-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-600">
                      New to KEC Connect?{" "}
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                        className="font-semibold text-[#2563EB] hover:underline"
                      >
                        Create an account
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* CREATE ACCOUNT FORM */
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Role Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-slate-700">I am a</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole("student")}
                        className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          role === "student"
                            ? "bg-[#0038A8] text-white border-[#0038A8] shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <GraduationCap className="h-4 w-4" />
                        Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("alumni")}
                        className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                          role === "alumni"
                            ? "bg-[#0038A8] text-white border-[#0038A8] shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <Building2 className="h-4 w-4" />
                        Alumnus
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="name"
                        required
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="pl-10 h-10.5 rounded-xl text-sm border-slate-200 bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="su-email" className="text-sm font-semibold text-slate-700">
                      {role === "student" ? "College Email" : "Email Address"}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="su-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={role === "student" ? "name@kongu.edu" : "name@company.com"}
                        className="pl-10 h-10.5 rounded-xl text-sm border-slate-200 bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                      />
                    </div>
                  </div>

                  {/* Branch & Year/Batch */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold text-slate-700">Branch</Label>
                      <Select value={branch} onValueChange={setBranch}>
                        <SelectTrigger className="h-10.5 rounded-xl text-sm border-slate-200 bg-white">
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRANCHES.map((b) => (
                            <SelectItem key={b} value={b} className="text-sm">
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {role === "student" ? (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-slate-700">Year</Label>
                        <Select value={year} onValueChange={setYear}>
                          <SelectTrigger className="h-10.5 rounded-xl text-sm border-slate-200 bg-white">
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {["1", "2", "3", "4"].map((y) => (
                              <SelectItem key={y} value={y} className="text-sm">
                                {y} Year
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor="batch" className="text-sm font-semibold text-slate-700">Batch</Label>
                        <Input
                          id="batch"
                          value={batch}
                          onChange={(e) => setBatch(e.target.value)}
                          placeholder="2019-2023"
                          className="h-10.5 rounded-xl text-sm border-slate-200 bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Alumni Fields */}
                  {role === "alumni" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="company" className="text-sm font-semibold text-slate-700">Company</Label>
                        <Input
                          id="company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Cognizant"
                          className="h-10.5 rounded-xl text-sm border-slate-200 bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="jobtitle" className="text-sm font-semibold text-slate-700">Role</Label>
                        <Input
                          id="jobtitle"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="Software Engineer"
                          className="h-10.5 rounded-xl text-sm border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  <div className="space-y-1.5">
                    <Label htmlFor="bio" className="text-sm font-semibold text-slate-700">Short bio (optional)</Label>
                    <div className="relative">
                      <Textarea
                        id="bio"
                        rows={2}
                        maxLength={300}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us a little about yourself..."
                        className="pr-9 rounded-xl text-sm border-slate-200 bg-white resize-none"
                      />
                      <Pencil className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="su-password" className="text-sm font-semibold text-slate-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="su-password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10 h-10.5 rounded-xl text-sm border-slate-200 bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 mt-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? "Creating account..." : "Create Account"}
                    {!loading && <ArrowRight className="h-4 w-4" />}
                  </Button>

                  {/* Switch Link */}
                  <div className="pt-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-600">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                        className="font-semibold text-[#2563EB] hover:underline"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full text-center py-4 text-xs text-slate-500 z-10 font-medium">
        © {new Date().getFullYear()} Kongu Engineering College. All rights reserved.
      </footer>
    </div>
  );
}
