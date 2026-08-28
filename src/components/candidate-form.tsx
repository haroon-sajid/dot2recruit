// Component: form for submitting a candidate (name, email, position, CV text, job description).
// CV and job description can be typed, pasted, or extracted from an uploaded file.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { FileDrop } from "@/components/file-drop";
import { candidateInputSchema } from "@/lib/validations";
import type { CandidateInput, ExtractTextResponse, JobDescription } from "@/types";

const POSITION_OPTIONS = [
  "Full-Stack AI Automation Developer",
  "Frontend Developer",
  "Backend Developer",
] as const;
const CUSTOM_POSITION = "__custom__";
const MIN_TEXT_LENGTH = 50;

type FieldName = keyof CandidateInput;
type FieldErrors = Partial<Record<FieldName, string>>;
/** Which fields were prefilled from an uploaded CV, so the hint can be shown and then cleared. */
type AutoFilled = Partial<Record<"name" | "email" | "position", boolean>>;

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

const inputClass =
  "block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/40 disabled:bg-gray-50 disabled:text-gray-500";

function fieldClass(hasError: boolean) {
  return `${inputClass} ${hasError ? "border-red-300 focus:border-[#EF4444]" : "border-gray-200 focus:border-[#4A90E2]"}`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-600">
      {message}
    </p>
  );
}

