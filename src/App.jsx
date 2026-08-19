import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Home, Search, ListMusic, Heart, 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Loader2, Plus, Trash2, AlignLeft, ChevronDown, Maximize2, Disc
} from "lucide-react";

const INITIAL_CATALOG = [
  {
    id: "yt_1",
    videoId: "fHI8X4OXluQ",
    title: "Khamoshiyan (Unplugged)",
    artist: "Arijit Singh, Jeet Gannguli",
    album: "Khamoshiyan OST",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80",
    lyrics: [
      "Khamoshiyan aawaaz hain",
      "Tum sun'ne toh aao kabhi",
      "Chhukar tumhe khil jaayengi",
      "Ghar inko bulaao kabhi",
      "Be-aitbaar hain bada",
      "Yeh dard hai yeh raahat hai",
      "Khamoshiyan khamoshiyan..."
    ]
  },
  {
    id: "yt_2",
    videoId: "kJQP7kiw5Fk",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    album: "Starboy",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    lyrics: [
      "I'm tryna put you in the worst mood, ah",
      "P1 cleaner than your church shoes, ah",
      "Milli point two just to hurt you, ah",
      "All red Lamb' just to tease you, ah",
      "None of these toys on lease too, ah",
      "Made your whole year in a week too, yah"
    ]
  },
  {
    id: "yt_3",
    videoId: "OPf0YbXqDm0",
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
    lyrics: [
      "Yeah",
      "I've been tryin' to call",
      "I've been on my own for long enough",
      "Maybe you can show me how to love, maybe",
      "I'm going through withdrawals",
      "You don't even have to do too much"
    ]
  }
];

