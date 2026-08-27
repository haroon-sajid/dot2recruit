// Component: form for submitting a candidate (name, email, position, CV text, job description).
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { candidateInputSchema } from "@/lib/validations";
import type { CandidateInput } from "@/types";

const POSITION_OPTIONS = [
  "Full-Stack AI Automation Developer",
  "Frontend Developer",
  "Backend Developer",
] as const;
const CUSTOM_POSITION = "__custom__";
const MIN_TEXT_LENGTH = 50;

type FieldName = keyof CandidateInput;
type FieldErrors = Partial<Record<FieldName, string>>;

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
  "block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-500";

function fieldClass(hasError: boolean) {
  return `${inputClass} ${hasError ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"}`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-600">
      {message}
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
  const [apiError, setApiError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isCustom = positionChoice === CUSTOM_POSITION;
  const position = isCustom ? customPosition : positionChoice;

  function clearError(field: FieldName) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
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
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
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
            }}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby="name-error"
            placeholder="Jane Doe"
            className={`mt-1 ${fieldClass(Boolean(fieldErrors.name))}`}
          />
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
            }}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby="email-error"
            placeholder="jane@example.com"
            className={`mt-1 ${fieldClass(Boolean(fieldErrors.email))}`}
          />
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
            }}
            disabled={submitting}
            aria-label="Custom position title"
            placeholder="Enter the position title"
            className={`mt-2 ${fieldClass(Boolean(fieldErrors.position))}`}
          />
        )}
        <FieldError id="position-error" message={fieldErrors.position} />
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="cvText" className="block text-sm font-medium text-gray-700">
            CV / Resume
          </label>
          <span className="text-xs text-gray-500">
            {cvText.trim().length} chars · min {MIN_TEXT_LENGTH}
          </span>
        </div>
        <textarea
          id="cvText"
          name="cvText"
          rows={8}
          value={cvText}
          onChange={(e) => {
            setCvText(e.target.value);
            clearError("cvText");
          }}
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.cvText)}
          aria-describedby="cvText-error"
          placeholder="Paste the candidate's CV text here…"
          className={`mt-1 resize-y ${fieldClass(Boolean(fieldErrors.cvText))}`}
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
        <textarea
          id="jdText"
          name="jdText"
          rows={8}
          value={jdText}
          onChange={(e) => {
            setJdText(e.target.value);
            clearError("jdText");
          }}
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.jdText)}
          aria-describedby="jdText-error"
          placeholder="Paste the job description here…"
          className={`mt-1 resize-y ${fieldClass(Boolean(fieldErrors.jdText))}`}
        />
        <FieldError id="jdText-error" message={fieldErrors.jdText} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Spinner />}
          {submitting ? "Submitting…" : "Screen candidate"}
        </button>
      </div>
    </form>
  );
}
