import React, { useState, useEffect, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Heart, Search,
  Plus, ChevronDown, AlignLeft, Repeat, Shuffle, Disc3,
  ListMusic, Home, Flame, Sparkles, FolderPlus, Check
} from "lucide-react";

// Curated Editorial Initial Catalog
const EDITORIAL_CATALOG = [
  {
    id: "edit-1",
    title: "Khuda Jaane",
    artist: "KK, Shilpa Rao",
    durationStr: "05:32",
    theme: "#e63946",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80",
    audioUrl: "https://aac.saavncdn.com/712/ba0716a5d454659b8be5d45cf5447a11_160.mp4",
    lyrics: "Sajde mein yun hi jhukta hoon\nTum pe hi aa ke rukta hoon\nKya yeh sab ko hota hai...\n\nHumko toh kuch pata nahi tha\nKismat ke rang juda the\nDil ko toh pehle se pata tha..."
  },
  {
    id: "edit-2",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    durationStr: "03:50",
    theme: "#ffcc00",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    audioUrl: "https://ia801503.us.archive.org/15/items/audio-sample-archive/starboy_electronic.mp3",
    lyrics: "I'm tryna put you in the worst mood, ah\nP1 cleaner than your church shoes, ah\nMilli point two just to hurt you, ah\nAll red Lamb' just to tease you, ah..."
  },
  {
    id: "edit-3",
    title: "Falak Tak",
    artist: "Udit Narayan, Mahalakshmi",
    durationStr: "05:56",
    theme: "#9ef01a",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
    audioUrl: "https://aac.saavncdn.com/001/6a0319dbb3b4aaebec56dfa255a2ee21_160.mp4",
    lyrics: "Falak tak chal saath mere\nFalak tak chal saath chal\nYeh baadal ki chaadar pe\nAao soyein hum dono..."
  },
  {
    id: "edit-4",
    title: "Midnight Drive",
    artist: "Synthwave Neo",
    durationStr: "03:12",
    theme: "#00f2fe",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
    lyrics: "Neon reflections on the wet asphalt...\nAnalog memories floating in the wind."
  }
];

