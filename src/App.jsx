import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Search, ListMusic, Heart, 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Loader2, Plus, Trash2, AlignLeft, ChevronDown, Maximize2
} from "lucide-react";

const STARTER_TRACKS = [
  {
    id: "saavn-1",
    title: "Khamoshiyan",
    artist: "Arijit Singh, Jeet Gannguli",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80",
    audioUrl: "https://aac.saavncdn.com/264/3d02cf65e7164cfcae9cba35fce5a3f2_160.mp4",
    lyrics: "Khamoshiyan aawaaz hain\nTum sun'ne toh aao kabhi\nChhukar tumhe khil jaayengi\nGhar inko bulaao kabhi\n\nBe-aitbaar hain bada\nYeh dard hai yeh raahat hai\nKhamoshiyan khamoshiyan..."
  },
  {
    id: "saavn-2",
    title: "Kesariya",
    artist: "Arijit Singh, Pritam",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
    audioUrl: "https://aac.saavncdn.com/191/9f7e5b10b0d367468165b4c489cf3046_160.mp4",
    lyrics: "Kesariya tera ishq hai piya\nRang jaaun jo main haath lagaaun\nDin beete saara teri fikr mein\nRain saari teri khair manaun..."
  },
  {
    id: "saavn-3",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3",
    lyrics: "I'm tryna put you in the worst mood, ah\nP1 cleaner than your church shoes, ah\nMilli point two just to hurt you, ah\nAll red Lamb' just to tease you, ah..."
  }
];

