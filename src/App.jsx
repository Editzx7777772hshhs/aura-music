import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, Search, Compass, Heart,
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Loader2, Plus, Trash2, AlignLeft, ChevronDown, Maximize2, Music2, Home, Library, Radio, MoreVertical
} from "lucide-react";

// Curated Spotify-Style Catalog
const FEATURED_SECTIONS = {
  quickMixes: [
    { id: "qm-1", title: "Liked Songs", artist: "Auto Playlist", cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80", audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3", isLikedCard: true },
    { id: "qm-2", title: "Midnight Drive", artist: "The Weeknd, Daft Punk", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80", audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3" },
    { id: "qm-3", title: "Arijit Singh Radio", artist: "Arijit Singh, Pritam", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80", audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=synthwave-80s-110045.mp3" },
    { id: "qm-4", title: "Lo-Fi Beats 2026", artist: "Chillhop Music", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80", audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3" },
    { id: "qm-5", title: "Bollywood Romance", artist: "Jeet Gannguli, Shreya", cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80", audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=synthwave-80s-110045.mp3" },
    { id: "qm-6", title: "Synthwave Vibes", artist: "RetroWave Masters", cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&q=80", audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3" }
  ],
  trendingAlbums: [
    { id: "ta-1", title: "Khamoshiyan (Deluxe)", artist: "Arijit Singh • Jeet Gannguli", cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80", audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3" },
    { id: "ta-2", title: "After Hours (Cyber)", artist: "The Weeknd", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80", audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=synthwave-80s-110045.mp3" },
    { id: "ta-3", title: "Haunted 3D OST", artist: "Chirantan Bhatt", cover: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&q=80", audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3" },
    { id: "ta-4", title: "Promaan", artist: "Bishrut Saikia", cover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&q=80", audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3" }
  ]
};

