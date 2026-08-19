import React from "react";
import { Heart, ListPlus, Plus } from "lucide-react";
import TrackArt from "./TrackArt";
import { fmtTime } from "../../lib/utils";

export default function TrackRow({ track, onPlay, onLike, liked, onQueue, onAddPlaylist, isCurrent, ctxQueue }) {
  return (
    <div className={`track-row ${isCurrent ? "current" : ""}`} onClick={() => onPlay(track, ctxQueue)}>
      <TrackArt track={track} size={44} playing={isCurrent} />
      <div className="track-meta">
        <div className="t-title">{track.title}</div>
        <div className="t-sub">{track.artist}</div>
      </div>
      <div className="t-dur mono">{fmtTime(track.dur)}</div>
      <div className="t-actions" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn sm" title="Like" onClick={() => onLike(track)}>
          <Heart size={15} fill={liked.has(track.id) ? "currentColor" : "none"} className={liked.has(track.id) ? "liked" : ""} />
        </button>
        <button className="icon-btn sm" title="Add to queue" onClick={() => onQueue(track)}>
          <ListPlus size={15} />
        </button>
        <button className="icon-btn sm" title="Add to playlist" onClick={() => onAddPlaylist(track)}>
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
