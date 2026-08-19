import React from "react";
import { Sparkles, Play, Radio, TrendingUp, Clock, Music2 } from "lucide-react";
import { Section } from "../components/shared/Section";
import TrackCard from "../components/shared/TrackCard";
import { MOODS } from "../lib/constants";

export default function HomePage({ trending, newReleases, recommended, recent, onPlay, onLike, liked, onQueue, onAddPlaylist, onMood, currentTrack }) {
  return (
    <div className="page">
      <div className="hero glass">
        <div className="hero-glow" />
        <div className="hero-eyebrow">
          <Sparkles size={13} /> Curated for you
        </div>
        <h1>
          Your Music.
          <br />
          Your Vibe.
        </h1>
        <p>Search, discover, and play anything on YouTube — wrapped in a player that feels like it's made of light.</p>
        <button className="btn-primary" onClick={() => trending[0] && onPlay(trending[0], trending)}>
          <Play size={15} fill="currentColor" /> Play Trending Now
        </button>
      </div>

      <Section title="Mood" icon={Radio}>
        <div className="mood-row">
          {MOODS.map((m) => (
            <button key={m} className="mood-chip glass" onClick={() => onMood(m)} style={{ "--mh": (MOODS.indexOf(m) * 47) % 360 }}>
              {m}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Trending Now" icon={TrendingUp}>
        <div className="card-grid">
          {trending.map((t) => (
            <TrackCard key={t.id} track={t} onPlay={onPlay} onLike={onLike} liked={liked} onQueue={onQueue} onAddPlaylist={onAddPlaylist} isCurrent={currentTrack?.id === t.id} ctxQueue={trending} />
          ))}
        </div>
      </Section>

      {recent.length > 0 && (
        <Section title="Recently Played" icon={Clock}>
          <div className="card-grid">
            {recent.slice(0, 6).map((t) => (
              <TrackCard key={t.id} track={t} onPlay={onPlay} onLike={onLike} liked={liked} onQueue={onQueue} onAddPlaylist={onAddPlaylist} isCurrent={currentTrack?.id === t.id} ctxQueue={recent} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Recommended" icon={Sparkles}>
        <div className="card-grid">
          {recommended.map((t) => (
            <TrackCard key={t.id} track={t} onPlay={onPlay} onLike={onLike} liked={liked} onQueue={onQueue} onAddPlaylist={onAddPlaylist} isCurrent={currentTrack?.id === t.id} ctxQueue={recommended} />
          ))}
        </div>
      </Section>

      <Section title="New Releases" icon={Music2}>
        <div className="card-grid">
          {newReleases.map((t) => (
            <TrackCard key={t.id} track={t} onPlay={onPlay} onLike={onLike} liked={liked} onQueue={onQueue} onAddPlaylist={onAddPlaylist} isCurrent={currentTrack?.id === t.id} ctxQueue={newReleases} />
          ))}
        </div>
      </Section>
    </div>
  );
}
