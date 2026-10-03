import type { PropsWithChildren } from "react";

const navItems = ["Today", "Journal", "Rediscover", "Search"];

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">Memoir</div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={item === "Today" ? "nav-item nav-item--active" : "nav-item"}
              key={item}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
