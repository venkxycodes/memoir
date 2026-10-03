import type { PropsWithChildren } from "react";
import { apiBaseUrl } from "../lib/api";
import type { View } from "../types/journal";
const items: { label: View; icon: string }[] = [
  { label: "Today", icon: "○" },
  { label: "Journal", icon: "▤" },
  { label: "Rediscover", icon: "↻" },
  { label: "Search", icon: "⌕" },
];
export function AppShell({
  children,
  view,
  navigate,
}: PropsWithChildren<{ view: View; navigate: (view: View) => void }>) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#today" onClick={() => navigate("Today")}>
          <span className="brand-mark" aria-hidden="true">
            m.
          </span>
          memoir<span className="brand-dot">.</span>
        </a>
        <a
          className="mobile-export"
          href={`${apiBaseUrl}/entries/export`}
          download
        >
          Export journal ↗
        </a>
        <p className="brand-caption">A little space for your life.</p>
        <nav className="nav-list" aria-label="Primary navigation">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`nav-item ${view === item.label ? "nav-item--active" : ""}`}
              aria-current={view === item.label ? "page" : undefined}
              onClick={() => navigate(item.label)}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a
            className="export-link"
            href={`${apiBaseUrl}/entries/export`}
            download
          >
            Export journal ↗
          </a>
        </div>
      </aside>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
