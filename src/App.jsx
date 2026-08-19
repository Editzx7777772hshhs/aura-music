import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Search, ListMusic, Heart, 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Loader2, Plus, Trash2, AlignLeft, ChevronDown, Maximize2
} from "lucide-react";

const STARTER_TRACKS = [
  {
    id: "init-1",
    title: "Khamoshiyan (Unplugged)",
    artist: "Arijit Singh, Jeet Gannguli",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3",
    lyrics: "Khamoshiyan aawaaz hain\nTum sun'ne toh aao kabhi\nChhukar tumhe khil jaayengi\nGhar inko bulaao kabhi\n\nBe-aitbaar hain bada\nYeh dard hai yeh raahat hai\nKhamoshiyan khamoshiyan..."
  },
  {
    id: "init-2",
    title: "Starboy (Night Drive)",
    artist: "The Weeknd ft. Daft Punk",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3",
    lyrics: "I'm tryna put you in the worst mood, ah\nP1 cleaner than your church shoes, ah\nMilli point two just to hurt you, ah\nAll red Lamb' just to tease you, ah..."
  },
  {
    id: "init-3",
    title: "Blinding Lights (Cyber)",
    artist: "The Weeknd",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=synthwave-80s-110045.mp3",
    lyrics: "Yeah\nI've been tryin' to call\nI've been on my own for long enough\nMaybe you can show me how to love, maybe..."
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
      return saved ? JSON.parse(saved) : [{ id: "pl-1", name: "Night Mix", tracks: STARTER_TRACKS }];
    } catch { return [{ id: "pl-1", name: "Night Mix", tracks: STARTER_TRACKS }]; }
  });

  const [newPlaylistName, setNewPlaylistName] = useState("");

  // Smooth Time States
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const isScrubbing = useRef(false);
  const currentTrack = queue[queueIndex] || STARTER_TRACKS[0];

  useEffect(() => {
    localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked)));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem("aura_playlists", JSON.stringify(playlists));
  }, [playlists]);

  // High-Speed Search
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
            id: `song-${item.trackId || idx}-${Date.now()}`,
            title: item.trackName,
            artist: item.artistName,
            album: item.collectionName || "Aura Studio",
            cover: item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "600x600bb") : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
            audioUrl: item.previewUrl,
            lyrics: `[Live Stream] ${item.trackName}\nArtist: ${item.artistName}\n\n[Verse]\nEnjoying the track on AURA Lossless Stream.\nFeel the ambient beats.`
          }));

        if (formatted.length > 0) {
          setTracks(formatted);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Play Track Smoothly
  const playTrack = (track, list = tracks) => {
    const listIndex = list.findIndex(t => t.id === track.id);
    setQueue(list);
    setQueueIndex(listIndex !== -1 ? listIndex : 0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  };

  const togglePlayPause = (e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    const nextSong = queue[nextIdx];
    setQueueIndex(nextIdx);
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
    const prevSong = queue[prevIdx];
    setQueueIndex(prevIdx);
    if (audioRef.current) {
      audioRef.current.src = prevSong.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // Glitch-Free Time Tracker
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

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = (e) => {
    if (e) e.stopPropagation();
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.9;
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
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#050608", color: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden", position: "relative" }}>
      
      {/* Dynamic Ambient Background Glow */}
      <div style={{
        position: "absolute",
        top: "-10%",
        right: "5%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(0, 242, 254, 0.12) 0%, transparent 70%)",
        filter: "blur(80px)",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Global Audio Node */}
      <audio 
        ref={audioRef} 
        src={currentTrack?.audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        preload="auto"
      />

      {/* Sidebar */}
      <aside style={{ width: "240px", background: "rgba(10, 14, 23, 0.8)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "24px 16px", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: 900, color: "#00f2fe", marginBottom: "30px", paddingLeft: "6px" }}>
          <Sparkles size={22} style={{ filter: "drop-shadow(0 0 8px #00f2fe)" }} />
          <span>AURA MUSIC</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {[
            { id: "search", label: "Search & Stream", icon: Search },
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
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: active ? "1px solid rgba(0, 242, 254, 0.3)" : "1px solid transparent",
                  background: active ? "rgba(0, 242, 254, 0.12)" : "transparent",
                  color: active ? "#00f2fe" : "#94a3b8",
                  fontSize: "14px",
                  fontWeight: active ? 700 : 500,
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

        {/* Create Playlist Box */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", fontWeight: 700 }}>NEW PLAYLIST</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <input 
              type="text" 
              placeholder="Name..." 
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              style={{ flex: 1, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", padding: "6px 8px", fontSize: "12px", outline: "none" }}
            />
            <button 
              onClick={() => {
                if (!newPlaylistName.trim()) return;
                setPlaylists([...playlists, { id: "pl-" + Date.now(), name: newPlaylistName.trim(), tracks: [currentTrack] }]);
                setNewPlaylistName("");
              }} 
              style={{ background: "#00f2fe", border: "none", borderRadius: "6px", color: "#050608", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: "110px", zIndex: 1 }}>
        {/* Top Search */}
        <header style={{ padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center" }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); searchOnline(searchQuery); }}
            style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "8px 18px", borderRadius: "24px", width: "100%", maxWidth: "440px", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Search size={16} color="#00f2fe" />
            <input 
              type="text" 
              placeholder="Search tracks, singers (Khamoshiyan, Arijit)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", color: "#fff", outline: "none", width: "100%", fontSize: "14px" }}
            />
            {loading ? <Loader2 size={16} className="animate-spin" color="#00f2fe" /> : (
              <button type="submit" style={{ background: "#00f2fe", border: "none", color: "#050608", padding: "5px 14px", borderRadius: "16px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                Search
              </button>
            )}
          </form>
        </header>

        {/* Tracks Grid */}
        <div style={{ padding: "24px 28px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "18px" }}>
            {page === "liked" ? "Liked Tracks" : page === "playlists" ? "Custom Playlists" : "Tracks Feed"}
          </h2>

          {page === "playlists" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
              {playlists.map((pl) => (
                <div key={pl.id} style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "16px", color: "#00f2fe" }}>{pl.name}</span>
                    <button onClick={() => setPlaylists(playlists.filter(p => p.id !== pl.id))} style={{ background: "none", border: "none", color: "#ff4d6d", cursor: "pointer" }}><Trash2 size={15} /></button>
                  </div>
                  <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 12px 0" }}>{pl.tracks.length} Tracks</p>
                  <button onClick={() => playTrack(pl.tracks[0], pl.tracks)} style={{ width: "100%", background: "#00f2fe", border: "none", padding: "8px", borderRadius: "8px", color: "#050608", fontWeight: 700, cursor: "pointer" }}>
                    Play Playlist
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "18px" }}>
              {(page === "liked" ? queue.filter(t => liked.has(t.id)) : tracks).map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div 
                    key={track.id} 
                    onClick={() => playTrack(track, tracks)}
                    style={{
                      background: isCurrent ? "rgba(0, 242, 254, 0.08)" : "rgba(255,255,255,0.03)",
                      padding: "12px",
                      borderRadius: "14px",
                      cursor: "pointer",
                      border: isCurrent ? "1px solid #00f2fe" : "1px solid rgba(255,255,255,0.05)",
                      transition: "0.2s transform"
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", paddingTop: "100%", marginBottom: "10px" }}>
                      <img 
                        src={track.cover} 
                        alt={track.title} 
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} 
                      />
                      {isCurrent && isPlaying && (
                        <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "#00f2fe", borderRadius: "50%", padding: "6px", display: "flex" }}>
                          <Play size={15} fill="#050608" color="#050608" />
                        </div>
                      )}
                    </div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</h4>
                    <p style={{ margin: "0", fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</p>
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
          height: "86px",
          background: "rgba(10, 14, 23, 0.9)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 100
        }}
      >
        {/* Track Thumbnail Info (Tap opens Full View) */}
        <div 
          onClick={() => setFullPlayerOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "12px", width: "260px", cursor: "pointer" }}
        >
          <img src={currentTrack.cover} alt="cover" style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover" }} />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
            <div style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</div>
          </div>
          <Maximize2 size={15} color="#00f2fe" style={{ flexShrink: 0 }} />
        </div>

        {/* Center Controls */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "42%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><SkipBack size={18} /></button>
            <button 
              onClick={togglePlayPause}
              style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#00f2fe", color: "#050608", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {isPlaying ? <Pause size={18} fill="#050608" /> : <Play size={18} fill="#050608" />}
            </button>
            <button onClick={handleNext} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><SkipForward size={18} /></button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#64748b", width: "32px", textAlign: "right" }}>{formatTime(currentTime)}</span>
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
              style={{ flex: 1, accentColor: "#00f2fe", cursor: "pointer" }} 
            />
            <span style={{ fontSize: "11px", color: "#64748b", width: "32px" }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Volume / Like */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "220px", justifyContent: "flex-end" }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const next = new Set(liked);
              if (next.has(currentTrack.id)) next.delete(currentTrack.id);
              else next.add(currentTrack.id);
              setLiked(next);
            }} 
            style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#ff4d6d" : "#64748b", cursor: "pointer" }}
          >
            <Heart size={18} fill={liked.has(currentTrack.id) ? "#ff4d6d" : "none"} />
          </button>
          <button onClick={toggleMute} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
            {isMuted ? <VolumeX size={18} color="#ff4d6d" /> : <Volume2 size={18} />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume} 
            onChange={handleVolumeChange}
            style={{ width: "70px", accentColor: "#00f2fe", cursor: "pointer" }} 
          />
        </div>
      </footer>

      {/* Spotify Fullscreen Now Playing View */}
      {fullPlayerOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle at 50% 30%, rgba(0, 242, 254, 0.15) 0%, #050608 85%)",
          backdropFilter: "blur(30px)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          boxSizing: "border-box"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <button onClick={() => setFullPlayerOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <ChevronDown size={28} />
            </button>
            <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", color: "#00f2fe", textTransform: "uppercase" }}>Playing Lossless Stream</span>
            <button 
              onClick={() => setShowLyricsTab(!showLyricsTab)} 
              style={{ background: showLyricsTab ? "#00f2fe" : "rgba(255,255,255,0.08)", color: showLyricsTab ? "#050608" : "#fff", border: "none", padding: "6px 14px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
            >
              <AlignLeft size={15} />
              <span>Lyrics</span>
            </button>
          </div>

          {/* Center Art or Lyrics View */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0" }}>
            {showLyricsTab ? (
              <div style={{ width: "100%", maxWidth: "440px", height: "320px", background: "rgba(10, 14, 23, 0.8)", borderRadius: "20px", padding: "24px", overflowY: "auto", border: "1px solid rgba(0, 242, 254, 0.2)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#00f2fe", fontSize: "13px", textTransform: "uppercase" }}>Aura Lyrics</h4>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "15px", color: "#e2e8f0", margin: 0 }}>{currentTrack.lyrics}</p>
              </div>
            ) : (
              <div style={{ position: "relative", width: "100%", maxWidth: "300px", aspectRatio: "1/1" }}>
                <img 
                  src={currentTrack.cover} 
                  alt="Big Cover" 
                  style={{ width: "100%", height: "100%", borderRadius: "20px", objectFit: "cover", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 16px 36px rgba(0,0,0,0.8)" }} 
                />
              </div>
            )}
          </div>

          {/* Track Info */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "420px", width: "100%", margin: "0 auto 16px auto" }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", fontWeight: 800, color: "#fff" }}>{currentTrack.title}</h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>{currentTrack.artist}</p>
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
              <Heart size={26} fill={liked.has(currentTrack.id) ? "#ff4d6d" : "none"} />
            </button>
          </div>

          {/* Scrubber */}
          <div style={{ maxWidth: "420px", width: "100%", margin: "0 auto 20px auto" }}>
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
              style={{ width: "100%", accentColor: "#00f2fe", cursor: "pointer", height: "6px" }} 
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Big Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "36px", marginBottom: "24px" }}>
            <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><SkipBack size={28} /></button>
            <button 
              onClick={togglePlayPause}
              style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#00f2fe", color: "#050608", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {isPlaying ? <Pause size={28} fill="#050608" /> : <Play size={28} fill="#050608" />}
            </button>
            <button onClick={handleNext} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><SkipForward size={28} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
