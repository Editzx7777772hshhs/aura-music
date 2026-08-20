import React, { useState, useEffect, useRef } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Heart, Search,
  ChevronDown, AlignLeft, HardDrive, AlertCircle
} from "lucide-react";

export default function App() {
  const [queue, setQueue] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fullPlayerOpen, setFullPlayerOpen] = useState(false);
  
  const audioRef = useRef(null);

  // Global Engine: Piped API (The most stable global source)
  const searchGlobal = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      // Using a stable public Piped instance
      const response = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(term)}&filter=videos`);
      const data = await response.json();
      
      const formatted = data.items.map(item => ({
        id: item.url.replace('/watch?v=', ''),
        title: item.title,
        artist: item.uploaderName,
        cover: item.thumbnail,
        streamUrl: `https://piped.kavin.rocks/videoplayback?id=${item.url.replace('/watch?v=', '')}`,
        duration: item.duration
      }));
      setResults(formatted);
    } catch (e) {
      console.error("Global Engine Error:", e);
    }
    setLoading(false);
  };

  const playSong = (track) => {
    setCurrentTrack(track);
    if (audioRef.current) {
      audioRef.current.src = track.streamUrl;
      audioRef.current.play().then(() => setIsPlaying(true));
    }
  };

  return (
    <div style={{ height: "100vh", background: "#f4f3ef", padding: "20px" }}>
      {/* Search Input */}
      <form onSubmit={(e) => { e.preventDefault(); searchGlobal(searchQuery); }} style={{ display: "flex", gap: "10px" }}>
        <input 
          placeholder="Search global, Bollywood, everything..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: "15px", borderRadius: "10px", border: "2px solid #000" }}
        />
        <button type="submit" style={{ padding: "0 20px", background: "#000", color: "#fff", borderRadius: "10px" }}>
          {loading ? "Searching..." : "Go"}
        </button>
      </form>

      {/* Results */}
      <div style={{ marginTop: "20px" }}>
        {results.map(track => (
          <div key={track.id} onClick={() => playSong(track)} style={{ display: "flex", gap: "10px", marginBottom: "10px", cursor: "pointer" }}>
            <img src={track.cover} style={{ width: "50px", height: "50px", borderRadius: "10px" }} />
            <div>
              <div style={{ fontWeight: 900 }}>{track.title}</div>
              <div style={{ fontSize: "12px" }}>{track.artist}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Audio Engine */}
      <audio ref={audioRef} />

      {/* Persistent Mini Player */}
      {currentTrack && (
        <div style={{ position: "fixed", bottom: 20, left: 20, right: 20, background: "#000", color: "#fff", padding: "15px", borderRadius: "20px", display: "flex", justifyContent: "space-between" }}>
          <span>{currentTrack.title}</span>
          <button onClick={() => isPlaying ? audioRef.current.pause() : audioRef.current.play()} style={{ background: "#fff", border: "none", borderRadius: "50%", width: "30px", height: "30px" }}>
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      )}
    </div>
  );
}
