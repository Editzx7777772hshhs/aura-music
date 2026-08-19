import React from "react";
import { Search, Bell, User } from "lucide-react";

export default function Topbar() {
  return (
    <header className="topbar glass">
      <div className="search-box">
        <Search size={18} />
        <input type="text" placeholder="Search songs, albums, artists..." />
      </div>
      <div className="user-actions">
        <button className="icon-btn"><Bell size={18} /></button>
        <button className="icon-btn"><User size={18} /></button>
      </div>
    </header>
  );
}
