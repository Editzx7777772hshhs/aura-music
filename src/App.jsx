import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Home, Compass, Search, ListMusic, Heart, 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Loader2, Plus, Trash2, AlignLeft, ChevronDown, Maximize2
} from "lucide-react";

const STARTER_TRACKS = [
  {
    id: "s-1",
    title: "Khamoshiyan",
    artist: "Arijit Singh, Jeet Gannguli",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3",
    lyrics: "Khamoshiyan aawaaz hain\nTum sun'ne toh aao kabhi\nChhukar tumhe khil jaayengi\nGhar inko bulaao kabhi\n\nBe-aitbaar hain bada\nYeh dard hai yeh raahat hai\nKhamoshiyan khamoshiyan..."
  },
  {
    id: "s-2",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3",
    lyrics: "I'm tryna put you in the worst mood, ah\nP1 cleaner than your church shoes, ah\nMilli point two just to hurt you, ah\nAll red Lamb' just to tease you, ah..."
  },
  {
    id: "s-3",
    title: "Blinding Lights",
    artist: "The Weeknd",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80",
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
  const [searchQuery, setSearchQuery] = useState("Khamoshiyan");
  
  // Spotify Style Fullscreen Player Modal State
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
      return saved ? JSON.parse(saved) : [{ id: "pl-1", name: "Favorites", tracks: STARTER_TRACKS }];
    } catch { return [{ id: "pl-1", name: "Favorites", tracks: STARTER_TRACKS }]; }
  });

  const [newPlaylistName, setNewPlaylistName] = useState("");

  // Audio Engine State
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const currentTrack = queue[queueIndex] || STARTER_TRACKS[0];

  useEffect(() => {
    localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked)));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem("aura_playlists", JSON.stringify(playlists));
  }, [playlists]);

  // Online Search API (Apple Music / iTunes Engine)
  const searchOnline = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=25`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const mapped = data.results
          .filter(item => item.previewUrl)
          .map(item => ({
            id: String(item.trackId),
            title: item.trackName,
            artist: item.artistName,
            album: item.collectionName,
            cover: item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "600x600bb") : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
            audioUrl: item.previewUrl,
            lyrics: `Lyrics for "${item.trackName}" by ${item.artistName}\n\n[Chorus]\nEnjoying the track on AURA Music!\nHigh Definition Audio Stream\n\n[Verse]\nFeel the rhythm and vibe with pure beats.`
          }));
        setTracks(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Play track and expand
  const playTrack = (track, list = tracks) => {
    const listIndex = list.findIndex(t => t.id === track.id);
    setQueue(list);
    setQueueIndex(listIndex !== -1 ? listIndex : 0);
    
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.log("Play error:", err));
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
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
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
    <div style={{ display: "flex", height: "100vh", background: "#090a0f", color: "#f0f2f5", fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden" }}>
      
      {/* HTML5 Audio Node */}
      <audio 
        ref={audioRef} 
        src={currentTrack?.audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
      />

      {/* Sidebar */}
      <aside style={{ width: "240px", background: "rgba(15, 17, 24, 0.85)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: 800, color: "#00f2fe", marginBottom: "32px", paddingLeft: "8px" }}>
          <Sparkles size={22} style={{ filter: "drop-shadow(0 0 8px #00f2fe)" }} />
          <span>AURA MUSIC</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {[
            { id: "search", label: "Search Music", icon: Search },
            { id: "playlists", label: "My Playlists", icon: ListMusic },
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
                  border: "none",
                  background: active ? "linear-gradient(135deg, rgba(0,242,254,0.15), rgba(79,172,254,0.05))" : "transparent",
                  color: active ? "#00f2fe" : "#8b949e",
                  fontSize: "14px",
                  fontWeight: active ? 600 : 500,
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

        {/* Quick Playlist Box */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "11px", color: "#8b949e", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase" }}>New Playlist</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <input 
              type="text" 
              placeholder="Name..." 
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "12px", outline: "none" }}
            />
            <button 
              onClick={() => {
                if (!newPlaylistName.trim()) return;
                setPlaylists([...playlists, { id: "pl-" + Date.now(), name: newPlaylistName.trim(), tracks: [currentTrack] }]);
                setNewPlaylistName("");
              }} 
              style={{ background: "#00f2fe", border: "none", borderRadius: "6px", color: "#000", padding: "6px 10px", cursor: "pointer" }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Feed */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: "110px" }}>
        {/* Top Search */}
        <header style={{ padding: "18px 30px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); searchOnline(searchQuery); }}
            style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: "30px", width: "100%", maxWidth: "450px", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Search size={16} color="#8b949e" />
            <input 
              type="text" 
              placeholder="Search artists, songs (e.g. Khamoshiyan, Arijit)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", color: "#fff", outline: "none", width: "100%", fontSize: "14px" }}
            />
            {loading ? <Loader2 size={16} className="animate-spin" color="#00f2fe" /> : (
              <button type="submit" style={{ background: "#00f2fe", border: "none", color: "#090a0f", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                Search
              </button>
            )}
          </form>
        </header>

        {/* View Layout */}
        <div style={{ padding: "24px 30px" }}>
          <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
            {page === "liked" ? "Liked Songs" : page === "playlists" ? "Your Playlists" : "Search Results"}
          </h2>

          {page === "playlists" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
              {playlists.map((pl) => (
                <div key={pl.id} style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: "bold", fontSize: "16px", color: "#00f2fe" }}>{pl.name}</span>
                    <button onClick={() => setPlaylists(playlists.filter(p => p.id !== pl.id))} style={{ background: "none", border: "none", color: "#ff4d6d", cursor: "pointer" }}><Trash2 size={16} /></button>
                  </div>
                  <p style={{ color: "#8b949e", fontSize: "13px", margin: "0 0 12px 0" }}>{pl.tracks.length} Songs</p>
                  <button onClick={() => playTrack(pl.tracks[0], pl.tracks)} style={{ width: "100%", background: "#00f2fe", border: "none", padding: "8px", borderRadius: "8px", color: "#000", fontWeight: "bold", cursor: "pointer" }}>
                    Play Playlist
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
              {(page === "liked" ? queue.filter(t => liked.has(t.id)) : tracks).map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div 
                    key={track.id} 
                    onClick={() => playTrack(track, tracks)}
                    style={{
                      background: isCurrent ? "rgba(0, 242, 254, 0.08)" : "rgba(255,255,255,0.03)",
                      padding: "14px",
                      borderRadius: "14px",
                      cursor: "pointer",
                      border: isCurrent ? "1px solid #00f2fe" : "1px solid rgba(255,255,255,0.05)",
                      transition: "0.2s"
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", paddingTop: "100%", marginBottom: "12px" }}>
                      <img 
                        src={track.cover} 
                        alt={track.title} 
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }} 
                      />
                      {isCurrent && isPlaying && (
                        <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "#00f2fe", borderRadius: "50%", padding: "6px", display: "flex", boxShadow: "0 0 12px #00f2fe" }}>
                          <Play size={16} fill="#000" color="#000" />
                        </div>
                      )}
                    </div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</h4>
                    <p style={{ margin: "0", fontSize: "12px", color: "#8b949e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Spotify-Style Mini Player (Clickable to Expand) */}
      <footer 
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "88px",
          background: "rgba(12, 14, 20, 0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 100
        }}
      >
        {/* Track Thumbnail Info (Tap opens Spotify Player) */}
        <div 
          onClick={() => setFullPlayerOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "14px", width: "280px", cursor: "pointer" }}
        >
          <img src={currentTrack.cover} alt="cover" style={{ width: "52px", height: "52px", borderRadius: "8px", objectFit: "cover" }} />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
            <div style={{ fontSize: "12px", color: "#8b949e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</div>
          </div>
          <Maximize2 size={16} color="#8b949e" style={{ marginLeft: "4px" }} />
        </div>

        {/* Center Controls */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "45%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#c5c6c7", cursor: "pointer" }}><SkipBack size={18} /></button>
            <button 
              onClick={togglePlayPause}
              style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#00f2fe", color: "#090a0f", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {isPlaying ? <Pause size={18} fill="#090a0f" /> : <Play size={18} fill="#090a0f" />}
            </button>
            <button onClick={handleNext} style={{ background: "none", border: "none", color: "#c5c6c7", cursor: "pointer" }}><SkipForward size={18} /></button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#8b949e", width: "35px", textAlign: "right" }}>{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              style={{ flex: 1, accentColor: "#00f2fe", cursor: "pointer" }} 
            />
            <span style={{ fontSize: "11px", color: "#8b949e", width: "35px" }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Volume / Like */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "240px", justifyContent: "flex-end" }}>
          <button 
            onClick={() => {
              const next = new Set(liked);
              if (next.has(currentTrack.id)) next.delete(currentTrack.id);
              else next.add(currentTrack.id);
              setLiked(next);
            }} 
            style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#ff4d6d" : "#8b949e", cursor: "pointer" }}
          >
            <Heart size={18} fill={liked.has(currentTrack.id) ? "#ff4d6d" : "none"} />
          </button>
          <button onClick={toggleMute} style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer" }}>
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
          background: "linear-gradient(180deg, #1b202e 0%, #090a0f 100%)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          boxSizing: "border-box",
          animation: "slideUp 0.3s ease"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <button 
              onClick={() => setFullPlayerOpen(false)}
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <ChevronDown size={28} />
            </button>
            <span style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "1px", color: "#8b949e", textTransform: "uppercase" }}>Playing From Aura</span>
            <button 
              onClick={() => setShowLyricsTab(!showLyricsTab)} 
              style={{ background: showLyricsTab ? "#00f2fe" : "rgba(255,255,255,0.1)", color: showLyricsTab ? "#000" : "#fff", border: "none", padding: "6px 12px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px" }}
            >
              <AlignLeft size={14} />
              <span>Lyrics</span>
            </button>
          </div>

          {/* Center Art or Lyrics View */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
            {showLyricsTab ? (
              <div style={{ width: "100%", maxWidth: "450px", height: "340px", background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "20px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#00f2fe" }}>Live Lyrics</h4>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "15px", color: "#e2e8f0" }}>{currentTrack.lyrics}</p>
              </div>
            ) : (
              <img 
                src={currentTrack.cover} 
                alt="Big Cover" 
                style={{ width: "100%", maxWidth: "340px", aspectRatio: "1/1", borderRadius: "16px", objectFit: "cover", boxShadow: "0 12px 30px rgba(0, 242, 254, 0.2)" }} 
              />
            )}
          </div>

          {/* Track Details & Heart */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", maxWidth: "450px", width: "100%", margin: "0 auto 20px auto" }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "22px", color: "#fff" }}>{currentTrack.title}</h2>
              <p style={{ margin: 0, fontSize: "15px", color: "#8b949e" }}>{currentTrack.artist}</p>
            </div>
            <button 
              onClick={() => {
                const next = new Set(liked);
                if (next.has(currentTrack.id)) next.delete(currentTrack.id);
                else next.add(currentTrack.id);
                setLiked(next);
              }} 
              style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#ff4d6d" : "#8b949e", cursor: "pointer" }}
            >
              <Heart size={26} fill={liked.has(currentTrack.id) ? "#ff4d6d" : "none"} />
            </button>
          </div>

          {/* Full Scrubber */}
          <div style={{ maxWidth: "450px", width: "100%", margin: "0 auto 24px auto" }}>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              style={{ width: "100%", accentColor: "#00f2fe", cursor: "pointer", height: "6px" }} 
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8b949e", marginTop: "6px" }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Full Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "36px", marginBottom: "30px" }}>
            <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><SkipBack size={28} /></button>
            <button 
              onClick={togglePlayPause}
              style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#00f2fe", color: "#090a0f", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 0 20px rgba(0, 242, 254, 0.4)" }}
            >
              {isPlaying ? <Pause size={28} fill="#090a0f" /> : <Play size={28} fill="#090a0f" />}
            </button>
            <button onClick={handleNext} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><SkipForward size={28} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
