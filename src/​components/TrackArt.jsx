import React from "react";
import { artStyle } from "../../lib/utils";

export default function TrackArt({ track, size = 48, playing = false, rounded = 14 }) {
  return (
    <div className="track-art" style={{ width: size, height: size, borderRadius: rounded, ...artStyle(track.hue) }}>
      {playing && (
        <div className="viz">
          <span /><span /><span /><span />
        </div>
      )}
    </div>
  );
}
