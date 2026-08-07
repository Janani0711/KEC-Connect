import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Plus, Upload, BookOpen, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RESOURCE_CATEGORIES, BRANCHES, labelFor, useProfile } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/resources")({
  head: () => ({
    meta: [
      { title: "Student Resources — KEC Connect" },
      {
        name: "description",
        content: "Aptitude sets, coding sheets, resume templates, past interview questions and department notes uploaded by KEC students & alumni.",
      },
      { property: "og:title", content: "Resources — KEC Connect" },
      { property: "og:description", content: "A curated prep library for KEC students." },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { data: me } = useProfile();
  const qc = useQueryClient();
  const [branch, setBranch] = useState("all");

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("aptitude");
  const [uploadBranch, setUploadBranch] = useState("CSE");
  const [fileUrl, setFileUrl] = useState("");
  const [description, setDescription] = useState("");

  const resources = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("title", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const uploadResource = useMutation({
    mutationFn: async () => {
      if (!me) throw new Error("Not signed in");
      if (!title.trim()) throw new Error("Please enter a title for the resource.");
      if (!fileUrl.trim()) throw new Error("Please provide a file or document URL.");

      const { error } = await supabase.from("resources").insert({
        title: title.trim(),
        category,
        branch: uploadBranch,
        file_url: fileUrl.trim(),
        uploaded_by: me.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Resource uploaded & published successfully!");
      setTitle("");
      setFileUrl("");
      setDescription("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["resources"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const branches = [
    ...new Set((resources.data ?? []).map((r) => r.branch).filter(Boolean) as string[]),
  ].sort();

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span>Student Prep & Study Resources</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            A student-driven library. Access aptitude sets, coding sheets, resume templates, past interview questions, and department notes.
          </p>
        </div>

        {/* Upload Resource Button & Modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md flex items-center gap-2 flex-shrink-0">
              <Upload className="w-4 h-4" />
              <span>Upload Resource</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] bg-white border border-slate-200 rounded-2xl shadow-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Upload Study Resource
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                uploadResource.mutate();
              }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1.5">
                <Label htmlFor="res-title" className="text-xs font-semibold text-slate-700">
                  Resource Title
                </Label>
                <Input
                  id="res-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Striver's SDE Sheet & Solutions PDF"
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 z-50">
                      {RESOURCE_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="text-xs font-medium">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Department</Label>
                  <Select value={uploadBranch} onValueChange={setUploadBranch}>
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 z-50 max-h-48 overflow-y-auto">
                      {BRANCHES.map((b) => (
                        <SelectItem key={b} value={b} className="text-xs font-medium">
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="res-url" className="text-xs font-semibold text-slate-700">
                  File / Document Link (Google Drive / GitHub / URL)
                </Label>
                <Input
                  id="res-url"
                  type="url"
                  required
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={uploadResource.isPending}
                className="w-full h-11 bg-[#0F2847] hover:bg-[#163861] text-white font-semibold rounded-xl shadow-lg mt-2"
              >
                {uploadResource.isPending ? "Uploading..." : "Publish Resource"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Branch Filter Chips */}
      {branches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...branches].map((b) => (
            <button
              key={b}
              onClick={() => setBranch(b)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                branch === b
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {b === "all" ? "All Departments" : b}
            </button>
          ))}
        </div>
      )}

      {/* Resource Category Cards */}
      {RESOURCE_CATEGORIES.map((cat) => {
        const items = (resources.data ?? []).filter(
          (r) =>
            r.category === cat.value &&
            (branch === "all" || !r.branch || r.branch === branch),
        );
        if (!items.length) return null;
        return (
          <section key={cat.value} className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{cat.label}</span>
              <Badge variant="secondary" className="text-xs">
                {items.length}
              </Badge>
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
              {items.map((r) => (
                <a
                  key={r.id}
                  href={r.file_url ?? "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50/80 transition-colors group"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-blue-600" strokeWidth={1.8} />
                    <span className="truncate text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                      {r.title}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 flex-shrink-0">
                    {r.branch && <Badge variant="outline" className="text-xs">{r.branch}</Badge>}
                    <Badge variant="secondary" className="text-xs">{labelFor(RESOURCE_CATEGORIES, r.category)}</Badge>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  </span>
                </a>
              ))}
            </div>
          </section>
        );
      })}

      {!resources.isLoading && !resources.data?.length && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-medium text-slate-600">No resources published yet.</p>
          <p className="text-xs text-slate-400">Be the first to click "Upload Resource" above to share prep materials!</p>
        </div>
      )}
    </div>
  );
}
