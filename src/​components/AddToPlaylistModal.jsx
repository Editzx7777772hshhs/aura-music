import React from "react";
import { X, ListMusic, Check, Plus } from "lucide-react";
import TrackArt from "../shared/TrackArt";

export default function AddToPlaylistModal({ track, playlists, onAdd, onCreateAndAdd, onClose }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal glass" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Add to playlist</h3>
          <button className="icon-btn sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-track">
          <TrackArt track={track} size={40} />
          <div className="track-meta">
            <div className="t-title">{track.title}</div>
            <div className="t-sub">{track.artist}</div>
          </div>
        </div>
        <div className="modal-list">
          {playlists.map((p) => (
            <button key={p.id} className="modal-pl-row" onClick={() => onAdd(p.id, track)}>
              <ListMusic size={15} />
              <span>{p.name}</span>
              {p.trackIds.includes(track.id) && <Check size={14} className="liked" />}
            </button>
          ))}
        </div>
        <button className="btn-primary sm full" onClick={onCreateAndAdd}>
          <Plus size={15} /> New Playlist
        </button>
      </div>
    </div>
  );
}
