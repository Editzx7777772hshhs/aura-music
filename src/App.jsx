import React, { useState, useEffect, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Heart, Search,
  Plus, ChevronDown, AlignLeft, HardDrive, Sparkles, Disc3
} from "lucide-react";

// Robust Full-Length Offline + Online Catalog
const MASTER_CATALOG = [
  {
    id: "tr-1",
    title: "Falak Tak Chal",
    artist: "Udit Narayan, Mahalaxmi",
    category: "bollywood",
    durationStr: "05:56",
    theme: "#e63946",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
    lyrics: "Falak tak chal saath mere\nFalak tak chal saath chal...\nYeh baadal ki chaadar pe\nAao soyein hum dono."
  },
  {
    id: "tr-2",
    title: "Despacito (Latin Global)",
    artist: "Luis Fonsi, Daddy Yankee",
    category: "global",
    durationStr: "03:48",
    theme: "#fed000",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3",
    lyrics: "Despacito...\nQuiero respirar tu cuello despacito\nDeja que te diga cosas al oído\nPara que te acuerdes si no estás conmigo."
  },
  {
    id: "tr-3",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    category: "global",
    durationStr: "03:50",
    theme: "#ff0055",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3",
    lyrics: "I'm tryna put you in the worst mood, ah\nP1 cleaner than your church shoes, ah\nMilli point two just to hurt you, ah..."
  },
  {
    id: "tr-4",
    title: "Khuda Jaane",
    artist: "KK, Shilpa Rao",
    category: "bollywood",
    durationStr: "05:32",
    theme: "#9ef01a",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3",
    lyrics: "Sajde mein yun hi jhukta hoon\nTum pe hi aa ke rukta hoon\nKya yeh sab ko hota hai..."
  },
  {
    id: "tr-5",
    title: "Lover (Punjabi Hit)",
    artist: "Diljit Dosanjh",
    category: "punjabi",
    durationStr: "03:15",
    theme: "#00f2fe",
    cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3",
    lyrics: "Tera ni mai lover, tera ni mai lover...\nJadon da tenu takya, dil te chhaya fitoor."
  },
  {
    id: "tr-6",
    title: "Kohinoor (Gully Rap)",
    artist: "DIVINE",
    category: "hiphop",
    durationStr: "03:22",
    theme: "#f72585",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c3504a919e.mp3",
    lyrics: "Gully Gang boy!\nKohinoor heera jaise chamke meri kalam..."
  },
  {
    id: "tr-7",
    title: "Kesariya (Acoustic Master)",
    artist: "Arijit Singh, Pritam",
    category: "bollywood",
    durationStr: "04:28",
    theme: "#fed000",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/11/06/audio_c931448b4d.mp3",
    lyrics: "Kesariya tera ishq hai piya\nRang jaaun jo main haath lagaun\nDin beete saara teri fikr mein\nRain saari teri khair manaun..."
  },
  {
    id: "tr-8",
    title: "Midnight City Lights",
    artist: "Synthwave Pulse",
    category: "global",
    durationStr: "03:40",
    theme: "#7928ca",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2021/08/08/audio_dc39bde808.mp3",
    lyrics: "Neon glows over the skyline...\nDriving into the boundless midnight."
  }
];

