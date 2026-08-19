import React from "react";
import { Heart, ListPlus, Plus, Play } from "lucide-react";
import { artStyle } from "../../lib/utils";

export default function TrackCard({ track, onPlay, onLike, liked, onQueue, onAddPlaylist, isCurrent, ctxQueue }) {
  return (
    <div className="track-card glass" onClick={() => onPlay(track, ctxQueue)}>
      <div className="tc-art" style={artStyle(track.hue)}>
        {isCurrent && (
          <div className="viz">
            <span /><span /><span /><span />
          </div>
        )}
        <button className="tc-play">
          <Play size={18} fill="currentColor" />
        </button>
      </div>
      <div className="tc-title">{track.title}</div>
      <div className="tc-sub">{track.artist}</div>
      <div className="tc-actions" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn sm" onClick={() => onLike(track)}>
          <Heart size={13} fill={liked.has(track.id) ? "currentColor" : "none"} className={liked.has(track.id) ? "liked" : ""} />
        </button>
        <button className="icon-btn sm" onClick={() => onQueue(track)}>
          <ListPlus size={13} />
        </button>
        <button className="icon-btn sm" onClick={() => onAddPlaylist(track)}>
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
