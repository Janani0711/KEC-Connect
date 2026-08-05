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
  Users,
  Briefcase,
  Lightbulb,
  ArrowRight,
  User,
  GraduationCap,
  CheckCircle2,
  Building2,
  Sparkles,
} from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).catch("signin"),
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
      toast.error("Please enter your name.");
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
    <main className="min-h-screen bg-gradient-to-br from-[#F4FAF6] via-[#EEF6F2] to-[#E5F2EC] flex items-center justify-center p-4 md:p-8 font-sans antialiased text-slate-800 relative overflow-hidden">
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-[#1B7B3A]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 my-auto">
        {/* Left Branding & Highlights Column */}
        <div className="lg:col-span-4 space-y-6 hidden lg:flex lg:flex-col justify-between h-full py-4 pr-4">
          <div>
            {/* Logo */}
            <Link to="/" className="inline-block group">
              <img
                src="/images/logo.webp"
                alt="KEC Logo"
                className="h-16 w-auto object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Title & Tagline */}
            <div className="mt-8 space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Welcome to <br />
                <span className="text-slate-900">KEC </span>
                <span className="text-[#1B7B3A]">Connect</span>
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                The official alumni & student network of{" "}
                <span className="font-semibold text-slate-700">Kongu Engineering College</span>.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 border border-emerald-100/60 backdrop-blur-xs transition-all hover:bg-white/90">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E2F5EA] text-[#1B7B3A]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Connect</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Build meaningful connections with students & alumni across batches.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 border border-emerald-100/60 backdrop-blur-xs transition-all hover:bg-white/90">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF7E5] text-[#65A30D]">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Collaborate</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Discover career opportunities, internships, and job referrals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 border border-emerald-100/60 backdrop-blur-xs transition-all hover:bg-white/90">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EBF3FE] text-sky-600">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Inspire</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Share knowledge, office hours guidance, and real-world experience.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Vector Art Illustration */}
          <div className="pt-4 border-t border-emerald-950/10">
            <svg className="w-full h-auto max-h-24 opacity-75" viewBox="0 0 300 90" fill="none">
              <rect x="110" y="30" width="80" height="50" rx="3" fill="#FFFFFF" stroke="#64748B" strokeWidth="1.5" />
              <path d="M100 30 L150 10 L200 30 Z" fill="#FFFFFF" stroke="#64748B" strokeWidth="1.5" />
              <text x="150" y="24" fill="#1B7B3A" fontSize="7" fontWeight="bold" textAnchor="middle">KEC CAMPUS</text>
              <rect x="120" y="40" width="12" height="12" rx="1.5" fill="#E2E8F0" />
              <rect x="168" y="40" width="12" height="12" rx="1.5" fill="#E2E8F0" />
              <rect x="140" y="58" width="20" height="22" fill="#475569" />
              <path d="M20 80 H280" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
          </div>
        </div>

        {/* Center Auth Floating Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-7 md:p-9 relative overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Mobile Header Logo */}
            <div className="lg:hidden flex justify-center mb-6">
              <Link to="/">
                <img src="/images/logo.webp" alt="KEC Logo" className="h-12 w-auto object-contain" />
              </Link>
            </div>

            {sent ? (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-[#1B7B3A]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Check your email</h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  We sent a confirmation link to <span className="font-semibold text-slate-900">{email}</span>. Click it to activate your account, then sign in.
                </p>
                <Button
                  className="mt-4 w-full bg-[#1B7B3A] hover:bg-[#145F2C] text-white rounded-xl py-2.5 font-semibold text-xs"
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
                {/* Top Tab Controls */}
                <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-2xl mb-7 border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      mode === "signin"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      mode === "signup"
                        ? "bg-[#1B7B3A] text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Create account
                  </button>
                </div>

                {/* Form Heading */}
                <div className="mb-6 space-y-1">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    {mode === "signin" ? (
                      <>
                        Welcome back! <span className="animate-bounce inline-block">👋</span>
                      </>
                    ) : (
                      <>
                        Join KEC Connect <Sparkles className="h-5 w-5 text-amber-500 inline" />
                      </>
                    )}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {mode === "signin"
                      ? "Sign in to continue to your KEC Connect dashboard"
                      : "Create your account as a student or alumnus"}
                  </p>
                </div>

                {/* SIGN IN FORM */}
                {mode === "signin" ? (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                        Email
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
                          className="pl-10 h-11 rounded-xl text-xs border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-bold text-slate-700">
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
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11 rounded-xl text-xs border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & Forgot Password */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-[#1B7B3A] focus:ring-[#1B7B3A]"
                        />
                        <span className="text-xs text-slate-600 font-medium">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => toast.info("Contact admin or check Supabase auth settings to reset password.")}
                        className="text-xs font-semibold text-[#1B7B3A] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 mt-2 rounded-xl bg-[#0B2545] hover:bg-[#134074] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </Button>

                    {/* Bottom Link */}
                    <div className="pt-4 text-center border-t border-slate-100">
                      <p className="text-xs text-slate-500">
                        New to KEC Connect?{" "}
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                          className="font-bold text-[#1B7B3A] hover:underline"
                        >
                          Create an account
                        </button>
                      </p>
                    </div>
                  </form>
                ) : (
                  /* SIGN UP FORM */
                  <form onSubmit={handleSignUp} className="space-y-3.5">
                    {/* Role Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">I am a</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["student", "alumni"] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              role === r
                                ? "border-[#1B7B3A] bg-[#1B7B3A] text-white shadow-xs"
                                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {r === "student" ? (
                              <>
                                <GraduationCap className="h-3.5 w-3.5" /> Student
                              </>
                            ) : (
                              <>
                                <Building2 className="h-3.5 w-3.5" /> Alumnus
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name Input */}
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs font-bold text-slate-700">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        required
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="h-10 rounded-xl text-xs border-slate-200 bg-slate-50/50"
                      />
                    </div>

                    {/* Email Input */}
                    <div className="space-y-1">
                      <Label htmlFor="su-email" className="text-xs font-bold text-slate-700">
                        {role === "student" ? "College Email" : "Email Address"}
                      </Label>
                      <Input
                        id="su-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={role === "student" ? "23ecr085@kongu.edu" : "name@company.com"}
                        className="h-10 rounded-xl text-xs border-slate-200 bg-slate-50/50"
                      />
                    </div>

                    {/* Branch & Year/Batch */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700">Branch</Label>
                        <Select value={branch} onValueChange={setBranch}>
                          <SelectTrigger className="h-10 rounded-xl text-xs border-slate-200 bg-slate-50/50">
                            <SelectValue placeholder="Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRANCHES.map((b) => (
                              <SelectItem key={b} value={b} className="text-xs">
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {role === "student" ? (
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-700">Year</Label>
                          <Select value={year} onValueChange={setYear}>
                            <SelectTrigger className="h-10 rounded-xl text-xs border-slate-200 bg-slate-50/50">
                              <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                              {["1", "2", "3", "4"].map((y) => (
                                <SelectItem key={y} value={y} className="text-xs">
                                  {y} Year
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Label htmlFor="batch" className="text-xs font-bold text-slate-700">Batch</Label>
                          <Input
                            id="batch"
                            value={batch}
                            onChange={(e) => setBatch(e.target.value)}
                            placeholder="2019-2023"
                            className="h-10 rounded-xl text-xs border-slate-200 bg-slate-50/50"
                          />
                        </div>
                      )}
                    </div>

                    {/* Alumni Company & Role */}
                    {role === "alumni" && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="company" className="text-xs font-bold text-slate-700">Company</Label>
                          <Input
                            id="company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="Cognizant"
                            className="h-10 rounded-xl text-xs border-slate-200 bg-slate-50/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="jobtitle" className="text-xs font-bold text-slate-700">Role</Label>
                          <Input
                            id="jobtitle"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="Software Engineer"
                            className="h-10 rounded-xl text-xs border-slate-200 bg-slate-50/50"
                          />
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    <div className="space-y-1">
                      <Label htmlFor="bio" className="text-xs font-bold text-slate-700">Short bio (optional)</Label>
                      <Textarea
                        id="bio"
                        rows={2}
                        maxLength={300}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell the community a little about yourself..."
                        className="rounded-xl text-xs border-slate-200 bg-slate-50/50 resize-none"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                      <Label htmlFor="su-password" className="text-xs font-bold text-slate-700">Password</Label>
                      <Input
                        id="su-password"
                        type="password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="h-10 rounded-xl text-xs border-slate-200 bg-slate-50/50"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 mt-3 rounded-xl bg-[#1B7B3A] hover:bg-[#145F2C] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? "Creating account..." : "Create Account"}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </Button>

                    {/* Bottom Link */}
                    <div className="pt-3 text-center border-t border-slate-100">
                      <p className="text-xs text-slate-500">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
                          className="font-bold text-[#1B7B3A] hover:underline"
                        >
                          Sign in
                        </button>
                      </p>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Photo Column */}
        <div className="lg:col-span-3 hidden lg:block h-full relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/60 aspect-[4/5] h-full max-h-[580px] group">
            {/* Campus Photo */}
            <img
              src="/images/kec_campus.jpg"
              alt="Kongu Engineering College Campus"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

            {/* Bottom Glass Badge */}
            <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white space-y-1 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" /> Transform Yourself
              </div>
              <p className="text-xs font-semibold leading-snug">
                Kongu Engineering College Alumni & Student Ecosystem
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

