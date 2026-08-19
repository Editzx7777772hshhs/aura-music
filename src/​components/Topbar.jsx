import React from "react";
import { Menu, Search, Sun, Moon, User } from "lucide-react";

export default function Topbar({ setSidebarOpen, setPage, isDark, setTheme }) {
  return (
    <header className="topbar">
      <button className="icon-btn only-mobile" onClick={() => setSidebarOpen(true)}>
        <Menu size={20} />
      </button>
      <div className="topbar-search" onClick={() => setPage("search")}>
        <Search size={16} />
        <span>Search tracks, artists, moods…</span>
      </div>
      <div className="topbar-actions">
        <button className="icon-btn" onClick={() => setTheme(isDark ? "light" : "dark")} title="Toggle theme">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="avatar" onClick={() => setPage("settings")}>
          <User size={16} />
        </div>
      </div>
    </header>
  );
}