export default function App() {
  const [page, setPage] = useState("search");
  const [tracks, setTracks] = useState(INITIAL_CATALOG);
  const [queue, setQueue] = useState(INITIAL_CATALOG);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fullscreen & Lyrics States
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
      return saved ? JSON.parse(saved) : [{ id: "pl-1", name: "Night Drive Beats", tracks: INITIAL_CATALOG }];
    } catch { return [{ id: "pl-1", name: "Night Drive Beats", tracks: INITIAL_CATALOG }]; }
  });

  const [newPlaylistName, setNewPlaylistName] = useState("");

  // Audio Engine State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(210);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);

  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const currentTrack = queue[queueIndex] || INITIAL_CATALOG[0];

  useEffect(() => {
    localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked)));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem("aura_playlists", JSON.stringify(playlists));
  }, [playlists]);

  // Load YouTube Audio API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript.parentNode.insertBefore(tag, firstScript);
      window.onYouTubeIframeAPIReady = () => initYouTube(currentTrack.videoId);
    } else {
      initYouTube(currentTrack.videoId);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initYouTube = (videoId) => {
    if (window.YT && window.YT.Player) {
      playerRef.current = new window.YT.Player("yt-audio-core", {
        height: "1",
        width: "1",
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1
        },
        events: {
          onReady: (e) => e.target.setVolume(volume),
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startTimer();
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopTimer();
            } else if (e.data === window.YT.PlayerState.ENDED) {
              handleNext();
            }
          }
        }
      });
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
        setDuration(playerRef.current.getDuration() || 210);
      }
    }, 500);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Online Search
  const searchOnline = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=25`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const mapped = data.results.map((item, idx) => ({
          id: String(item.trackId),
          videoId: "fHI8X4OXluQ", // mapped for demonstration audio stream
          title: item.trackName,
          artist: item.artistName,
          album: item.collectionName,
          cover: item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "800x800bb") : INITIAL_CATALOG[0].cover,
          lyrics: [
            `Streaming "${item.trackName}"`,
            `Artist: ${item.artistName}`,
            "",
            "Experience high-fidelity lossless sound",
            "Vibing with Aura Neon Glow Engine",
            "Lost in the soundscapes & bass"
          ]
        }));
        setTracks(mapped);
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

    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(track.videoId);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (!playerRef.current || !playerRef.current.playVideo) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleNext = () => {
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    const nextSong = queue[nextIdx];
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(nextSong.videoId);
      playerRef.current.playVideo();
    }
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    const prevSong = queue[prevIdx];
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(prevSong.videoId);
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true);
    }
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(val);
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 80);
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#050608", color: "#f8fafc", fontFamily: "'Inter', -apple-system, sans-serif", overflow: "hidden", position: "relative" }}>
      
      {/* Dynamic Background Ambient Aura Glow */}
      <div style={{
        position: "absolute",
        top: "-15%",
        right: "10%",
        width: "550px",
        height: "550px",
        background: "radial-gradient(circle, rgba(0, 242, 254, 0.18) 0%, rgba(121, 40, 202, 0.08) 60%, transparent 80%)",
        filter: "blur(90px)",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 0,
        animation: isPlaying ? "pulse 4s infinite alternate" : "none"
      }} />

      {/* Hidden YouTube Engine */}
      <div style={{ position: "absolute", top: "-9999px" }}>
        <div id="yt-audio-core" />
      </div>

      {/* Sidebar with Glass Glow */}
      <aside style={{ width: "260px", background: "rgba(10, 14, 23, 0.65)", backdropFilter: "blur(30px)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "28px 18px", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "21px", fontWeight: 900, color: "#00f2fe", marginBottom: "36px", paddingLeft: "8px", letterSpacing: "1.5px" }}>
          <Sparkles size={24} style={{ filter: "drop-shadow(0 0 12px #00f2fe)" }} />
          <span>AURA STUDIO</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          {[
            { id: "search", label: "Explore Music", icon: Search },
            { id: "playlists", label: "My Collections", icon: ListMusic },
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

        {/* Create Playlist Box */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px", fontWeight: 700, letterSpacing: "1px" }}>CUSTOM PLAYLIST</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <input 
              type="text" 
              placeholder="Playlist name..." 
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
              style={{ background: "#00f2fe", border: "none", borderRadius: "8px", color: "#050608", padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", boxShadow: "0 0 10px rgba(0, 242, 254, 0.4)" }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Stream Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: "115px", position: "relative", zIndex: 1 }}>
        {/* Top Searchbar */}
        <header style={{ padding: "20px 36px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); searchOnline(searchQuery); }}
            style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.04)", padding: "10px 20px", borderRadius: "30px", width: "100%", maxWidth: "480px", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
          >
            <Search size={17} color="#00f2fe" />
            <input 
              type="text" 
              placeholder="Search artists, tracks, vibez (Arijit Singh, Weeknd)..." 
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

        {/* Content Layout */}
        <div style={{ padding: "28px 36px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "22px", letterSpacing: "0.5px" }}>
            {page === "liked" ? "Liked Tracks" : page === "playlists" ? "Custom Collections" : "Aesthetic Feed"}
          </h2>

          {page === "playlists" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
              {playlists.map((pl) => (
                <div key={pl.id} style={{ background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(15px)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontWeight: 800, fontSize: "17px", color: "#00f2fe" }}>{pl.name}</span>
                    <button onClick={() => setPlaylists(playlists.filter(p => p.id !== pl.id))} style={{ background: "none", border: "none", color: "#ff4d6d", cursor: "pointer" }}><Trash2 size={16} /></button>
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 14px 0" }}>{pl.tracks.length} Tracks in queue</p>
                  <button onClick={() => playSong(pl.tracks[0], pl.tracks)} style={{ width: "100%", background: "linear-gradient(135deg, #00f2fe, #4facfe)", border: "none", padding: "10px", borderRadius: "10px", color: "#050608", fontWeight: 800, cursor: "pointer", boxShadow: "0 0 14px rgba(0,242,254,0.3)" }}>
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
                    onClick={() => playSong(track, tracks)}
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

      {/* Aesthetic Frosted Glass Bottom Player */}
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
        {/* Track Thumbnail Info (Click to open Spotify View) */}
        <div 
          onClick={() => setFullPlayerOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "16px", width: "290px", cursor: "pointer" }}
        >
          <div style={{ position: "relative" }}>
            <img src={currentTrack.cover} alt="cover" style={{ width: "56px", height: "56px", borderRadius: "12px", objectFit: "cover", boxShadow: "0 4px 18px rgba(0, 242, 254, 0.3)" }} />
          </div>
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
            max="100" 
            value={isMuted ? 0 : volume} 
            onChange={handleVolumeChange}
            style={{ width: "80px", accentColor: "#00f2fe", cursor: "pointer" }} 
          />
        </div>
      </footer>

      {/* Ultra-Aesthetic Spotify Fullscreen Player */}
      {fullPlayerOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at 50% 30%, rgba(0, 242, 254, 0.15) 0%, #050608 85%)",
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
            <span style={{ fontSize: "12.5px", fontWeight: 700, letterSpacing: "2px", color: "#00f2fe", textTransform: "uppercase" }}>Playing From Aura Stream</span>
            <button 
              onClick={() => setShowLyricsTab(!showLyricsTab)} 
              style={{ background: showLyricsTab ? "#00f2fe" : "rgba(255,255,255,0.08)", color: showLyricsTab ? "#050608" : "#fff", border: "none", padding: "8px 16px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 700, boxShadow: showLyricsTab ? "0 0 16px #00f2fe" : "none" }}
            >
              <AlignLeft size={16} />
              <span>Lyrics</span>
            </button>
          </div>

          {/* Center Art or Synchronized Glow Lyrics */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
            {showLyricsTab ? (
              <div style={{ width: "100%", maxWidth: "480px", height: "360px", background: "rgba(10, 14, 23, 0.7)", borderRadius: "24px", padding: "28px", overflowY: "auto", border: "1px solid rgba(0, 242, 254, 0.2)", backdropFilter: "blur(20px)", boxShadow: "0 0 30px rgba(0, 242, 254, 0.15)" }}>
                <h4 style={{ margin: "0 0 16px 0", color: "#00f2fe", letterSpacing: "1px", textTransform: "uppercase", fontSize: "14px" }}>Synchronized Aura Lyrics</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {currentTrack.lyrics?.map((line, idx) => (
                    <p key={idx} style={{ margin: 0, fontSize: "17px", fontWeight: idx === 1 ? 800 : 500, color: idx === 1 ? "#00f2fe" : "#94a3b8", textShadow: idx === 1 ? "0 0 12px rgba(0, 242, 254, 0.8)" : "none", transition: "0.3s" }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ position: "relative", width: "100%", maxWidth: "330px", aspectRatio: "1/1" }}>
                <div style={{ position: "absolute", inset: -10, background: "radial-gradient(circle, rgba(0, 242, 254, 0.4), transparent 70%)", filter: "blur(25px)", borderRadius: "24px" }} />
                <img 
                  src={currentTrack.cover} 
                  alt="Big Cover" 
                  style={{ position: "relative", width: "100%", height: "100%", borderRadius: "24px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 40px rgba(0,0,0,0.8)" }} 
                />
              </div>
            )}
          </div>

          {/* Track Info & Like Button */}
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

          {/* Progress Seekbar */}
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

          {/* Player Big Controls */}
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
