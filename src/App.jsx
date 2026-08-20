import React, { useState, useEffect, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Heart, Search,
  Plus, ChevronDown, AlignLeft, Loader2, Sparkles
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState("discover");
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [playlists, setPlaylists] = useState(() => {
    try {
      const s = localStorage.getItem("aura_playlists");
      return s ? JSON.parse(s) : { "Heavy Rotation": [] };
    } catch { return { "Heavy Rotation": [] }; }
  });
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [liked, setLiked] = useState(() => {
    try {
      const s = localStorage.getItem("aura_liked");
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch { return new Set(); }
  });

  const audioRef = useRef(null);
  const isScrubbing = useRef(false);
  const currentTrack = queue[queueIndex] || null;

  useEffect(() => {
    localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked)));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem("aura_playlists", JSON.stringify(playlists));
  }, [playlists]);

  // System MediaSession Controls (Background + Lock Screen + Drawer)
  useEffect(() => {
    if ("mediaSession" in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: "Aura Master Studio",
        artwork: [{ src: currentTrack.cover, sizes: "512x512", type: "image/jpeg" }]
      });

      navigator.mediaSession.setActionHandler("play", () => {
        if (audioRef.current) { audioRef.current.play(); setIsPlaying(true); }
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => handlePrev());
      navigator.mediaSession.setActionHandler("nexttrack", () => handleNext());
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setCurrentTime(details.seekTime);
        }
      });
    }
  }, [currentTrack, queueIndex]);

  // Real Serverless Music Search
  const searchMusic = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    setStatusMsg("");
    setSearchResults([]);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term.trim())}`);
      const data = await res.json();

      if (data?.results && data.results.length > 0) {
        setSearchResults(data.results);
        if (queue.length === 0) setQueue(data.results);
      } else {
        setStatusMsg("Koi track nahi mila. Doosra song title try karein.");
      }
    } catch (err) {
      setStatusMsg("Connecting to audio engine... Please retry.");
    }
    setLoading(false);
  };

  // Initial trending feed on load
  useEffect(() => {
    searchMusic("Arijit Singh Pritam songs");
  }, []);

  const playSong = (track, list) => {
    if (!track?.audioUrl) return;
    setStatusMsg("");
    const activeList = list && list.length > 0 ? list : searchResults;
    setQueue(activeList);
    const targetIdx = activeList.findIndex((t) => t.id === track.id);
    setQueueIndex(targetIdx !== -1 ? targetIdx : 0);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = track.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn("Playback stream warning:", err);
        setIsPlaying(false);
      });
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

  const currentTheme = currentTrack?.theme || "#fed000";

  return (
    <div style={{
      position: "relative",
      height: "100vh",
      width: "100vw",
      background: "#fed000",
      color: "#08090d",
      fontFamily: "'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        @keyframes vinylSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spinning-vinyl { animation: vinylSpin 14s linear infinite; }
        .paused-vinyl { animation-play-state: paused; }
        input[type="range"] { -webkit-appearance: none; height: 3px; border-radius: 999px; background: rgba(0,0,0,0.18); outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #08090d; cursor: pointer; }
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
        onTimeUpdate={() => {
          if (audioRef.current && !isScrubbing.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onEnded={handleNext}
        preload="auto"
      />

      {/* Main Screen Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 120px 16px" }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
            <span
              onClick={() => setActiveTab("discover")}
              style={{
                fontSize: "34px",
                fontWeight: 900,
                letterSpacing: "-1.5px",
                color: activeTab === "discover" ? "#08090d" : "rgba(8,9,13,0.35)",
                cursor: "pointer"
              }}>
              Discover
            </span>
            <span
              onClick={() => setActiveTab("playlists")}
              style={{
                fontSize: "30px",
                fontWeight: 900,
                letterSpacing: "-1.5px",
                color: activeTab === "playlists" ? "#08090d" : "rgba(8,9,13,0.35)",
                cursor: "pointer"
              }}>
              Playlists
            </span>
          </div>

          <button
            onClick={() => setActiveTab(activeTab === "search" ? "discover" : "search")}
            style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "#08090d", color: "#fff", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}>
            <Search size={18} />
          </button>
        </div>

        {/* Global Live Search Bar */}
        <form onSubmit={(e) => { e.preventDefault(); searchMusic(searchQuery); }} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Search any song (Falak Tak, Diljit, The Weeknd)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, padding: "12px 16px", borderRadius: "12px", border: "2px solid #08090d",
              fontSize: "14px", fontWeight: 700, outline: "none", background: "#fff"
            }}
          />
          <button
            type="submit"
            style={{ padding: "0 18px", borderRadius: "12px", background: "#08090d", color: "#fff", border: "none", fontWeight: 800, cursor: "pointer" }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Go"}
          </button>
        </form>

        {statusMsg && (
          <div style={{ padding: "10px", background: "rgba(0,0,0,0.06)", borderRadius: "8px", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>
            {statusMsg}
          </div>
        )}

        {/* Visual Cards Row */}
        {activeTab === "discover" && searchResults.length > 0 && (
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "14px", marginBottom: "14px" }}>
            {searchResults.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => playSong(item, searchResults)}
                style={{
                  position: "relative",
                  minWidth: "120px",
                  height: "140px",
                  borderRadius: "18px",
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
                  border: currentTrack?.id === item.id ? "3px solid #08090d" : "none"
                }}>
                <img src={item.cover} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85) 100%)" }} />
                <span style={{ position: "absolute", bottom: "8px", left: "8px", right: "8px", color: "#fff", fontSize: "12px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.artist}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Playlists View */}
        {activeTab === "playlists" && (
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900 }}>Your Playlists</h3>
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
                    setPlaylists({ ...playlists, [newPlaylistName.trim()]: currentTrack ? [currentTrack.id] : [] });
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
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "rgba(0,0,0,0.06)", borderRadius: "12px" }}>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 900 }}>{pl}</div>
                    <div style={{ fontSize: "12px", opacity: 0.6, fontWeight: 700 }}>{playlists[pl].length} tracks stored</div>
                  </div>
                  {currentTrack && (
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
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Track Results List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {searchResults.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => playSong(track, searchResults)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  background: isCurrent ? "rgba(0,0,0,0.08)" : "transparent",
                  cursor: "pointer"
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                  <img src={track.cover} alt={track.title} style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover" }} />
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#08090d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "rgba(8,9,13,0.55)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {track.artist}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, opacity: 0.6 }}>{track.durationStr}</span>
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
      {currentTrack && (
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
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#1a1a1a", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

          <button onClick={togglePlayPause} style={{ background: "#fff", color: "#08090d", border: "none", width: "38px", height: "38px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {isPlaying ? <Pause size={18} fill="#08090d" /> : <Play size={18} fill="#08090d" style={{ marginLeft: "2px" }} />}
          </button>
        </div>
      )}

      {/* Full Editorial Monochromatic Vinyl Player Screen */}
      {fullPlayerOpen && currentTrack && (
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
            padding: "24px"
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setFullPlayerOpen(false)} style={{ background: "none", border: "none", color: "#08090d", cursor: "pointer" }}>
              <ChevronDown size={30} />
            </button>
            <span style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "2px" }}>Aura Vinyl Master</span>
            <button onClick={() => setShowLyrics(!showLyrics)} style={{ background: "none", border: "none", color: showLyrics ? "#fff" : "#08090d", cursor: "pointer" }}>
              <AlignLeft size={22} />
            </button>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {showLyrics ? (
              <div style={{ width: "100%", maxHeight: "320px", background: "rgba(0,0,0,0.06)", borderRadius: "20px", padding: "24px", overflowY: "auto", border: "2px solid #08090d" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 900 }}>Lyrics & Info</h4>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "16px", fontWeight: 800 }}>{currentTrack.lyrics}</p>
              </div>
            ) : (
              <div style={{ position: "relative", width: "270px", height: "270px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div
                  className={`spinning-vinyl ${!isPlaying ? "paused-vinyl" : ""}`}
                  style={{
                    width: "260px",
                    height: "260px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #1a1a1a 0%, #000 70%, #1a1a1a 100%)",
                    boxShadow: "0 24px 50px rgba(0,0,0,0.45)",
                    border: "4px solid #08090d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                  <div style={{ width: "95px", height: "95px", borderRadius: "50%", overflow: "hidden", border: "3px solid #08090d" }}>
                    <img src={currentTrack.cover} alt="label" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "-15px",
                    right: "10px",
                    width: "70px",
                    height: "120px",
                    transformOrigin: "top right",
                    transform: isPlaying ? "rotate(18deg)" : "rotate(0deg)",
                    transition: "transform 0.5s ease",
                    pointerEvents: "none"
                  }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#08090d", border: "2px solid #fff" }} />
                  <div style={{ width: "4px", height: "90px", background: "#08090d", marginLeft: "6px", borderRadius: "2px" }} />
                  <div style={{ width: "14px", height: "20px", background: "#08090d", marginLeft: "1px", borderRadius: "2px" }} />
                </div>
              </div>
            )}
          </div>

          <div>
            <div style={{ marginBottom: "18px" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, opacity: 0.7 }}>{currentTrack.artist}</div>
              <div style={{ fontSize: "30px", fontWeight: 900, letterSpacing: "-1px" }}>{currentTrack.title}</div>
            </div>

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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px" }}>
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
                  cursor: "pointer"
                }}>
                {isPlaying ? <Pause size={28} fill="#fff" /> : <Play size={28} fill="#fff" style={{ marginLeft: "2px" }} />}
              </button>
              <button onClick={handleNext} style={{ background: "none", border: "none", color: "#08090d", cursor: "pointer" }}>
                <SkipForward size={28} fill="#08090d" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