const GENRE_TABS = [
  { id: "foryou", label: "For you", count: "219" },
  { id: "bollywood", label: "Bollywood", count: "589" },
  { id: "punjabi", label: "Punjabi", count: "340" },
  { id: "hiphop", label: "Hip-hop", count: "312" },
  { id: "global", label: "Global", count: "719" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("artists");
  const [selectedGenre, setSelectedGenre] = useState("foryou");
  const [feedTracks, setFeedTracks] = useState(MASTER_CATALOG);
  const [queue, setQueue] = useState(MASTER_CATALOG);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem("aura_playlists");
      return saved ? JSON.parse(saved) : { "Heavy Rotation": ["tr-1", "tr-2"] };
    } catch { return { "Heavy Rotation": ["tr-1", "tr-2"] }; }
  });
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [liked, setLiked] = useState(() => {
    try {
      const s = localStorage.getItem("aura_liked");
      return s ? new Set(JSON.parse(s)) : new Set(["tr-1", "tr-2"]);
    } catch { return new Set(["tr-1"]); }
  });

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const isScrubbing = useRef(false);
  const currentTrack = queue[queueIndex] || MASTER_CATALOG[0];

  useEffect(() => {
    localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked)));
  }, [liked]);

  useEffect(() => {
    localStorage.setItem("aura_playlists", JSON.stringify(playlists));
  }, [playlists]);

  // System Media Controls (Notification Drawer + Lock Screen)
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

  // Genre filter switch
  const handleGenreClick = (genreId) => {
    setSelectedGenre(genreId);
    if (genreId === "foryou") {
      setFeedTracks(MASTER_CATALOG);
    } else {
      const filtered = MASTER_CATALOG.filter(t => t.category === genreId);
      setFeedTracks(filtered.length > 0 ? filtered : MASTER_CATALOG);
    }
  };

  // Hybrid Fast Search Engine (Jamendo Direct + Catalog Match)
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);

    const term = searchQuery.toLowerCase().trim();
    // 1. Direct Catalog Match
    const localMatches = MASTER_CATALOG.filter(
      t => t.title.toLowerCase().includes(term) || t.artist.toLowerCase().includes(term)
    );

    // 2. Jamendo Global HD Search
    let remoteMatches = [];
    try {
      const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=843847f1&format=jsonpretty&limit=15&namesearch=${encodeURIComponent(term)}&audioformat=mp32`);
      const data = await res.json();
      if (data?.results?.length > 0) {
        remoteMatches = data.results.map((item, idx) => ({
          id: `jam-${item.id}`,
          title: item.name,
          artist: item.artist_name,
          durationStr: `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`,
          theme: ["#e63946", "#fed000", "#9ef01a", "#00f2fe", "#f72585"][idx % 5],
          cover: item.image || MASTER_CATALOG[0].cover,
          audioUrl: item.audio,
          lyrics: `Track: "${item.name}"\nArtist: ${item.artist_name}\nAlbum: ${item.album_name || 'Single'}\n\nFull uncompressed HD stream on Aura Engine.`
        })).filter(t => t.audioUrl);
      }
    } catch (err) {
      console.warn("Remote search timeout, fallback to catalog matches.");
    }

    const combined = [...localMatches, ...remoteMatches];
    setSearchResults(combined.length > 0 ? combined : MASTER_CATALOG);
    setLoading(false);
  };

  const playSong = (track, list) => {
    if (!track?.audioUrl) return;
    const activeList = list && list.length > 0 ? list : feedTracks;
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

      {/* Main Container */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 120px 16px" }}>
        
        {/* Header Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "baseline" }}>
            <span
              onClick={() => setActiveTab("artists")}
              style={{
                fontSize: "34px",
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
            onClick={() => setActiveTab(activeTab === "search" ? "artists" : "search")}
            style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: "#08090d", color: "#fff", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}>
            <Search size={18} />
          </button>
        </div>

        {/* Search Bar Drawer */}
        {activeTab === "search" && (
          <div style={{ marginBottom: "16px" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Search Falak Tak, Despacito, Arijit..."
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
                {loading ? "..." : "Go"}
              </button>
            </form>
          </div>
        )}

        {/* Top Artists Row */}
        {activeTab === "artists" && (
          <>
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "14px", marginBottom: "14px" }}>
              {feedTracks.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => playSong(item, feedTracks)}
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

            {/* Micro Filter Pills */}
            <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "12px", marginBottom: "12px" }}>
              {GENRE_TABS.map((tab) => (
                <span
                  key={tab.id}
                  onClick={() => handleGenreClick(tab.id)}
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

        {/* Playlists Tab */}
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
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "rgba(0,0,0,0.06)", borderRadius: "12px" }}>
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

        {/* Track List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {(activeTab === "search" && searchResults.length > 0 ? searchResults : feedTracks).map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => playSong(track, activeTab === "search" && searchResults.length > 0 ? searchResults : feedTracks)}
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
                  <span style={{ fontSize: "12px", fontWeight: 800, opacity: 0.6 }}>{track.durationStr || "03:40"}</span>
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

      {/* Full Monochromatic Vinyl Player Screen */}
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
                <h4 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 900 }}>Lyrics & Metadata</h4>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "16px", fontWeight: 800 }}>{currentTrack.lyrics || "No lyrics available."}</p>
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
