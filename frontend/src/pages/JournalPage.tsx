import { useEffect, useState } from "react";
import { apiRequest, dateLabel } from "../lib/api";
import type { EntryList, EntryPreview } from "../types/journal";
export function JournalPage({
  open,
  search = false,
}: {
  open: (id: number) => void;
  search?: boolean;
}) {
  const [entries, setEntries] = useState<EntryPreview[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    const timer = setTimeout(
      () => {
        if (search && !query.trim()) {
          setEntries([]);
          setLoading(false);
          return;
        }
        void apiRequest<EntryList>(
          search
            ? `/entries/search?q=${encodeURIComponent(query.trim())}`
            : "/entries?limit=20",
        )
          .then((data) => {
            if (alive) {
              setEntries(data.results);
              setCursor(data.next_cursor ?? null);
            }
          })
          .catch(() => {
            if (alive)
              setError("Your journal couldn’t be loaded. Please try again.");
          })
          .finally(() => {
            if (alive) setLoading(false);
          });
      },
      search ? 300 : 0,
    );
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, search, retry]);
  const more = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<EntryList>(
        `/entries?limit=20&cursor=${encodeURIComponent(cursor ?? "")}`,
      );
      setEntries((e) => [...e, ...data.results]);
      setCursor(data.next_cursor ?? null);
    } catch {
      setError("Couldn’t load more entries. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="collection">
      <div className="eyebrow">
        {search ? "FIND A MOMENT" : "THE DAYS, AS THEY WERE"}
      </div>
      <h1>{search ? "Search your journal" : "Your journal"}</h1>
      <p className="page-description">
        {search
          ? "A word, a place, a feeling. Start with what you remember."
          : "Memories kept. Lessons learnt. Moments cherished"}
      </p>
      {search && (
        <div className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Search journal"
            placeholder="Search your words…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}
      {error && (
        <div className="error-state" role="alert">
          {error}{" "}
          <button
            className="text-button"
            onClick={() => setRetry((r) => r + 1)}
          >
            Try again
          </button>
        </div>
      )}
      {entries.length > 0 && (
        <div className="entry-list">
          {entries.map((e) => (
            <button
              className="entry-card"
              key={e.id}
              onClick={() => open(e.id)}
            >
              <span className="entry-card-date">{dateLabel(e.entry_date)}</span>
              <span className="entry-card-title">
                {e.title ||
                  e.preview.split("\n")[0].slice(0, 80) ||
                  "An untitled moment"}
              </span>
              <span className="entry-card-preview">{e.preview}</span>
              <span className="entry-card-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
      )}
      {loading && (
        <p className="loading-state" role="status">
          Opening your journal…
        </p>
      )}
      {!loading && !error && entries.length === 0 && (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">
            {search ? "⌕" : "▤"}
          </span>
          <h2>
            {search
              ? query.trim()
                ? "Nothing found."
                : "What would you like to find?"
              : "Nothing here yet."}
          </h2>
          <p>
            {search
              ? query.trim()
                ? "Try another word or phrase."
                : "Your memories are just a few words away."
              : "Write whatever is on your mind."}
          </p>
        </div>
      )}
      {!search && cursor && (
        <button
          className="subtle-button load-more"
          disabled={loading}
          onClick={more}
        >
          Earlier moments ↓
        </button>
      )}
    </section>
  );
}
