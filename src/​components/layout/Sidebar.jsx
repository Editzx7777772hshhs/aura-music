import {
  Sparkles,
  X,
  BarChart3,
  Home,
  Compass,
  Search,
  ListMusic,
  Music2,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "search", label: "Search", icon: Search },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "tracks", label: "All Tracks", icon: Music2 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  page,
  setPage,
  sidebarOpen,
  setSidebarOpen,
  setActivePlaylistId,
}) {
  const handleNavigation = (id) => {
    setPage(id);
    setSidebarOpen(false);

    if (setActivePlaylistId) {
      setActivePlaylistId(null);
    }
  };

  return (
    <aside className={`sidebar glass ${sidebarOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">
          <Sparkles size={18} />
        </div>

        <span>AURA</span>

        <button
          type="button"
          className="icon-btn only-mobile close-side"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            className={`nav-item ${page === id ? "active" : ""}`}
            onClick={() => handleNavigation(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
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
