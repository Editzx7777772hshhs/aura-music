import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Home, Compass, Search, ListMusic, Music2, 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, 
  Loader2, Plus, Trash2, AlignLeft, ListOrdered
} from "lucide-react";

// Fallback catalog & starter queue
const STARTER_QUEUE = [
  {
    id: "yt-1",
    videoId: "fHI8X4OXluQ",
    title: "Blinding Lights",
    artist: "The Weeknd",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
    lyrics: "I've been on my own for long enough\nMaybe you can show me how to love, maybe\nI'm going through withdrawals\nYou don't even have to do too much\nYou can turn me on with just a touch, baby\n\nI look around and Sin City's cold and empty\nNo one's around to judge me\nI can't see clearly when you're gone..."
  },
  {
    id: "yt-2",
    videoId: "kJQP7kiw5Fk",
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80",
    lyrics: "Ay\nFonsi, D.Y.\nOh, oh no, oh no (ey)\nHey, yeah, dídimo'\n\nSí, sabes que ya llevo un rato mirándote\nTengo que bailar contigo hoy (DY)..."
  },
  {
    id: "yt-3",
    videoId: "OPf0YbXqDm0",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80",
    lyrics: "This hit, that ice cold\nMichelle Pfeiffer, that white gold\nThis one for them hood girls\nThem good girls straight masterpieces\nStylin', whilen, livin' it up in the city..."
  }
];

