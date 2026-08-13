import type { MindMapNode } from "@/services/ai/mindmap";

/**
 * Tidy left-to-right tree layout.
 *
 * Leaves are stacked top to bottom in traversal order and each internal node is
 * centred against its children, which is the classic Reingold–Tilford shape
 * without the sibling-subtree contouring — our trees are at most 3 deep and 6
 * wide, so the simple form never produces visible overlap and stays cheap
 * enough to re-run on every render.
 */

export const COLUMN_WIDTH = 250;
export const NODE_WIDTH = 200;
const NODE_HEIGHT = 44;
const NODE_HEIGHT_WITH_DETAIL = 68;
const ROW_GAP = 14;

export interface LaidOutNode {
  node: MindMapNode;
  depth: number;
  x: number;
  /** Vertical centre of the node. */
  y: number;
  height: number;
  /** Index of the root-level branch this node belongs to, for colouring. */
  branch: number;
  children: LaidOutNode[];
}

export interface MindMapLayout {
  root: LaidOutNode;
  width: number;
  height: number;
}

export function layoutMindMap(root: MindMapNode): MindMapLayout {
  let cursor = 0;
  let maxDepth = 0;

  function walk(node: MindMapNode, depth: number, branch: number): LaidOutNode {
    maxDepth = Math.max(maxDepth, depth);
    const height = node.detail ? NODE_HEIGHT_WITH_DETAIL : NODE_HEIGHT;

    const children = (node.children ?? []).map((child, index) =>
      // Root's children each start a new colour branch; deeper nodes inherit.
      walk(child, depth + 1, depth === 0 ? index : branch)
    );

    let y: number;
    if (children.length === 0) {
      y = cursor + height / 2;
      cursor += height + ROW_GAP;
    } else {
      y = (children[0].y + children[children.length - 1].y) / 2;
    }

    return { node, depth, x: depth * COLUMN_WIDTH, y, height, branch, children };
  }

  const laid = walk(root, 0, 0);

  return {
    root: laid,
    width: (maxDepth + 1) * COLUMN_WIDTH - (COLUMN_WIDTH - NODE_WIDTH),
    height: Math.max(cursor - ROW_GAP, NODE_HEIGHT_WITH_DETAIL),
  };
}

/** Depth-first list of every laid-out node, for rendering. */
export function flatten(node: LaidOutNode): LaidOutNode[] {
  return [node, ...node.children.flatMap(flatten)];
}

/** Cubic bezier from a parent's right edge to a child's left edge. */
export function edgePath(parent: LaidOutNode, child: LaidOutNode): string {
  const x1 = parent.x + NODE_WIDTH;
  const y1 = parent.y;
  const x2 = child.x;
  const y2 = child.y;
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}
