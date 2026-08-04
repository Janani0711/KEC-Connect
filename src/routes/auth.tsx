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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BRANCHES, COLLEGE_EMAIL_RE } from "@/lib/kec";

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
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/app" });
  }

  async function handleSignUp(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter your name."); return; }
    if (role === "student" && !COLLEGE_EMAIL_RE.test(email.trim())) {
      { toast.error("Students must sign up with a college email, e.g. 23ecr085@kongu.edu"); return; }
    }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
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
    if (error) { toast.error(error.message); return; }
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-lg flex-col px-6 py-12">
        <Link to="/" className="font-serif text-xl font-semibold">
          KEC Connect
        </Link>

        {sent ? (
          <div className="panel mt-8 p-8">
            <h1 className="text-2xl">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              We sent a confirmation link to <span className="text-foreground">{email}</span>. Click
              it to activate your account, then come back and sign in.
            </p>
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => {
                setSent(false);
                navigate({ to: "/auth", search: { mode: "signin" } });
              }}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <div className="panel mt-8 p-8">
            <Tabs
              value={mode}
              onValueChange={(v) =>
                navigate({ to: "/auth", search: { mode: v as "signin" | "signup" } })
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="mt-8 space-y-5">
                <h1 className="text-2xl">Welcome back</h1>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="23ecr085@kongu.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="mt-8 space-y-5">
                <h1 className="text-2xl">Join KEC Connect</h1>

                <div className="space-y-2">
                  <Label>I am a</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["student", "alumni"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`rounded-md border px-4 py-3 text-sm capitalize transition-colors ${
                          role === r
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-secondary"
                        }`}
                      >
                        {r === "student" ? "Student (1st–4th year)" : "Alumnus / Alumna"}
                      </button>
                    ))}
                  </div>
                  {role === "alumni" && (
                    <p className="text-xs text-muted-foreground">
                      Alumni accounts are self-declared for now and reviewed manually before being
                      marked verified.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-email">
                    {role === "student" ? "College email" : "Email"}
                  </Label>
                  <Input
                    id="su-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={role === "student" ? "23ecr085@kongu.edu" : "you@company.com"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select value={branch} onValueChange={setBranch}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCHES.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {role === "student" ? (
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Select value={year} onValueChange={setYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {["1", "2", "3", "4"].map((y) => (
                            <SelectItem key={y} value={y}>
                              {y} year
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="batch">Batch</Label>
                      <Input
                        id="batch"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        placeholder="2019–2023"
                      />
                    </div>
                  )}
                </div>

                {role === "alumni" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobtitle">Role</Label>
                      <Input
                        id="jobtitle"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bio">Short bio (optional)</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    maxLength={400}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-password">Password</Label>
                  <Input
                    id="su-password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
