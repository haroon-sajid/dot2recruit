// Positions page: saved job descriptions HR can reuse when screening candidates.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FileDrop } from "@/components/file-drop";
import { PageHeader } from "@/components/ui/page-header";
import type { JobDescription } from "@/types";

const PREVIEW_LENGTH = 120;
const MIN_JD_LENGTH = 50;
const MIN_TITLE_LENGTH = 2;

const inputClass =
  "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#4A90E2] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]/40 disabled:bg-gray-50";

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function preview(text: string) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH)}…` : flat;
}

function Spinner() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/** Create a position, or edit one when `existing` is given. */
function PositionForm({
  existing,
  onSaved,
  onCancel,
}: {
  existing: JobDescription | null;
  onSaved: (saved: JobDescription) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [jdText, setJdText] = useState(existing?.jd_text ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (title.trim().length < MIN_TITLE_LENGTH) {
      setError("Title must be at least 2 characters.");
      return;
    }
    if (jdText.trim().length < MIN_JD_LENGTH) {
      setError(`Job description must be at least ${MIN_JD_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        existing ? `/api/job-descriptions/${existing.id}` : "/api/job-descriptions",
        {
          method: existing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: title.trim(), jd_text: jdText.trim() }),
        },
      );
      const data = (await res.json().catch(() => null)) as
        | (JobDescription & { error?: string })
        | null;

      if (!res.ok || !data?.id) {
        setError(data?.error ?? "Could not save this position. Please try again.");
        return;
      }
      onSaved(data);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-100 bg-white p-6 shadow-[0_4px_20px_rgba(79,70,229,0.06)]"
    >
      <h2 className="text-sm font-semibold text-gray-900">
        {existing ? "Edit position" : "Add a position"}
      </h2>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="mt-4">
        <label htmlFor="jd-title" className="block text-sm font-medium text-gray-700">
          Position title
        </label>
        <input
          id="jd-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          placeholder="Senior Frontend Developer"
          className={`mt-1 ${inputClass}`}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="jd-text" className="block text-sm font-medium text-gray-700">
            Job description
          </label>
          <span className="text-xs text-gray-500">
            {jdText.trim().length} chars · min {MIN_JD_LENGTH}
          </span>
        </div>
        <FileDrop
          label="the job description"
          disabled={saving}
          fileName={fileName}
          onExtracted={({ text }, name) => {
            setJdText(text);
            setFileName(name);
          }}
          onRemove={() => {
            setFileName(null);
            setJdText("");
          }}
        />
        <textarea
          id="jd-text"
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          disabled={saving}
          placeholder="Paste the job description here…"
          className={`mt-2 h-[32vh] min-h-[180px] resize-y ${inputClass}`}
        />
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#4A90E2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Spinner />}
          {saving ? "Saving…" : existing ? "Save changes" : "Save position"}
        </button>
      </div>
    </form>
  );
}

function PositionRow({
  position,
  onEdit,
  onDelete,
}: {
  position: JobDescription;
  onEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/job-descriptions/${position.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete(position.id);
        return;
      }
    } catch {
      // Fall through to reset the row so the user can retry.
    }
    setDeleting(false);
    setConfirming(false);
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-gray-900">{position.title}</h3>
        <p className="mt-0.5 text-xs text-gray-400">Saved {formatDate(position.created_at)}</p>
        <p className="mt-1.5 line-clamp-2 text-sm text-gray-600">{preview(position.jd_text)}</p>
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-gray-500">Delete this position?</span>
          <button
            type="button"
            onClick={remove}
            disabled={deleting}
            className="rounded-lg bg-[#EF4444] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#DC2626] disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={deleting}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-[#EBF3FC] hover:text-[#4A90E2]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-red-50 hover:text-[#DC2626]"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<JobDescription[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<JobDescription | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/job-descriptions", { cache: "no-store" });
        const data = (await res.json().catch(() => null)) as
          | { jobDescriptions?: JobDescription[]; error?: string }
          | null;
        if (cancelled) return;
        if (!res.ok || !data?.jobDescriptions) {
          setError(data?.error ?? "Failed to load positions.");
          return;
        }
        setPositions(data.jobDescriptions);
      } catch {
        if (!cancelled) {
          setError("Could not reach the server. Check your connection and try again.");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Positions"
        subtitle="Save a job description once and reuse it when screening candidates."
        action={
          !adding &&
          !editing && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#4A90E2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3A7BD5]"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
              </svg>
              Add Position
            </button>
          )
        }
      />

      {(adding || editing) && (
        <PositionForm
          // Remount when the target changes so the fields re-seed.
          key={editing?.id ?? "new"}
          existing={editing}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={(saved) => {
            setPositions((prev) => {
              const list = prev ?? [];
              return editing
                ? list.map((p) => (p.id === saved.id ? saved : p))
                : [saved, ...list];
            });
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 shadow-[0_4px_20px_rgba(79,70,229,0.06)]"
        >
          {error}
        </div>
      ) : positions === null ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-500 shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          Loading positions…
        </div>
      ) : positions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          <p className="text-base font-semibold text-gray-900">No saved positions yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Add a job description here and it will be available when you screen a candidate.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_4px_20px_rgba(79,70,229,0.06)]">
          {positions.map((position) => (
            <PositionRow
              key={position.id}
              position={position}
              onEdit={() => {
                setAdding(false);
                setEditing(position);
              }}
              onDelete={(id) =>
                setPositions((prev) => (prev ?? []).filter((p) => p.id !== id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
