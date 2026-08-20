import katex from "katex";
import { cn } from "@/lib/utils";

/**
 * Renders a string that mixes prose with LaTeX.
 *
 * Question banks, worked solutions and AI explanations all arrive as plain
 * strings with the maths written in TeX — `$\frac{v^2}{r}$`, `\varepsilon_0`,
 * `10^{-3}`. Printed raw, that reads as line noise, which is exactly what makes
 * a test review unusable. Everything here is about turning that back into
 * notation a student recognises.
 *
 * Both delimited maths (`$…$`, `$$…$$`, `\(…\)`, `\[…\]`) and bare control
 * sequences left loose in the prose are picked up, because model output is not
 * reliably delimited. Anything KaTeX cannot parse falls back to the original
 * text rather than erroring — a slightly ugly line beats a blank screen.
 */

interface Delimiter {
  open: string;
  close: string;
  display: boolean;
}

// Longest-first: `$$` has to be tested before `$`.
const DELIMITERS: Delimiter[] = [
  { open: "$$", close: "$$", display: true },
  { open: "\\[", close: "\\]", display: true },
  { open: "\\(", close: "\\)", display: false },
  { open: "$", close: "$", display: false },
];

/**
 * A TeX control sequence with its arguments, sub- and superscripts — the shape
 * of maths that models emit without remembering to wrap it in `$`.
 */
const BARE_LATEX =
  /\\[a-zA-Z]+(?:\{[^{}]{0,120}\}|\[[^\]]{0,60}\])*(?:[_^](?:\{[^{}]{0,60}\}|[A-Za-z0-9]))*/g;

type Segment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; display: boolean };

/** Rendering the same equation on every keystroke is pure waste. */
const cache = new Map<string, string>();
const CACHE_LIMIT = 500;

function renderLatex(latex: string, display: boolean): string | null {
  const key = `${display ? "d" : "i"}:${latex}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit || null;

  let html: string;
  try {
    html = katex.renderToString(latex, {
      displayMode: display,
      throwOnError: false,
      // `strict: false` keeps unicode and other loose input rendering rather
      // than bailing — student-facing content is not a well-formed corpus.
      strict: false,
      output: "htmlAndMathml",
      trust: false,
    });
  } catch {
    html = "";
  }

  if (cache.size > CACHE_LIMIT) cache.clear();
  cache.set(key, html);
  return html || null;
}

/**
 * `$5 to $10` is not an equation. A `$` pair only counts as maths when it wraps
 * something that actually looks like notation rather than a price or a stray
 * symbol.
 */
function looksLikeMath(body: string, delimiter: Delimiter): boolean {
  if (body.trim().length === 0) return false;
  if (delimiter.open !== "$") return true;
  if (body.length > 400) return false;
  if (/^\s|\s$/.test(body)) return false;
  // A bare number between dollar signs is a currency range far more often than
  // it is an equation.
  return !/^\d[\d,.]*$/.test(body.trim());
}

function splitBareLatex(text: string): Segment[] {
  if (!text.includes("\\")) return [{ kind: "text", value: text }];

  const segments: Segment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(BARE_LATEX)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ kind: "text", value: text.slice(cursor, start) });
    }
    segments.push({ kind: "math", value: match[0], display: false });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ kind: "text", value: text.slice(cursor) });
  }
  return segments;
}

export function parseMath(input: string): Segment[] {
  const segments: Segment[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) {
      segments.push(...splitBareLatex(buffer));
      buffer = "";
    }
  };

  while (i < input.length) {
    // An escaped dollar is a literal dollar, not an opening delimiter.
    if (input[i] === "\\" && input[i + 1] === "$") {
      buffer += "$";
      i += 2;
      continue;
    }

    const delimiter = DELIMITERS.find((d) => input.startsWith(d.open, i));
    if (!delimiter) {
      buffer += input[i];
      i += 1;
      continue;
    }

    const bodyStart = i + delimiter.open.length;
    const end = input.indexOf(delimiter.close, bodyStart);
    if (end === -1) {
      buffer += input[i];
      i += 1;
      continue;
    }

    const body = input.slice(bodyStart, end);
    if (!looksLikeMath(body, delimiter)) {
      buffer += input[i];
      i += 1;
      continue;
    }

    flush();
    segments.push({ kind: "math", value: body, display: delimiter.display });
    i = end + delimiter.close.length;
  }

  flush();
  return segments;
}

export function MathText({
  children,
  className,
}: {
  children?: string | null;
  className?: string;
}) {
  if (!children) return null;

  const segments = parseMath(children);

  return (
    <span className={cn("math-text", className)}>
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <span key={index}>{segment.value}</span>;
        }

        const html = renderLatex(segment.value, segment.display);
        if (!html) {
          // KaTeX gave up; show the source rather than an empty gap.
          return <span key={index}>{segment.value}</span>;
        }

        return (
          <span
            key={index}
            className={segment.display ? "block overflow-x-auto py-1" : undefined}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}
