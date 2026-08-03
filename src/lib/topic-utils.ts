export type TopicStatus = "not_started" | "learning" | "reviewing" | "mastered";

export function topicStatusLabel(status: TopicStatus) {
  switch (status) {
    case "not_started":
      return "Not started";
    case "learning":
      return "Learning";
    case "reviewing":
      return "Reviewing";
    case "mastered":
      return "Mastered";
    default:
      return status;
  }
}

/** Small colour dot indicating proficiency strength on a topic chip. */
export function proficiencyDot(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  if (score > 0) return "bg-rose-500";
  return "bg-muted-foreground/40";
}

/** Badge styling per topic status. */
export const statusStyles: Record<
  TopicStatus,
  { label: string; className: string }
> = {
  not_started: { label: "Not started", className: "bg-muted text-muted-foreground" },
  learning: { label: "Learning", className: "bg-chart-4/15 text-foreground" },
  reviewing: { label: "Reviewing", className: "bg-chart-2/15 text-foreground" },
  mastered: { label: "Mastered", className: "bg-emerald-500/15 text-foreground" },
};

/** Recursively collect proficiency scores from a topic subtree. */
export function collectProficiencyScores(nodes: any[]): number[] {
  const out: number[] = [];
  for (const node of nodes ?? []) {
    if (node.proficiencyScores?.length) {
      out.push(...node.proficiencyScores.map((p: any) => p.score));
    }
    if (node.children?.length) {
      out.push(...collectProficiencyScores(node.children));
    }
  }
  return out;
}

export function buildTopicTree(topics: any[]) {
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const topic of topics) {
    map.set(topic.id, { ...topic, children: [] });
  }

  for (const topic of topics) {
    const node = map.get(topic.id)!;
    if (topic.parentId) {
      const parent = map.get(topic.parentId);
      if (parent) parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function flattenTopics(topics: any[]): any[] {
  const result: any[] = [];
  for (const t of topics) {
    result.push(t);
    if (t.children?.length) result.push(...flattenTopics(t.children));
  }
  return result;
}
