import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import MobileNav from "./components/layout/MobileNav.jsx";
import Toasts from "./components/layout/Toasts.jsx";
import PlayerBar from "./components/player/PlayerBar.jsx";
import QueueDrawer from "./components/player/QueueDrawer.jsx";
import AddToPlaylistModal from "./components/modals/AddToPlaylistModal.jsx";

import HomePage from "./pages/HomePage.jsx";
import DiscoverPage from "./pages/DiscoverPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import PlaylistsPage from "./pages/PlaylistsPage.jsx";
import PlaylistDetail from "./pages/PlaylistDetail.jsx";
import TrackListPage from "./pages/TrackListPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

import { useYouTubePlayer } from "./hooks/useYouTubePlayer.js";
import { searchYouTube } from "./services/youtubeApi.js";
import { storageService } from "./services/storageService.js";
import { CATALOG_SEED } from "./data/catalogSeed.js";

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [page, setPage] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMood, setActiveMood] = useState(null);

  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [muted, setMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off");
  const [shuffle, setShuffle] = useState(false);
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);

  const [liked, setLiked] = useState(new Set());
  const [recent, setRecent] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [renamingId, setRenamingId] = useState(null);

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

  return (
    <div className={`app ${theme}`}>
      <Sidebar 
        page={page} 
        setPage={setPage} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activePlaylistId={activePlaylistId} 
        setActivePlaylistId={setActivePlaylistId} 
      />
      <div className="main-content">
        <Topbar />
        {page === "home" && <HomePage />}
        {page === "discover" && <DiscoverPage />}
        {page === "search" && <SearchPage />}
        {page === "playlists" && <PlaylistsPage />}
        {page === "playlist-detail" && <PlaylistDetail />}
        {page === "tracks" && <TrackListPage />}
        {page === "settings" && <SettingsPage />}
      </div>
      <MobileNav page={page} setPage={setPage} />
      <PlayerBar currentTrack={currentTrack} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
      {queueDrawerOpen && <QueueDrawer queue={queue} currentTrack={currentTrack} />}
      {addToPlaylistTrack && <AddToPlaylistModal track={addToPlaylistTrack} />}
      <Toasts toasts={toasts} />
      <div ref={ytContainerRef} id="yt-player-container" style={{ display: "none" }} />
    </div>
  );
}

