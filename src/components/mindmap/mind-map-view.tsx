"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { MindMapNode } from "@/services/ai/mindmap";
import {
  COLUMN_WIDTH,
  NODE_WIDTH,
  edgePath,
  flatten,
  layoutMindMap,
  type LaidOutNode,
} from "./layout";

/** Root-level branches cycle through the chart ramp so each reads distinctly. */
const BRANCH_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function branchColor(node: LaidOutNode): string {
  return BRANCH_COLORS[node.branch % BRANCH_COLORS.length];
}

export function MindMapView({ root }: { root: MindMapNode }) {
  const layout = useMemo(() => layoutMindMap(root), [root]);
  const nodes = useMemo(() => flatten(layout.root), [layout]);

  // Padding keeps node borders and the outermost edges off the scroll edges.
  const padX = 8;
  const padY = 12;

  return (
    <div className="overflow-x-auto rounded-xl border bg-card p-3">
      <div
        className="relative"
        style={{
          width: layout.width + padX * 2,
          height: layout.height + padY * 2,
        }}
      >
        <svg
          className="absolute inset-0 overflow-visible"
          width={layout.width + padX * 2}
          height={layout.height + padY * 2}
          aria-hidden="true"
        >
          <g transform={`translate(${padX}, ${padY})`}>
            {nodes.flatMap((parent) =>
              parent.children.map((child) => (
                <path
                  key={`${parent.node.label}-${child.node.label}-${child.y}`}
                  d={edgePath(parent, child)}
                  fill="none"
                  stroke={branchColor(child)}
                  strokeOpacity={0.5}
                  strokeWidth={1.5}
                />
              ))
            )}
          </g>
        </svg>

        {nodes.map((laid) => {
          const isRoot = laid.depth === 0;
          const color = branchColor(laid);
          return (
            <div
              key={`${laid.depth}-${laid.y}-${laid.node.label}`}
              className={cn(
                "absolute flex flex-col justify-center rounded-lg border px-3 py-2",
                isRoot ? "bg-primary text-primary-foreground" : "bg-background"
              )}
              style={{
                left: laid.x + padX,
                top: laid.y - laid.height / 2 + padY,
                width: NODE_WIDTH,
                height: laid.height,
                borderColor: isRoot ? "transparent" : color,
                // A tint of the branch colour, so depth reads without relying on
                // hue alone.
                boxShadow: isRoot ? undefined : `inset 3px 0 0 0 ${color}`,
              }}
            >
              <p
                className={cn(
                  "text-sm leading-tight font-medium",
                  laid.node.detail ? "line-clamp-1" : "line-clamp-2"
                )}
                title={laid.node.label}
              >
                {laid.node.label}
              </p>
              {laid.node.detail && (
                <p
                  className={cn(
                    "mt-0.5 line-clamp-2 text-xs leading-tight",
                    isRoot ? "opacity-80" : "text-muted-foreground"
                  )}
                  title={laid.node.detail}
                >
                  {laid.node.detail}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {layout.width > COLUMN_WIDTH * 2 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Scroll horizontally to follow the deeper branches.
        </p>
      )}
    </div>
  );
}
