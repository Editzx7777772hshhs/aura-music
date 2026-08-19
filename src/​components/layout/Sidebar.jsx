import React from "react";
import { Sparkles, X, BarChart3 } from "lucide-react";
import { NAV } from "../../lib/constants.js";

export default function Sidebar({ page, setPage, sidebarOpen, setSidebarOpen, activePlaylistId, setActivePlaylistId }) {
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
        {NAV && NAV.map((n) => (
          <button
            key={n.id}
            className={`nav-item ${page === n.id ? "active" : ""}`}
            onClick={() => {
              setPage(n.id);
              setSidebarOpen(false);
              if (setActivePlaylistId) setActivePlaylistId(null);
            }}
          >
            <n.icon size={18} />
            <span>{n.label}</span>
          </button>
        ))}
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
