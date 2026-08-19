import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, Search, Heart,
  Play, Pause, SkipBack, SkipForward,
  Loader2, AlignLeft, ChevronDown, Home, FolderHeart
} from "lucide-react";

const STARTER_TRACKS = [
  {
    id: "init-1",
    title: "Khuda Jaane",
    artist: "KK, Shilpa Rao",
    cover: "https://c.saavncdn.com/712/Bachna-Ae-Haseeno-Hindi-2008-20221128032742-500x500.jpg",
    audioUrl: "https://aac.saavncdn.com/712/ba0716a5d454659b8be5d45cf5447a11_160.mp4",
    lyrics: "Sajde mein yun hi jhukta hoon\nTum pe hi aa ke rukta hoon\nKya yeh sab ko hota hai..."
  },
  {
    id: "init-2",
    title: "Bojhena Shey Bojhena",
    artist: "Arijit Singh",
    cover: "https://c.saavncdn.com/978/Bojhena-Shey-Bojhena-Bengali-2012-500x500.jpg",
    audioUrl: "https://aac.saavncdn.com/978/2b2c9535eb0188ca0572b94f1640a3fe_160.mp4",
    lyrics: "Bojhena shey bojhena\nKeno mon je chaay tomake..."
  },
  {
    id: "init-3",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80",
    audioUrl: "https://ia801503.us.archive.org/15/items/audio-sample-archive/starboy_electronic.mp3",
    lyrics: "I'm tryna put you in the worst mood, ah\nP1 cleaner than your church shoes, ah..."
  }
];

