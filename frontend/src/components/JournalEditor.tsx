import { useEffect, useRef } from "react";
import { dateLabel } from "../lib/api";
import { useJournalDraft } from "../hooks/useJournalDraft";
import type { JournalEntry } from "../types/journal";
export function JournalEditor({
  date,
  entry,
  back,
  rediscover,
}: {
  date: string;
  entry?: JournalEntry;
  back?: () => void;
  rediscover?: () => void;
}) {
  const draft = useJournalDraft(date, entry);
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (draft.ready) textarea.current?.focus({ preventScroll: true });
  }, [draft.ready]);
  useEffect(() => {
    if (textarea.current) {
      textarea.current.style.height = "auto";
      textarea.current.style.height = `${Math.max(360, textarea.current.scrollHeight)}px`;
    }
  }, [draft.content, draft.ready]);
  return (
    <section className="editor">
      <div className="page-topline">
        <span className="eyebrow">
          {entry ? "FROM YOUR JOURNAL" : "WRITE DOWN YOUR THOUGHTS"}
        </span>
        {back && (
          <button className="text-button" onClick={back}>
            ← Back to journal
          </button>
        )}
      </div>
      <header className="editor-header">
        <h1>{dateLabel(date)}</h1>
        {entry && <p className="date-note">A moment worth coming back to.</p>}
      </header>
      <label className="sr-only" htmlFor="entry-title">
        Optional title
      </label>
      <input
        id="entry-title"
        className="entry-title"
        placeholder="A title, if you like…"
        value={draft.title}
        disabled={!draft.ready}
        onChange={(e) => draft.update("title", e.target.value)}
        maxLength={255}
      />
      <label className="sr-only" htmlFor="journal-content">
        Journal entry
      </label>
      <textarea
        id="journal-content"
        ref={textarea}
        className="writing-surface"
        placeholder={
          draft.ready
            ? "Let your thoughts find their way here…"
            : "Opening your journal…"
        }
        value={draft.content}
        disabled={!draft.ready}
        onChange={(e) => draft.update("content", e.target.value)}
      />
      <footer className="editor-footer">
        <span className="quiet-note">A moment for yourself.</span>
        <button
          className="save-state"
          onClick={draft.retry}
          title="Retry saving"
          aria-live="polite"
        >
          <span
            className={draft.status === "Saved" ? "saved-dot" : "status-dot"}
          />
          {draft.status}
        </button>
      </footer>
      {rediscover && (
        <div className="entry-actions">
          <button className="text-button" onClick={rediscover}>
            Take me somewhere else <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}
    </section>
  );
}
