import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Home, Compass, Search, ListMusic, Music2, Settings, 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, Loader2
} from "lucide-react";

const INITIAL_TRACKS = [
  {
    id: "init-1",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=electronic-future-beats-117997.mp3"
  },
  {
    id: "init-2",
    title: "Midnight City Groove",
    artist: "Neon Skyline",
    cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3"
  },
  {
    id: "init-3",
    title: "Blinding Lights Energy",
    artist: "Retro Wave",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=synthwave-80s-110045.mp3"
  }
];

export default function App() {
  const [page, setPage] = useState("search");
  const [tracks, setTracks] = useState(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [liked, setLiked] = useState(new Set());
  
  // Audio Player States
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);

  // Search Live Songs from Free Public Music API
  const searchOnlineSongs = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=20`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const formatted = data.results
          .filter(item => item.previewUrl)
          .map(item => ({
            id: String(item.trackId),
            title: item.trackName,
            artist: item.artistName,
            cover: item.artworkUrl100?.replace("100x100bb", "400x400bb") || item.artworkUrl100,
            audioUrl: item.previewUrl
          }));
        setTracks(formatted);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Play selected song
  const handlePlaySong = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = track.audioUrl;
      audioRef.current.play().catch(e => console.log("Playback error:", e));
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.log("Playback error:", e));
      setIsPlaying(true);
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
      audioRef.current.volume = volume || 0.5;
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
    <div style={{ display: "flex", height: "100vh", background: "#0b0c10", color: "#fff", fontFamily: "system-ui, sans-serif", overflow: "hidden" }}>
      
      {/* Hidden Global Audio Engine */}
      <audio 
        ref={audioRef} 
        src={currentTrack?.audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Sidebar */}
      <aside style={{ width: "240px", background: "rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "20px", fontWeight: "bold", color: "#66fcf1", marginBottom: "30px" }}>
          <Sparkles size={24} />
          <span>AURA MUSIC</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          {[
            { id: "home", label: "Home", icon: Home },
            { id: "search", label: "Search Online", icon: Search },
            { id: "discover", label: "Discover", icon: Compass },
            { id: "playlists", label: "Liked Songs", icon: ListMusic },
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
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: "none",
                  background: active ? "rgba(102, 252, 241, 0.15)" : "transparent",
                  color: active ? "#66fcf1" : "#c5c6c7",
                  fontSize: "15px",
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
      </aside>

      {/* Main Area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: "110px" }}>
        
        {/* Search Bar */}
        <header style={{ padding: "16px 30px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "15px" }}>
          <form 
            onSubmit={(e) => { e.preventDefault(); searchOnlineSongs(searchQuery); }}
            style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.06)", padding: "8px 18px", borderRadius: "20px", width: "100%", maxWidth: "450px" }}
          >
            <Search size={18} color="#888" />
            <input 
              type="text" 
              placeholder="Search any song, artist, album online..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: "transparent", border: "none", color: "#fff", outline: "none", width: "100%", fontSize: "14px" }}
            />
            {loading ? <Loader2 size={18} className="animate-spin" color="#66fcf1" /> : (
              <button type="submit" style={{ background: "#66fcf1", border: "none", color: "#000", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}>
                Search
              </button>
            )}
          </form>
        </header>

        {/* Tracks Grid */}
        <div style={{ padding: "30px" }}>
          <h2 style={{ fontSize: "22px", marginBottom: "20px", color: "#fff" }}>
            {page === "playlists" ? "Liked Songs" : "Online Music Feed"}
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px" }}>
            {tracks
              .filter(t => page !== "playlists" || liked.has(t.id))
              .map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div 
                    key={track.id} 
                    onClick={() => handlePlaySong(track)}
                    style={{
                      background: isCurrent ? "rgba(102, 252, 241, 0.1)" : "rgba(255,255,255,0.04)",
                      padding: "14px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "0.2s",
                      border: isCurrent ? "1px solid #66fcf1" : "1px solid transparent"
                    }}
                  >
                    <div style={{ position: "relative", width: "100%", paddingTop: "100%", marginBottom: "10px" }}>
                      <img 
                        src={track.cover} 
                        alt={track.title} 
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} 
                      />
                      {isCurrent && isPlaying && (
                        <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "#66fcf1", color: "#000", borderRadius: "50%", padding: "6px", display: "flex" }}>
                          <Play size={16} fill="#000" />
                        </div>
                      )}
                    </div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</h4>
                    <p style={{ margin: "0", fontSize: "13px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</p>
                  </div>
                );
            })}
          </div>
        </div>
      </main>

      {/* Real Functional Player Bar */}
      <footer style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "90px",
        background: "rgba(15, 15, 20, 0.98)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        zIndex: 100
      }}>
        {/* Track Details */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "260px" }}>
          <img src={currentTrack?.cover} alt="cover" style={{ width: "52px", height: "52px", borderRadius: "6px", objectFit: "cover" }} />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "14px", fontWeight: "bold", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack?.title}</div>
            <div style={{ fontSize: "12px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{currentTrack?.artist}</div>
          </div>
          <button 
            onClick={() => {
              const next = new Set(liked);
              if (next.has(currentTrack.id)) next.delete(currentTrack.id);
              else next.add(currentTrack.id);
              setLiked(next);
            }} 
            style={{ background: "none", border: "none", color: liked.has(currentTrack?.id) ? "#ff4d6d" : "#666", cursor: "pointer" }}
          >
            <Heart size={18} fill={liked.has(currentTrack?.id) ? "#ff4d6d" : "none"} />
          </button>
        </div>

        {/* Player Controls & Seekbar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "45%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button 
              onClick={togglePlayPause}
              style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#66fcf1", color: "#0b0c10", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {isPlaying ? <Pause size={20} fill="#0b0c10" /> : <Play size={20} fill="#0b0c10" />}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%" }}>
            <span style={{ fontSize: "11px", color: "#888", width: "35px", textAlign: "right" }}>{formatTime(currentTime)}</span>
            <input 
              type="range" 
              min="0" 
              max={duration || 100} 
              value={currentTime} 
              onChange={handleSeek}
              style={{ flex: 1, accentColor: "#66fcf1", cursor: "pointer" }} 
            />
            <span style={{ fontSize: "11px", color: "#888", width: "35px" }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "220px", justifyContent: "flex-end" }}>
          <button onClick={toggleMute} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>
            {isMuted ? <VolumeX size={18} color="#ff4d6d" /> : <Volume2 size={18} />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume} 
            onChange={handleVolumeChange}
            style={{ width: "80px", accentColor: "#66fcf1", cursor: "pointer" }} 
          />
        </div>
      </footer>
    </div>
  );
}
