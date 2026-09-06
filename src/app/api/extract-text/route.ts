// API route: extracts plain text from an uploaded PDF, DOCX, or TXT file.
// The file is held in memory for the duration of the request and never stored.
import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/auth";
import { detectFields } from "@/lib/extract-detect";
import { orderPageText, type PositionedText } from "@/lib/pdf-layout";
import { checkRateLimit, RATE_LIMITS, rateLimitedResponse } from "@/lib/rate-limit";
import { MAX_TEXT_LENGTH, MIN_TEXT_LENGTH } from "@/lib/validations";
import type { ExtractTextResponse } from "@/types";

export const dynamic = "force-dynamic";
// mammoth needs Node APIs, so this route cannot run on the edge.
export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

type Kind = "pdf" | "docx" | "txt";

function kindFor(file: File): Kind | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".txt")) return "txt";
  return null;
}

/**
 * Collapse the ragged whitespace that PDF and DOCX extraction produces:
 * normalise line endings, strip zero-width and non-breaking spaces, squeeze
 * runs of spaces, and cap consecutive blank lines at one.
 */
function normalizeWhitespace(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    // Non-breaking space, en and em spaces, zero-width characters, and the BOM.
    .replace(/[\u00a0\u2000-\u200d\ufeff]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extract(file: File, kind: Kind): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (kind === "txt") {
    return buffer.toString("utf-8");
  }

  if (kind === "docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }

  // unpdf ships a serverless build of pdf.js. Unlike pdf-parse it has no dynamic
  // requires and no bundled per-version pdf.js copies, which is what broke on Vercel.
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));

  // Positioned text lets the page be read in column order. Fall back to the
  // plain content-stream order if a page cannot be laid out.
  try {
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // Marked-content entries carry no text; keep only real text items.
      const items: PositionedText[] = [];
      for (const item of content.items) {
        if ("str" in item && typeof item.str === "string" && Array.isArray(item.transform)) {
          items.push({ str: item.str, transform: item.transform, width: item.width, height: item.height });
        }
      }
      pages.push(orderPageText(items));
    }
    const text = pages.join("\n\n");
    if (text.trim().length > 0) return text;
  } catch (err) {
    console.warn("[api/extract-text] Layout-aware PDF read failed, using plain order:", err);
  }

  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/** POST /api/extract-text — multipart form-data with a single `file` field. */
export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limit = checkRateLimit(ctx.userId, RATE_LIMITS.extract);
    if (!limit.ok) return rateLimitedResponse(limit.retryAfterSec);

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Request must be multipart form-data with a 'file' field" },
        { status: 400 },
      );
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was uploaded" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "The uploaded file is empty" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is larger than 5 MB. Please upload a smaller file." },
        { status: 400 },
      );
    }

    const kind = kindFor(file);
    if (!kind) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF, DOCX, or TXT file." },
        { status: 400 },
      );
    }

    let raw: string;
    try {
      raw = await extract(file, kind);
    } catch (err) {
      // The parser's message stays in the server log; the user only needs to
      // know the file could not be read.
      console.error(`[api/extract-text] ${kind} extraction failed:`, err);
      return NextResponse.json(
        { error: "Could not read this file. It may be corrupt or password protected. Please paste the text instead." },
        { status: 400 },
      );
    }

    const text = normalizeWhitespace(raw);
    if (text.length < MIN_TEXT_LENGTH) {
      // Most often a scanned PDF with no text layer.
      return NextResponse.json(
        { error: "Could not read enough text from this file, please paste the text instead" },
        { status: 422 },
      );
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `This file contains more than ${MAX_TEXT_LENGTH.toLocaleString("en-US")} characters of text. Please upload a shorter document or paste the relevant part.`,
        },
        { status: 422 },
      );
    }

    const body: ExtractTextResponse = { text, detected: detectFields(text) };
    return NextResponse.json(body);
  } catch (err) {
    console.error("[api/extract-text] POST unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
