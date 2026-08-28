// Upload area used above the CV and job description textareas.
// Handles the file picker, drag and drop, and the extraction request.
"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import type { ExtractTextResponse } from "@/types";

const ACCEPT = ".pdf,.docx,.txt";

function IconUpload() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function FileDrop({
  label,
  disabled = false,
  onExtracted,
}: {
  /** Describes the target field, used for the accessible button label. */
  label: string;
  disabled?: boolean;
  onExtracted: (result: ExtractTextResponse) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/extract-text", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as
        | (ExtractTextResponse & { error?: string })
        | null;

      if (!res.ok || !data?.text) {
        setError(data?.error ?? "Could not read this file. Please paste the text instead.");
        return;
      }

      setFileName(file.name);
      onExtracted(data);
    } catch {
      setError("Could not reach the server. Please paste the text instead.");
    } finally {
      setBusy(false);
      // Allow re-selecting the same file after a removal.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled || busy) return;
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!disabled && !busy) setDragging(true);
  }

  return (
    <div className="mt-1">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
        className={`flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-3 py-2.5 transition ${
          dragging ? "border-[#4A90E2] bg-[#EBF3FC]" : "border-gray-200 bg-gray-50/60"
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          disabled={disabled || busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
          className="sr-only"
        />
        <label
          htmlFor={inputId}
          aria-disabled={disabled || busy}
          className={`inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 transition ${
            disabled || busy
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          {busy ? <Spinner /> : <IconUpload />}
          {busy ? "Reading file…" : "Upload PDF, DOCX or TXT"}
        </label>

        {busy ? (
          <span className="text-xs text-gray-500">Extracting text from {label}…</span>
        ) : fileName ? (
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#EBF3FC] py-1 pl-2.5 pr-1 text-xs font-medium text-[#4A90E2]">
            <IconFile />
            <span className="truncate">{fileName}</span>
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                setError(null);
              }}
              aria-label={`Remove ${fileName}`}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[#4A90E2] transition hover:bg-white"
            >
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </span>
        ) : (
          <span className="text-xs text-gray-500">
            or drag a file here, or paste text below
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
