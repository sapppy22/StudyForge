"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { MindMapView } from "./mind-map-view";
import type { MindMapNode } from "@/services/ai/mindmap";
import { Loader2, Network, RefreshCw, Sparkles, Trash2 } from "lucide-react";

interface MindMapRow {
  id: string;
  title: string;
  data: MindMapNode;
  generatedBy: string;
  nodeCount: number;
  contentItemId: string | null;
  updatedAt: string;
}

const WHOLE_TOPIC = "__topic__";

export function MindMapPanel({
  topicId,
  notes,
}: {
  topicId: string;
  notes: { id: string; title: string }[];
}) {
  const [source, setSource] = useState(WHOLE_TOPIC);
  const queryClient = useQueryClient();
  const queryKey = ["mindmaps", topicId];

  const { data: maps = [], isPending } = useQuery<MindMapRow[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/mindmaps?topicId=${topicId}`);
      if (!res.ok) throw new Error("Failed to load memory maps");
      return res.json();
    },
  });

  // The source is passed per-call rather than read from state: the regenerate
  // buttons target a specific map, and a setState right before mutate() would
  // still send the previous render's value.
  const generate = useMutation({
    mutationFn: async (target: string) => {
      const res = await fetch("/api/mindmaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          ...(target === WHOLE_TOPIC ? {} : { contentItemId: target }),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not build the memory map");
      }
      return res.json();
    },
    onSuccess: (map: MindMapRow) => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success(
        map.generatedBy === "offline"
          ? "Memory map built from your notes' structure (AI is offline)."
          : "Memory map generated."
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/mindmaps/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete that map");
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <p className="text-sm font-medium">Generate a memory map</p>
            <p className="text-xs text-muted-foreground">
              Turns your notes into a branching map you can revise from. Pick a
              single note, or map the whole topic.
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={source} onValueChange={(v) => setSource(v ?? WHOLE_TOPIC)}>
              <SelectTrigger className="w-48" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={WHOLE_TOPIC}>Whole topic</SelectItem>
                {notes.map((note) => (
                  <SelectItem key={note.id} value={note.id}>
                    {note.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => generate.mutate(source)}
              disabled={generate.isPending}
            >
              {generate.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {isPending ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : maps.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No memory maps yet"
          description="Generate one above to see this topic laid out as a branching map."
        />
      ) : (
        maps.map((map) => (
          <div key={map.id} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium">{map.title}</h3>
              <Badge variant="secondary">{map.nodeCount} nodes</Badge>
              {map.generatedBy === "offline" && (
                <Badge variant="outline" title="Built without an Anthropic API key">
                  Offline
                </Badge>
              )}
              <div className="ml-auto flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Regenerate this map"
                  title="Regenerate"
                  disabled={generate.isPending}
                  onClick={() => generate.mutate(map.contentItemId ?? WHOLE_TOPIC)}
                >
                  <RefreshCw className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete this map"
                  onClick={() => remove.mutate(map.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
            <MindMapView root={map.data} />
          </div>
        ))
      )}
    </div>
  );
}
