import React, { useRef } from "react";
import { ArrowLeft, ListMusic, Play, Edit3, Trash2, GripVertical, X } from "lucide-react";
import { EmptyState } from "../components/shared/Section";
import TrackRow from "../components/shared/TrackRow";
import { artStyle } from "../lib/utils";

export default function PlaylistDetail({
  playlist, trackById, onBack, onPlay, onLike, liked, onQueue, onRemove, onDelete,
  renamingId, setRenamingId, onRename, onReorder, currentTrack
}) {
  const tracks = playlist.trackIds.map((id) => trackById[id]).filter(Boolean);
  const dragFrom = useRef(null);

  return (
    <div className="page">
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={15} /> All Playlists
      </button>
      <div className="playlist-header glass">
        <div className="pl-cover lg">
          {tracks.length === 0 ? (
            <div className="pl-cover-empty" style={artStyle(260)}>
              <ListMusic size={30} />
            </div>
          ) : (
            <div className="pl-cover-grid">
              {tracks.slice(0, 4).map((t) => (
                <div key={t.id} style={artStyle(t.hue)} />
              ))}
              {[...Array(Math.max(0, 4 - tracks.length))].map((_, i) => (
                <div key={i} className="pl-cover-blank" />
              ))}
            </div>
          )}
        </div>
        <div className="pl-info">
          {renamingId === playlist.id ? (
            <input
              autoFocus
              className="rename-input"
              defaultValue={playlist.name}
              onBlur={(e) => onRename(playlist.id, e.target.value.trim() || playlist.name)}
              onKeyDown={(e) => e.key === "Enter" && onRename(playlist.id, e.target.value.trim() || playlist.name)}
            />
          ) : (
            <h1>{playlist.name}</h1>
          )}
          <p>
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
          </p>
          <div className="pl-actions">
            <button className="btn-primary sm" onClick={() => tracks[0] && onPlay(tracks[0], tracks)}>
              <Play size={14} fill="currentColor" /> Play
            </button>
            <button className="icon-btn" onClick={() => setRenamingId(playlist.id)} title="Rename">
              <Edit3 size={15} />
            </button>
            <button className="icon-btn danger" onClick={onDelete} title="Delete playlist">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>

      {tracks.length === 0 ? (
        <EmptyState icon={ListMusic} title="This playlist is empty" msg="Add songs from Search or Discover using the + button." />
      ) : (
        <div className="track-list">
          {tracks.map((t, i) => (
            <div
              key={t.id}
              draggable
              onDragStart={() => (dragFrom.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragFrom.current !== null) onReorder(playlist.id, dragFrom.current, i);
                dragFrom.current = null;
              }}
              className="drag-row"
            >
              <span className="drag-handle">
                <GripVertical size={15} />
              </span>
              <TrackRow track={t} onPlay={onPlay} onLike={onLike} liked={liked} onQueue={onQueue} onAddPlaylist={() => {}} isCurrent={currentTrack?.id === t.id} ctxQueue={tracks} />
              <button className="icon-btn sm" onClick={() => onRemove(t.id)} title="Remove">
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
