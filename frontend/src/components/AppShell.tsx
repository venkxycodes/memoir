import { useState, type PropsWithChildren } from "react";
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
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`app-shell${collapsed ? " app-shell--collapsed" : ""}`}>
      <aside id="sidebar" className="sidebar">
        <a className="brand" href="#today" onClick={() => navigate("Today")}>
          <span className="brand-mark" aria-hidden="true">
            m.
          </span>
          <span className="brand-name">memoir<span className="brand-dot">.</span></span>
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
              aria-label={item.label}
              title={item.label}
              onClick={() => navigate(item.label)}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a
            className="export-link"
            aria-label="Export journal"
            title="Export journal"
            href={`${apiBaseUrl}/entries/export`}
            download
          >
            <span className="export-label">Export journal </span>↗
          </a>
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="sidebar"
            onClick={() => setCollapsed((value) => !value)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
              <path d={collapsed ? "m13 9 3 3-3 3" : "m16 9-3 3 3 3"} />
            </svg>
          </button>
        </div>
      </aside>
      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
