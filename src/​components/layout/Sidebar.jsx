import React from "react";
import { Sparkles, X, BarChart3, Home, Compass, Search, ListMusic, Music2, Settings } from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "search", label: "Search", icon: Search },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "tracks", label: "All Tracks", icon: Music2 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ page, setPage, sidebarOpen, setSidebarOpen, setActivePlaylistId }) {
  return (
    <aside className={`sidebar glass ${sidebarOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">
          <Sparkles size={18} />
        </div>
        <span>AURA</span>
        <button
          className="icon-btn only-mobile close-side"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.id}
              className={`nav-item ${page === n.id ? "active" : ""}`}
              onClick={() => {
                setPage(n.id);
                setSidebarOpen(false);
                if (setActivePlaylistId) setActivePlaylistId(null);
              }}
            >
              <Icon size={18} />
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="mini-stat">
          <BarChart3 size={16} />
          <span>Aura v1.0</span>
        </div>
      </div>
    </aside>
  );
}
