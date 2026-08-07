import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowRight,
  CheckCircle2,
  User,
  Building2,
  GraduationCap,
  ArrowLeft,
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

  const videoRef = useRef<HTMLVideoElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [batch, setBatch] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");

  // Guarantee HTML5 Video Autoplay & Muted State on Client Hydration
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Video autoplay prevented by browser:", err);
        });
      }
    }
  }, []);

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

  async function handleForgotPassword(e: React.MouseEvent): Promise<void> {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your college email address first.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset instructions sent to your email.");
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col font-sans text-slate-900 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Video Layer — Video 2, perfectly tuned transparency */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover scale-105"
          style={{ filter: "brightness(0.75) saturate(1.1)" }}
        >
          <source src="/video2.mp4" type="video/mp4" />
        </video>
        {/* Light dark overlay for card contrast — video stays clearly visible */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,25,50,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(10,25,50,0.50) 100%)" }} />
      </div>

      {/* Top Banner Header - Kongu Engineering College */}
      <header className="w-full bg-[#0C2340]/95 backdrop-blur-md border-b border-white/15 text-white py-3 px-4 sm:px-8 shadow-xl z-20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-[280px]">
          <img
            src="/kec-logo.jpg"
            alt="KEC Logo"
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-contain bg-white p-0.5 border-2 border-white/20 shadow-md flex-shrink-0"
          />
          <div className="flex-1">
            <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-wider font-serif text-white uppercase drop-shadow-sm">
              KONGU ENGINEERING COLLEGE
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-200 font-medium tracking-wide">
              (Autonomous)
            </p>
            <p className="text-[10px] sm:text-xs text-yellow-300 font-bold tracking-widest uppercase">
              PERUNDURAI ERODE - 638060 TAMILNADU INDIA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 bg-white/95 hover:bg-white rounded-full shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex-shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            <span>Back to home</span>
          </Link>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto z-10">
        <div className="w-full max-w-[460px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-8 transition-all">
          {sent ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Check your email</h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                We sent a confirmation link to <span className="font-semibold text-slate-900">{email}</span>. Click
                it to activate your account, then sign in below.
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full h-11 rounded-xl font-medium border-slate-200 hover:bg-slate-50 text-slate-700"
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
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 mb-6">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
                  className={`flex-1 py-3 text-center text-sm font-semibold transition-all relative ${
                    mode === "signin"
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sign In
                  {mode === "signin" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                  className={`flex-1 py-3 text-center text-sm font-semibold transition-all relative ${
                    mode === "signup"
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Create Account
                  {mode === "signup" && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              </div>

              {mode === "signin" ? (
                /* SIGN IN FORM */
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      Welcome back <span className="inline-block animate-bounce text-xl">👋</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Sign in to access the KEC student & alumni portal.
                    </p>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                      College Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="23ecr085@kongu.edu"
                        className="pl-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-11 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    {loading ? (
                      "Signing in…"
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  {/* Switch to Signup */}
                  <div className="text-center pt-2 text-xs text-slate-500">
                    New to KEC Connect?{" "}
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/auth", search: { mode: "signup" } })}
                      className="font-semibold text-blue-600 hover:underline focus:outline-none"
                    >
                      Create an account
                    </button>
                  </div>
                </form>
              ) : (
                /* CREATE ACCOUNT FORM */
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Join KEC Connect
                    </h2>
                    <p className="text-xs text-slate-500">
                      Create an account to connect with KEC students and alumni.
                    </p>
                  </div>

                  {/* Role Selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">I am a</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["student", "alumni"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                            role === r
                              ? "border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow-sm"
                              : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {r === "student" ? (
                            <>
                              <GraduationCap className="w-4 h-4 text-blue-600" />
                              <span>Student</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="w-4 h-4 text-blue-600" />
                              <span>Alumnus / Alumna</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="name"
                        required
                        maxLength={80}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="su-email" className="text-xs font-semibold text-slate-700">
                      {role === "student" ? "College Email" : "Email"}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="su-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={role === "student" ? "23ecr085@kongu.edu" : "you@company.com"}
                        className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Branch & Year/Batch Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">Branch</Label>
                      <Select value={branch} onValueChange={setBranch}>
                        <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 rounded-xl text-xs">
                          <SelectValue placeholder="Select" />
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
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-700">Year</Label>
                        <Select value={year} onValueChange={setYear}>
                          <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 rounded-xl text-xs">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {["1", "2", "3", "4"].map((y) => (
                              <SelectItem key={y} value={y} className="text-xs">
                                {y} year
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor="batch" className="text-xs font-semibold text-slate-700">
                          Batch
                        </Label>
                        <Input
                          id="batch"
                          value={batch}
                          onChange={(e) => setBatch(e.target.value)}
                          placeholder="2019–2023"
                          className="h-10 bg-slate-50/50 border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {role === "alumni" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="company" className="text-xs font-semibold text-slate-700">
                          Company
                        </Label>
                        <Input
                          id="company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="h-10 bg-slate-50/50 border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="jobtitle" className="text-xs font-semibold text-slate-700">
                          Role
                        </Label>
                        <Input
                          id="jobtitle"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          className="h-10 bg-slate-50/50 border-slate-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="su-password" className="text-xs font-semibold text-slate-700">
                      Password (min. 8 characters)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="su-password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-10 bg-slate-50/50 border-slate-200 focus:bg-white focus:border-blue-600 rounded-xl text-xs sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm mt-2"
                  >
                    {loading ? (
                      "Creating account…"
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  {/* Switch to Signin */}
                  <div className="text-center pt-1 text-xs text-slate-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/auth", search: { mode: "signin" } })}
                      className="font-semibold text-blue-600 hover:underline focus:outline-none"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
