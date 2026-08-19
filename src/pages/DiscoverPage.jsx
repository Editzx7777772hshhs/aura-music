import React from "react";
import { Compass } from "lucide-react";
import { EmptyState } from "../components/shared/Section";
import TrackCard from "../components/shared/TrackCard";
import { MOODS } from "../lib/constants";

export default function DiscoverPage({ activeMood, setActiveMood, tracks, onPlay, onLike, liked, onQueue, onAddPlaylist, currentTrack }) {
  return (
    <div className="page">
      <div className="page-title-row">
        <h1>Discover</h1>
        <p>Browse by mood, or clear the filter to see everything.</p>
      </div>
      <div className="mood-row">
        <button className={`mood-chip glass ${!activeMood ? "active" : ""}`} onClick={() => setActiveMood(null)}>
          All
        </button>
        {MOODS.map((m) => (
          <button key={m} className={`mood-chip glass ${activeMood === m ? "active" : ""}`} onClick={() => setActiveMood(m)} style={{ "--mh": (MOODS.indexOf(m) * 47) % 360 }}>
            {m}
          </button>
        ))}
      </div>
      <div className="card-grid lg">
        {tracks.map((t) => (
          <TrackCard key={t.id} track={t} onPlay={onPlay} onLike={onLike} liked={liked} onQueue={onQueue} onAddPlaylist={onAddPlaylist} isCurrent={currentTrack?.id === t.id} ctxQueue={tracks} />
        ))}
      </div>
      {tracks.length === 0 && <EmptyState icon={Compass} title="Nothing here yet" msg="Try a different mood." />}
    </div>
  );
}
