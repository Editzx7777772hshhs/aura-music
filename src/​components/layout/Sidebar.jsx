import React from "react";
import { Sparkles, X, BarChart3 } from "lucide-react";
import { NAV } from "@/lib/constants";

export default function Sidebar({ page, setPage, sidebarOpen, setSidebarOpen, setActivePlaylistId, plays }) {
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
        {NAV.map((n) => (
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
          <BarChart3 size={14} />
          <span>{plays || 0} plays tracked</span>
        </div>
      </div>
    </aside>
  );
}