export default function App() {
  const [page, setPage] = useState("search");
  const [tracks, setTracks] = useState(STARTER_TRACKS);
  const [queue, setQueue] = useState(STARTER_TRACKS);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Full Player & Lyrics Modal States
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [showLyricsTab, setShowLyricsTab] = useState(false);

  // Storage
  const [liked, setLiked] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_liked");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_playlists");
      return saved ? JSON.parse(saved) : [{ id: "pl-1", name: "Night Drive Hits", tracks: STARTER_TRACKS }];
    } catch { return [{ id: "pl-1", name: "Night Drive Hits", tracks: STARTER_TRACKS }]; }
  });

  const [newPlaylistName, setNewPlaylistName] = useState("");

  // Audio Engine State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const currentTrack = queue[queueIndex] || STARTER_TRACKS[0];

  useEffect(() => {
    localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked)));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem("aura_playlists", JSON.stringify(playlists));
  }, [playlists]);

  // Full Song Search Engine (JioSaavn Open Stream API)
  const searchOnline = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(term)}&limit=25`);
      const data = await res.json();
      
      if (data?.data?.results && data.data.results.length > 0) {
        const formatted = data.data.results.map(item => {
          // Get Highest Quality Stream Link (320kbps / 160kbps)
          const downloadUrlObj = item.downloadUrl?.find(d => d.quality === "320kbps") || 
                                 item.downloadUrl?.find(d => d.quality === "160kbps") || 
                                 item.downloadUrl?.[item.downloadUrl.length - 1];

          // Get Highest Quality Cover Art
          const imageObj = item.image?.find(img => img.quality === "500x500") || 
                           item.image?.[item.image.length - 1];

          return {
            id: String(item.id),
            title: item.name ? item.name.replace(/&quot;/g, '"').replace(/&#039;/g, "'") : "Unknown Track",
            artist: item.artists?.primary?.map(a => a.name).join(", ") || "Various Artists",
            cover: imageObj?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
            audioUrl: downloadUrlObj?.url || "",
            lyrics: item.hasLyrics ? `Full lyrics available for ${item.name}` : `Enjoy full track stream for "${item.name}"\n\nExperience Lossless Audio Stream\nPowered by Aura Sound Engine.`
          };
        }).filter(item => item.audioUrl);

        if (formatted.length > 0) {
          setTracks(formatted);
        }
      } else {
        // Fallback search
        const fallbackRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=20`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.results) {
          setTracks(fallbackData.results.filter(t => t.previewUrl).map(t => ({
            id: String(t.trackId),
            title: t.trackName,
            artist: t.artistName,
            cover: t.artworkUrl100?.replace("100x100bb", "600x600bb"),
            audioUrl: t.previewUrl,
            lyrics: `Lyrics for ${t.trackName}\nEnjoy the preview track.`
          })));
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Play Full Track
  const playTrack = (track, list = tracks) => {
    const listIndex = list.findIndex(t => t.id === track.id);
    setQueue(list);
    setQueueIndex(listIndex !== -1 ? listIndex : 0);

    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.log("Playback error:", err));
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => console.log(e));
    }
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    const nextSong = queue[nextIdx];
    setQueueIndex(nextIdx);
    if (audioRef.current) {
      audioRef.current.src = nextSong.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log(e));
    }
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    const prevSong = queue[prevIdx];
    setQueueIndex(prevIdx);
    if (audioRef.current) {
      audioRef.current.src = prevSong.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log(e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.85;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || !secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#050608", color: "#f8fafc", fontFamily: "'Inter', -apple-system, sans-serif", overflow: "hidden", position: "relative" }}>
      
      {/* Background Ambient Glow */}
      <div style={{
        position: "absolute",
        top: "-20%",
        right: "5%",
        width: "550px",
        height: "550px",
        background: "radial-gradient(circle, rgba(0, 242, 254, 0.16) 0%, rgba(121, 40, 202, 0.08) 60%, transparent 80%)",
        filter: "blur(100px)",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Global HTML5 Audio Engine for Full Playback */}
      <audio 
        ref={audioRef} 
        src={currentTrack?.audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
      />

      {/* Sidebar */}
      <aside style={{ width: "250px", background: "rgba(10, 14, 23, 0.7)", backdropFilter: "blur(30px)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "28px 18px", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "21px", fontWeight: 900, color: "#00f2fe", marginBottom: "34px", paddingLeft: "8px" }}>
          <Sparkles size={24} style={{ filter: "drop-shadow(0 0 10px #00f2fe)" }} />
          <span>AURA MUSIC</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          {[
            { id: "search", label: "Search Full Songs", icon: Search },
            { id: "playlists", label: "Custom Playlists", icon: ListMusic },
            { id: "liked", label: "Liked Songs", icon: Heart },
          ].map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "13px 16px",
                  borderRadius: "14px",
                  border: active ? "1px solid rgba(0, 242, 254, 0.3)" : "1px solid transparent",
                  background: active ? "linear-gradient(135deg, rgba(0,242,254,0.18), rgba(79,172,254,0.04))" : "transparent",
                  color: active ? "#00f2fe" : "#94a3b8",
                  fontSize: "14.5px",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow: active ? "0 0 20px rgba(0,242,254,0.15)" : "none",
                  transition: "all 0.25s ease"
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Create Playlist Widget */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px", fontWeight: 700 }}>NEW PLAYLIST</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <input 
              type="text" 
              placeholder="Name..." 
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff", padding: "8px", fontSize: "12px", outline: "none" }}
            />
            <button 
              onClick={() => {
                if (!newPlaylistName.trim()) return;
                setPlaylists([...playlists, { id: "pl-" + Date.now(), name: newPlaylistName.trim(), tracks: [currentTrack] }]);
                setNewPlaylistName("");
              }} 
              style={{ background: "#00f2fe", border: "none", borderRadius: "8px", color: "#050608", padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: "115px", position: "relative", zIndex: 1 }}>
        {/* Search Header */}
        <header style={{ padding: "20px 36px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); searchOnline(searchQuery); }}
            style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.04)", padding: "10px 20px", borderRadius: "30px", width: "100%", maxWidth: "480px", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
          >
            <Search size={17} color="#00f2fe" />
            <input 
              type="text" 
              placeholder="Search full tracks (Khamoshiyan, Arijit, Weekend)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", color: "#fff", outline: "none", width: "100%", fontSize: "14.5px" }}
            />
            {loading ? <Loader2 size={18} className="animate-spin" color="#00f2fe" /> : (
              <button type="submit" style={{ background: "linear-gradient(135deg, #00f2fe, #4facfe)", border: "none", color: "#050608", padding: "6px 16px", borderRadius: "20px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 12px rgba(0,242,254,0.4)" }}>
                Stream
              </button>
            )}
          </form>
        </header>

        {/* Main Grid View */}
        <div style={{ padding: "28px 36px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "22px" }}>
            {page === "liked" ? "Liked Tracks" : page === "playlists" ? "Custom Playlists" : "Full Track Catalog"}
          </h2>

          {page === "playlists" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
              {playlists.map((pl) => (
                <div key={pl.id} style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(15px)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontWeight: 800, fontSize: "17px", color: "#00f2fe" }}>{pl.name}</span>
                    <button onClick={() => setPlaylists(playlists.filter(p => p.id !== pl.id))} style={{ background: "none", border: "none", color: "#ff4d6d", cursor: "pointer" }}><Trash2 size={16} /></button>
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 14px 0" }}>{pl.tracks.length} Tracks</p>
                  <button onClick={() => playTrack(pl.tracks[0], pl.tracks)} style={{ width: "100%", background: "linear-gradient(135deg, #00f2fe, #4facfe)", border: "none", padding: "10px", borderRadius: "10px", color: "#050608", fontWeight: 800, cursor: "pointer" }}>
                    Play Album
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: "24px" }}>
              {(page === "liked" ? queue.filter(t => liked.has(t.id)) : tracks).map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div 
                    key={track.id} 
                    onClick={() => playTrack(track, tracks)}
                    style={{
                      background: isCurrent ? "linear-gradient(180deg, rgba(0, 242, 254, 0.12), rgba(255,255,255,0.02))" : "rgba(255,255,255,0.03)",
                      padding: "16px",
                      borderRadius: "18px",
                      cursor: "pointer",
                      border: isCurrent ? "1px solid #00f2fe" : "1px solid rgba(255,255,255,0.06)",
                      backdropFilter: "blur(15px)",
                      boxShadow: isCurrent ? "0 0 25px rgba(0, 242, 254, 0.25)" : "0 8px 20px rgba(0,0,0,0.3)",
                      transition: "all 0.3s ease"
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", paddingTop: "100%", marginBottom: "14px" }}>
                      <img 
                        src={track.cover} 
                        alt={track.title} 
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" }} 
                      />
                      {isCurrent && isPlaying && (
                        <div style={{ position: "absolute", bottom: "10px", right: "10px", background: "#00f2fe", borderRadius: "50%", padding: "8px", display: "flex", boxShadow: "0 0 16px #00f2fe" }}>
                          <Play size={18} fill="#050608" color="#050608" />
                        </div>
                      )}
                    </div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</h4>
                    <p style={{ margin: "0", fontSize: "12.5px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Frosted Glass Bottom Player Bar */}
      <footer 
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "92px",
          background: "rgba(10, 14, 23, 0.75)",
          backdropFilter: "blur(30px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          zIndex: 100
        }}
      >
        {/* Track Thumbnail Info (Tap to Expand) */}
        <div 
          onClick={() => setFullPlayerOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "16px", width: "290px", cursor: "pointer" }}
        >
          <img src={currentTrack.cover} alt="cover" style={{ width: "56px", height: "56px", borderRadius: "12px", objectFit: "cover", boxShadow: "0 4px 18px rgba(0, 242, 254, 0.3)" }} />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
            <div style={{ fontSize: "12.5px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</div>
          </div>
          <Maximize2 size={16} color="#00f2fe" style={{ marginLeft: "4px" }} />
        </div>

        {/* Center Controls */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "45%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><SkipBack size={20} /></button>
            <button 
              onClick={togglePlayPause}
              style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #00f2fe, #4facfe)", color: "#050608", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 0 20px rgba(0, 242, 254, 0.5)" }}
            >
              {isPlaying ? <Pause size={20} fill="#050608" /> : <Play size={20} fill="#050608" />}
            </button>
            <button onClick={handleNext} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><SkipForward size={20} /></button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#64748b", width: "36px", textAlign: "right" }}>{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              style={{ flex: 1, accentColor: "#00f2fe", cursor: "pointer" }} 
            />
            <span style={{ fontSize: "11px", color: "#64748b", width: "36px" }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Volume / Like */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "240px", justifyContent: "flex-end" }}>
          <button 
            onClick={() => {
              const next = new Set(liked);
              if (next.has(currentTrack.id)) next.delete(currentTrack.id);
              else next.add(currentTrack.id);
              setLiked(next);
            }} 
            style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#ff4d6d" : "#64748b", cursor: "pointer" }}
          >
            <Heart size={20} fill={liked.has(currentTrack.id) ? "#ff4d6d" : "none"} />
          </button>
          <button onClick={toggleMute} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
            {isMuted ? <VolumeX size={20} color="#ff4d6d" /> : <Volume2 size={20} />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume} 
            onChange={handleVolumeChange}
            style={{ width: "80px", accentColor: "#00f2fe", cursor: "pointer" }} 
          />
        </div>
      </footer>

      {/* Spotify Fullscreen Now Playing View */}
      {fullPlayerOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at 50% 30%, rgba(0, 242, 254, 0.18) 0%, #050608 85%)",
          backdropFilter: "blur(40px)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          padding: "32px 28px",
          boxSizing: "border-box"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <button onClick={() => setFullPlayerOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <ChevronDown size={30} />
            </button>
            <span style={{ fontSize: "12.5px", fontWeight: 700, letterSpacing: "2px", color: "#00f2fe", textTransform: "uppercase" }}>Playing Lossless Stream</span>
            <button 
              onClick={() => setShowLyricsTab(!showLyricsTab)} 
              style={{ background: showLyricsTab ? "#00f2fe" : "rgba(255,255,255,0.08)", color: showLyricsTab ? "#050608" : "#fff", border: "none", padding: "8px 16px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}
            >
              <AlignLeft size={16} />
              <span>Lyrics</span>
            </button>
          </div>

          {/* Center Art or Lyrics View */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
            {showLyricsTab ? (
              <div style={{ width: "100%", maxWidth: "480px", height: "360px", background: "rgba(10, 14, 23, 0.7)", borderRadius: "24px", padding: "28px", overflowY: "auto", border: "1px solid rgba(0, 242, 254, 0.2)", backdropFilter: "blur(20px)" }}>
                <h4 style={{ margin: "0 0 16px 0", color: "#00f2fe", letterSpacing: "1px", textTransform: "uppercase", fontSize: "14px" }}>Aura Lyrics View</h4>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "16px", color: "#e2e8f0" }}>{currentTrack.lyrics}</p>
              </div>
            ) : (
              <div style={{ position: "relative", width: "100%", maxWidth: "330px", aspectRatio: "1/1" }}>
                <div style={{ position: "absolute", inset: -12, background: "radial-gradient(circle, rgba(0, 242, 254, 0.45), transparent 70%)", filter: "blur(30px)", borderRadius: "24px" }} />
                <img 
                  src={currentTrack.cover} 
                  alt="Big Cover" 
                  style={{ position: "relative", width: "100%", height: "100%", borderRadius: "24px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.8)" }} 
                />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "450px", width: "100%", margin: "0 auto 20px auto" }}>
            <div>
              <h2 style={{ margin: "0 0 6px 0", fontSize: "24px", fontWeight: 800, color: "#fff" }}>{currentTrack.title}</h2>
              <p style={{ margin: 0, fontSize: "16px", color: "#94a3b8" }}>{currentTrack.artist}</p>
            </div>
            <button 
              onClick={() => {
                const next = new Set(liked);
                if (next.has(currentTrack.id)) next.delete(currentTrack.id);
                else next.add(currentTrack.id);
                setLiked(next);
              }} 
              style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#ff4d6d" : "#94a3b8", cursor: "pointer" }}
            >
              <Heart size={28} fill={liked.has(currentTrack.id) ? "#ff4d6d" : "none"} />
            </button>
          </div>

          {/* Scrubber (Full 3-5 mins) */}
          <div style={{ maxWidth: "450px", width: "100%", margin: "0 auto 26px auto" }}>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              style={{ width: "100%", accentColor: "#00f2fe", cursor: "pointer", height: "6px" }} 
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Big Center Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "40px", marginBottom: "36px" }}>
            <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><SkipBack size={32} /></button>
            <button 
              onClick={togglePlayPause}
              style={{ width: "70px", height: "70px", borderRadius: "50%", background: "linear-gradient(135deg, #00f2fe, #4facfe)", color: "#050608", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 0 28px rgba(0, 242, 254, 0.6)" }}
            >
              {isPlaying ? <Pause size={32} fill="#050608" /> : <Play size={32} fill="#050608" />}
            </button>
            <button onClick={handleNext} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><SkipForward size={32} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
