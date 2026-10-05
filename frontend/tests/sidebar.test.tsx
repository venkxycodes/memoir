// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AppShell } from "../src/components/AppShell";

afterEach(cleanup);

it("can collapse and reopen the sidebar while keeping navigation and export available", () => {
  const navigate = vi.fn();
  render(<AppShell view="Today" navigate={navigate}>Journal content</AppShell>);
  fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
  const expand = screen.getByRole("button", { name: "Expand sidebar" });
  expect(expand.getAttribute("aria-expanded")).toBe("false");
  fireEvent.click(screen.getByRole("button", { name: "Search" }));
  expect(navigate).toHaveBeenCalledWith("Search");
  expect(screen.getByRole("link", { name: "Export journal" }).getAttribute("href")).toContain("/entries/export");
  fireEvent.click(expand);
  expect(screen.getByRole("button", { name: "Collapse sidebar" }).getAttribute("aria-expanded")).toBe("true");
});
