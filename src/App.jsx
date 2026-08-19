import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, Search, Heart,
  Play, Pause, SkipBack, SkipForward,
  Loader2, AlignLeft, ChevronDown, Home, FolderHeart
} from "lucide-react";

// Fallback Tracks
const DEFAULT_TRACKS = [
  { id: "s1", title: "Starboy", artist: "The Weeknd", ytId: "34Na4j8AVgA", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80" },
  { id: "s2", title: "Zaalima", artist: "Arijit Singh", ytId: "hhdSyH4QCqA", cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&q=80" }
];

export default function App() {
  const [navTab, setNavTab] = useState("home");
  const [queue, setQueue] = useState(DEFAULT_TRACKS);
  const [queueIndex, setQueueIndex] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const playerRef = useRef(null);

  useEffect(() => {
    // Load YouTube API safely
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  }, []);

  const initPlayer = () => {
    playerRef.current = new window.YT.Player("yt-player", {
      height: "0", width: "0",
      events: { onStateChange: (e) => setIsPlaying(e.data === 1) }
    });
  };

  const searchOnline = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    
    // Multiple fast nodes to prevent timeout
    const nodes = [
      `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(term)}&filter=videos`,
      `https://api.piped.kavin.rocks/search?q=${encodeURIComponent(term)}&filter=videos`
    ];

    for (let node of nodes) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000); // 5s timeout
        const res = await fetch(node, { signal: controller.signal });
        clearTimeout(id);
        const data = await res.json();
        
        if (data.items?.length > 0) {
          setSearchResults(data.items.map(i => ({
            id: i.url.replace('/watch?v=', ''),
            title: i.title,
            artist: i.uploaderName,
            cover: i.thumbnail,
            ytId: i.url.replace('/watch?v=', '')
          })));
          setLoading(false);
          return;
        }
      } catch (e) { console.log("Node failed, trying next..."); }
    }
    setLoading(false);
    alert("Server busy, try again in 2 seconds!");
  };

  const play = (track) => {
    if (playerRef.current) {
      playerRef.current.loadVideoById(track.ytId);
      playerRef.current.playVideo();
      setQueue([track]);
      setIsPlaying(true);
    }
  };

  return (
    <div style={{ background: "#08090d", color: "#fff", height: "100vh", padding: "20px" }}>
      <div id="yt-player" />
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>Aura Search</h1>
      <form onSubmit={(e) => { e.preventDefault(); searchOnline(searchQuery); }} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search music..." style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none" }} />
        <button type="submit" style={{ padding: "10px 20px", background: "#00f2fe", borderRadius: "8px", border: "none" }}>{loading ? "..." : "Go"}</button>
      </form>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {searchResults.map(t => (
          <div key={t.id} onClick={() => play(t)} style={{ display: "flex", alignItems: "center", gap: "15px", padding: "10px", background: "#1a1a1a", borderRadius: "8px" }}>
            <img src={t.cover} style={{ width: "50px", borderRadius: "4px" }} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>{t.title}</div>
              <div style={{ fontSize: "12px", color: "#aaa" }}>{t.artist}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
