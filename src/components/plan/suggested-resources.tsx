"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  Loader2,
  Plus,
  CirclePlay,
} from "lucide-react";

/**
 * "What do I actually watch or read for this block?"
 *
 * Links are searches on a named provider rather than deep links, because
 * nothing here has web access and a fabricated URL costs the student the very
 * minutes the block was for. The label says what to look for; the link is
 * guaranteed to get them to a page where it is findable.
 */

interface SuggestedResource {
  kind: "video" | "article";
  title: string;
  provider: string;
  why: string;
  minutes?: number;
  url: string;
  query: string;
}

export function SuggestedResources({
  topicId,
  intent,
  className,
}: {
  topicId: string;
  intent?: "learn" | "practice" | "revise" | "test";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  const { data, isPending, isError } = useQuery<SuggestedResource[]>({
    queryKey: ["resources", topicId, intent],
    // Only fetched once the student asks — a plan with thirty blocks must not
    // fire thirty model calls on render.
    enabled: open,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const params = new URLSearchParams({ topicId });
      if (intent) params.set("intent", intent);
      const res = await fetch(`/api/resources?${params}`);
      if (!res.ok) throw new Error("Could not load suggestions");
      return res.json();
    },
  });

  async function save(resource: SuggestedResource) {
    setSaving(resource.url);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          kind: resource.kind,
          title: `${resource.title} — ${resource.provider}`,
          url: resource.url,
          provider: resource.provider,
          why: resource.why,
        }),
      });
      if (!res.ok) throw new Error("Could not save that");
      setSaved((prev) => new Set(prev).add(resource.url));
      toast.success("Added to this topic's material.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save that");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        aria-expanded={open}
      >
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        Suggested videos &amp; reading
      </button>

      {open && (
        <div className="space-y-1.5">
          {isPending ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Finding material…
            </p>
          ) : isError || !data?.length ? (
            <p className="text-xs text-muted-foreground">
              No suggestions right now. Add your own material on the topic page.
            </p>
          ) : (
            data.map((resource) => {
              const Icon = resource.kind === "video" ? CirclePlay : BookOpen;
              const isSaved = saved.has(resource.url);
              return (
                <div
                  key={resource.url + resource.title}
                  className="rounded-lg border bg-card px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <Icon
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        resource.kind === "video" ? "text-chart-1" : "text-chart-2"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium underline-offset-2 hover:underline"
                        >
                          {resource.title}
                          <ExternalLink className="ml-1 inline size-3" />
                        </a>
                        <Badge variant="secondary" className="text-[10px]">
                          {resource.provider}
                        </Badge>
                        {resource.minutes && (
                          <span className="text-[11px] text-muted-foreground tabular-nums">
                            ~{resource.minutes} min
                          </span>
                        )}
                      </div>
                      {resource.why && (
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {resource.why}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                        Opens a search for “{resource.query}”
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isSaved || saving === resource.url}
                      onClick={() => save(resource)}
                      aria-label={isSaved ? "Saved" : `Save "${resource.title}" to this topic`}
                      title={isSaved ? "Saved to this topic" : "Save to this topic"}
                    >
                      {saving === resource.url ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : isSaved ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
