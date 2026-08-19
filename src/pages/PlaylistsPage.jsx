import React from "react";
import { Plus, ListMusic } from "lucide-react";
import { EmptyState } from "../components/shared/Section";
import { artStyle } from "../lib/utils";

export default function PlaylistsPage({ playlists, trackById, onOpen, newPlaylistName, setNewPlaylistName, onCreate }) {
  return (
    <div className="page">
      <div className="page-title-row">
        <h1>Your Playlists</h1>
        <p>No limits — create as many as you like.</p>
      </div>
      <div className="new-playlist-row glass">
        <input
          placeholder="Name your new playlist…"
          value={newPlaylistName}
          onChange={(e) => setNewPlaylistName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCreate()}
        />
        <button className="btn-primary sm" onClick={onCreate}>
          <Plus size={15} /> Create
        </button>
      </div>
      {playlists.length === 0 ? (
        <EmptyState icon={ListMusic} title="No playlists yet" msg="Create your first playlist above." />
      ) : (
        <div className="card-grid">
          {playlists.map((p) => {
            const covers = p.trackIds.slice(0, 4).map((id) => trackById[id]).filter(Boolean);
            return (
              <div key={p.id} className="playlist-card glass" onClick={() => onOpen(p.id)}>
                <div className="pl-cover">
                  {covers.length === 0 ? (
                    <div className="pl-cover-empty" style={artStyle(260)}>
                      <ListMusic size={22} />
                    </div>
                  ) : (
                    <div className="pl-cover-grid">
                      {covers.map((t) => (
                        <div key={t.id} style={artStyle(t.hue)} />
                      ))}
                      {[...Array(Math.max(0, 4 - covers.length))].map((_, i) => (
                        <div key={i} className="pl-cover-blank" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="tc-title">{p.name}</div>
                <div className="tc-sub">
                  {p.trackIds.length} track{p.trackIds.length === 1 ? "" : "s"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
