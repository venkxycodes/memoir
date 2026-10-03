// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJournalDraft } from "../src/hooks/useJournalDraft";
import { apiRequest } from "../src/lib/api";
vi.mock("../src/lib/api", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  apiRequest: vi.fn(),
}));
const request = vi.mocked(apiRequest);
const entry = {
  id: 1,
  title: null,
  content: "Server content",
  entry_date: "2026-10-03",
  mood: null,
  created_at: "2026-10-03T00:00:00Z",
  updated_at: "2099-01-01T00:00:00Z",
};
const key = "memoir:draft:2026-10-03";
beforeEach(() => {
  localStorage.clear();
  request.mockReset();
  request.mockResolvedValue(entry);
});
afterEach(async () => {
  request.mockResolvedValue(entry);
  cleanup();
  await act(async () => {
    await Promise.resolve();
  });
  vi.useRealTimers();
});
describe("journal autosave durability", () => {
  it("restores dirty draft even when an older saved snapshot has a newer server timestamp", async () => {
    localStorage.setItem(
      key,
      JSON.stringify({
        content: "Latest unsaved thought",
        title: "",
        updated: 1,
      }),
    );
    const { result } = renderHook(() => useJournalDraft("2026-10-03", entry));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.content).toBe("Latest unsaved thought");
  });
  it("ignores malformed local storage safely", async () => {
    localStorage.setItem(
      key,
      JSON.stringify({ content: 42, title: null, updated: 1 }),
    );
    const { result } = renderHook(() => useJournalDraft("2026-10-03", entry));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.content).toBe("Server content");
  });
  it("retains newer input while a previous snapshot saves", async () => {
    vi.useFakeTimers();
    let complete!: (value: typeof entry) => void;
    request.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const { result } = renderHook(() => useJournalDraft("2026-10-03", entry));
    act(() => result.current.update("content", "First thought"));
    await act(async () => {
      vi.advanceTimersByTime(750);
    });
    act(() => result.current.update("content", "Latest thought"));
    await act(async () => {
      complete({ ...entry, content: "First thought" });
    });
    expect(JSON.parse(localStorage.getItem(key)!).content).toBe(
      "Latest thought",
    );
    expect(result.current.content).toBe("Latest thought");
  });
  it("waits for the actual in-flight write before allowing deletion", async () => {
    vi.useFakeTimers();
    let complete!: (value: typeof entry) => void;
    request.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const { result } = renderHook(() => useJournalDraft("2026-10-03", entry));
    act(() => result.current.update("content", "First thought"));
    await act(async () => {
      vi.advanceTimersByTime(750);
    });
    act(() => result.current.update("content", "Latest thought"));
    await act(async () => {
      vi.advanceTimersByTime(750);
    });
    let finished = false;
    const preparing = result.current.prepareDelete().then(() => {
      finished = true;
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(finished).toBe(false);
    await act(async () => {
      complete({ ...entry, content: "First thought" });
      await preparing;
    });
    expect(finished).toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    expect(request).toHaveBeenCalledTimes(1);
  });
});
