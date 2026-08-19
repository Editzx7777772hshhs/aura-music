import React from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Section, EmptyState } from "../components/shared/Section";
import TrackRow from "../components/shared/TrackRow";

export default function SearchPage({
  query, setQuery, loading, results, source, recentSearches, filter, setFilter,
  onPlay, onLike, liked, onQueue, onAddPlaylist, currentTrack
}) {
  const trendingSearches = ["Ed Sheeran", "workout hits", "night drive", "romantic", "focus flow"];
  const filtered = results && filter !== "all" ? results.filter((t) => t.mood.some((m) => m.toLowerCase() === filter)) : results;

  return (
    <div className="page">
      <div className="search-bar-full glass">
        <Search size={18} />
        <input autoFocus placeholder="Search tracks, artists, or moods…" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && (
          <button className="icon-btn sm" onClick={() => setQuery("")}>
            <X size={15} />
          </button>
        )}
      </div>

      {results && source === "demo-fallback" && (
        <div className="demo-banner">
          Showing results from the local demo catalog — live YouTube search isn't connected yet. See{" "}
          <code>api/youtube-search.js</code> and <code>.env.example</code>.
        </div>
      )}

      {results && (
        <div className="filter-row">
          {["all", "chill", "party", "focus", "workout"].map((f) => (
            <button key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      )}

      {!query && (
        <>
          <Section title="Recent Searches" icon={Clock}>
            <div className="chip-wrap">
              {recentSearches.map((s) => (
                <button key={s} className="chip glass" onClick={() => setQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
          </Section>
          <Section title="Trending Searches" icon={TrendingUp}>
            <div className="chip-wrap">
              {trendingSearches.map((s) => (
                <button key={s} className="chip glass" onClick={() => setQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
          </Section>
        </>
      )}

      {loading && (
        <div className="skeleton-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skel skel-art" />
              <div className="skel-lines">
                <div className="skel skel-line w60" />
                <div className="skel skel-line w35" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered && filtered.length > 0 && (
        <Section title={`Results for "${query}"`} icon={Search}>
          <div className="track-list">
            {filtered.map((t) => (
              <TrackRow key={t.id} track={t} onPlay={onPlay} onLike={onLike} liked={liked} onQueue={onQueue} onAddPlaylist={onAddPlaylist} isCurrent={currentTrack?.id === t.id} ctxQueue={filtered} />
            ))}
          </div>
        </Section>
      )}

      {!loading && filtered && filtered.length === 0 && (
        <EmptyState icon={Search} title="No matches" msg={`Nothing found for "${query}". Try a different search.`} />
      )}
    </div>
  );
}
