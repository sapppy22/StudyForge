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
