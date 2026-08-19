import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, Search, Heart,
  Play, Pause, SkipBack, SkipForward,
  Loader2, AlignLeft, ChevronDown, Home, FolderHeart
} from "lucide-react";

// Curated Bollywood & Global Hits
const DEFAULT_TRACKS = [
  {
    id: "init-1",
    title: "Zaalima",
    artist: "Arijit Singh, Harshdeep Kaur",
    ytId: "hhdSyH4QCqA",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80",
    lyrics: "Jo teri khatir tadpe pehle se hi\nKya use tadpana, o zaalima..."
  },
  {
    id: "init-2",
    title: "Kesariya",
    artist: "Arijit Singh, Pritam",
    ytId: "BddP6PYo2gs",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
    lyrics: "Kesariya tera ishq hai piya\nRang jaaun jo main haath lagaun..."
  },
  {
    id: "init-3",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    ytId: "34Na4j8AVgA",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80",
    lyrics: "I'm tryna put you in the worst mood, ah\nP1 cleaner than your church shoes, ah..."
  }
];

export default function App() {
  const [navTab, setNavTab] = useState("home");
  const [searchResults, setSearchResults] = useState([]);
  const [queue, setQueue] = useState(DEFAULT_TRACKS);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFeedback, setSearchFeedback] = useState("");
  
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const [liked, setLiked] = useState(() => {
    try {
      const s = localStorage.getItem("aura_liked");
      return s ? new Set(JSON.parse(s)) : new Set(["init-1"]);
    } catch { return new Set(["init-1"]); }
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef(null);
  const isScrubbing = useRef(false);
  const currentTrack = queue[queueIndex] || DEFAULT_TRACKS[0];

  useEffect(() => {
    localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked)));
  }, [liked]);

  // Load YouTube Engine API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initEngine = () => {
      playerRef.current = new window.YT.Player("aura-yt-player", {
        height: "0",
        width: "0",
        videoId: currentTrack.ytId,
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
        },
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === window.YT.PlayerState.ENDED) {
              handleNext();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initEngine();
    } else {
      window.onYouTubeIframeAPIReady = initEngine;
    }
  }, []);

  // Time & Duration Sync
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function" && isPlaying) {
        if (!isScrubbing.current) {
          const curr = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (curr) setCurrentTime(curr);
          if (dur && dur > 0) setDuration(dur);
        }
      }
    }, 500);

    return () => clearInterval(timer);
  }, [isPlaying]);

  // Bollywood & Global Universal Search
  const searchOnline = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    setSearchFeedback("");
    setSearchResults([]);

    const q = encodeURIComponent(term.trim() + " audio");
    const endpoints = [
      `https://pipedapi.kavin.rocks/search?q=${q}&filter=videos`,
      `https://invidious.nerdvpn.de/api/v1/search?q=${q}&type=video`,
      `https://inv.tux.pizza/api/v1/search?q=${q}&type=video`
    ];

    let found = [];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        const items = data.items || data;

        if (Array.isArray(items) && items.length > 0) {
          found = items.slice(0, 25).map((item) => {
            const vid = item.videoId || (item.url ? item.url.replace("/watch?v=", "") : "");
            return {
              id: `yt-${vid}`,
              title: item.title,
              artist: item.uploaderName || item.author || "Bollywood Artist",
              ytId: vid,
              cover: item.thumbnail || item.videoThumbnails?.[0]?.url || DEFAULT_TRACKS[0].cover,
              lyrics: `Track: "${item.title}"\nArtist: ${item.uploaderName || item.author}\n\nFull-length Bollywood Audio Stream active on Aura.`
            };
          }).filter(t => t.ytId);

          if (found.length > 0) break;
        }
      } catch (err) {
        console.warn("Retrying next search mirror...", err);
      }
    }

    if (found.length > 0) {
      setSearchResults(found);
    } else {
      setSearchFeedback("Koi track nahi mila. Dusra Bollywood song ya artist try karein!");
    }
    setLoading(false);
  };

  const playSong = (track, list) => {
    if (!track?.ytId) return;
    const activeList = list && list.length > 0 ? list : DEFAULT_TRACKS;
    setQueue(activeList);
    const targetIdx = activeList.findIndex((t) => t.id === track.id);
    setQueueIndex(targetIdx !== -1 ? targetIdx : 0);

    if (playerRef.current && typeof playerRef.current.loadVideoById === "function") {
      playerRef.current.loadVideoById(track.ytId);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const togglePlayPause = (e) => {
    if (e) e.stopPropagation();
    if (!playerRef.current) return;
    if (isPlaying) {
      if (typeof playerRef.current.pauseVideo === "function") playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      if (typeof playerRef.current.playVideo === "function") playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    const nextSong = queue[nextIdx];
    if (playerRef.current && nextSong?.ytId && typeof playerRef.current.loadVideoById === "function") {
      playerRef.current.loadVideoById(nextSong.ytId);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    const prevSong = queue[prevIdx];
    if (playerRef.current && prevSong?.ytId && typeof playerRef.current.loadVideoById === "function") {
      playerRef.current.loadVideoById(prevSong.ytId);
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(time, true);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || !secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
  const likedTracksList = (searchResults.length > 0 ? searchResults : DEFAULT_TRACKS).filter((t) => liked.has(t.id));

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh", width: "100vw",
      background: "radial-gradient(circle at 15% 15%, rgba(0,242,254,0.16), transparent 30%), radial-gradient(circle at 85% 25%, rgba(121,40,202,0.20), transparent 32%), #08090d",
      color: "#f1f3f5", fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden", position: "relative"
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .aura-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
        .aura-orb { position: absolute; width: 280px; height: 280px; border-radius: 50%; filter: blur(80px); opacity: 0.22; animation: auraFloat 10s ease-in-out infinite alternate; }
        .aura-orb.one { top: -100px; left: -100px; background: #00f2fe; }
        .aura-orb.two { top: 25%; right: -120px; background: #7928ca; animation-delay: -3s; }
        @keyframes auraFloat { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(35px, -25px, 0) scale(1.15); } }
        input[type="range"] { -webkit-appearance: none; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.18); outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #00f2fe; cursor: pointer; }
      `}</style>

      {/* Invisible YouTube Stream Engine */}
      <div id="aura-yt-player" style={{ position: "absolute", top: "-9999px", left: "-9999px", pointerEvents: "none" }} />

      <div className="aura-bg">
        <div className="aura-orb one" />
        <div className="aura-orb two" />
      </div>

      <header style={{ padding: "16px", zIndex: 10, background: "linear-gradient(180deg, rgba(8,9,13,0.95) 0%, transparent 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #00f2fe, #7928ca)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", color: "#08090d" }}>A</div>
            <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px" }}>Aura</span>
          </div>
          <div style={{ padding: "5px 12px", background: "rgba(0,242,254,0.12)", border: "1px solid rgba(0,242,254,0.3)", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "#00f2fe", display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={12} /> BOLLYWOOD FULL ENGINE
          </div>
        </div>
      </header>

      <main className="hide-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: "140px", zIndex: 1 }}>
        {navTab === "home" && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ margin: "6px 0 20px", padding: "24px 20px", borderRadius: "20px", background: "linear-gradient(135deg, rgba(0,242,254,0.14), rgba(121,40,202,0.14))", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
              <div style={{ fontSize: "11px", color: "#00f2fe", fontWeight: 800, letterSpacing: "2px", marginBottom: "6px" }}>AURA MUSIC STUDIO</div>
              <h1 style={{ margin: 0, fontSize: "26px", lineHeight: 1.1, fontWeight: 900 }}>Bollywood & Worldwide.<br />Full Length.</h1>
              <p style={{ margin: "10px 0 0", color: "#8b949e", fontSize: "13px" }}>Search any Bollywood or International track.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
              {DEFAULT_TRACKS.map((item) => (
                <div key={item.id} onClick={() => playSong(item, DEFAULT_TRACKS)} style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: "8px", overflow: "hidden", cursor: "pointer", border: currentTrack?.id === item.id ? "1px solid #00f2fe" : "1px solid rgba(255,255,255,0.04)" }}>
                  <img src={item.cover} alt={item.title} style={{ width: "48px", height: "48px", objectFit: "cover", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, padding: "0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 12px 0" }}>Bollywood Trending</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {DEFAULT_TRACKS.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div key={track.id} onClick={() => playSong(track, DEFAULT_TRACKS)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px", borderRadius: "8px", background: isCurrent ? "rgba(0,242,254,0.08)" : "transparent", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                      <img src={track.cover} alt={track.title} style={{ width: "44px", height: "44px", borderRadius: "6px", objectFit: "cover" }} />
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: isCurrent ? "#00f2fe" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
                        <div style={{ fontSize: "12px", color: "#8b949e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</div>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); const next = new Set(liked); if (next.has(track.id)) next.delete(track.id); else next.add(track.id); setLiked(next); }} style={{ background: "none", border: "none", color: liked.has(track.id) ? "#00f2fe" : "#8b949e", cursor: "pointer", padding: "4px" }}>
                      <Heart size={18} fill={liked.has(track.id) ? "#00f2fe" : "none"} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {navTab === "search" && (
          <div style={{ padding: "0 16px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 14px 0" }}>Search Any Song</h2>
            <form onSubmit={(e) => { e.preventDefault(); searchOnline(searchQuery); }} style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" }}>
              <Search size={18} color="#08090d" />
              <input type="text" placeholder="Type Arijit, Zaalima, Diljit, The Weeknd..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: "none", outline: "none", color: "#08090d", fontSize: "14px", fontWeight: 600, background: "transparent" }} />
              {loading ? <Loader2 size={18} className="animate-spin" color="#08090d" /> : (
                <button type="submit" style={{ background: "#08090d", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Go</button>
              )}
            </form>

            {searchFeedback && <div style={{ padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", color: "#8b949e", fontSize: "13px", marginBottom: "16px" }}>{searchFeedback}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(searchResults.length > 0 ? searchResults : DEFAULT_TRACKS).map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div key={track.id} onClick={() => playSong(track, searchResults.length > 0 ? searchResults : DEFAULT_TRACKS)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "8px", background: isCurrent ? "rgba(0,242,254,0.08)" : "rgba(255,255,255,0.03)", cursor: "pointer" }}>
                    <img src={track.cover} alt={track.title} style={{ width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover" }} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: isCurrent ? "#00f2fe" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
                      <div style={{ fontSize: "12px", color: "#8b949e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</div>
                    </div>
                    <Play size={18} fill="#00f2fe" color="#00f2fe" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {navTab === "library" && (
          <div style={{ padding: "0 16px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 16px 0" }}>Your Library</h2>
            <div onClick={() => { if (likedTracksList.length > 0) playSong(likedTracksList[0], likedTracksList); }} style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", background: "rgba(255,255,255,0.04)", padding: "12px", borderRadius: "10px" }}>
              <div style={{ width: "54px", height: "54px", borderRadius: "6px", background: "linear-gradient(135deg, #450af5, #c4efd9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Heart size={22} fill="#fff" color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700 }}>Liked Songs</div>
                <div style={{ fontSize: "12px", color: "#8b949e" }}>{liked.size} tracks saved</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mini Player */}
      <div onClick={() => setFullPlayerOpen(true)} style={{ position: "fixed", bottom: "64px", left: "8px", right: "8px", height: "56px", background: "rgba(18, 22, 34, 0.96)", backdropFilter: "blur(25px)", borderRadius: "8px", border: "1px solid rgba(0, 242, 254, 0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", zIndex: 90, cursor: "pointer" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, height: "2px", width: `${progressPct}%`, background: "#00f2fe", borderRadius: "2px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
          <img src={currentTrack.cover} alt="cover" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
            <div style={{ fontSize: "11px", color: "#8b949e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={(e) => { e.stopPropagation(); const next = new Set(liked); if (next.has(currentTrack.id)) next.delete(currentTrack.id); else next.add(currentTrack.id); setLiked(next); }} style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#00f2fe" : "#8b949e", cursor: "pointer" }}>
            <Heart size={18} fill={liked.has(currentTrack.id) ? "#00f2fe" : "none"} />
          </button>
          <button onClick={togglePlayPause} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px" }}>
            {isPlaying ? <Pause size={22} fill="#fff" /> : <Play size={22} fill="#fff" />}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "60px", background: "rgba(8,9,13,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 100 }}>
        {[
          { id: "home", label: "Home", icon: Home },
          { id: "search", label: "Search", icon: Search },
          { id: "library", label: "Your Library", icon: FolderHeart }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = navTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setNavTab(tab.id)} style={{ background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", color: active ? "#00f2fe" : "#8b949e", cursor: "pointer", fontSize: "10px", fontWeight: active ? 700 : 500 }}>
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Fullscreen Player */}
      {fullPlayerOpen && (
        <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, #182334 0%, #08090d 100%)", zIndex: 999, display: "flex", flexDirection: "column", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <button onClick={() => setFullPlayerOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><ChevronDown size={28} /></button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", color: "#8b949e", textTransform: "uppercase" }}>Playing on Aura</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>Full Length Stream</div>
            </div>
            <button onClick={() => setShowLyrics(!showLyrics)} style={{ background: "none", border: "none", color: showLyrics ? "#00f2fe" : "#8b949e", cursor: "pointer" }}><AlignLeft size={20} /></button>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0" }}>
            {showLyrics ? (
              <div style={{ width: "100%", height: "280px", background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "20px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#00f2fe" }}>Live Lyrics</h4>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "15px", color: "#e4e4e9" }}>{currentTrack.lyrics || "No lyrics available."}</p>
              </div>
            ) : (
              <img src={currentTrack.cover} alt="Big Cover" style={{ width: "100%", maxWidth: "300px", aspectRatio: "1/1", borderRadius: "12px", objectFit: "cover", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }} />
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ overflow: "hidden" }}>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#8b949e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</p>
            </div>
            <button onClick={() => { const next = new Set(liked); if (next.has(currentTrack.id)) next.delete(currentTrack.id); else next.add(currentTrack.id); setLiked(next); }} style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#00f2fe" : "#8b949e", cursor: "pointer" }}>
              <Heart size={24} fill={liked.has(currentTrack.id) ? "#00f2fe" : "none"} />
            </button>
          </div>

          {/* Complete Duration Progress Bar */}
          <div style={{ marginBottom: "20px" }}>
            <input type="range" min="0" max={duration || 100} value={currentTime} onMouseDown={() => { isScrubbing.current = true; }} onMouseUp={() => { isScrubbing.current = false; }} onTouchStart={() => { isScrubbing.current = true; }} onTouchEnd={() => { isScrubbing.current = false; }} onChange={handleSeek} style={{ width: "100%", cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8b949e", marginTop: "6px" }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", marginBottom: "20px" }}>
            <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><SkipBack size={28} fill="#fff" /></button>
            <button onClick={togglePlayPause} style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fff", color: "#08090d", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {isPlaying ? <Pause size={26} fill="#08090d" /> : <Play size={26} fill="#08090d" style={{ marginLeft: "2px" }} />}
            </button>
            <button onClick={handleNext} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><SkipForward size={28} fill="#fff" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

