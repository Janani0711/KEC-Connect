import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { RESOURCE_CATEGORIES, labelFor } from "@/lib/kec";

export const Route = createFileRoute("/_authenticated/app/resources")({
  head: () => ({
    meta: [
      { title: "Resources — KEC Connect" },
      {
        name: "description",
        content: "Aptitude sets, coding sheets, resume templates, past interview questions and department notes.",
      },
      { property: "og:title", content: "Resources — KEC Connect" },
      { property: "og:description", content: "A curated prep library for KEC students." },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  const [branch, setBranch] = useState("all");

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

  const branches = [
    ...new Set((resources.data ?? []).map((r) => r.branch).filter(Boolean) as string[]),
  ].sort();

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl">Resources</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A small, curated library. Everything here is something a senior actually used.
        </p>
      </header>

      {branches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...branches].map((b) => (
            <button
              key={b}
              onClick={() => setBranch(b)}
              className={`rounded-full border px-3 py-1 text-xs ${
                branch === b ? "border-primary bg-primary text-primary-foreground" : "border-border"
              }`}
            >
              {b === "all" ? "All branches" : b}
            </button>
          ))}
        </div>
      )}

      {RESOURCE_CATEGORIES.map((cat) => {
        const items = (resources.data ?? []).filter(
          (r) =>
            r.category === cat.value &&
            (branch === "all" || !r.branch || r.branch === branch),
        );
        if (!items.length) return null;
        return (
          <section key={cat.value}>
            <h2 className="text-xl">{cat.label}</h2>
            <div className="panel mt-3 divide-y divide-border">
              {items.map((r) => (
                <a
                  key={r.id}
                  href={r.file_url ?? "#"}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between gap-4 p-4 hover:bg-secondary"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                    <span className="truncate text-sm">{r.title}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    {r.branch && <Badge variant="outline">{r.branch}</Badge>}
                    <Badge variant="secondary">{labelFor(RESOURCE_CATEGORIES, r.category)}</Badge>
                  </span>
                </a>
              ))}
            </div>
          </section>
        );
      })}

      {!resources.isLoading && !resources.data?.length && (
        <p className="text-sm text-muted-foreground">No resources published yet.</p>
      )}
    </div>
  );
}