export default function App() {
  const [navTab, setNavTab] = useState("home");
  const [queue, setQueue] = useState(STARTER_TRACKS);
  const [queueIndex, setQueueIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
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

  const audioRef = useRef(null);
  const isScrubbing = useRef(false);
  const currentTrack = queue[queueIndex] || STARTER_TRACKS[0];

  useEffect(() => {
    localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked)));
  }, [liked]);

  // Universal Search Resolver (Full High-Bitrate Tracks)
  const searchOnline = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    setSearchFeedback("");

    const q = encodeURIComponent(term.trim());
    const endpoints = [
      `https://saavn.dev/api/search/songs?query=${q}&limit=20`,
      `https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${q}&limit=20`
    ];

    let found = [];

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        const list = data?.data?.results || data?.results || [];

        if (Array.isArray(list) && list.length > 0) {
          found = list.map((item, idx) => {
            const dl = item.downloadUrl?.find(d => d.quality === "160kbps") ||
                       item.downloadUrl?.find(d => d.quality === "320kbps") ||
                       (Array.isArray(item.downloadUrl) ? item.downloadUrl[item.downloadUrl.length - 1] : null);

            const img = item.image?.find(i => i.quality === "500x500") ||
                        (Array.isArray(item.image) ? item.image[item.image.length - 1] : null);

            const stream = dl?.url || dl?.link || (typeof item.downloadUrl === "string" ? item.downloadUrl : "");

            return {
              id: `track-${item.id || idx}-${Date.now()}`,
              title: (item.name || item.title || "Track").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
              artist: item.artists?.primary?.map(a => a.name).join(", ") || item.primaryArtists || "Aura Artist",
              cover: img?.url || img?.link || STARTER_TRACKS[0].cover,
              audioUrl: stream,
              lyrics: `Track: "${(item.name || item.title || '').replace(/&quot;/g, '"')}"\nArtist: ${item.primaryArtists || 'Artist'}\n\nFull-Length Master Track Streaming on Aura.`
            };
          }).filter(t => t.audioUrl);

          if (found.length > 0) break;
        }
      } catch (err) {
        console.warn("Retrying next mirror...", err);
      }
    }

    if (found.length > 0) {
      setSearchResults(found);
    } else {
      setSearchFeedback("Track direct play ke liye available nahi hua. Dusra keyword type karein!");
    }
    setLoading(false);
  };

  const playSong = (track, list) => {
    if (!track?.audioUrl) return;
    const activeList = list && list.length > 0 ? list : STARTER_TRACKS;
    setQueue(activeList);
    const targetIdx = activeList.findIndex((t) => t.id === track.id);
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
    const nextSong = queue[nextIdx];
    if (audioRef.current && nextSong?.audioUrl) {
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
    if (audioRef.current && prevSong?.audioUrl) {
      audioRef.current.src = prevSong.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isScrubbing.current) {
      setCurrentTime(audioRef.current.currentTime);
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
  const likedTracksList = (searchResults.length > 0 ? searchResults : STARTER_TRACKS).filter((t) => liked.has(t.id));

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh", width: "100vw",
      background: "#08090d", color: "#f1f3f5", fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden", position: "relative"
    }}>
      {/* Ambient Moody Drift Background Animation */}
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes drift1 {
          0%, 100% { transform: translate(-10%, -10%) scale(1); }
          50% { transform: translate(10%, 15%) scale(1.15); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(15%, 10%) scale(1.1); }
          50% { transform: translate(-15%, -10%) scale(0.95); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(0%, 20%) scale(1); }
          50% { transform: translate(5%, -20%) scale(1.2); }
        }
        .aura-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: #08090d; overflow: hidden; }
        .aura-blob { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; will-change: transform; }
        .aura-blob-1 { width: 420px; height: 420px; top: -100px; left: -80px; background: radial-gradient(circle, #00f2fe, transparent); animation: drift1 22s ease-in-out infinite; }
        .aura-blob-2 { width: 380px; height: 380px; bottom: -60px; right: -100px; background: radial-gradient(circle, #7928ca, transparent); animation: drift2 26s ease-in-out infinite; }
        .aura-blob-3 { width: 300px; height: 300px; top: 40%; left: 30%; background: radial-gradient(circle, #00f2fe, transparent); animation: drift3 20s ease-in-out infinite; }

        input[type="range"] { -webkit-appearance: none; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.18); outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #00f2fe; cursor: pointer; }
      `}</style>

      {/* Floating Blobs */}
      <div className="aura-bg">
        <div className="aura-blob aura-blob-1" />
        <div className="aura-blob aura-blob-2" />
        <div className="aura-blob aura-blob-3" />
      </div>

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
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        preload="metadata"
      />

      <header style={{ padding: "16px", zIndex: 10, background: "linear-gradient(180deg, rgba(8,9,13,0.95) 0%, transparent 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #00f2fe, #7928ca)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", color: "#08090d" }}>A</div>
            <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px" }}>Aura</span>
          </div>
          <div style={{ padding: "5px 12px", background: "rgba(0,242,254,0.12)", border: "1px solid rgba(0,242,254,0.3)", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "#00f2fe", display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={12} /> FULL TRACK ACTIVE
          </div>
        </div>
      </header>

      <main className="hide-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: "140px", zIndex: 1 }}>
        {navTab === "home" && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ margin: "6px 0 20px", padding: "24px 20px", borderRadius: "20px", background: "linear-gradient(135deg, rgba(0,242,254,0.14), rgba(121,40,202,0.14))", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
              <div style={{ fontSize: "11px", color: "#00f2fe", fontWeight: 800, letterSpacing: "2px", marginBottom: "6px" }}>AURA MUSIC STUDIO</div>
              <h1 style={{ margin: 0, fontSize: "26px", lineHeight: 1.1, fontWeight: 900 }}>Universal Streaming.<br />Lossless Audio.</h1>
              <p style={{ margin: "10px 0 0", color: "#8b949e", fontSize: "13px" }}>Every Bollywood, Tollywood & Global full track.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
              {STARTER_TRACKS.map((item) => (
                <div key={item.id} onClick={() => playSong(item, STARTER_TRACKS)} style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: "8px", overflow: "hidden", cursor: "pointer", border: currentTrack?.id === item.id ? "1px solid #00f2fe" : "1px solid rgba(255,255,255,0.04)" }}>
                  <img src={item.cover} alt={item.title} style={{ width: "48px", height: "48px", objectFit: "cover", flexShrink: 0 }} onError={(e) => { e.target.src = STARTER_TRACKS[0].cover; }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, padding: "0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 12px 0" }}>Featured Songs</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {STARTER_TRACKS.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div key={track.id} onClick={() => playSong(track, STARTER_TRACKS)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px", borderRadius: "8px", background: isCurrent ? "rgba(0,242,254,0.08)" : "transparent", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                      <img src={track.cover} alt={track.title} style={{ width: "44px", height: "44px", borderRadius: "6px", objectFit: "cover" }} onError={(e) => { e.target.src = STARTER_TRACKS[0].cover; }} />
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
              <input type="text" placeholder="Khuda Jaane, Bojhena Shey Bojhena, Starboy..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: "none", outline: "none", color: "#08090d", fontSize: "14px", fontWeight: 600, background: "transparent" }} />
              {loading ? <Loader2 size={18} className="animate-spin" color="#08090d" /> : (
                <button type="submit" style={{ background: "#08090d", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Go</button>
              )}
            </form>

            {searchFeedback && <div style={{ padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", color: "#8b949e", fontSize: "13px", marginBottom: "16px" }}>{searchFeedback}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(searchResults.length > 0 ? searchResults : STARTER_TRACKS).map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div key={track.id} onClick={() => playSong(track, searchResults.length > 0 ? searchResults : STARTER_TRACKS)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px", borderRadius: "8px", background: isCurrent ? "rgba(0,242,254,0.08)" : "rgba(255,255,255,0.03)", cursor: "pointer" }}>
                    <img src={track.cover} alt={track.title} style={{ width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover" }} onError={(e) => { e.target.src = STARTER_TRACKS[0].cover; }} />
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
          <img src={currentTrack.cover} alt="cover" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} onError={(e) => { e.target.src = STARTER_TRACKS[0].cover; }} />
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

      {/* Full Player */}
      {fullPlayerOpen && (
        <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, #182334 0%, #08090d 100%)", zIndex: 999, display: "flex", flexDirection: "column", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <button onClick={() => setFullPlayerOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}><ChevronDown size={28} /></button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", color: "#8b949e", textTransform: "uppercase" }}>Playing on Aura</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>Lossless Audio Master</div>
            </div>
            <button onClick={() => setShowLyrics(!showLyrics)} style={{ background: "none", border: "none", color: showLyrics ? "#00f2fe" : "#8b949e", cursor: "pointer" }}><AlignLeft size={20} /></button>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0" }}>
            {showLyrics ? (
              <div style={{ width: "100%", height: "280px", background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "20px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#00f2fe" }}>Live Lyrics & Info</h4>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "15px", color: "#e4e4e9" }}>{currentTrack.lyrics || "No lyrics available."}</p>
              </div>
            ) : (
              <img src={currentTrack.cover} alt="Big Cover" style={{ width: "100%", maxWidth: "300px", aspectRatio: "1/1", borderRadius: "12px", objectFit: "cover", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }} onError={(e) => { e.target.src = STARTER_TRACKS[0].cover; }} />
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