function AutoFillHint({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-[#4A90E2]">
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
      </svg>
      Auto-filled from CV
    </p>
  );
}

/** Take the first message per field from a zod/API `fieldErrors` map. */
function firstErrors(
  errors: Partial<Record<FieldName, string[] | undefined>>,
): FieldErrors {
  const next: FieldErrors = {};
  (Object.keys(errors) as FieldName[]).forEach((key) => {
    next[key] = errors[key]?.[0];
  });
  return next;
}

export function CandidateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [positionChoice, setPositionChoice] = useState("");
  const [customPosition, setCustomPosition] = useState("");
  const [cvText, setCvText] = useState("");
  const [jdText, setJdText] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [autoFilled, setAutoFilled] = useState<AutoFilled>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [positions, setPositions] = useState<JobDescription[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [saveJd, setSaveJd] = useState(false);

  const isCustom = positionChoice === CUSTOM_POSITION;
  const position = isCustom ? customPosition : positionChoice;

  // Saved positions for the "Select saved position" dropdown. A failure here
  // only hides the dropdown; uploading and pasting still work.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/job-descriptions", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ jobDescriptions: JobDescription[] }>) : null))
      .then((data) => {
        if (!cancelled && data?.jobDescriptions) setPositions(data.jobDescriptions);
      })
      .catch(() => {
        // Non-blocking: the dropdown just stays empty.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function clearError(field: FieldName) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function clearAutoFill(field: keyof AutoFilled) {
    setAutoFilled((prev) => (prev[field] ? { ...prev, [field]: false } : prev));
  }

  /**
   * Fill the CV text, then prefill name, email, and position from the detected
   * values. Only empty fields are touched, so anything already typed survives.
   */
  function handleCvExtracted({ text, detected }: ExtractTextResponse) {
    setCvText(text);
    clearError("cvText");

    const filled: AutoFilled = {};

    if (detected.name && name.trim() === "") {
      setName(detected.name);
      clearError("name");
      filled.name = true;
    }
    if (detected.email && email.trim() === "") {
      setEmail(detected.email);
      clearError("email");
      filled.email = true;
    }
    if (detected.position && positionChoice === "" && customPosition.trim() === "") {
      setPositionChoice(CUSTOM_POSITION);
      setCustomPosition(detected.position);
      clearError("position");
      filled.position = true;
    }

    setAutoFilled((prev) => ({ ...prev, ...filled }));
  }

  function handleJdExtracted({ text }: ExtractTextResponse) {
    setJdText(text);
    clearError("jdText");
    // The text no longer matches the chosen saved position.
    setSelectedPositionId("");
  }

  /**
   * Fill the job description and the position title from a saved position.
   * Both stay editable afterwards.
   */
  function handleSelectPosition(id: string) {
    setSelectedPositionId(id);
    if (!id) return;

    const saved = positions.find((p) => p.id === id);
    if (!saved) return;

    setJdText(saved.jd_text);
    clearError("jdText");
    // Saving it again would just duplicate the row.
    setSaveJd(false);

    const known = POSITION_OPTIONS.find((option) => option === saved.title);
    if (known) {
      setPositionChoice(known);
      setCustomPosition("");
    } else {
      setPositionChoice(CUSTOM_POSITION);
      setCustomPosition(saved.title);
    }
    clearError("position");
    clearAutoFill("position");
  }

  /** Save the submitted JD as a reusable position. Failures are ignored on purpose. */
  async function persistJobDescription(title: string, jd_text: string) {
    try {
      await fetch("/api/job-descriptions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, jd_text }),
      });
    } catch {
      // The screening already succeeded; a failed save must not block the user.
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);
    setSavedId(null);

    const input: CandidateInput = { name, email, position, cvText, jdText };
    const parsed = candidateInputSchema.safeParse(input);
    if (!parsed.success) {
      setFieldErrors(firstErrors(z.flattenError(parsed.error).fieldErrors));
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
        fieldErrors?: Partial<Record<FieldName, string[]>>;
      };

      if (res.status === 201 && data.id) {
        if (saveJd) {
          await persistJobDescription(parsed.data.position, parsed.data.jdText);
        }
        router.push(`/candidates/${data.id}`);
        return; // keep the button disabled while navigating
      }

      if (res.status === 400 && data.fieldErrors) {
        setFieldErrors(firstErrors(data.fieldErrors));
      }
      setApiError(data.error ?? "Something went wrong. Please try again.");
      if (data.id) setSavedId(data.id);
    } catch {
      setApiError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {apiError && (
        <div
          role="alert"
          className="rounded-lg border border-red-100 bg-white px-4 py-3 text-sm text-red-800 shadow-[0_4px_20px_rgba(79,70,229,0.06)]"
        >
          <p className="font-medium">Submission failed</p>
          <p className="mt-0.5">{apiError}</p>
          {savedId && (
            <p className="mt-1">
              The candidate was saved.{" "}
              <a href={`/candidates/${savedId}`} className="font-medium underline">
                View candidate
              </a>
            </p>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Candidate name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="off"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name");
              clearAutoFill("name");
            }}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby="name-error"
            placeholder="Jane Doe"
            className={`mt-1 ${fieldClass(Boolean(fieldErrors.name))}`}
          />
          <AutoFillHint show={autoFilled.name} />
          <FieldError id="name-error" message={fieldErrors.name} />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
              clearAutoFill("email");
            }}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby="email-error"
            placeholder="jane@example.com"
            className={`mt-1 ${fieldClass(Boolean(fieldErrors.email))}`}
          />
          <AutoFillHint show={autoFilled.email} />
          <FieldError id="email-error" message={fieldErrors.email} />
        </div>
      </div>

      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
          Position
        </label>
        <select
          id="position"
          name="position"
          value={positionChoice}
          onChange={(e) => {
            setPositionChoice(e.target.value);
            clearError("position");
            clearAutoFill("position");
          }}
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.position)}
          aria-describedby="position-error"
          className={`mt-1 ${fieldClass(Boolean(fieldErrors.position))}`}
        >
          <option value="">Select a position…</option>
          {POSITION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={CUSTOM_POSITION}>Custom…</option>
        </select>
        {isCustom && (
          <input
            id="custom-position"
            name="customPosition"
            type="text"
            value={customPosition}
            onChange={(e) => {
              setCustomPosition(e.target.value);
              clearError("position");
              clearAutoFill("position");
            }}
            disabled={submitting}
            aria-label="Custom position title"
            placeholder="Enter the position title"
            className={`mt-2 ${fieldClass(Boolean(fieldErrors.position))}`}
          />
        )}
        <AutoFillHint show={autoFilled.position} />
        <FieldError id="position-error" message={fieldErrors.position} />
      </div>

      {/* CV and JD sit side by side on wide screens so they can be compared while pasting.
          The textareas use a viewport-relative height so the whole form fits on screen by
          default, and keep resize-y so the corner grip still works. */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="cvText" className="block text-sm font-medium text-gray-700">
              CV / Resume
            </label>
            <span className="text-xs text-gray-500">
              {cvText.trim().length} chars · min {MIN_TEXT_LENGTH}
            </span>
          </div>
          <FileDrop label="the CV" disabled={submitting} onExtracted={handleCvExtracted} />
          <textarea
            id="cvText"
            name="cvText"
            value={cvText}
            onChange={(e) => {
              setCvText(e.target.value);
              clearError("cvText");
            }}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.cvText)}
            aria-describedby="cvText-error"
            placeholder="Paste the candidate's CV text here…"
            className={`mt-2 h-[38vh] min-h-[180px] resize-y ${fieldClass(Boolean(fieldErrors.cvText))}`}
          />
          <FieldError id="cvText-error" message={fieldErrors.cvText} />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="jdText" className="block text-sm font-medium text-gray-700">
              Job description
            </label>
            <span className="text-xs text-gray-500">
              {jdText.trim().length} chars · min {MIN_TEXT_LENGTH}
            </span>
          </div>
          {/* Three ways to provide the JD: pick a saved position, upload a file, or paste. */}
          {positions.length > 0 && (
            <div className="mt-1">
              <label
                htmlFor="savedPosition"
                className="block text-xs font-medium text-gray-500"
              >
                Select saved position
              </label>
              <select
                id="savedPosition"
                value={selectedPositionId}
                onChange={(e) => handleSelectPosition(e.target.value)}
                disabled={submitting}
                className={`mt-1 ${fieldClass(false)}`}
              >
                <option value="">None, upload or paste below…</option>
                {positions.map((saved) => (
                  <option key={saved.id} value={saved.id}>
                    {saved.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <FileDrop
            label="the job description"
            disabled={submitting}
            onExtracted={handleJdExtracted}
          />
          <textarea
            id="jdText"
            name="jdText"
            value={jdText}
            onChange={(e) => {
              setJdText(e.target.value);
              clearError("jdText");
              setSelectedPositionId("");
            }}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.jdText)}
            aria-describedby="jdText-error"
            placeholder="Paste the job description here…"
            className={`mt-2 h-[38vh] min-h-[180px] resize-y ${fieldClass(Boolean(fieldErrors.jdText))}`}
          />
          <FieldError id="jdText-error" message={fieldErrors.jdText} />

          <label className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={saveJd}
              onChange={(e) => setSaveJd(e.target.checked)}
              disabled={submitting}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#4A90E2] accent-[#4A90E2]"
            />
            Save this JD to Positions
          </label>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#4A90E2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Spinner />}
          {submitting ? "Submitting…" : "Screen candidate"}
        </button>
      </div>
    </form>
  );
}
