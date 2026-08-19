import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import MobileNav from "./components/layout/MobileNav";
import Toasts from "./components/layout/Toasts";
import PlayerBar from "./components/player/PlayerBar";
import QueueDrawer from "./components/player/QueueDrawer";
import AddToPlaylistModal from "./components/modals/AddToPlaylistModal";

import HomePage from "./pages/HomePage";
import DiscoverPage from "./pages/DiscoverPage";
import SearchPage from "./pages/SearchPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import PlaylistDetail from "./pages/PlaylistDetail";
import TrackListPage from "./pages/TrackListPage";
import SettingsPage from "./pages/SettingsPage";

import { useYouTubePlayer } from "./hooks/useYouTubePlayer";
import { searchYouTube } from "./services/youtubeApi";
import { storageService } from "./services/storageService";
import { CATALOG_SEED } from "./data/catalogSeed";




export default function App() {
  const [theme, setTheme] = useState("dark");
  const [page, setPage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMood, setActiveMood] = useState(null);

  // Player state
  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off"); // off | all | one
  const [shuffle, setShuffle] = useState(false);
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);

  // Library state — hydrated from storageService (localStorage today,
  // swappable for a real backend later; see src/services/storageService.js)
  const [liked, setLiked] = useState(new Set());
  const [recent, setRecent] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [renamingId, setRenamingId] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchSource, setSearchSource] = useState("live");
  const [recentSearches, setRecentSearches] = useState(["lofi chill", "workout mix", "sad songs"]);
  const [searchFilter, setSearchFilter] = useState("all");

  const ytContainerRef = useRef(null);
  const progressTimer = useRef(null);
  const toastId = useRef(0);

  const currentTrack = queue[queueIdx] || null;

  // ---------- Hydrate persisted library state on first load ----------
  useEffect(() => {
    (async () => {
      const [likedSet, storedPlaylists, storedRecent] = await Promise.all([
        storageService.getLiked(),
        storageService.getPlaylists(),
        storageService.getRecent()
      ]);
      setLiked(likedSet);
      setPlaylists(storedPlaylists);
      setRecent(storedRecent);
      setHydrated(true);
    })();
  }, []);

  // Persist on change (skip the very first render before hydration).
  useEffect(() => { if (hydrated) storageService.setLiked(liked); }, [liked, hydrated]);
  useEffect(() => { if (hydrated) storageService.setPlaylists(playlists); }, [playlists, hydrated]);
  useEffect(() => { if (hydrated) storageService.setRecent(recent); }, [recent, hydrated]);

  // ---------- Toasts ----------
  const pushToast = useCallback((msg, icon = Check) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  // ---------- YouTube IFrame Player (official embedded player) ----------
  const handleTrackEndRef = useRef();
  const { playerRef, playerReady } = useYouTubePlayer({
    containerRef: ytContainerRef,
    volume,
    onStateChange: (e) => {
      if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
      if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
      if (e.data === window.YT.PlayerState.ENDED) handleTrackEndRef.current?.();
    }
  });

  handleTrackEndRef.current = () => {
    if (repeatMode === "one") { seekAndPlay(0); return; }
    playNext(true);
  };

  // Load a track into the player when currentTrack changes
  useEffect(() => {
    if (!playerReady || !playerRef.current || !currentTrack) return;
    try {
      playerRef.current.loadVideoById(currentTrack.id);
      playerRef.current.setVolume(muted ? 0 : volume);
      setProgress(0);
      setDuration(currentTrack.dur || 0);
      setRecent((r) => [currentTrack, ...r.filter((t) => t.id !== currentTrack.id)].slice(0, 30));
    } catch (e) { /* player not ready yet */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, playerReady]);

  // Progress polling
  useEffect(() => {
    clearInterval(progressTimer.current);
    if (isPlaying) {
      progressTimer.current = setInterval(() => {
        const p = playerRef.current;
        if (p && p.getCurrentTime) {
          setProgress(p.getCurrentTime());
          const d = p.getDuration();
          if (d) setDuration(d);
        }
      }, 500);
    }
    return () => clearInterval(progressTimer.current);
  }, [isPlaying, playerRef]);

  const seekAndPlay = (t) => {
    playerRef.current?.seekTo(t, true);
    playerRef.current?.playVideo();
  };

  const playTrack = (track, ctxQueue = null) => {
    if (ctxQueue) {
      setQueue(ctxQueue);
      setQueueIdx(ctxQueue.findIndex((t) => t.id === track.id));
    } else {
      setQueue((q) => {
        const exists = q.find((t) => t.id === track.id);
        if (exists) {
          setQueueIdx(q.findIndex((t) => t.id === track.id));
          return q;
        }
        setQueueIdx(q.length);
        return [...q, track];
      });
    }
    setTimeout(() => playerRef.current?.playVideo(), 150);
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) playerRef.current?.pauseVideo();
    else playerRef.current?.playVideo();
  };

  const playNext = (fromEnd = false) => {
    if (queue.length === 0) return;
    if (shuffle) {
      setQueueIdx(Math.floor(Math.random() * queue.length));
      return;
    }
    if (queueIdx < queue.length - 1) setQueueIdx((i) => i + 1);
    else if (repeatMode === "all") setQueueIdx(0);
    else if (fromEnd) setIsPlaying(false);
  };

  const playPrev = () => {
    if (progress > 4) { seekAndPlay(0); return; }
    if (queueIdx > 0) setQueueIdx((i) => i - 1);
  };

  const addToQueue = (track) => {
    setQueue((q) => [...q, track]);
    pushToast(`Added "${track.title}" to queue`, ListPlus);
  };

  const toggleLike = (track) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(track.id)) { next.delete(track.id); pushToast("Removed from Liked Songs", Heart); }
      else { next.add(track.id); pushToast("Added to Liked Songs", Heart); }
      return next;
    });
  };

  const createPlaylist = () => {
    const name = newPlaylistName.trim() || `New Playlist ${playlists.length + 1}`;
    const pl = { id: `pl${Date.now()}`, name, trackIds: [] };
    setPlaylists((p) => [...p, pl]);
    setNewPlaylistName("");
    pushToast(`Created "${name}"`, ListMusic);
    return pl;
  };

  const addToPlaylist = (playlistId, track) => {
    setPlaylists((ps) => ps.map((p) => (p.id === playlistId ? (p.trackIds.includes(track.id) ? p : { ...p, trackIds: [...p.trackIds, track.id] }) : p)));
    pushToast(`Added to playlist`, Check);
    setAddToPlaylistTrack(null);
  };

  const removeFromPlaylist = (playlistId, trackId) => {
    setPlaylists((ps) => ps.map((p) => (p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) } : p)));
  };

  const deletePlaylist = (playlistId) => {
    setPlaylists((ps) => ps.filter((p) => p.id !== playlistId));
    setActivePlaylistId(null);
    pushToast("Playlist deleted", Trash2);
  };

  const renamePlaylist = (playlistId, name) => {
    setPlaylists((ps) => ps.map((p) => (p.id === playlistId ? { ...p, name } : p)));
    setRenamingId(null);
  };

  const reorderPlaylist = (playlistId, from, to) => {
    setPlaylists((ps) => ps.map((p) => {
      if (p.id !== playlistId) return p;
      const ids = [...p.trackIds];
      const [moved] = ids.splice(from, 1);
      ids.splice(to, 0, moved);
      return { ...p, trackIds: ids };
    }));
  };

  // ---------- Search (calls the backend via services/youtubeApi.js) ----------
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    let cancelled = false;
    setSearchLoading(true);
    const t = setTimeout(async () => {
      const { results, source } = await searchYouTube(searchQuery);
      if (!cancelled) {
        setSearchResults(results);
        setSearchSource(source);
        setSearchLoading(false);
      }
    }, 450);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchQuery]);

  const runSearch = (q) => {
    setSearchQuery(q);
    if (q.trim() && !recentSearches.includes(q)) setRecentSearches((r) => [q, ...r].slice(0, 6));
  };

  // ---------- Derived ----------
  const trackById = useMemo(() => Object.fromEntries(CATALOG_SEED.map((t) => [t.id, t])), []);
  const trending = CATALOG_SEED.slice(0, 8);
  const newReleases = [...CATALOG_SEED].reverse().slice(0, 6);
  const recommended = CATALOG_SEED.filter((t) => t.mood.includes("Chill") || t.mood.includes("Focus")).slice(0, 6);
  const moodTracks = activeMood ? CATALOG_SEED.filter((t) => t.mood.includes(activeMood)) : [];
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);
  const listeningStats = useMemo(() => {
    const totalMin = Math.round(recent.reduce((a, t) => a + t.dur, 0) / 60);
    const topArtist = Object.entries(recent.reduce((acc, t) => { acc[t.artist] = (acc[t.artist] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0];
    return { plays: recent.length, minutes: totalMin, topArtist: topArtist ? topArtist[0] : "—" };
  }, [recent]);

  const isDark = theme === "dark";

  return (
    <div className={isDark ? "aura dark" : "aura light"} style={{ "--h": currentTrack ? currentTrack.hue : 260 }}>
      <div id="yt-hidden-player" ref={ytContainerRef} style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }} />

      {/* Ambient liquid background */}
      <div className="aura-bg" aria-hidden="true">
        <div className="blob blob-a" />
        <div className="blob blob-b" />
        <div className="blob blob-c" />
        <div className="grain" />
      </div>

      <div className="shell">
        <Sidebar page={page} setPage={setPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} setActivePlaylistId={setActivePlaylistId} plays={listeningStats.plays} />

        <main className="main">
          <Topbar setSidebarOpen={setSidebarOpen} setPage={setPage} isDark={isDark} setTheme={setTheme} />

          <div className="page-scroll">
            {page === "home" && (
              <HomePage
                trending={trending} newReleases={newReleases} recommended={recommended}
                recent={recent} onPlay={(t, ctx) => playTrack(t, ctx)} onLike={toggleLike} liked={liked}
                onQueue={addToQueue} onAddPlaylist={setAddToPlaylistTrack} onMood={(m) => { setActiveMood(m); setPage("discover"); }}
                currentTrack={currentTrack}
              />
            )}
            {page === "discover" && (
              <DiscoverPage activeMood={activeMood} setActiveMood={setActiveMood} tracks={activeMood ? moodTracks : CATALOG_SEED}
                onPlay={(t, ctx) => playTrack(t, ctx)} onLike={toggleLike} liked={liked} onQueue={addToQueue} onAddPlaylist={setAddToPlaylistTrack} currentTrack={currentTrack} />
            )}
            {page === "search" && (
              <SearchPage query={searchQuery} setQuery={runSearch} loading={searchLoading} results={searchResults} source={searchSource}
                recentSearches={recentSearches} filter={searchFilter} setFilter={setSearchFilter}
                onPlay={(t, ctx) => playTrack(t, ctx)} onLike={toggleLike} liked={liked} onQueue={addToQueue} onAddPlaylist={setAddToPlaylistTrack} currentTrack={currentTrack} />
            )}
            {page === "playlists" && !activePlaylist && (
              <PlaylistsPage playlists={playlists} trackById={trackById} onOpen={setActivePlaylistId}
                newPlaylistName={newPlaylistName} setNewPlaylistName={setNewPlaylistName} onCreate={createPlaylist} />
            )}
            {page === "playlists" && activePlaylist && (
              <PlaylistDetail playlist={activePlaylist} trackById={trackById} onBack={() => setActivePlaylistId(null)}
                onPlay={(t, ctx) => playTrack(t, ctx)} onLike={toggleLike} liked={liked} onQueue={addToQueue}
                onRemove={(tid) => removeFromPlaylist(activePlaylist.id, tid)} onDelete={() => deletePlaylist(activePlaylist.id)}
                renamingId={renamingId} setRenamingId={setRenamingId} onRename={renamePlaylist} onReorder={reorderPlaylist}
                currentTrack={currentTrack} />
            )}
            {page === "liked" && (
              <TrackListPage title="Liked Songs" subtitle={`${liked.size} song${liked.size === 1 ? "" : "s"}`} icon={Heart}
                tracks={CATALOG_SEED.filter((t) => liked.has(t.id))} onPlay={(t, ctx) => playTrack(t, ctx)} onLike={toggleLike} liked={liked}
                onQueue={addToQueue} onAddPlaylist={setAddToPlaylistTrack} currentTrack={currentTrack}
                emptyMsg="Songs you like will show up here. Tap the heart on any track." />
            )}
            {page === "recent" && (
              <TrackListPage title="Recently Played" subtitle={`${recent.length} tracks`} icon={Clock}
                tracks={recent} onPlay={(t, ctx) => playTrack(t, ctx)} onLike={toggleLike} liked={liked}
                onQueue={addToQueue} onAddPlaylist={setAddToPlaylistTrack} currentTrack={currentTrack}
                emptyMsg="Nothing played yet — your listening history will appear here." />
            )}
            {page === "settings" && (
              <SettingsPage theme={theme} setTheme={setTheme} stats={listeningStats} playlists={playlists} liked={liked} />
            )}
          </div>
        </main>
      </div>

      {sidebarOpen && <div className="scrim" onClick={() => setSidebarOpen(false)} />}

      <MobileNav page={page} setPage={setPage} setActivePlaylistId={setActivePlaylistId} />

      <PlayerBar
        track={currentTrack} isPlaying={isPlaying} progress={progress} duration={duration}
        volume={volume} muted={muted} repeatMode={repeatMode} shuffle={shuffle}
        liked={liked} queueLen={queue.length}
        onToggle={togglePlay} onNext={() => playNext(false)} onPrev={playPrev}
        onSeek={(t) => seekAndPlay(t)} onVolume={(v) => { setVolume(v); setMuted(false); playerRef.current?.setVolume(v); }}
        onMute={() => setMuted((m) => { playerRef.current?.setVolume(!m ? 0 : volume); return !m; })}
        onRepeat={() => setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"))}
        onShuffle={() => setShuffle((s) => !s)}
        onLike={() => currentTrack && toggleLike(currentTrack)}
        onQueueToggle={() => setQueueDrawerOpen((q) => !q)}
      />

      <QueueDrawer open={queueDrawerOpen} onClose={() => setQueueDrawerOpen(false)} queue={queue} idx={queueIdx}
        onJump={(i) => setQueueIdx(i)} onRemove={(i) => setQueue((q) => q.filter((_, idx) => idx !== i))} />

      {addToPlaylistTrack && (
        <AddToPlaylistModal track={addToPlaylistTrack} playlists={playlists} onAdd={addToPlaylist}
          onCreateAndAdd={() => { const pl = createPlaylist(); addToPlaylist(pl.id, addToPlaylistTrack); }}
          onClose={() => setAddToPlaylistTrack(null)} />
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}
