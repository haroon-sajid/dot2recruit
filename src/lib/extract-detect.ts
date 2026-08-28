// Heuristics for pulling a candidate name, email, and position out of extracted CV text.
// These are best-effort hints for prefilling the form. Every field stays editable.
import type { DetectedFields } from "@/types";

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

// Words that mark a line as a document heading rather than a person's name.
const NON_NAME_WORDS = ["resume", "cv", "curriculum"];

// Common role words. A line containing one of these is likely a job title.
const TITLE_KEYWORDS = [
  "engineer",
  "developer",
  "designer",
  "manager",
  "analyst",
  "architect",
  "consultant",
  "administrator",
  "scientist",
  "specialist",
  "lead",
  "intern",
];

const MAX_POSITION_LENGTH = 60;
// A name is looked for in the few lines around the email, not the whole document.
const NAME_SEARCH_RADIUS = 3;

function lines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * A plausible personal name: 2 to 5 words, letters only (allowing accents,
 * hyphens, apostrophes and periods), and not a document heading.
 */
function looksLikeName(line: string): boolean {
  if (line.length > 60) return false;

  const lower = line.toLowerCase();
  if (NON_NAME_WORDS.some((word) => new RegExp(`\\b${word}\\b`).test(lower))) {
    return false;
  }

  const words = line.split(/\s+/);
  if (words.length < 2 || words.length > 5) return false;

  return words.every((word) => /^[\p{L}][\p{L}'.-]*$/u.test(word));
}

function detectName(all: string[], emailIndex: number): string | null {
  // The name is usually the very first line of a CV.
  if (all.length > 0 && looksLikeName(all[0])) return all[0];

  // Otherwise look at the lines around the email, nearest first.
  if (emailIndex >= 0) {
    const start = Math.max(0, emailIndex - NAME_SEARCH_RADIUS);
    const end = Math.min(all.length - 1, emailIndex + NAME_SEARCH_RADIUS);
    const candidates: string[] = [];
    for (let offset = 1; offset <= NAME_SEARCH_RADIUS; offset += 1) {
      if (emailIndex - offset >= start) candidates.push(all[emailIndex - offset]);
      if (emailIndex + offset <= end) candidates.push(all[emailIndex + offset]);
    }
    const found = candidates.find(looksLikeName);
    if (found) return found;
  }

  return null;
}

function detectPosition(all: string[]): string | null {
  const found = all.find((line) => {
    if (line.length > MAX_POSITION_LENGTH) return false;
    const lower = line.toLowerCase();
    if (EMAIL_RE.test(line)) return false;
    return TITLE_KEYWORDS.some((keyword) => new RegExp(`\\b${keyword}`).test(lower));
  });
  return found ?? null;
}

/** Best-effort name, email, and position from CV text. Any field may be null. */
export function detectFields(text: string): DetectedFields {
  const all = lines(text);

  const emailMatch = text.match(EMAIL_RE);
  const email = emailMatch ? emailMatch[0] : null;
  const emailIndex = email ? all.findIndex((line) => line.includes(email)) : -1;

  return {
    name: detectName(all, emailIndex),
    email,
    position: detectPosition(all),
  };
}
