import { useEffect, useRef, useState } from "react";
import { apiRequest, dateLabel } from "../lib/api";
import { useJournalDraft } from "../hooks/useJournalDraft";
import type { JournalEntry } from "../types/journal";
export function JournalEditor({
  date,
  entry,
  onDeleted,
  back,
  rediscover,
}: {
  date: string;
  entry?: JournalEntry;
  onDeleted: () => void;
  back?: () => void;
  rediscover?: () => void;
}) {
  const draft = useJournalDraft(date, entry);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (draft.ready) textarea.current?.focus({ preventScroll: true });
  }, [draft.ready]);
  useEffect(() => {
    if (textarea.current) {
      textarea.current.style.height = "auto";
      textarea.current.style.height = `${Math.max(360, textarea.current.scrollHeight)}px`;
    }
  }, [draft.content, draft.ready]);
  useEffect(() => {
    if (confirming) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirming]);
  const remove = async () => {
    setDeleting(true);
    await draft.prepareDelete();
    try {
      await apiRequest(`/entries/${draft.id}`, { method: "DELETE" });
      draft.discard();
      try {
        localStorage.removeItem(`memoir:draft:${date}`);
      } catch {
        /* entry removed on server */
      }
      onDeleted();
    } catch {
      draft.cancelDelete();
      setError("Couldn’t delete this entry. Please try again.");
      setDeleting(false);
    }
  };
  return (
    <section className="editor">
      <div className="page-topline">
        <span className="eyebrow">
          {entry ? "FROM YOUR JOURNAL" : "YOUR SPACE, TODAY"}
        </span>
        {back && (
          <button className="text-button" onClick={back}>
            ← Back to journal
          </button>
        )}
      </div>
      <header className="editor-header">
        <h1>{dateLabel(date)}</h1>
        <p className="date-note">
          {entry
            ? "A moment worth coming back to."
            : "There’s no right way to begin."}
        </p>
      </header>
      {!entry && (
        <div className="prompt">What’s occupying your mind right now?</div>
      )}
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
      {(draft.id || rediscover) && (
        <div className="entry-actions">
          {rediscover && (
            <button className="subtle-button" onClick={rediscover}>
              Take me somewhere else <span aria-hidden="true">↗</span>
            </button>
          )}
          {draft.id && (
            <button
              className="text-button delete-button"
              onClick={() => setConfirming(true)}
            >
              Delete entry
            </button>
          )}
        </div>
      )}
      <dialog
        ref={dialog}
        onCancel={() => setConfirming(false)}
        onClose={() => setConfirming(false)}
      >
        <h2>Delete this entry?</h2>
        <p>This moment will be permanently removed from your journal.</p>
        {error && <p role="alert">{error}</p>}
        <div className="dialog-actions">
          <button
            className="subtle-button"
            onClick={() => setConfirming(false)}
            disabled={deleting}
          >
            Keep entry
          </button>
          <button
            className="danger-button"
            onClick={remove}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete entry"}
          </button>
        </div>
      </dialog>
    </section>
  );
}