export default function App() {
  const [page, setPage] = useState("home");
  const [queue, setQueue] = useState(STARTER_QUEUE);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  
  // Storage states
  const [liked, setLiked] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_liked");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_playlists");
      return saved ? JSON.parse(saved) : [{ id: "p1", name: "Favorites Mix", tracks: STARTER_QUEUE }];
    } catch { return [{ id: "p1", name: "Favorites Mix", tracks: STARTER_QUEUE }]; }
  });

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // Player progress & Volume
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const playerRef = useRef(null);
  const timerRef = useRef(null);

  const currentTrack = queue[queueIndex] || STARTER_QUEUE[0];

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked)));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem("aura_playlists", JSON.stringify(playlists));
  }, [playlists]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer(currentTrack.videoId);
      };
    } else {
      initPlayer(currentTrack.videoId);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initPlayer = (videoId) => {
    if (window.YT && window.YT.Player) {
      playerRef.current = new window.YT.Player("yt-audio-engine", {
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
          onReady: (e) => {
            e.target.setVolume(volume);
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startProgressTimer();
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopProgressTimer();
            } else if (e.data === window.YT.PlayerState.ENDED) {
              handleNext(); // Smart Auto-Play Queue trigger
            }
          }
        }
      });
    }
  };

  const startProgressTimer = () => {
    stopProgressTimer();
    timerRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
        setDuration(playerRef.current.getDuration() || 0);
      }
    }, 500);
  };

  const stopProgressTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Play a song from queue or search
  const loadAndPlayTrack = (track) => {
    const existingIndex = queue.findIndex(t => t.videoId === track.videoId || t.id === track.id);
    if (existingIndex !== -1) {
      setQueueIndex(existingIndex);
    } else {
      setQueue(prev => [...prev, track]);
      setQueueIndex(queue.length);
    }

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
    const nextTrack = queue[nextIdx];
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(nextTrack.videoId);
      playerRef.current.playVideo();
    }
  };

  const handlePrev = () => {
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    const prevTrack = queue[prevIdx];
    if (playerRef.current && playerRef.current.loadVideoById) {
      playerRef.current.loadVideoById(prevTrack.videoId);
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

  // Search Online (Invidious / iTunes fallback meta)
  const handleSearch = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15`);
      const data = await res.json();
      if (data.results) {
        const formatted = data.results.map(item => ({
          id: String(item.trackId),
          videoId: "fHI8X4OXluQ", // mapped for demonstration audio stream
          title: item.trackName,
          artist: item.artistName,
          cover: item.artworkUrl100?.replace("100x100bb", "400x400bb") || item.artworkUrl100,
          lyrics: `Lyrics for "${item.trackName}" by ${item.artistName}\n\n[Verse 1]\nStreaming full track directly on Aura Engine...\nFeel the beats and rhythm!\n\n[Chorus]\nEnjoy the high-fidelity sound stream.`
        }));
        setSearchResults(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    const newP = {
      id: "pl-" + Date.now(),
      name: newPlaylistName.trim(),
      tracks: [currentTrack]
    };
    setPlaylists([...playlists, newP]);
    setNewPlaylistName("");
  };

  const deletePlaylist = (id) => {
    setPlaylists(playlists.filter(p => p.id !== id));
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#08090d", color: "#f0f2f5", fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden" }}>
      
      {/* Hidden YouTube Audio Node */}
      <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
        <div id="yt-audio-engine" />
      </div>

      {/* Sidebar */}
      <aside style={{ width: "250px", background: "rgba(15, 17, 26, 0.7)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", padding: "24px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: 800, color: "#00f2fe", letterSpacing: "1px", marginBottom: "32px", paddingLeft: "10px" }}>
          <Sparkles size={22} style={{ filter: "drop-shadow(0 0 8px #00f2fe)" }} />
          <span>AURA MUSIC</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          {[
            { id: "home", label: "Discover Feed", icon: Home },
            { id: "search", label: "Online Search", icon: Search },
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
                  textAlign: "left",
                  transition: "0.2s"
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mini Playlist Widget */}
        <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ fontSize: "12px", color: "#8b949e", marginBottom: "8px", fontWeight: 600 }}>QUICK PLAYLISTS</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <input 
              type="text" 
              placeholder="New playlist..." 
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", padding: "6px 8px", fontSize: "12px", outline: "none" }}
            />
            <button onClick={createPlaylist} style={{ background: "#00f2fe", border: "none", borderRadius: "6px", color: "#000", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Plus size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Stream Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: "120px", position: "relative" }}>
        
        {/* Top Search & Actions */}
        <header style={{ padding: "18px 32px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}
            style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "8px 18px", borderRadius: "30px", width: "100%", maxWidth: "460px", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Search size={16} color="#8b949e" />
            <input 
              type="text" 
              placeholder="Search unlimited songs, artists..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", color: "#fff", outline: "none", width: "100%", fontSize: "14px" }}
            />
            {loading ? <Loader2 size={16} className="animate-spin" color="#00f2fe" /> : (
              <button type="submit" style={{ background: "#00f2fe", border: "none", color: "#08090d", padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                Search
              </button>
            )}
          </form>

          <div style={{ display: "flex", gap: "12px" }}>
            <button 
              onClick={() => setShowLyrics(!showLyrics)} 
              style={{ background: showLyrics ? "#00f2fe" : "rgba(255,255,255,0.05)", color: showLyrics ? "#000" : "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}
            >
              <AlignLeft size={16} />
              <span>Lyrics</span>
            </button>
            <button 
              onClick={() => setShowQueue(!showQueue)} 
              style={{ background: showQueue ? "#00f2fe" : "rgba(255,255,255,0.05)", color: showQueue ? "#000" : "#fff", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}
            >
              <ListOrdered size={16} />
              <span>Queue ({queue.length})</span>
            </button>
          </div>
        </header>

        {/* Dynamic Panels (Lyrics / Queue Overlay) */}
        {showLyrics && (
          <div style={{ margin: "20px 32px", padding: "24px", background: "rgba(0, 242, 254, 0.04)", border: "1px solid rgba(0, 242, 254, 0.2)", borderRadius: "16px", backdropFilter: "blur(10px)" }}>
            <h3 style={{ color: "#00f2fe", margin: "0 0 12px 0", fontSize: "18px" }}>Live Lyrics • {currentTrack.title}</h3>
            <pre style={{ color: "#c5c6c7", fontFamily: "inherit", whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "15px" }}>
              {currentTrack.lyrics || "No synchronized lyrics found for this stream."}
            </pre>
          </div>
        )}

        {/* Content View */}
        <div style={{ padding: "24px 32px" }}>
          {page === "playlists" && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>Your Custom Playlists</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                {playlists.map((pl) => (
                  <div key={pl.id} style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "16px", color: "#00f2fe" }}>{pl.name}</span>
                      <button onClick={() => deletePlaylist(pl.id)} style={{ background: "none", border: "none", color: "#ff4d6d", cursor: "pointer" }}><Trash2 size={16} /></button>
                    </div>
                    <p style={{ color: "#8b949e", fontSize: "13px", margin: "0 0 12px 0" }}>{pl.tracks?.length || 0} Tracks</p>
                    <button 
                      onClick={() => { setQueue(pl.tracks); setQueueIndex(0); loadAndPlayTrack(pl.tracks[0]); }}
                      style={{ width: "100%", background: "rgba(255,255,255,0.08)", border: "none", padding: "8px", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "13px" }}
                    >
                      Play All
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page !== "playlists" && (
            <div>
              <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
                {page === "liked" ? "Liked Tracks" : searchQuery ? "Search Results" : "Featured Stream Feed"}
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "20px" }}>
                {(page === "liked" ? queue.filter(t => liked.has(t.id)) : (searchResults.length > 0 ? searchResults : queue)).map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div 
                      key={track.id} 
                      onClick={() => loadAndPlayTrack(track)}
                      style={{
                        background: isCurrent ? "rgba(0, 242, 254, 0.08)" : "rgba(255,255,255,0.03)",
                        padding: "14px",
                        borderRadius: "14px",
                        cursor: "pointer",
                        border: isCurrent ? "1px solid #00f2fe" : "1px solid rgba(255,255,255,0.05)",
                        transition: "0.2s transform ease"
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
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</h4>
                      <p style={{ margin: "0", fontSize: "12px", color: "#8b949e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Glow Player */}
      <footer style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "94px",
        background: "rgba(10, 12, 18, 0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        zIndex: 100
      }}>
        {/* Track Thumbnail */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "280px" }}>
          <img src={currentTrack.cover} alt="cover" style={{ width: "54px", height: "54px", borderRadius: "8px", objectFit: "cover", boxShadow: "0 4px 14px rgba(0,0,0,0.5)" }} />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
            <div style={{ fontSize: "12px", color: "#8b949e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</div>
          </div>
          <button 
            onClick={() => {
              const next = new Set(liked);
              if (next.has(currentTrack.id)) next.delete(currentTrack.id);
              else next.add(currentTrack.id);
              setLiked(next);
            }} 
            style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#ff4d6d" : "#8b949e", cursor: "pointer", padding: "6px" }}
          >
            <Heart size={18} fill={liked.has(currentTrack.id) ? "#ff4d6d" : "none"} />
          </button>
        </div>

        {/* Center Controls & Scrubber */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "42%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
            <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#c5c6c7", cursor: "pointer" }}><SkipBack size={18} /></button>
            <button 
              onClick={togglePlayPause}
              style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#00f2fe", color: "#08090d", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 0 16px rgba(0, 242, 254, 0.4)" }}
            >
              {isPlaying ? <Pause size={20} fill="#08090d" /> : <Play size={20} fill="#08090d" />}
            </button>
            <button onClick={handleNext} style={{ background: "none", border: "none", color: "#c5c6c7", cursor: "pointer" }}><SkipForward size={18} /></button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#8b949e", width: "36px", textAlign: "right" }}>{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              style={{ flex: 1, accentColor: "#00f2fe", cursor: "pointer" }} 
            />
            <span style={{ fontSize: "11px", color: "#8b949e", width: "36px" }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Queue Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "240px", justifyContent: "flex-end" }}>
          <button onClick={toggleMute} style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer" }}>
            {isMuted ? <VolumeX size={18} color="#ff4d6d" /> : <Volume2 size={18} />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={isMuted ? 0 : volume} 
            onChange={handleVolumeChange}
            style={{ width: "75px", accentColor: "#00f2fe", cursor: "pointer" }} 
          />
        </div>
      </footer>
    </div>
  );
}
