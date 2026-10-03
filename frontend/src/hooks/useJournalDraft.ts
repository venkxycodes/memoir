import { useEffect, useRef, useState } from "react";
import { ApiError, apiRequest } from "../lib/api";
import type { JournalEntry } from "../types/journal";
// Serialize saves for each day across editor mounts and navigation.
const writeQueues = new Map<string, Promise<void>>();
type Draft = { content: string; title: string; updated: number };
export function useJournalDraft(date: string, initial?: JournalEntry) {
  const key = `memoir:draft:${date}`;
  const [content, setContent] = useState(initial?.content ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [status, setStatus] = useState("Loading…");
  const [ready, setReady] = useState(false);
  const [id, setId] = useState(initial?.id);
  const state = useRef({
    content: initial?.content ?? "",
    title: initial?.title ?? "",
    id: initial?.id,
    dirty: false,
    loaded: false,
  });
  const saveRef = useRef<() => Promise<void>>(async () => {});
  const storageFailed = useRef(false);
  const suspended = useRef(false);
  const pending = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let saving = false;
    const report = (s: string) => {
      if (alive) setStatus(s);
    };
    const performSave = async () => {
      if (suspended.current || !state.current.dirty || !state.current.loaded)
        return;
      if (
        !state.current.id &&
        !state.current.content.trim() &&
        !state.current.title.trim()
      ) {
        report("Ready");
        return;
      }
      const snapshot = {
        content: state.current.content,
        title: state.current.title || null,
      };
      report("Saving…");
      try {
        let entry: JournalEntry;
        try {
          entry = await apiRequest<JournalEntry>(
            state.current.id ? `/entries/${state.current.id}` : "/entries",
            {
              method: state.current.id ? "PATCH" : "POST",
              body: JSON.stringify({
                ...snapshot,
                ...(!state.current.id ? { entry_date: date } : {}),
              }),
            },
          );
        } catch (error) {
          if (
            !(error instanceof ApiError) ||
            error.status !== 409 ||
            state.current.id
          )
            throw error;
          const existing = await apiRequest<JournalEntry>(
            `/entries/today?date=${date}`,
          );
          state.current.id = existing.id;
          entry = await apiRequest<JournalEntry>(`/entries/${existing.id}`, {
            method: "PATCH",
            body: JSON.stringify(snapshot),
          });
        }
        state.current.id = entry.id;
        if (alive) setId(entry.id);
        if (
          state.current.content === snapshot.content &&
          state.current.title === (snapshot.title ?? "")
        ) {
          state.current.dirty = false;
          try {
            const raw = localStorage.getItem(key);
            const current = raw ? JSON.parse(raw) : null;
            if (
              current?.content === snapshot.content &&
              current?.title === (snapshot.title ?? "")
            )
              localStorage.removeItem(key);
          } catch {
            /* saved on server */
          }
          report("Saved");
        }
      } catch {
        report(
          navigator.onLine
            ? "Couldn’t save · retry"
            : storageFailed.current
              ? "Offline · local backup unavailable"
              : "Offline · draft kept here",
        );
      } finally {
        if (state.current.dirty && alive) timer = setTimeout(save, 3000);
      }
    };
    const save = () => {
      if (saving) return pending.current;
      if (suspended.current || !state.current.dirty || !state.current.loaded)
        return Promise.resolve();
      saving = true;
      const previous = writeQueues.get(date) ?? Promise.resolve();
      const task = previous
        .catch(() => {})
        .then(performSave)
        .finally(() => {
          saving = false;
          if (writeQueues.get(date) === task) writeQueues.delete(date);
        });
      pending.current = task;
      writeQueues.set(date, task);
      return task;
    };
    const load = async () => {
      const outstanding = writeQueues.get(date);
      if (outstanding) await outstanding.catch(() => {});
      if (!alive) return;
      let entry = outstanding ? undefined : initial;
      let unavailable = false;
      let draft: Draft | undefined;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            typeof parsed.content === "string" &&
            typeof parsed.title === "string" &&
            typeof parsed.updated === "number"
          )
            draft = parsed;
        }
      } catch {
        storageFailed.current = true;
      }
      if (!entry) {
        try {
          entry = await apiRequest<JournalEntry>(`/entries/today?date=${date}`);
        } catch (error) {
          unavailable = !(error instanceof ApiError && error.status === 404);
        }
      }
      if (!alive) return;
      // Drafts are removed only when their exact snapshot reaches the server.
      // A newer server timestamp can still contain an older in-flight snapshot.
      const recover = Boolean(draft);
      const value =
        recover && draft
          ? draft
          : { content: entry?.content ?? "", title: entry?.title ?? "" };
      state.current = {
        content: value.content,
        title: value.title,
        id: entry?.id,
        dirty: Boolean(recover),
        loaded: !unavailable,
      };
      setContent(value.content);
      setTitle(value.title);
      setId(entry?.id);
      setReady(true);
      report(
        unavailable
          ? "Connection unavailable · retry"
          : recover
            ? "Draft restored · saving…"
            : entry
              ? "Saved"
              : "Ready",
      );
      if (recover) timer = setTimeout(save, 750);
    };
    saveRef.current = () => (state.current.loaded ? save() : load());
    void load();
    const reconnect = () => {
      if (!state.current.loaded) void load();
      else void save();
    };
    window.addEventListener("online", reconnect);
    return () => {
      clearTimeout(timer);
      void save();
      alive = false;
      window.removeEventListener("online", reconnect);
    };
  }, [date, initial, key]);
  useEffect(() => {
    if (!ready || !state.current.dirty) return;
    const timer = setTimeout(() => void saveRef.current(), 750);
    return () => clearTimeout(timer);
  }, [content, title, ready]);
  const update = (field: "content" | "title", value: string) => {
    state.current[field] = value;
    state.current.dirty = true;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          content: state.current.content,
          title: state.current.title,
          updated: Date.now(),
        }),
      );
    } catch {
      storageFailed.current = true;
    }
    setStatus(
      storageFailed.current ? "Saving… · local backup unavailable" : "Saving…",
    );
    if (field === "content") setContent(value);
    else setTitle(value);
  };
  return {
    content,
    title,
    status,
    ready,
    id,
    update,
    prepareDelete: async () => {
      suspended.current = true;
      await pending.current;
    },
    cancelDelete: () => {
      suspended.current = false;
    },
    discard: () => {
      state.current.dirty = false;
    },
    retry: () => void saveRef.current(),
  };
}
