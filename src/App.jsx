‎import React, { useState, useEffect, useRef } from "react";
‎import {
‎  Play, Pause, SkipBack, SkipForward, Heart, Search,
‎  Plus, ChevronDown, AlignLeft, Loader2, Music2
‎} from "lucide-react";
‎
‎const decodeHtml = (html) => {
‎  const txt = document.createElement("textarea");
‎  txt.innerHTML = html || "";
‎  return txt.value;
‎};
‎
‎export default function App() {
‎  const [activeTab, setActiveTab] = useState("discover");
‎  const [queue, setQueue] = useState([]);
‎  const [queueIndex, setQueueIndex] = useState(0);
‎  const [isPlaying, setIsPlaying] = useState(false);
‎  const [currentTime, setCurrentTime] = useState(0);
‎  const [duration, setDuration] = useState(0);
‎
‎  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
‎  const [showLyrics, setShowLyrics] = useState(false);
‎  const [searchQuery, setSearchQuery] = useState("");
‎  const [searchResults, setSearchResults] = useState([]);
‎  const [loading, setLoading] = useState(false);
‎  const [statusMsg, setStatusMsg] = useState("");
‎
‎  const [playlists, setPlaylists] = useState(() => {
‎    try {
‎      const s = localStorage.getItem("aura_spotify_playlists");
‎      return s ? JSON.parse(s) : { "Heavy Rotation": [], "Chill Hits": [] };
‎    } catch { return { "Heavy Rotation": [], "Chill Hits": [] }; }
‎  });
‎  const [newPlaylistName, setNewPlaylistName] = useState("");
‎  const [showCreateModal, setShowCreateModal] = useState(false);
‎
‎  const [liked, setLiked] = useState(() => {
‎    try {
‎      const s = localStorage.getItem("aura_spotify_liked");
‎      return s ? new Set(JSON.parse(s)) : new Set();
‎    } catch { return new Set(); }
‎  });
‎
‎  const audioRef = useRef(null);
‎  const isScrubbing = useRef(false);
‎  const currentTrack = queue[queueIndex] || null;
‎
‎  useEffect(() => {
‎    localStorage.setItem("aura_spotify_liked", JSON.stringify(Array.from(liked)));
‎  }, [liked]);
‎
‎  useEffect(() => {
‎    localStorage.setItem("aura_spotify_playlists", JSON.stringify(playlists));
‎  }, [playlists]);
‎
‎  // System Media Controls (Background & Notification Bar)
‎  useEffect(() => {
‎    if ("mediaSession" in navigator && currentTrack) {
‎      navigator.mediaSession.metadata = new MediaMetadata({
‎        title: currentTrack.title,
‎        artist: currentTrack.artist,
‎        album: "Aura Music",
‎        artwork: [{ src: currentTrack.cover, sizes: "512x512", type: "image/jpeg" }]
‎      });
‎
‎      navigator.mediaSession.setActionHandler("play", () => {
‎        if (audioRef.current) { audioRef.current.play(); setIsPlaying(true); }
‎      });
‎      navigator.mediaSession.setActionHandler("pause", () => {
‎        if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
‎      });
‎      navigator.mediaSession.setActionHandler("previoustrack", () => handlePrev());
‎      navigator.mediaSession.setActionHandler("nexttrack", () => handleNext());
‎      navigator.mediaSession.setActionHandler("seekto", (details) => {
‎        if (details.seekTime && audioRef.current) {
‎          audioRef.current.currentTime = details.seekTime;
‎          setCurrentTime(details.seekTime);
‎        }
‎      });
‎    }
‎  }, [currentTrack, queueIndex]);
‎
‎  // Full-Length Songs JioSaavn Engine (No 30-sec limit)
‎  const searchMusic = async (term) => {
‎    if (!term || !term.trim()) return;
‎    setLoading(true);
‎    setStatusMsg("");
‎
‎    try {
‎      const res = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(term.trim())}&limit=30`);
‎      const data = await res.json();
‎
‎      if (data?.success && data?.data?.results?.length > 0) {
‎        const fullTracks = data.data.results.map((song) => {
‎          const audioUrl = song.downloadUrl?.[4]?.url || 
‎                           song.downloadUrl?.[3]?.url || 
‎                           song.downloadUrl?.[2]?.url || 
‎                           song.downloadUrl?.[0]?.url || "";
‎
‎          const cover = song.image?.[2]?.url || 
‎                        song.image?.[1]?.url || 
‎                        song.image?.[0]?.url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500";
‎
‎          const artists = song.artists?.primary?.map((a) => a.name).join(", ") || "Unknown Artist";
‎          const dSecs = Number(song.duration) || 210;
‎          const mins = Math.floor(dSecs / 60);
‎          const secs = Math.floor(dSecs % 60);
‎
‎          return {
‎            id: song.id,
‎            title: decodeHtml(song.name),
‎            artist: decodeHtml(artists),
‎            cover: cover,
‎            audioUrl: audioUrl,
‎            durationStr: `${mins}:${secs < 10 ? "0" : ""}${secs}`,
‎            lyrics: "Streaming full-length lossless audio powered by Aura Master Engine."
‎          };
‎        }).filter(item => item.audioUrl && item.audioUrl.startsWith("http"));
‎
‎        if (fullTracks.length > 0) {
‎          setSearchResults(fullTracks);
‎          if (queue.length === 0) setQueue(fullTracks);
‎        } else {
‎          setStatusMsg("Koi track nahi mila. Dusra song title search karein.");
‎        }
‎      } else {
‎        setStatusMsg("Koi track nahi mila. Dusra name try karein.");
‎      }
‎    } catch (err) {
‎      console.error(err);
‎      setStatusMsg("Connection retry karein...");
‎    }
‎    setLoading(false);
‎  };
‎
‎  useEffect(() => {
‎    searchMusic("Diljit Dosanjh Arijit Singh");
‎  }, []);
‎
‎  const playSong = (track, list) => {
‎    if (!track?.audioUrl) return;
‎    setStatusMsg("");
‎    const activeList = list && list.length > 0 ? list : searchResults;
‎    setQueue(activeList);
‎    const targetIdx = activeList.findIndex((t) => t.id === track.id);
‎    setQueueIndex(targetIdx !== -1 ? targetIdx : 0);
‎
‎    if (audioRef.current) {
‎      audioRef.current.src = track.audioUrl;
‎      audioRef.current.load();
‎      audioRef.current.play()
‎        .then(() => setIsPlaying(true))
‎        .catch(() => setIsPlaying(false));
‎    }
‎  };
‎
‎  const togglePlayPause = (e) => {
‎    if (e) e.stopPropagation();
‎    if (!audioRef.current) return;
‎    if (isPlaying) {
‎      audioRef.current.pause();
‎      setIsPlaying(false);
‎    } else {
‎      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
‎    }
‎  };
‎
‎  const handleNext = (e) => {
‎    if (e) e.stopPropagation();
‎    if (queue.length === 0) return;
‎    const nextIdx = (queueIndex + 1) % queue.length;
‎    setQueueIndex(nextIdx);
‎    playSong(queue[nextIdx], queue);
‎  };
‎
‎  const handlePrev = (e) => {
‎    if (e) e.stopPropagation();
‎    if (queue.length === 0) return;
‎    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
‎    setQueueIndex(prevIdx);
‎    playSong(queue[prevIdx], queue);
‎  };
‎
‎  const handleSeek = (e) => {
‎    const time = Number(e.target.value);
‎    setCurrentTime(time);
‎    if (audioRef.current) audioRef.current.currentTime = time;
‎  };
‎
‎  const formatTime = (secs) => {
‎    if (isNaN(secs) || !secs) return "0:00";
‎    const m = Math.floor(secs / 60);
‎    const s = Math.floor(secs % 60);
‎    return `${m}:${s < 10 ? "0" : ""}${s}`;
‎  };
‎
‎  return (
‎    <div style={{
‎      position: "relative",
‎      height: "100vh",
‎      width: "100vw",
‎      background: "#121212",
‎      color: "#FFFFFF",
‎      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
‎      overflow: "hidden",
‎      display: "flex",
‎      flexDirection: "column"
‎    }}>
‎      <style>{`
‎        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
‎        ::-webkit-scrollbar { display: none; }
‎        input[type="range"] { -webkit-appearance: none; height: 4px; border-radius: 999px; background: #4d4d4d; outline: none; }
‎        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #1db954; cursor: pointer; }
‎      `}</style>
‎
‎      <audio
‎        ref={audioRef}
‎        src={currentTrack?.audioUrl}
‎        onLoadedMetadata={(e) => {
‎          const d = e.currentTarget.duration;
‎          if (Number.isFinite(d) && d > 0) setDuration(d);
‎        }}
‎        onDurationChange={(e) => {
‎          const d = e.currentTarget.duration;
‎          if (Number.isFinite(d) && d > 0) setDuration(d);
‎        }}
‎        onTimeUpdate={() => {
‎          if (audioRef.current && !isScrubbing.current) {
‎            setCurrentTime(audioRef.current.currentTime);
‎          }
‎        }}
‎        onEnded={handleNext}
‎        preload="auto"
‎      />
‎
‎      {/* Main App Feed */}
‎      <div style={{ flex: 1, overflowY: "auto", padding: "18px 16px 120px 16px" }}>
‎        
‎        {/* Header with Spotify Accent */}
‎        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
‎          <div>
‎            <div style={{ fontSize: "11px", fontWeight: 800, color: "#1db954", letterSpacing: "2px" }}>
‎              AURA MUSIC
‎            </div>
‎            <h1 style={{ margin: "2px 0 0 0", fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px" }}>
‎              Spotify Edition
‎            </h1>
‎          </div>
‎
‎          <div style={{ display: "flex", gap: "8px" }}>
‎            <button
‎              onClick={() => setActiveTab("discover")}
‎              style={{
‎                background: activeTab === "discover" ? "#1db954" : "#282828",
‎                color: activeTab === "discover" ? "#000" : "#fff",
‎                border: "none",
‎                borderRadius: "500px",
‎                padding: "8px 16px",
‎                fontSize: "13px",
‎                fontWeight: 700,
‎                cursor: "pointer"
‎              }}>
‎              Discover
‎            </button>
‎            <button
‎              onClick={() => setActiveTab("playlists")}
‎              style={{
‎                background: activeTab === "playlists" ? "#1db954" : "#282828",
‎                color: activeTab === "playlists" ? "#000" : "#fff",
‎                border: "none",
‎                borderRadius: "500px",
‎                padding: "8px 16px",
‎                fontSize: "13px",
‎                fontWeight: 700,
‎                cursor: "pointer"
‎              }}>
‎              Playlists
‎            </button>
‎          </div>
‎        </div>
‎
‎        {/* Search Input */}
‎        <form onSubmit={(e) => { e.preventDefault(); searchMusic(searchQuery); }} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
‎          <div style={{ position: "relative", flex: 1 }}>
‎            <Search size={18} color="#b3b3b3" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
‎            <input
‎              type="text"
‎              placeholder="Search any song, artist, album..."
‎              value={searchQuery}
‎              onChange={(e) => setSearchQuery(e.target.value)}
‎              style={{
‎                width: "100%",
‎                padding: "12px 16px 12px 42px",
‎                borderRadius: "500px",
‎                border: "none",
‎                fontSize: "14px",
‎                fontWeight: 600,
‎                outline: "none",
‎                background: "#242424",
‎                color: "#fff"
‎              }}
‎            />
‎          </div>
‎          <button
‎            type="submit"
‎            style={{
‎              padding: "0 20px",
‎              borderRadius: "500px",
‎              background: "#1db954",
‎              color: "#000",
‎              border: "none",
‎              fontWeight: 800,
‎              cursor: "pointer"
‎            }}>
‎            {loading ? <Loader2 size={16} className="animate-spin" color="#000" /> : "Search"}
‎          </button>
‎        </form>
‎
‎        {statusMsg && (
‎          <div style={{ padding: "10px", background: "#282828", borderRadius: "8px", fontSize: "13px", color: "#b3b3b3", marginBottom: "14px" }}>
‎            {statusMsg}
‎          </div>
‎        )}
‎
‎        {/* Spotify Horizontal Card Grid */}
‎        {activeTab === "discover" && searchResults.length > 0 && (
‎          <div style={{ marginBottom: "24px" }}>
‎            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: 800 }}>Top Recommended</h3>
‎            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
‎              {searchResults.slice(0, 8).map((item) => (
‎                <div
‎                  key={item.id}
‎                  onClick={() => playSong(item, searchResults)}
‎                  style={{
‎                    position: "relative",
‎                    minWidth: "130px",
‎                    background: "#181818",
‎                    padding: "12px",
‎                    borderRadius: "8px",
‎                    cursor: "pointer",
‎                    border: currentTrack?.id === item.id ? "2px solid #1db954" : "1px solid transparent"
‎                  }}>
‎                  <img src={item.cover} alt={item.title} style={{ width: "100%", height: "115px", borderRadius: "6px", objectFit: "cover", marginBottom: "8px" }} />
‎                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
‎                    {item.title}
‎                  </div>
‎                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#b3b3b3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
‎                    {item.artist}
‎                  </div>
‎                </div>
‎              ))}
‎            </div>
‎          </div>
‎        )}
‎
‎        {/* Playlists */}
‎        {activeTab === "playlists" && (
‎          <div style={{ marginBottom: "24px" }}>
‎            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
‎              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Your Library</h3>
‎              <button
‎                onClick={() => setShowCreateModal(true)}
‎                style={{
‎                  display: "flex",
‎                  alignItems: "center",
‎                  gap: "6px",
‎                  background: "#1db954",
‎                  color: "#000",
‎                  padding: "6px 14px",
‎                  borderRadius: "500px",
‎                  border: "none",
‎                  fontWeight: 800,
‎                  fontSize: "12px",
‎                  cursor: "pointer"
‎                }}>
‎                <Plus size={14} /> New
‎              </button>
‎            </div>
‎
‎            {showCreateModal && (
‎              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
‎                <input
‎                  type="text"
‎                  placeholder="Playlist Name..."
‎                  value={newPlaylistName}
‎                  onChange={(e) => setNewPlaylistName(e.target.value)}
‎                  style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #333", background: "#282828", color: "#fff", fontWeight: 600 }}
‎                />
‎                <button
‎                  onClick={() => {
‎                    if (!newPlaylistName.trim()) return;
‎                    setPlaylists({ ...playlists, [newPlaylistName.trim()]: currentTrack ? [currentTrack.id] : [] });
‎                    setNewPlaylistName("");
‎                    setShowCreateModal(false);
‎                  }}
‎                  style={{ background: "#1db954", color: "#000", border: "none", padding: "0 14px", borderRadius: "8px", fontWeight: 800 }}>
‎                  Save
‎                </button>
‎              </div>
‎            )}
‎
‎            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
‎              {Object.keys(playlists).map((pl) => (
‎                <div
‎                  key={pl}
‎                  style={{
‎                    display: "flex",
‎                    justifyContent: "space-between",
‎                    alignItems: "center",
‎                    padding: "14px",
‎                    background: "#181818",
‎                    borderRadius: "8px"
‎                  }}>
‎                  <div>
‎                    <div style={{ fontSize: "14px", fontWeight: 800 }}>{pl}</div>
‎                    <div style={{ fontSize: "12px", color: "#b3b3b3", fontWeight: 600 }}>{playlists[pl].length} songs stored</div>
‎                  </div>
‎                  {currentTrack && (
‎                    <button
‎                      onClick={() => {
‎                        const updated = { ...playlists };
‎                        if (!updated[pl].includes(currentTrack.id)) {
‎                          updated[pl].push(currentTrack.id);
‎                          setPlaylists(updated);
‎                        }
‎                      }}
‎                      style={{
‎                        background: "transparent",
‎                        border: "1px solid #1db954",
‎                        color: "#1db954",
‎                        padding: "6px 12px",
‎                        borderRadius: "500px",
‎                        fontSize: "11px",
‎                        fontWeight: 700,
‎                        cursor: "pointer"
‎                      }}>
‎                      + Add Current
‎                    </button>
‎                  )}
‎                </div>
‎              ))}
‎            </div>
‎          </div>
‎        )}
‎
‎        {/* Spotify Track List */}
‎        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
‎          <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: 800 }}>Popular Tracks</h3>
‎          {searchResults.map((track) => {
‎            const isCurrent = currentTrack?.id === track.id;
‎            return (
‎              <div
‎                key={track.id}
‎                onClick={() => playSong(track, searchResults)}
‎                style={{
‎                  display: "flex",
‎                  alignItems: "center",
‎                  justifyContent: "space-between",
‎                  padding: "10px 12px",
‎                  borderRadius: "8px",
‎                  background: isCurrent ? "#282828" : "transparent",
‎                  cursor: "pointer"
‎                }}>
‎                <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
‎                  <img src={track.cover} alt={track.title} style={{ width: "46px", height: "46px", borderRadius: "6px", objectFit: "cover" }} />
‎                  <div style={{ overflow: "hidden" }}>
‎                    <div style={{ fontSize: "14px", fontWeight: 700, color: isCurrent ? "#1db954" : "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
‎                      {track.title}
‎                    </div>
‎                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#b3b3b3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
‎                      {track.artist}
‎                    </div>
‎                  </div>
‎                </div>
‎
‎                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
‎                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#b3b3b3" }}>{track.durationStr}</span>
‎                  <button
‎                    onClick={(e) => {
‎                      e.stopPropagation();
‎                      const next = new Set(liked);
‎                      if (next.has(track.id)) next.delete(track.id);
‎                      else next.add(track.id);
‎                      setLiked(next);
‎                    }}
‎                    style={{ background: "none", border: "none", color: liked.has(track.id) ? "#1db954" : "#b3b3b3", cursor: "pointer", padding: "4px" }}>
‎                    <Heart size={16} fill={liked.has(track.id) ? "#1db954" : "none"} />
‎                  </button>
‎                </div>
‎              </div>
‎            );
‎          })}
‎        </div>
‎      </div>
‎
‎      {/* Floating Bottom Mini Player */}
‎      {currentTrack && (
‎        <div
‎          onClick={() => setFullPlayerOpen(true)}
‎          style={{
‎            position: "fixed",
‎            bottom: "12px",
‎            left: "12px",
‎            right: "12px",
‎            height: "62px",
‎            background: "#242424",
‎            color: "#fff",
‎            borderRadius: "10px",
‎            display: "flex",
‎            alignItems: "center",
‎            justifyContent: "space-between",
‎            padding: "0 16px",
‎            boxShadow: "0 10px 24px rgba(0,0,0,0.6)",
‎            cursor: "pointer",
‎            zIndex: 90,
‎            borderBottom: "3px solid #1db954"
‎          }}>
‎          <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
‎            <img
‎              src={currentTrack.cover}
‎              alt="cover"
‎              style={{ width: "42px", height: "42px", borderRadius: "6px", objectFit: "cover" }}
‎            />
‎            <div style={{ overflow: "hidden" }}>
‎              <div style={{ fontSize: "14px", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
‎              <div style={{ fontSize: "12px", color: "#b3b3b3", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</div>
‎            </div>
‎          </div>
‎
‎          <button
‎            onClick={togglePlayPause}
‎            style={{
‎              background: "#1db954",
‎              color: "#000",
‎              border: "none",
‎              width: "38px",
‎              height: "38px",
‎              borderRadius: "50%",
‎              display: "flex",
‎              alignItems: "center",
‎              justifyContent: "center",
‎              cursor: "pointer"
‎            }}>
‎            {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" style={{ marginLeft: "2px" }} />}
‎          </button>
‎        </div>
‎      )}
‎
‎      {/* Full Modal Player */}
‎      {fullPlayerOpen && currentTrack && (
‎        <div
‎          style={{
‎            position: "fixed",
‎            inset: 0,
‎            background: "linear-gradient(180deg, #1e3a1e 0%, #121212 60%)",
‎            color: "#FFFFFF",
‎            zIndex: 999,
‎            display: "flex",
‎            flexDirection: "column",
‎            justifyContent: "space-between",
‎            padding: "24px 20px"
‎          }}>
‎          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
‎            <button onClick={() => setFullPlayerOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
‎              <ChevronDown size={30} />
‎            </button>
‎            <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "#b3b3b3" }}>AURA MASTER PLAYBACK</span>
‎            <button onClick={() => setShowLyrics(!showLyrics)} style={{ background: "none", border: "none", color: showLyrics ? "#1db954" : "#fff", cursor: "pointer" }}>
‎              <AlignLeft size={22} />
‎            </button>
‎          </div>
‎
‎          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
‎            {showLyrics ? (
‎              <div style={{ width: "100%", maxHeight: "320px", background: "#181818", borderRadius: "16px", padding: "24px", overflowY: "auto", border: "1px solid #282828" }}>
‎                <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 800, color: "#1db954" }}>Lyrics & Info</h4>
‎                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "15px", color: "#b3b3b3", fontWeight: 600 }}>{currentTrack.lyrics}</p>
‎              </div>
‎            ) : (
‎              <div style={{ width: "280px", height: "280px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.8)", border: "2px solid #282828" }}>
‎                <img src={currentTrack.cover} alt="album art" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
‎              </div>
‎            )}
‎          </div>
‎
‎          <div>
‎            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
‎              <div>
‎                <div style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.5px" }}>{currentTrack.title}</div>
‎                <div style={{ fontSize: "15px", fontWeight: 600, color: "#b3b3b3", marginTop: "4px" }}>{currentTrack.artist}</div>
‎              </div>
‎              <button
‎                onClick={() => {
‎                  const next = new Set(liked);
‎                  if (next.has(currentTrack.id)) next.delete(currentTrack.id);
‎                  else next.add(currentTrack.id);
‎                  setLiked(next);
‎                }}
‎                style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#1db954" : "#fff", cursor: "pointer" }}>
‎                <Heart size={24} fill={liked.has(currentTrack.id) ? "#1db954" : "none"} />
‎              </button>
‎            </div>
‎
‎            <div style={{ marginBottom: "20px" }}>
‎              <input
‎                type="range"
‎                min="0"
‎                max={duration || 100}
‎                value={currentTime}
‎                onMouseDown={() => { isScrubbing.current = true; }}
‎                onMouseUp={() => { isScrubbing.current = false; }}
‎                onTouchStart={() => { isScrubbing.current = true; }}
‎                onTouchEnd={() => { isScrubbing.current = false; }}
‎                onChange={handleSeek}
‎                style={{ width: "100%", cursor: "pointer" }}
‎              />
‎              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 600, color: "#b3b3b3", marginTop: "6px" }}>
‎                <span>{formatTime(currentTime)}</span>
‎                <span>{formatTime(duration)}</span>
‎              </div>
‎            </div>
‎
‎            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px" }}>
‎              <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
‎                <SkipBack size={32} fill="#fff" />
‎              </button>
‎              <button
‎                onClick={togglePlayPause}
‎                style={{
‎                  width: "64px",
‎                  height: "64px",
‎                  borderRadius: "50%",
‎                  background: "#1db954",
‎                  color: "#000",
‎                  border: "none",
‎                  display: "flex",
‎                  alignItems: "center",
‎                  justifyContent: "center",
‎                  cursor: "pointer"
‎                }}>
‎                {isPlaying ? <Pause size={28} fill="#000" /> : <Play size={28} fill="#000" style={{ marginLeft: "3px" }} />}
‎              </button>
‎              <button onClick={handleNext} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
‎                <SkipForward size={32} fill="#fff" />
‎              </button>
‎            </div>
‎          </div>
‎        </div>
‎      )}
‎    </div>
‎  );
‎}
‎
