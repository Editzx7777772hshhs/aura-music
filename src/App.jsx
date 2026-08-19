import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Search, Heart, Play, Pause, SkipBack, SkipForward, Loader2, ChevronDown, AlignLeft, Music, Home, FolderHeart, Volume2, VolumeX } from "lucide-react";

export default function App() {
  const [navTab, setNavTab] = useState("home");
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  
  const playerRef = useRef(null);
  const currentTrack = queue[queueIndex] || { title: "Select a song", artist: "Aura Music" };

  // Load YouTube Iframe API
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('yt-player', {
        height: '0', width: '0',
        events: {
          onStateChange: (e) => setIsPlaying(e.data === window.YT.PlayerState.PLAYING)
        }
      });
    };
  }, []);

  const searchOnline = async (term) => {
    setLoading(true);
    try {
      // Using Invidious API for high-quality full length streams
      const res = await fetch(`https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(term)}&type=video`);
      const data = await res.json();
      const mapped = data.map(v => ({
        id: v.videoId,
        title: v.title,
        artist: v.author,
        cover: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      }));
      setQueue(mapped);
      setQueueIndex(0);
      playerRef.current.loadVideoById(mapped[0].videoId);
      playerRef.current.playVideo();
    } catch (e) { alert("Search failed, please try again."); }
    setLoading(false);
  };

  const playSong = (index) => {
    setQueueIndex(index);
    playerRef.current.loadVideoById(queue[index].videoId);
    playerRef.current.playVideo();
  };

  return (
    <div style={{ background: "#08090d", color: "#fff", minHeight: "100vh", fontFamily: "sans-serif", paddingBottom: "100px" }}>
      {/* Hidden Player */}
      <div id="yt-player" style={{ display: "none" }} />

      {/* Header */}
      <header style={{ padding: "20px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", color: "#00f2fe" }}>Aura Music</h1>
      </header>

      {/* Search */}
      <div style={{ padding: "0 20px" }}>
        <form onSubmit={(e) => { e.preventDefault(); searchOnline(searchQuery); }} style={{ display: "flex", gap: "10px" }}>
          <input 
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search full length songs..."
            style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none" }}
          />
          <button type="submit" style={{ padding: "10px 20px", background: "#00f2fe", border: "none", borderRadius: "8px" }}>Go</button>
        </form>
      </div>

      {/* Results */}
      <div style={{ padding: "20px" }}>
        {queue.map((t, i) => (
          <div key={t.id} onClick={() => playSong(i)} style={{ padding: "10px", background: "#16161d", marginBottom: "10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={t.cover} style={{ width: "50px", height: "50px", borderRadius: "4px" }} />
            <div>
              <div style={{ fontWeight: "bold" }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "#aaa" }}>{t.artist}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Mini Player */}
      <div style={{ position: "fixed", bottom: 60, left: 0, right: 0, background: "#16161d", padding: "15px", display: "flex", justifyContent: "space-between" }}>
        <span>{currentTrack.title}</span>
        <button onClick={() => isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo()}>
          {isPlaying ? <Pause /> : <Play />}
        </button>
      </div>
    </div>
  );
}
