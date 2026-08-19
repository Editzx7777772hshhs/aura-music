import React, { useState } from "react";
import { 
  Sparkles, Home, Compass, Search, ListMusic, Music2, Settings, 
  Play, Pause, SkipBack, SkipForward, Volume2, Heart, Shuffle, Repeat 
} from "lucide-react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: Home },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "search", label: "Search", icon: Search },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "tracks", label: "All Tracks", icon: Music2 },
  { id: "settings", label: "Settings", icon: Settings },
];

const SAMPLE_TRACKS = [
  { id: "1", title: "Midnight City", artist: "M83", duration: "4:03", cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80" },
  { id: "2", title: "Starboy", artist: "The Weeknd", duration: "3:50", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80" },
  { id: "3", title: "Blinding Lights", artist: "The Weeknd", duration: "3:20", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80" },
  { id: "4", title: "Nightcall", artist: "Kavinsky", duration: "4:19", cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=80" },
];

export default function App() {
  const [page, setPage] = useState("home");
  const [currentTrack, setCurrentTrack] = useState(SAMPLE_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleLike = (id) => {
    const next = new Set(liked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLiked(next);
  };

  const filteredTracks = SAMPLE_TRACKS.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app dark" style={{ display: "flex", height: "100vh", background: "#0b0c10", color: "#fff", fontFamily: "sans-serif", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{ width: "240px", background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: "bold", color: "#66fcf1", marginBottom: "30px" }}>
          <Sparkles size={24} />
          <span>AURA MUSIC</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: active ? "rgba(102, 252, 241, 0.15)" : "transparent",
                  color: active ? "#66fcf1" : "#c5c6c7",
                  fontSize: "15px",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: "90px" }}>
        {/* Topbar */}
        <header style={{ padding: "16px 30px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.06)", padding: "8px 16px", borderRadius: "20px", width: "300px" }}>
            <Search size={16} color="#888" />
            <input 
              type="text" 
              placeholder="Search music..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", color: "#fff", outline: "none", width: "100%" }}
            />
          </div>
        </header>

        {/* Dynamic Views */}
        <div style={{ padding: "30px" }}>
          <h2 style={{ fontSize: "24px", marginBottom: "20px", textTransform: "capitalize" }}>{page} Feed</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" }}>
            {filteredTracks.map((track) => (
              <div 
                key={track.id} 
                onClick={() => { setCurrentTrack(track); setIsPlaying(true); }}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  padding: "16px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "0.2s",
                  border: currentTrack?.id === track.id ? "1px solid #66fcf1" : "1px solid transparent"
                }}
              >
                <img src={track.cover} alt={track.title} style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px", marginBottom: "12px" }} />
                <h4 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#fff" }}>{track.title}</h4>
                <p style={{ margin: "0", fontSize: "13px", color: "#888" }}>{track.artist}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Player Bar */}
      <footer style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "80px",
        background: "rgba(15, 15, 20, 0.95)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        zIndex: 100
      }}>
        {/* Track Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "250px" }}>
          <img src={currentTrack.cover} alt="cover" style={{ width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover" }} />
          <div>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#fff" }}>{currentTrack.title}</div>
            <div style={{ fontSize: "12px", color: "#888" }}>{currentTrack.artist}</div>
          </div>
          <button onClick={() => toggleLike(currentTrack.id)} style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#ff4d6d" : "#666", cursor: "pointer" }}>
            <Heart size={18} fill={liked.has(currentTrack.id) ? "#ff4d6d" : "none"} />
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><Shuffle size={16} /></button>
            <button style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><SkipBack size={18} /></button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#66fcf1", color: "#0b0c10", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} fill="#0b0c10" />}
            </button>
            <button style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><SkipForward size={18} /></button>
            <button style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}><Repeat size={16} /></button>
          </div>
        </div>

        {/* Volume */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "250px", justifyContent: "flex-end" }}>
          <Volume2 size={18} color="#888" />
          <input type="range" min="0" max="100" defaultValue="70" style={{ width: "80px", accentColor: "#66fcf1" }} />
        </div>
      </footer>
    </div>
  );
}