export default function App() {
  const [navTab, setNavTab] = useState("home"); // 'home' | 'search' | 'library'
  const [filterChip, setFilterChip] = useState("all"); // 'all' | 'music' | 'podcasts'
  const [tracks, setTracks] = useState(FEATURESECTION_FALLBACK());
  const [queue, setQueue] = useState(FEATURESECTION_FALLBACK());
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const [liked, setLiked] = useState(() => {
    try {
      const s = localStorage.getItem("aura_liked");
      return s ? new Set(JSON.parse(s)) : new Set(["qm-1", "ta-1"]);
    } catch { return new Set(); }
  });

  const [playlists, setPlaylists] = useState(() => {
    try {
      const s = localStorage.getItem("aura_playlists");
      return s ? JSON.parse(s) : [{ id: "p1", name: "Heavy Rotation", tracks: FEATURE_SECTIONS.quickMixes }];
    } catch { return [{ id: "p1", name: "Heavy Rotation", tracks: FEATURE_SECTIONS.quickMixes }]; }
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const isScrubbing = useRef(false);
  const currentTrack = queue[queueIndex] || FEATURE_SECTIONS.quickMixes[0];

  useEffect(() => { localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked))); }, [liked]);
  useEffect(() => { localStorage.setItem("aura_playlists", JSON.stringify(playlists)); }, [playlists]);

  function FEATURESECTION_FALLBACK() {
    return [...FEATURE_SECTIONS.quickMixes, ...FEATURE_SECTIONS.trendingAlbums];
  }

  const searchOnline = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=25`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const formatted = data.results
          .filter(item => item.previewUrl)
          .map((item, idx) => ({
            id: `search-${item.trackId || idx}`,
            title: item.trackName,
            artist: item.artistName,
            cover: item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "600x600bb") : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
            audioUrl: item.previewUrl,
            lyrics: `Now Playing "${item.trackName}"\nArtist: ${item.artistName}\n\n[Chorus]\nHigh-Fidelity Audio Stream\nPowered by Aura Sound Engine.`
          }));
        setTracks(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playSong = (track, list = tracks) => {
    const listIndex = list.findIndex(t => t.id === track.id);
    setQueue(list);
    setQueueIndex(listIndex !== -1 ? listIndex : 0);

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
    const nextSong = queue[nextIdx];
    if (audioRef.current) {
      audioRef.current.src = nextSong.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    const prevSong = queue[prevIdx];
    if (audioRef.current) {
      audioRef.current.src = prevSong.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isScrubbing.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && duration !== audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
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

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: "100vw",
      background: "#08090d",
      color: "#f1f3f5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      overflow: "hidden",
      position: "relative"
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.1); opacity: 0.4; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes eqWave {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }

        .eq-bar-anim { animation: eqWave 0.8s ease-in-out infinite; }
        .quick-mix-card { transition: transform 0.15s ease, background 0.15s ease; }
        .quick-mix-card:active { transform: scale(0.97); background: rgba(255,255,255,0.12) !important; }
        .song-row:active { background: rgba(255,255,255,0.08); }
        
        input[type="range"] {
          -webkit-appearance: none;
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.18);
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #00f2fe;
          cursor: pointer;
        }
      `}</style>

      {/* Global Audio Element */}
      <audio 
        ref={audioRef}
        src={currentTrack?.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        preload="auto"
      />

      {/* Top Spotify-Style Header & Filter Chips */}
      <header style={{ padding: "16px 16px 12px 16px", zIndex: 10, background: "linear-gradient(180deg, rgba(18,20,29,0.95) 0%, transparent 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #00f2fe, #7928ca)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", color: "#08090d" }}>
              A
            </div>
            <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px" }}>Aura</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ padding: "6px 12px", background: "rgba(0,242,254,0.12)", border: "1px solid rgba(0,242,254,0.3)", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "#00f2fe", display: "flex", alignItems: "center", gap: "4px" }}>
              <Sparkles size={12} /> PRO
            </div>
          </div>
        </div>

        {/* Categories / Filter Chips */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto" }} className="hide-scroll">
          {[
            { id: "all", label: "All" },
            { id: "music", label: "Music" },
            { id: "podcasts", label: "Podcasts" },
            { id: "ambient", label: "Chill Vibes" }
          ].map(chip => (
            <button
              key={chip.id}
              onClick={() => setFilterChip(chip.id)}
              style={{
                padding: "7px 16px",
                borderRadius: "20px",
                border: "none",
                background: filterChip === chip.id ? "#00f2fe" : "rgba(255,255,255,0.08)",
                color: filterChip === chip.id ? "#08090d" : "#f1f3f5",
                fontSize: "13px",
                fontWeight: filterChip === chip.id ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Scrollable View */}
      <main className="hide-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: "140px" }}>
        
        {/* ================= VIEW: HOME FEED ================= */}
        {navTab === "home" && (
          <div style={{ padding: "0 16px" }}>
            {/* 2x3 Quick Mix Grid (Spotify Signature Feature) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", margin: "14px 0 24px 0" }}>
              {FEATURE_SECTIONS.quickMixes.map(item => (
                <div
                  key={item.id}
                  className="quick-mix-card"
                  onClick={() => playSong(item, FEATURE_SECTIONS.quickMixes)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    cursor: "pointer",
                    border: currentTrack?.id === item.id ? "1px solid #00f2fe" : "1px solid rgba(255,255,255,0.04)"
                  }}
                >
                  {item.isLikedCard ? (
                    <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #450af5, #c4efd9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Heart size={20} fill="#fff" color="#fff" />
                    </div>
                  ) : (
                    <img src={item.cover} alt={item.title} style={{ width: "48px", height: "48px", objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: "12.5px", fontWeight: 700, padding: "0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Horizontal Carousel: Albums Featuring Songs You Like */}
            <div style={{ marginBottom: "26px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 12px 0", letterSpacing: "-0.3px" }}>Albums featuring songs you like</h3>
              <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "6px" }} className="hide-scroll">
                {FEATURE_SECTIONS.trendingAlbums.map(album => (
                  <div 
                    key={album.id}
                    onClick={() => playSong(album, FEATURE_SECTIONS.trendingAlbums)}
                    style={{ width: "135px", flexShrink: 0, cursor: "pointer" }}
                  >
                    <img src={album.cover} alt={album.title} style={{ width: "135px", height: "135px", borderRadius: "8px", objectFit: "cover", marginBottom: "8px", boxShadow: "0 6px 14px rgba(0,0,0,0.4)" }} />
                    <div style={{ fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{album.title}</div>
                    <div style={{ fontSize: "11.5px", color: "#8b949e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{album.artist}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vertical Feed: Start Listening */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Jump into a session</div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 12px 0" }}>Start listening</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {tracks.map(track => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={track.id}
                      className="song-row"
                      onClick={() => playSong(track, tracks)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        background: isCurrent ? "rgba(0,242,254,0.08)" : "transparent",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                        <img src={track.cover} alt={track.title} style={{ width: "44px", height: "44px", borderRadius: "6px", objectFit: "cover" }} />
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: isCurrent ? "#00f2fe" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
                          <div style={{ fontSize: "12px", color: "#8b949e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {isCurrent && isPlaying && (
                          <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "14px" }}>
                            <div className="eq-bar-anim" style={{ width: "3px", background: "#00f2fe", borderRadius: "1px", animationDelay: "0s" }} />
                            <div className="eq-bar-anim" style={{ width: "3px", background: "#00f2fe", borderRadius: "1px", animationDelay: "0.2s" }} />
                            <div className="eq-bar-anim" style={{ width: "3px", background: "#00f2fe", borderRadius: "1px", animationDelay: "0.4s" }} />
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = new Set(liked);
                            if (next.has(track.id)) next.delete(track.id);
                            else next.add(track.id);
                            setLiked(next);
                          }}
                          style={{ background: "none", border: "none", color: liked.has(track.id) ? "#00f2fe" : "#8b949e", cursor: "pointer", padding: "4px" }}
                        >
                          <Heart size={18} fill={liked.has(track.id) ? "#00f2fe" : "none"} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW: SEARCH ================= */}
        {navTab === "search" && (
          <div style={{ padding: "0 16px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "10px 0 16px 0" }}>Search</h2>
            
            {/* Search Pill Input */}
            <form 
              onSubmit={(e) => { e.preventDefault(); searchOnline(searchQuery); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", padding: "10px 14px", borderRadius: "8px", marginBottom: "20px" }}
            >
              <Search size={18} color="#08090d" />
              <input 
                type="text" 
                placeholder="What do you want to listen to?" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", color: "#08090d", fontSize: "14px", fontWeight: 600, background: "transparent" }}
              />
              {loading && <Loader2 size={16} className="animate-spin" color="#08090d" />}
            </form>

            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Search Results</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tracks.map(track => (
                <div 
                  key={track.id}
                  onClick={() => playSong(track, tracks)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", cursor: "pointer" }}
                >
                  <img src={track.cover} alt={track.title} style={{ width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover" }} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
                    <div style={{ fontSize: "12px", color: "#8b949e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</div>
                  </div>
                  <Play size={16} fill="#00f2fe" color="#00f2fe" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= VIEW: LIBRARY ================= */}
        {navTab === "library" && (
          <div style={{ padding: "0 16px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "10px 0 16px 0" }}>Your Library</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Liked Songs Playlist */}
              <div 
                onClick={() => {
                  const likedList = tracks.filter(t => liked.has(t.id));
                  if (likedList.length > 0) playSong(likedList[0], likedList);
                }}
                style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}
              >
                <div style={{ width: "56px", height: "56px", borderRadius: "6px", background: "linear-gradient(135deg, #450af5, #c4efd9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Heart size={24} fill="#fff" color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700 }}>Liked Songs</div>
                  <div style={{ fontSize: "12px", color: "#8b949e" }}>Playlist • {liked.size} songs</div>
                </div>
              </div>

              {playlists.map(pl => (
                <div key={pl.id} onClick={() => playSong(pl.tracks[0], pl.tracks)} style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "6px", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Music2 size={24} color="#00f2fe" />
                  </div>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 700 }}>{pl.name}</div>
                    <div style={{ fontSize: "12px", color: "#8b949e" }}>Playlist • Aura Mix</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Spotify Signature Floating Mini-Player Pill */}
      <div 
        onClick={() => setFullPlayerOpen(true)}
        style={{
          position: "fixed",
          bottom: "64px",
          left: "8px",
          right: "8px",
          height: "56px",
          background: "rgba(18, 22, 34, 0.95)",
          backdropFilter: "blur(25px)",
          borderRadius: "8px",
          border: "1px solid rgba(0, 242, 254, 0.2)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          zIndex: 90,
          cursor: "pointer"
        }}
      >
        {/* Progress Line */}
        <div style={{ position: "absolute", bottom: 0, left: 0, height: "2px", width: `${progressPct}%`, background: "#00f2fe", borderRadius: "2px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
          <img src={currentTrack.cover} alt="cover" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
            <div style={{ fontSize: "11px", color: "#8b949e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const next = new Set(liked);
              if (next.has(currentTrack.id)) next.delete(currentTrack.id);
              else next.add(currentTrack.id);
              setLiked(next);
            }}
            style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#00f2fe" : "#8b949e", cursor: "pointer" }}
          >
            <Heart size={18} fill={liked.has(currentTrack.id) ? "#00f2fe" : "none"} />
          </button>
          <button 
            onClick={togglePlayPause}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px" }}
          >
            {isPlaying ? <Pause size={22} fill="#fff" /> : <Play size={22} fill="#fff" />}
          </button>
        </div>
      </div>

      {/* Spotify Mobile Bottom Navigation Bar */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60px",
        background: "linear-gradient(180deg, rgba(8,9,13,0.85) 0%, #08090d 100%)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 100
      }}>
        {[
          { id: "home", label: "Home", icon: Home },
          { id: "search", label: "Search", icon: Search },
          { id: "library", label: "Your Library", icon: Library }
        ].map(tab => {
          const Icon = tab.icon;
          const active = navTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setNavTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                color: active ? "#00f2fe" : "#8b949e",
                cursor: "pointer",
                fontSize: "10px",
                fontWeight: active ? 700 : 500
              }}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Fullscreen Spotify Experience Modal */}
      {fullPlayerOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(180deg, #182334 0%, #08090d 100%)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          animation: "slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <button onClick={() => setFullPlayerOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <ChevronDown size={28} />
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", color: "#8b949e", textTransform: "uppercase" }}>Playing from playlist</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>Aura Heavy Mix</div>
            </div>
            <button onClick={() => setShowLyrics(!showLyrics)} style={{ background: "none", border: "none", color: showLyrics ? "#00f2fe" : "#8b949e", cursor: "pointer" }}>
              <AlignLeft size={20} />
            </button>
          </div>

          {/* Big Center Cover or Live Lyrics */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0" }}>
            {showLyrics ? (
              <div style={{ width: "100%", height: "300px", background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "20px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#00f2fe" }}>Live Lyrics</h4>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "16px", color: "#e4e4e9" }}>{currentTrack.lyrics || "No synced lyrics available."}</p>
              </div>
            ) : (
              <img 
                src={currentTrack.cover} 
                alt="Big Cover" 
                style={{ width: "100%", maxWidth: "320px", aspectRatio: "1/1", borderRadius: "12px", objectFit: "cover", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }} 
              />
            )}
          </div>

          {/* Track Info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ overflow: "hidden" }}>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#8b949e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</p>
            </div>
            <button 
              onClick={() => {
                const next = new Set(liked);
                if (next.has(currentTrack.id)) next.delete(currentTrack.id);
                else next.add(currentTrack.id);
                setLiked(next);
              }}
              style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#00f2fe" : "#8b949e", cursor: "pointer" }}
            >
              <Heart size={26} fill={liked.has(currentTrack.id) ? "#00f2fe" : "none"} />
            </button>
          </div>

          {/* Seekbar */}
          <div style={{ marginBottom: "20px" }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8b949e", marginTop: "6px" }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Big Spotify Media Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", marginBottom: "24px" }}>
            <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <SkipBack size={30} fill="#fff" />
            </button>
            <button 
              onClick={togglePlayPause}
              style={{ width: "68px", height: "68px", borderRadius: "50%", background: "#fff", color: "#08090d", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 0 20px rgba(0,242,254,0.3)" }}
            >
              {isPlaying ? <Pause size={28} fill="#08090d" /> : <Play size={28} fill="#08090d" style={{ marginLeft: "2px" }} />}
            </button>
            <button onClick={handleNext} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <SkipForward size={30} fill="#fff" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
