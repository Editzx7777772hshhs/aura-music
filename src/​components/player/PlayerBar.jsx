import React, { useEffect } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Shuffle,
  Volume2, VolumeX, Heart, ListMusic, Music2
} from "lucide-react";
import TrackArt from "../shared/TrackArt";
import { artStyle, fmtTime } from "../../lib/utils";

export default function PlayerBar({
  track, isPlaying, progress, duration, volume, muted, repeatMode, shuffle, liked, queueLen,
  onToggle, onNext, onPrev, onSeek, onVolume, onMute, onRepeat, onShuffle, onLike, onQueueToggle
}) {
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.code === "Space") { e.preventDefault(); onToggle(); }
      if (e.code === "ArrowRight" && e.shiftKey) onNext();
      if (e.code === "ArrowLeft" && e.shiftKey) onPrev();
      if (e.key === "m" || e.key === "M") onMute();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onToggle, onNext, onPrev, onMute]);

  if (!track) {
    return (
      <div className="player-bar glass empty">
        <div className="pb-empty">
          <Music2 size={16} /> Pick a track to start listening
        </div>
      </div>
    );
  }

  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div className="player-bar glass">
      <div className="pb-glow" style={artStyle(track.hue)} />
      <div className="pb-track">
        <TrackArt track={track} size={52} playing={isPlaying} rounded={12} />
        <div className="track-meta">
          <div className="t-title">{track.title}</div>
          <div className="t-sub">{track.artist}</div>
        </div>
        <button className="icon-btn sm only-desktop" onClick={onLike}>
          <Heart size={15} fill={liked.has(track.id) ? "currentColor" : "none"} className={liked.has(track.id) ? "liked" : ""} />
        </button>
      </div>

      <div className="pb-center">
        <div className="pb-controls">
          <button className={`icon-btn ${shuffle ? "active" : ""} only-desktop`} onClick={onShuffle} title="Shuffle">
            <Shuffle size={16} />
          </button>
          <button className="icon-btn" onClick={onPrev} title="Previous">
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button className="play-btn" onClick={onToggle} title="Play/Pause">
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>
          <button className="icon-btn" onClick={onNext} title="Next">
            <SkipForward size={18} fill="currentColor" />
          </button>
          <button className={`icon-btn ${repeatMode !== "off" ? "active" : ""} only-desktop`} onClick={onRepeat} title="Repeat">
            {repeatMode === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>
        <div className="pb-progress only-desktop">
          <span className="mono">{fmtTime(progress)}</span>
          <div
            className="seek"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onSeek(((e.clientX - r.left) / r.width) * duration);
            }}
          >
            <div className="seek-fill" style={{ width: `${pct}%` }} />
            <div className="seek-thumb" style={{ left: `${pct}%` }} />
          </div>
          <span className="mono">{fmtTime(duration)}</span>
        </div>
      </div>

      <div className="pb-right only-desktop">
        <button className="icon-btn" onClick={onQueueToggle} title="Queue">
          <ListMusic size={16} />
          {queueLen > 0 && <span className="badge">{queueLen}</span>}
        </button>
        <button className="icon-btn" onClick={onMute}>
          {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <div className="volume-slider">
          <div className="vs-fill" style={{ width: `${muted ? 0 : volume}%` }} />
          <input type="range" min="0" max="100" value={muted ? 0 : volume} onChange={(e) => onVolume(Number(e.target.value))} />
        </div>
      </div>
    </div>
  );
}
