// KEC Connect Authentication Page
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
import { BRANCHES, ALUMNI_BATCHES, ALUMNI_ROLES, COLLEGE_EMAIL_RE } from "@/lib/kec";
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
  const [selectedRole, setSelectedRole] = useState("");
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
      email,
      password,
      options: {
        data: {
          name: name.trim(),
          role,
          branch: branch || null,
          year: role === "student" ? Number(year) || null : null,
          batch: role === "alumni" ? batch || null : null,
          company: role === "alumni" ? company.trim() || null : null,
          job_title: role === "alumni" ? jobTitle.trim() || selectedRole || null : null,
          bio: bio.trim() || null,
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

  async function handleForgotPassword(): Promise<void> {
    if (!email.trim()) {
      toast.error("Enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset instructions sent to your email.");
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col font-sans text-slate-900 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Video Layer — Video 2 */}
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
        {/* Light dark overlay for card contrast */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,25,50,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(10,25,50,0.50) 100%)" }} />
      </div>

      {/* Top Header Bar - Centered header.jpg image with seamless background color #16336D */}
      <header className="w-full bg-[#16336D] border-b border-white/15 py-2 px-4 shadow-xl z-20 flex items-center justify-center relative min-h-[65px] sm:min-h-[80px]">
        <img
          src="/header.jpg"
          alt="Kongu Engineering College Header"
          className="h-12 sm:h-16 md:h-20 w-auto object-contain mx-auto block"
        />
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
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Welcome back
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
                        className="pl-10 h-11 rounded-xl bg-slate-50/80 border-slate-200 focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pass" className="text-xs font-semibold text-slate-700">
                        Password
                      </Label>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="pass"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 rounded-xl bg-slate-50/80 border-slate-200 focus:bg-white transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer font-medium">
                      Remember me on this device
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#0F2847] hover:bg-[#163861] text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>{loading ? "Signing in..." : "Sign in to Dashboard"}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </form>
              ) : (
                /* CREATE ACCOUNT FORM */
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Join the KEC Network
                    </h2>
                    <p className="text-xs text-slate-500">
                      Create your verified account in 60 seconds.
                    </p>
                  </div>

                  {/* Role Selection Tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        role === "student"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("alumni")}
                      className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                        role === "alumni"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Alumnus / Alumna</span>
                    </button>
                  </div>

                  {/* Name Input */}
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Kiruthiya S"
                        className="pl-10 h-10 rounded-xl bg-slate-50/80 border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-email" className="text-xs font-semibold text-slate-700">
                      {role === "student" ? "College Email" : "Email Address"}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={role === "student" ? "23ecr085@kongu.edu" : "name@company.com"}
                        className="pl-10 h-10 rounded-xl bg-slate-50/80 border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  {/* Branch & Year Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-700">Department</Label>
                      <Select value={branch} onValueChange={setBranch}>
                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Branch" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-2xl z-50 max-h-60 overflow-y-auto">
                          {BRANCHES.map((b) => (
                            <SelectItem key={b} value={b} className="text-xs font-semibold text-slate-900 hover:bg-slate-100 cursor-pointer">
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {role === "student" ? (
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Year</Label>
                        <Select value={year} onValueChange={setYear}>
                          <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800">
                            <SelectValue placeholder="Current Year" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-2xl z-50">
                            <SelectItem value="1" className="text-xs font-semibold text-slate-900 hover:bg-slate-100 cursor-pointer">1st Year</SelectItem>
                            <SelectItem value="2" className="text-xs font-semibold text-slate-900 hover:bg-slate-100 cursor-pointer">2nd Year</SelectItem>
                            <SelectItem value="3" className="text-xs font-semibold text-slate-900 hover:bg-slate-100 cursor-pointer">3rd Year</SelectItem>
                            <SelectItem value="4" className="text-xs font-semibold text-slate-900 hover:bg-slate-100 cursor-pointer">4th Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Grad Batch</Label>
                        <Select value={batch} onValueChange={setBatch}>
                          <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800">
                            <SelectValue placeholder="2020-2024" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-2xl z-50 max-h-60 overflow-y-auto">
                            {ALUMNI_BATCHES.map((b) => (
                              <SelectItem key={b} value={b} className="text-xs font-semibold text-slate-900 hover:bg-slate-100 cursor-pointer">
                                {b}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Additional Alumni Fields */}
                  {role === "alumni" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Company</Label>
                        <Input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Cognizant"
                          className="h-10 rounded-xl bg-slate-50/80 border-slate-200 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Role / Title</Label>
                        <Select
                          value={selectedRole}
                          onValueChange={(val) => {
                            setSelectedRole(val);
                            if (val !== "Other") setJobTitle(val);
                            else setJobTitle("");
                          }}
                        >
                          <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold text-slate-800">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-slate-200 text-slate-900 shadow-2xl z-50 max-h-60 overflow-y-auto">
                            {ALUMNI_ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="text-xs font-semibold text-slate-900 hover:bg-slate-100 cursor-pointer">
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {selectedRole === "Other" && (
                          <Input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="Enter custom role..."
                            className="mt-1.5 h-9 rounded-xl bg-slate-50 border-slate-200 text-xs"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Password Input */}
                  <div className="space-y-1">
                    <Label htmlFor="signup-pass" className="text-xs font-semibold text-slate-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="signup-pass"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="pl-10 pr-10 h-10 rounded-xl bg-slate-50/80 border-slate-200 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Create Account Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#0F2847] hover:bg-[#163861] text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer mt-2"
                  >
                    <span>{loading ? "Creating account..." : "Create your Account"}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
