import React from "react";
import { NAV, MOBILE_NAV } from "../../lib/constants";

export default function MobileNav({ page, setPage, setActivePlaylistId }) {
  return (
    <nav className="mobile-nav glass">
      {MOBILE_NAV.map((id) => {
        const n = NAV.find((x) => x.id === id);
        return (
          <button
            key={id}
            className={`mnav-item ${page === id ? "active" : ""}`}
            onClick={() => {
              setPage(id);
              setActivePlaylistId(null);
            }}
          >
            <n.icon size={20} />
            <span>{n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
