"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.08)",
  fontSize: 12,
  padding: "6px 10px",
} as const;

/** Magnitude across topics, single series → horizontal bars, one hue. */
export function ProficiencyBarChart({
  data,
}: {
  data: { topic: string; score: number }[];
}) {
  const height = Math.max(120, data.length * 36);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
        barCategoryGap={10}
      >
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="topic"
          width={150}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          itemStyle={{ color: "var(--popover-foreground)" }}
          formatter={(v: unknown) => [`${Math.round(Number(v))}%`, "Proficiency"]}
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
        />
        <Bar
          dataKey="score"
          fill="var(--chart-1)"
          radius={[0, 4, 4, 0]}
          barSize={14}
          background={{ fill: "var(--muted)" }}
        >
          <LabelList
            dataKey="score"
            position="right"
            offset={8}
            fill="var(--muted-foreground)"
            fontSize={11}
            formatter={(v: unknown) => `${Math.round(Number(v))}%`}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
