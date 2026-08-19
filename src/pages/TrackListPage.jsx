import React from "react";
import { EmptyState } from "../components/shared/Section";
import TrackRow from "../components/shared/TrackRow";

export default function TrackListPage({ title, subtitle, icon, tracks, onPlay, onLike, liked, onQueue, onAddPlaylist, currentTrack, emptyMsg }) {
  return (
    <div className="page">
      <div className="page-title-row">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {tracks.length === 0 ? (
        <EmptyState icon={icon} title={`No ${title.toLowerCase()} yet`} msg={emptyMsg} />
      ) : (
        <div className="track-list">
          {tracks.map((t, i) => (
            <TrackRow key={`${t.id}-${i}`} track={t} onPlay={onPlay} onLike={onLike} liked={liked} onQueue={onQueue} onAddPlaylist={onAddPlaylist} isCurrent={currentTrack?.id === t.id} ctxQueue={tracks} />
          ))}
        </div>
      )}
    </div>
  );
}
