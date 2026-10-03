import { useMemo, useState } from "react";

const formatDate = () =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

export function JournalEditor() {
  const [content, setContent] = useState("");
  const dateLabel = useMemo(formatDate, []);

  return (
    <section className="editor" aria-labelledby="today-heading">
      <header className="editor-header">
        <p className="eyebrow">Today</p>
        <h1 id="today-heading">{dateLabel}</h1>
        <p className="prompt">What&apos;s occupying your mind right now?</p>
      </header>

      <textarea
        aria-label="Journal entry"
        className="writing-surface"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Start writing..."
        autoFocus
      />

      <div className="save-state" aria-live="polite">
        {content ? "Local draft" : "Ready"}
      </div>
    </section>
  );
}
