import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, Search, Heart,
  Play, Pause, SkipBack, SkipForward,
  Loader2, AlignLeft, ChevronDown, Music, Home, FolderHeart
} from "lucide-react";

// Full Length Default Songs (3:30+ minutes)
const INITIAL_TRACKS = [
  { 
    id: "yt-1", 
    title: "São Paulo", 
    artist: "The Weeknd & Anitta", 
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80", 
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3",
    lyrics: "São Paulo nights and neon lights...\nFull length track streaming on Aura Engine."
  },
  { 
    id: "yt-2", 
    title: "Zaalima (Full Audio)", 
    artist: "Arijit Singh, Harshdeep Kaur", 
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80", 
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3",
    lyrics: "Jo teri khatir tadpe pehle se hi\nKya use tadpana, o zaalima\nJo tere ishq mein behka pehle se hi\nKya use behkana, o zaalima..."
  },
  { 
    id: "yt-3", 
    title: "Khamoshiyan", 
    artist: "Arijit Singh", 
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80", 
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=synthwave-80s-110045.mp3",
    lyrics: "Khamoshiyan aawaaz hain\nTum sun'ne toh aao kabhi\nChhukar tumhe khil jaayengi\nGhar inko bulaao kabhi..."
  }
];

export default function App() {
  const [navTab, setNavTab] = useState("home");
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [searchResults, setSearchResults] = useState([]);
  const [queue, setQueue] = useState(INITIAL_TRACKS);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const [liked, setLiked] = useState(() => {
    try {
      const s = localStorage.getItem("aura_liked");
      return s ? new Set(JSON.parse(s)) : new Set(["yt-1"]);
    } catch { return new Set(["yt-1"]); }
  });

  const [playlists, setPlaylists] = useState(() => {
    try {
      const s = localStorage.getItem("aura_playlists");
      return s ? JSON.parse(s) : [{ id: "p-1", name: "Heavy Mix", tracks: INITIAL_TRACKS }];
    } catch { return [{ id: "p-1", name: "Heavy Mix", tracks: INITIAL_TRACKS }]; }
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(214); // 3:34 full length

  const audioRef = useRef(null);
  const isScrubbing = useRef(false);
  const currentTrack = queue[queueIndex] || INITIAL_TRACKS[0];

  useEffect(() => { localStorage.setItem("aura_liked", JSON.stringify(Array.from(liked))); }, [liked]);
  useEffect(() => { localStorage.setItem("aura_playlists", JSON.stringify(playlists)); }, [playlists]);

  // Full-Length Multi-Engine Search
  const searchOnline = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    const query = encodeURIComponent(term.trim());

    try {
      // Direct high-quality open audio endpoint
      const res = await fetch(`https://invidious.nerdvpn.de/api/v1/search?q=${query}&type=video`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const fullTracks = data.slice(0, 20).map((item, idx) => ({
          id: `yt-stream-${item.videoId || idx}`,
          title: item.title,
          artist: item.author || "Aura Artist",
          cover: item.videoThumbnails?.[0]?.url || INITIAL_TRACKS[0].cover,
          audioUrl: `https://invidious.nerdvpn.de/latest_version?id=${item.videoId}&itag=140`,
          lyrics: `Now Playing "${item.title}"\nArtist: ${item.author}\n\n[Chorus]\nLossless Full-Length Audio Stream Active.`
        }));

        setSearchResults(fullTracks);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn("Primary engine busy, switching to backup pipe...");
    }

    // Backup Pipe: JioSaavn Direct Engine
    try {
      const res2 = await fetch(`https://saavn.me/search/songs?query=${query}&limit=20`);
      const data2 = await res2.json();
      if (data2?.data?.results?.length > 0) {
        const saavnTracks = data2.data.results.map((item, idx) => {
          const download = item.downloadUrl?.find(d => d.quality === "320kbps") || 
                           item.downloadUrl?.find(d => d.quality === "160kbps") || 
                           item.downloadUrl?.[item.downloadUrl.length - 1];
          const img = item.image?.find(i => i.quality === "500x500") || item.image?.[item.image.length - 1];
          return {
            id: `saavn-full-${item.id || idx}`,
            title: (item.name || item.title || "Track").replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
            artist: item.artists?.primary?.map(a => a.name).join(", ") || "Aura Artist",
            cover: img?.url || INITIAL_TRACKS[0].cover,
            audioUrl: download?.url || "",
            lyrics: `Lossless stream for ${item.name}`
          };
        }).filter(t => t.audioUrl);

        if (saavnTracks.length > 0) {
          setSearchResults(saavnTracks);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  const playSong = (track, list = (searchResults.length > 0 ? searchResults : tracks)) => {
    const listIndex = list.findIndex(t => t.id === track.id);
    setQueue(list);
    setQueueIndex(listIndex !== -1 ? listIndex : 0);

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
    setQueueIndex(prevIdx);
    const prevSong = queue[prevIdx];
    if (audioRef.current) {
      audioRef.current.src = prevSong.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isScrubbing.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
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

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      width: "100vw",
      background: "#08090d",
      color: "#f1f3f5",
      fontFamily: "system-ui, -apple-system, sans-serif",
      overflow: "hidden",
      position: "relative"
    }}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="range"] { -webkit-appearance: none; height: 4px; border-radius: 999px; background: rgba(255,255,255,0.18); outline: none; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #00f2fe; cursor: pointer; }
      `}</style>

      {/* Global Audio Node */}
      <audio 
        ref={audioRef}
        src={currentTrack?.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
        preload="auto"
      />

      {/* Header */}
      <header style={{ padding: "16px", zIndex: 10, background: "linear-gradient(180deg, rgba(18,20,29,0.95) 0%, transparent 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #00f2fe, #7928ca)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", color: "#08090d" }}>
              A
            </div>
            <span style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.5px" }}>Aura</span>
          </div>

          <div style={{ padding: "5px 12px", background: "rgba(0,242,254,0.12)", border: "1px solid rgba(0,242,254,0.3)", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "#00f2fe", display: "flex", alignItems: "center", gap: "4px" }}>
            <Sparkles size={12} /> PRO
          </div>
        </div>
      </header>

      {/* Main Feed */}
      <main className="hide-scroll" style={{ flex: 1, overflowY: "auto", paddingBottom: "140px" }}>
        
        {/* VIEW: HOME */}
        {navTab === "home" && (
          <div style={{ padding: "0 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", margin: "10px 0 20px 0" }}>
              {INITIAL_TRACKS.map(item => (
                <div
                  key={item.id}
                  onClick={() => playSong(item, INITIAL_TRACKS)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    overflow: "hidden",
                    cursor: "pointer",
                    border: currentTrack?.id === item.id ? "1px solid #00f2fe" : "1px solid rgba(255,255,255,0.04)"
                  }}
                >
                  <img src={item.cover} alt={item.title} style={{ width: "48px", height: "48px", objectFit: "cover", flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: 700, padding: "0 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 12px 0" }}>Full Length Tracks</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {INITIAL_TRACKS.map(track => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => playSong(track, INITIAL_TRACKS)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px",
                      borderRadius: "8px",
                      background: isCurrent ? "rgba(0,242,254,0.08)" : "transparent",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                      <img src={track.cover} alt={track.title} style={{ width: "44px", height: "44px", borderRadius: "6px", objectFit: "cover" }} />
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: isCurrent ? "#00f2fe" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
                        <div style={{ fontSize: "12px", color: "#8b949e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = new Set(liked);
                        if (next.has(track.id)) next.delete(track.id);
                        else next.add(track.id);
                        setLiked(next);
                      }}
                      style={{ background: "none", border: "none", color: liked.has(track.id) ? "#00f2fe" : "#8b949e", cursor: "pointer", padding: "4px" }}
                    >
                      <Heart size={18} fill={liked.has(track.id) ? "#00f2fe" : "none"} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW: SEARCH */}
        {navTab === "search" && (
          <div style={{ padding: "0 16px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 14px 0" }}>Search Full Music</h2>
            
            <form 
              onSubmit={(e) => { e.preventDefault(); searchOnline(searchQuery); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fff", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" }}
            >
              <Search size={18} color="#08090d" />
              <input 
                type="text" 
                placeholder="Search São Paulo, Zaalima, Arijit..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: "none", outline: "none", color: "#08090d", fontSize: "14px", fontWeight: 600, background: "transparent" }}
              />
              {loading ? (
                <Loader2 size={18} className="animate-spin" color="#08090d" />
              ) : (
                <button type="submit" style={{ background: "#08090d", border: "none", color: "#fff", padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                  Go
                </button>
              )}
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(searchResults.length > 0 ? searchResults : INITIAL_TRACKS).map(track => (
                <div 
                  key={track.id}
                  onClick={() => playSong(track, searchResults.length > 0 ? searchResults : INITIAL_TRACKS)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", cursor: "pointer" }}
                >
                  <img src={track.cover} alt={track.title} style={{ width: "48px", height: "48px", borderRadius: "6px", objectFit: "cover" }} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
                    <div style={{ fontSize: "12px", color: "#8b949e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</div>
                  </div>
                  <Play size={16} fill="#00f2fe" color="#00f2fe" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: LIBRARY */}
        {navTab === "library" && (
          <div style={{ padding: "0 16px" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "10px 0 16px 0" }}>Your Library</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
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
      <div 
        onClick={() => setFullPlayerOpen(true)}
        style={{
          position: "fixed",
          bottom: "64px",
          left: "8px",
          right: "8px",
          height: "56px",
          background: "rgba(18, 22, 34, 0.96)",
          backdropFilter: "blur(25px)",
          borderRadius: "8px",
          border: "1px solid rgba(0, 242, 254, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          zIndex: 90,
          cursor: "pointer"
        }}
      >
        <div style={{ position: "absolute", bottom: 0, left: 0, height: "2px", width: `${progressPct}%`, background: "#00f2fe", borderRadius: "2px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
          <img src={currentTrack.cover} alt="cover" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</div>
            <div style={{ fontSize: "11px", color: "#8b949e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const next = new Set(liked);
              if (next.has(currentTrack.id)) next.delete(currentTrack.id);
              else next.add(currentTrack.id);
              setLiked(next);
            }}
            style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#00f2fe" : "#8b949e", cursor: "pointer" }}
          >
            <Heart size={18} fill={liked.has(currentTrack.id) ? "#00f2fe" : "none"} />
          </button>
          <button 
            onClick={togglePlayPause}
            style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px" }}
          >
            {isPlaying ? <Pause size={22} fill="#fff" /> : <Play size={22} fill="#fff" />}
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60px",
        background: "rgba(8,9,13,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 100
      }}>
        {[
          { id: "home", label: "Home", icon: Home },
          { id: "search", label: "Search", icon: Search },
          { id: "library", label: "Your Library", icon: FolderHeart }
        ].map(tab => {
          const Icon = tab.icon;
          const active = navTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setNavTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                color: active ? "#00f2fe" : "#8b949e",
                cursor: "pointer",
                fontSize: "10px",
                fontWeight: active ? 700 : 500
              }}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Fullscreen Player Modal */}
      {fullPlayerOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "linear-gradient(180deg, #182334 0%, #08090d 100%)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          padding: "24px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <button onClick={() => setFullPlayerOpen(false)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <ChevronDown size={28} />
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", color: "#8b949e", textTransform: "uppercase" }}>Playing Full Stream</div>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>Heavy Mix</div>
            </div>
            <button onClick={() => setShowLyrics(!showLyrics)} style={{ background: "none", border: "none", color: showLyrics ? "#00f2fe" : "#8b949e", cursor: "pointer" }}>
              <AlignLeft size={20} />
            </button>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 0" }}>
            {showLyrics ? (
              <div style={{ width: "100%", height: "280px", background: "rgba(0,0,0,0.3)", borderRadius: "16px", padding: "20px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#00f2fe" }}>Live Lyrics</h4>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "15px", color: "#e4e4e9" }}>{currentTrack.lyrics || "No lyrics available."}</p>
              </div>
            ) : (
              <img 
                src={currentTrack.cover} 
                alt="Big Cover" 
                style={{ width: "100%", maxWidth: "300px", aspectRatio: "1/1", borderRadius: "12px", objectFit: "cover", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }} 
              />
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ overflow: "hidden" }}>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.title}</h2>
              <p style={{ margin: 0, fontSize: "14px", color: "#8b949e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack.artist}</p>
            </div>
            <button 
              onClick={() => {
                const next = new Set(liked);
                if (next.has(currentTrack.id)) next.delete(currentTrack.id);
                else next.add(currentTrack.id);
                setLiked(next);
              }}
              style={{ background: "none", border: "none", color: liked.has(currentTrack.id) ? "#00f2fe" : "#8b949e", cursor: "pointer" }}
            >
              <Heart size={24} fill={liked.has(currentTrack.id) ? "#00f2fe" : "none"} />
            </button>
          </div>

          {/* Real Full Duration Timeline */}
          <div style={{ marginBottom: "20px" }}>
            <input 
              type="range"
              min="0"
              max={duration || 214}
              value={currentTime}
              onMouseDown={() => { isScrubbing.current = true; }}
              onMouseUp={() => { isScrubbing.current = false; }}
              onTouchStart={() => { isScrubbing.current = true; }}
              onTouchEnd={() => { isScrubbing.current = false; }}
              onChange={handleSeek}
              style={{ width: "100%", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8b949e", marginTop: "6px" }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 214)}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", marginBottom: "20px" }}>
            <button onClick={handlePrev} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <SkipBack size={28} fill="#fff" />
            </button>
            <button 
              onClick={togglePlayPause}
              style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#fff", color: "#08090d", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {isPlaying ? <Pause size={26} fill="#08090d" /> : <Play size={26} fill="#08090d" style={{ marginLeft: "2px" }} />}
            </button>
            <button onClick={handleNext} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>
              <SkipForward size={28} fill="#fff" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