const GENRE_TABS = [
  { id: "foryou", label: "For you", count: "219" },
  { id: "bollywood", label: "Bollywood", count: "589" },
  { id: "rock", label: "Rock", count: "240" },
  { id: "hiphop", label: "Hip-hop", count: "312" },
  { id: "kpop", label: "K-Pop", count: "719" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("artists");
  const [selectedGenre, setSelectedGenre] = useState("foryou");
  const [queue, setQueue] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_queue");
      return saved ? JSON.parse(saved) : EDITORIAL_CATALOG;
    } catch { return EDITORIAL_CATALOG; }
  });
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Playlists Storage
  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_playlists");
      return saved ? JSON.parse(saved) : { "Heavy Rotation": ["edit-1", "edit-2"] };
    } catch { return { "Heavy Rotation": ["edit-1", "edit-2"] }; }
  });
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [liked, setLiked] = useState(() => {
    try {
      const s = localStorage.getItem("aura_liked");
      return s ? new Set(JSON.parse(s)) : new Set(["edit-1", "edit-2"]);
    } catch { return new Set(["edit-1"]); }
  });

  const audioRef = useRef(null);
  const isScrubbing = useRef(false);
  const currentTrack = queue[queueIndex] || EDITORIAL_CATALOG[0];

  useEffect(() => {
    localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked)));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem("aura_playlists", JSON.stringify(playlists));
  }, [playlists]);

  useEffect(() => {
    localStorage.setItem("aura_queue", JSON.stringify(queue));
  }, [queue]);

  const searchOnline = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    setSearchResults([]);

    const q = encodeURIComponent(term.trim());
    const endpoints = [
      `https://saavn.dev/api/search/songs?query=${q}&limit=15`,
      `https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${q}&limit=15`
    ];

    let found = [];
    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        const list = data?.data?.results || data?.results || [];

        if (Array.isArray(list) && list.length > 0) {
          found = list.map((item, idx) => {
            const dl = item.downloadUrl?.find(d => d.quality === "160kbps") ||
                       item.downloadUrl?.find(d => d.quality === "320kbps") ||
                       (Array.isArray(item.downloadUrl) ? item.downloadUrl[item.downloadUrl.length - 1] : null);

            const img = item.image?.find(i => i.quality === "500x500") ||
                        (Array.isArray(item.image) ? item.image[item.image.length - 1] : null);

            const stream = dl?.url || dl?.link || (typeof item.downloadUrl === "string" ? item.downloadUrl : "");

            return {
              id: `net-${item.id || idx}-${Date.now()}`,
              title: (item.name || item.title || "Track").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
              artist: item.artists?.primary?.map(a => a.name).join(", ") || item.primaryArtists || "Aura Artist",
              cover: img?.url || img?.link || EDITORIAL_CATALOG[0].cover,
              audioUrl: stream,
              theme: ["#e63946", "#ffcc00", "#9ef01a", "#00f2fe", "#f72585"][idx % 5],
              durationStr: item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : "03:45",
              lyrics: `Track: "${(item.name || item.title || '').replace(/&quot;/g, '"')}"\nArtist: ${item.primaryArtists || 'Artist'}\n\nUncompressed HD audio playing on Aura Engine.`
            };
          }).filter(t => t.audioUrl);

          if (found.length > 0) break;
        }
      } catch (err) {
        console.warn("Retrying mirror...", err);
      }
    }

    if (found.length > 0) {
      setSearchResults(found);
    }
    setLoading(false);
  };

  const playSong = (track, list) => {
    if (!track?.audioUrl) return;
    const activeList = list && list.length > 0 ? list : queue;
    setQueue(activeList);
    const targetIdx = activeList.findIndex(t => t.id === track.id);
    setQueueIndex(targetIdx !== -1 ? targetIdx : 0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const togglePlayPause = (e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    playSong(queue[nextIdx], queue);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    playSong(queue[prevIdx], queue);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isScrubbing.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || !secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
  const currentTheme = currentTrack?.theme || "#ffcc00";

  return (
    <div style={{
      position: "relative",
      height: "100vh",
      width: "100vw",
      background: "#f4f3ef",
      color: "#08090d",
      fontFamily: "'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; font-smooth: antialiased; }
        ::-webkit-scrollbar { display: none; }
        
        @keyframes vinylSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning-vinyl {
          animation: vinylSpin 14s linear infinite;
        }
        .paused-vinyl {
          animation-play-state: paused;
        }
        
        .editorial-title {
          font-size: 38px;
          font-weight: 900;
          letter-spacing: -1.5px;
          line-height: 1;
        }

        input[type="range"] {
          -webkit-appearance: none;
          height: 3px;
          border-radius: 999px;
          background: rgba(0,0,0,0.18);
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #08090d;
          cursor: pointer;
        }
      `}</style>

      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        preload="auto"
      />

      {/* Main Screen Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 120px 16px", background: activeTab === "artists" ? "#fed000" : "#f4f3ef", transition: "background 0.4s ease" }}>
        {/* Top Status & Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
            <span
              onClick={() => setActiveTab("artists")}
              style={{
                fontSize: "36px",
                fontWeight: 900,
                letterSpacing: "-1.5px",
                color: activeTab === "artists" ? "#08090d" : "rgba(8,9,13,0.35)",
                cursor: "pointer"
              }}>
              Artists
            </span>
            <span
              onClick={() => setActiveTab("playlists")}
              style={{
                fontSize: "32px",
                fontWeight: 900,
                letterSpacing: "-1.5px",
                color: activeTab === "playlists" ? "#08090d" : "rgba(8,9,13,0.35)",
                cursor: "pointer"
              }}>
              Playlists
            </span>
          </div>
          <button
            onClick={() => setActiveTab(activeTab === "search" ? "artists" : "search")}
            style={{
              width: "42px", height: "42px", borderRadius: "50%",
              background: "#08090d", color: "#fff", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}>
            <Search size={18} />
          </button>
        </div>

        {/* Search Drawer */}
        {activeTab === "search" && (
          <div style={{ marginBottom: "20px" }}>
            <form onSubmit={(e) => { e.preventDefault(); searchOnline(searchQuery); }} style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="Search any artist, song, Bollywood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, padding: "14px 18px", borderRadius: "14px", border: "2px solid #08090d",
                  fontSize: "15px", fontWeight: 700, outline: "none", background: "#fff"
                }}
              />
              <button
                type="submit"
                style={{ padding: "0 22px", borderRadius: "14px", background: "#08090d", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer" }}>
                {loading ? "..." : "Go"}
              </button>
            </form>
          </div>
        )}

        {/* Hero Artist/Album Cards Row */}
        {activeTab === "artists" && (
          <>
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "16px", marginBottom: "16px" }}>
              {EDITORIAL_CATALOG.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => playSong(item, EDITORIAL_CATALOG)}
                  style={{
                    position: "relative",
                    minWidth: "125px",
                    height: "145px",
                    borderRadius: "18px",
                    overflow: "hidden",
                    cursor: "pointer",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
                    border: currentTrack?.id === item.id ? "3px solid #08090d" : "none"
                  }}>
                  <img src={item.cover} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)" }} />
                  <span style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px", color: "#fff", fontSize: "13px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.artist}
                  </span>
                </div>
              ))}
            </div>

            {/* Micro Filter Pills */}
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "12px", marginBottom: "12px" }}>
              {GENRE_TABS.map((tab) => (
                <span
                  key={tab.id}
                  onClick={() => setSelectedGenre(tab.id)}
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    color: selectedGenre === tab.id ? "#08090d" : "rgba(8,9,13,0.4)"
                  }}>
                  {tab.label}<sup style={{ fontSize: "10px", fontWeight: 900, marginLeft: "2px" }}>{tab.count}</sup>
                </span>
              ))}
            </div>
          </>
        )}

        {/* Playlists Management Tab */}
        {activeTab === "playlists" && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900 }}>Your Custom Playlists</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "6px", background: "#08090d", color: "#fff", padding: "8px 14px", borderRadius: "10px", border: "none", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}>
                <Plus size={14} /> New
              </button>
            </div>

            {showCreateModal && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <input
                  type="text"
                  placeholder="Playlist Name..."
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #08090d", fontWeight: 700 }}
                />
                <button
                  onClick={() => {
                    if (!newPlaylistName.trim()) return;
                    setPlaylists({ ...playlists, [newPlaylistName.trim()]: [currentTrack.id] });
                    setNewPlaylistName("");
                    setShowCreateModal(false);
                  }}
                  style={{ background: "#08090d", color: "#fff", border: "none", padding: "0 14px", borderRadius: "8px", fontWeight: 800 }}>
                  Save
                </button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.keys(playlists).map((pl) => (
                <div
                  key={pl}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "rgba(0,0,0,0.04)", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 900 }}>{pl}</div>
                    <div style={{ fontSize: "12px", opacity: 0.6, fontWeight: 700 }}>{playlists[pl].length} tracks stored</div>
                  </div>
                  <button
                    onClick={() => {
                      const updated = { ...playlists };
                      if (!updated[pl].includes(currentTrack.id)) {
                        updated[pl].push(currentTrack.id);
                        setPlaylists(updated);
                      }
                    }}
                    style={{ background: "transparent", border: "1px solid #08090d", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}>
                    + Add Current
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editorial Track List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {(searchResults.length > 0 ? searchResults : EDITORIAL_CATALOG).map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => playSong(track, searchResults.length > 0 ? searchResults : EDITORIAL_CATALOG)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  background: isCurrent ? "rgba(0,0,0,0.08)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", overflow: "hidden" }}>
                  <img src={track.cover} alt={track.title} style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover" }} />
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontSize: "15px", fontWeight: 900, color: "#08090d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(8,9,13,0.55)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {track.artist}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(8,9,13,0.6)" }}>
                    {track.durationStr || "03:45"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = new Set(liked);
                      if (next.has(track.id)) next.delete(track.id);
                      else next.add(track.id);
                      setLiked(next);
                    }}
                    style={{ background: "none", border: "none", color: liked.has(track.id) ? "#e63946" : "#08090d", cursor: "pointer", padding: "4px" }}>
                    <Heart size={16} fill={liked.has(track.id) ? "#e63946" : "none"} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Monochromatic Mini-Player */}
      <div
        onClick={() => setFullPlayerOpen(true)}
        style={{
          position: "fixed",
          bottom: "16px",
          left: "16px",
          right: "16px",
          height: "64px",
          background: "#08090d",
          color: "#fff",
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          boxShadow: "0 14px 28px rgba(0,0,0,0.25)",
          cursor: "pointer",
          zIndex: 90
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
          {/* Mini Rotating Disc */}
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#1a1a1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <img
              src={currentTrack.cover}
              alt="disc"
              className={`spinning-vinyl ${!isPlaying ? "paused-vinyl" : ""}`}
              style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover" }}
            />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={togglePlayPause} style={{ background: "#fff", color: "#08090d", border: "none", width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {isPlaying ? <Pause size={18} fill="#08090d" /> : <Play size={18} fill="#08090d" style={{ marginLeft: "2px" }} />}
          </button>
        </div>
      </div>

      {/* Full Editorial Monochromatic Vinyl Player Screen */}
      {fullPlayerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: currentTheme,
            color: "#08090d",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "24px",
            transition: "background 0.3s ease"
          }}>
          {/* Header Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setFullPlayerOpen(false)} style={{ background: "none", border: "none", color: "#08090d", cursor: "pointer" }}>
              <ChevronDown size={30} />
            </button>
            <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "2px" }}>Aura Vinyl Master</span>
            <button onClick={() => setShowLyrics(!showLyrics)} style={{ background: "none", border: "none", color: showLyrics ? "#fff" : "#08090d", cursor: "pointer" }}>
              <AlignLeft size={22} />
            </button>
          </div>

          {/* Centerpiece: True Rotating Vinyl Record Player */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {showLyrics ? (
              <div style={{ width: "100%", maxHeight: "320px", background: "rgba(0,0,0,0.06)", borderRadius: "20px", padding: "24px", overflowY: "auto", border: "2px solid #08090d" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 900 }}>Lyrics</h4>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "16px", fontWeight: 800, color: "#08090d" }}>{currentTrack.lyrics || "No lyrics available."}</p>
              </div>
            ) : (
              <div style={{ position: "relative", width: "280px", height: "280px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {/* Vinyl Grooves Body */}
                <div
                  className={`spinning-vinyl ${!isPlaying ? "paused-vinyl" : ""}`}
                  style={{
                    width: "270px",
                    height: "270px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #1a1a1a 0%, #000 70%, #1a1a1a 100%)",
                    boxShadow: "0 24px 50px rgba(0,0,0,0.45)",
                    border: "4px solid #08090d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative"
                  }}>
                  {/* Outer Concentric Vinyl Grooves Lines */}
                  <div style={{ position: "absolute", width: "230px", height: "230px", borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.08)" }} />
                  <div style={{ position: "absolute", width: "180px", height: "180px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.06)" }} />
                  
                  {/* Center Artwork Label */}
                  <div style={{ width: "100px", height: "100px", borderRadius: "50%", overflow: "hidden", border: "4px solid #08090d", position: "relative" }}>
                    <img src={currentTrack.cover} alt="label" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: "50%", left: "50%", width: "14px", height: "14px", background: "#08090d", borderRadius: "50%", transform: "translate(-50%, -50%)", border: "2px solid #fff" }} />
                  </div>
                </div>

                {/* Turntable Stylus Tonearm Needle */}
                <div
                  style={{
                    position: "absolute",
                    top: "-15px",
                    right: "10px",
                    width: "70px",
                    height: "120px",
                    transformOrigin: "top right",
                    transform: isPlaying ? "rotate(18deg)" : "rotate(0deg)",
                    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    pointerEvents: "none"
                  }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#08090d", border: "2px solid #fff" }} />
                  <div style={{ width: "4px", height: "90px", background: "#08090d", marginLeft: "6px", borderRadius: "2px" }} />
                  <div style={{ width: "14px", height: "20px", background: "#08090d", marginLeft: "1px", borderRadius: "2px" }} />
                </div>
              </div>
            )}
          </div>

          {/* Track Details & Typography */}
          <div>
            <div style={{ marginBottom: "18px" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, opacity: 0.7 }}>{currentTrack.artist}</div>
              <div style={{ fontSize: "32px", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.1 }}>{currentTrack.title}</div>
            </div>

            {/* Scrubber */}
            <div style={{ marginBottom: "22px" }}>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onMouseDown={() => { isScrubbing.current = true; }}
                onMouseUp={() => { isScrubbing.current = false; }}
                onTouchStart={() => { isScrubbing.current = true; }}
                onTouchEnd={() => { isScrubbing.current = false; }}
                onChange={handleSeek}
                style={{ width: "100%", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 800, marginTop: "6px" }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px" }}>
              <button style={{ background: "none", border: "none", color: "#08090d", cursor: "pointer" }}>
                <Shuffle size={20} />
              </button>
              <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#08090d", cursor: "pointer" }}>
                <SkipBack size={28} fill="#08090d" />
              </button>
              <button
                onClick={togglePlayPause}
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  background: "#08090d",
                  color: "#fff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.25)"
                }}>
                {isPlaying ? <Pause size={28} fill="#fff" /> : <Play size={28} fill="#fff" style={{ marginLeft: "2px" }} />}
              </button>
              <button onClick={handleNext} style={{ background: "none", border: "none", color: "#08090d", cursor: "pointer" }}>
                <SkipForward size={28} fill="#08090d" />
              </button>
              <button
                onClick={() => {
                  const next = new Set(liked);
                  if (next.has(currentTrack.id)) next.delete(currentTrack.id);
                  else next.add(currentTrack.id);
                  setLiked(next);
                }}
                style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#e63946" : "#08090d", cursor: "pointer" }}>
                <Heart size={22} fill={liked.has(currentTrack.id) ? "#e63946" : "none"} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
