import React from "react";
import { Search, Moon, Sun, Menu } from "lucide-react";

export default function Topbar({
  theme,
  setTheme,
  setSidebarOpen,
  page,
  setPage,
  searchQuery,
  setSearchQuery,
  handleSearch,
}) {
  return (
    <header className="topbar glass">
      <div className="topbar-left">
        <button
          className="icon-btn only-mobile"
          onClick={() => setSidebarOpen((prev) => !prev)}
        >
          <Menu size={20} />
        </button>

        <form
          className="search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            if (handleSearch) handleSearch(searchQuery);
          }}
        >
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search tracks, artists, moods..."
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (page !== "search" && setPage) setPage("search");
            }}
          />
        </form>
      </div>

      <div className="topbar-right">
        <button
          className="icon-btn theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
