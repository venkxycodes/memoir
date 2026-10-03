import { useEffect, useRef, useState } from "react";
import { AppShell } from "../components/AppShell";
import { JournalEditor } from "../components/JournalEditor";
import { TodayPage } from "../pages/TodayPage";
import { JournalPage } from "../pages/JournalPage";
import { ApiError, apiRequest, localDate } from "../lib/api";
import type { JournalEntry, View } from "../types/journal";
function hashView(): View {
  const v = location.hash.slice(1).toLowerCase();
  return v === "journal"
    ? "Journal"
    : v === "search"
      ? "Search"
      : v === "rediscover"
        ? "Rediscover"
        : "Today";
}
export function App() {
  const [view, setView] = useState<View>(hashView);
  const [entry, setEntry] = useState<JournalEntry>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [empty, setEmpty] = useState(false);
  const [revision, setRevision] = useState(0);
  const request = useRef(0);
  const navigate = (next: View) => {
    request.current++;
    setLoading(false);
    setView(next);
    setEntry(undefined);
    setError("");
    setEmpty(false);
    location.hash = next.toLowerCase();
  };
  useEffect(() => {
    const update = () => navigate(hashView());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const open = async (id: number) => {
    const generation = ++request.current;
    setLoading(true);
    setError("");
    try {
      const result = await apiRequest<JournalEntry>(`/entries/${id}`);
      if (generation === request.current) setEntry(result);
    } catch {
      if (generation === request.current)
        setError("This entry couldn’t be opened. Please try again.");
    } finally {
      if (generation === request.current) setLoading(false);
    }
  };
  const random = async () => {
    const generation = ++request.current;
    setLoading(true);
    setError("");
    setEmpty(false);
    try {
      const result = await apiRequest<JournalEntry>(
        `/entries/random?date=${localDate()}${entry ? `&exclude=${entry.id}` : ""}`,
      );
      if (generation === request.current) setEntry(result);
    } catch (e) {
      if (generation !== request.current) return;
      if (e instanceof ApiError && e.status === 404) {
        setEmpty(true);
        setEntry(undefined);
      } else setError("Couldn’t find a memory right now. Please try again.");
    } finally {
      if (generation === request.current) setLoading(false);
    }
  };
  const deleted = () => {
    setEntry(undefined);
    setRevision((r) => r + 1);
    navigate("Journal");
  };
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to journal
      </a>
      <AppShell view={view} navigate={navigate}>
        {error && (
          <div className="global-error" role="alert">
            {error}
          </div>
        )}
        {loading ? (
          <div className="collection loading-state" role="status">
            Opening a moment…
          </div>
        ) : entry ? (
          <JournalEditor
            key={`${entry.id}`}
            date={entry.entry_date}
            entry={entry}
            onDeleted={deleted}
            back={() => navigate("Journal")}
            rediscover={view === "Rediscover" ? () => void random() : undefined}
          />
        ) : view === "Today" ? (
          <TodayPage key={revision} onDeleted={deleted} />
        ) : view === "Journal" || view === "Search" ? (
          <JournalPage
            key={view + revision}
            search={view === "Search"}
            open={(id) => void open(id)}
          />
        ) : (
          <section className="rediscover collection">
            <div className="eyebrow">A LITTLE WAY BACK</div>
            <div className="memory-mark" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 7v5h-5" />
                <path d="M20 12a8 8 0 1 0-2.3 5.7M20 7v5" />
              </svg>
            </div>
            <h1>
              Some days deserve
              <br />a second visit.
            </h1>
            <p className="page-description">
              A thought you’d forgotten. A day that made you smile.
              <br />
              Let your journal take you back.
            </p>
            <button className="primary-button" onClick={() => void random()}>
              Take me somewhere <span aria-hidden="true">↗</span>
            </button>
            {empty && (
              <div className="empty-state" role="status">
                <h2>There isn’t much to rediscover yet.</h2>
                <p>Keep writing. This space gets better with time.</p>
              </div>
            )}
            <p className="rediscover-note">
              A previous entry, chosen at random. Always just for you.
            </p>
          </section>
        )}
      </AppShell>
    </>
  );
}
