import React from "react";
import { ListMusic, X } from "lucide-react";
import TrackArt from "../shared/TrackArt";
import { EmptyState } from "../shared/Section";

export default function QueueDrawer({ open, onClose, queue, idx, onJump, onRemove }) {
  return (
    <div className={`queue-drawer glass ${open ? "open" : ""}`}>
      <div className="qd-head">
        <h3>
          <ListMusic size={16} /> Queue
        </h3>
        <button className="icon-btn sm" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="qd-list">
        {queue.length === 0 && <EmptyState icon={ListMusic} title="Queue is empty" msg="Add songs to see them here." />}
        {queue.map((t, i) => (
          <div key={i} className={`qd-row ${i === idx ? "current" : ""}`} onClick={() => onJump(i)}>
            <TrackArt track={t} size={38} playing={i === idx} rounded={9} />
            <div className="track-meta">
              <div className="t-title">{t.title}</div>
              <div className="t-sub">{t.artist}</div>
            </div>
            <button
              className="icon-btn sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(i);
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
