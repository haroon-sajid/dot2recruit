// Rebuilds reading order for PDF text.
//
// A PDF stores text in the order it was drawn, which for a two-column CV can
// put the sidebar after the main column or the name after the experience
// section. This module takes positioned text items from pdf.js and orders them
// the way a person reads the page: it recursively splits the page at the
// widest empty band (a column gap or a gap between sections), reads columns
// left to right and sections top to bottom, then joins items into lines.

/** The subset of a pdf.js TextItem this module needs. */
export interface PositionedText {
  str: string;
  /** pdf.js transform matrix; [4] is x, [5] is the baseline y (y grows upward). */
  transform: number[];
  width: number;
  height: number;
}

interface Box {
  str: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Baseline, used for line clustering. */
  y: number;
  h: number;
}

// A vertical gap this wide (relative to the region width) is a column break,
// not a wide word space.
const MIN_COLUMN_GAP_RATIO = 0.03;
const MIN_COLUMN_GAP_PT = 10;
// Below this many lines on a side, an x gap is more likely a layout quirk than a column.
const MIN_LINES_PER_COLUMN = 2;
// Any real whitespace between lines is a valid section cut.
const MIN_ROW_GAP_PT = 1;

function toBoxes(items: PositionedText[]): Box[] {
  const boxes: Box[] = [];
  for (const item of items) {
    if (!item.str || !item.str.trim()) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    // The vertical scale of the transform is the font size when height is missing.
    const h = item.height || Math.abs(item.transform[3]) || 10;
    const w = item.width || 0;
    boxes.push({ str: item.str, x0: x, x1: x + w, y0: y - h * 0.2, y1: y + h * 0.8, y, h });
  }
  return boxes;
}

/** Largest empty run in the projection of boxes onto one axis, within the region's extent. */
function largestGap(
  boxes: Box[],
  lo: (b: Box) => number,
  hi: (b: Box) => number,
): { start: number; end: number; size: number } | null {
  const spans = boxes.map((b) => [lo(b), hi(b)] as const).sort((a, b) => a[0] - b[0]);
  let best: { start: number; end: number; size: number } | null = null;
  let reach = spans[0][1];
  for (let i = 1; i < spans.length; i += 1) {
    const [s, e] = spans[i];
    if (s > reach) {
      const size = s - reach;
      if (!best || size > best.size) best = { start: reach, end: s, size };
    }
    if (e > reach) reach = e;
  }
  return best;
}

/** Groups boxes into lines by baseline, each line sorted left to right. */
function toLines(boxes: Box[]): Box[][] {
  const sorted = [...boxes].sort((a, b) => b.y - a.y || a.x0 - b.x0);
  const lines: Box[][] = [];
  for (const box of sorted) {
    const current = lines[lines.length - 1];
    if (current) {
      const ref = current[0];
      const tolerance = Math.max(2, Math.min(ref.h, box.h) * 0.5);
      if (Math.abs(box.y - ref.y) <= tolerance) {
        current.push(box);
        continue;
      }
    }
    lines.push([box]);
  }
  return lines.map((line) => line.sort((a, b) => a.x0 - b.x0));
}

function lineToText(line: Box[]): string {
  let out = "";
  let prev: Box | null = null;
  for (const box of line) {
    if (prev) {
      const gap = box.x0 - prev.x1;
      // pdf.js often splits a word into several items with no gap between them.
      const needsSpace = gap > Math.min(prev.h, box.h) * 0.15;
      if (needsSpace && !out.endsWith(" ") && !box.str.startsWith(" ")) out += " ";
    }
    out += box.str;
    prev = box;
  }
  return out.replace(/[ \t]+/g, " ").trim();
}

/** Recursive XY cut: columns first when a real column gap exists, otherwise sections. */
function readRegion(boxes: Box[], depth: number): string[] {
  if (boxes.length === 0) return [];
  const lines = toLines(boxes);
  if (lines.length <= 1 || depth > 40) return lines.map(lineToText);

  const minX = Math.min(...boxes.map((b) => b.x0));
  const maxX = Math.max(...boxes.map((b) => b.x1));
  const width = maxX - minX;

  const xGap = largestGap(boxes, (b) => b.x0, (b) => b.x1);
  if (xGap && xGap.size >= Math.max(MIN_COLUMN_GAP_PT, width * MIN_COLUMN_GAP_RATIO)) {
    const split = (xGap.start + xGap.end) / 2;
    const left = boxes.filter((b) => b.x1 <= split);
    const right = boxes.filter((b) => b.x0 >= split);
    const leftLines = toLines(left).length;
    const rightLines = toLines(right).length;
    if (
      left.length + right.length === boxes.length &&
      leftLines >= MIN_LINES_PER_COLUMN &&
      rightLines >= MIN_LINES_PER_COLUMN
    ) {
      return [...readRegion(left, depth + 1), ...readRegion(right, depth + 1)];
    }
  }

  const yGap = largestGap(boxes, (b) => b.y0, (b) => b.y1);
  if (yGap && yGap.size >= MIN_ROW_GAP_PT) {
    const split = (yGap.start + yGap.end) / 2;
    const top = boxes.filter((b) => b.y0 >= split);
    const bottom = boxes.filter((b) => b.y1 <= split);
    if (top.length > 0 && bottom.length > 0 && top.length + bottom.length === boxes.length) {
      return [...readRegion(top, depth + 1), ...readRegion(bottom, depth + 1)];
    }
  }

  return lines.map(lineToText);
}

/** Text for one page in reading order, one line per string, blank lines removed. */
export function orderPageText(items: PositionedText[]): string {
  const boxes = toBoxes(items);
  if (boxes.length === 0) return "";
  return readRegion(boxes, 0)
    .filter((line) => line.length > 0)
    .join("\n");
}
