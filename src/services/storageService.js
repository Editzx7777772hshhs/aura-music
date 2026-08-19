// -----------------------------------------------------------------------
// Persistence layer for playlists, liked songs, and play history.
//
// HONESTY NOTE: there is no real database or user account system wired
// up yet. This module currently persists to the browser's localStorage,
// scoped to a single anonymous "guest" device — that IS real, working
// persistence (it survives refreshes/reopens on the same browser), but
// it is NOT a shared account backed by a server database, and it will
// not sync across devices.
//
// The functions below are written as an async, DB-shaped interface on
// purpose: every call already returns a Promise. That means swapping the
// localStorage implementation for real fetch() calls to a backend
// (e.g. /api/playlists, /api/likes, /api/history, backed by Postgres/
// Supabase/etc. and real auth) is a drop-in change inside this file only
// — nothing in App.jsx or the components needs to change.
// -----------------------------------------------------------------------

const KEYS = {
  liked: "aura:liked",
  playlists: "aura:playlists",
  recent: "aura:recent"
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[AURA] Failed to persist ${key}:`, err);
  }
}

const DEFAULT_PLAYLISTS = [
  { id: "pl1", name: "Late Night Drive", trackIds: ["hT_nvWreIhg", "SlPhMPnQ58k", "60ItHLz5WEA"] },
  { id: "pl2", name: "Gym Energy", trackIds: ["CevxZvSJLk8", "4NRXx6U8ABQ", "OPf0YbXqDm0"] }
];

export const storageService = {
  // ---- Liked songs ----
  async getLiked() {
    return new Set(readJSON(KEYS.liked, []));
  },
  async setLiked(likedSet) {
    writeJSON(KEYS.liked, [...likedSet]);
  },

  // ---- Playlists ----
  async getPlaylists() {
    return readJSON(KEYS.playlists, DEFAULT_PLAYLISTS);
  },
  async setPlaylists(playlists) {
    writeJSON(KEYS.playlists, playlists);
  },

  // ---- Recently played ----
  async getRecent() {
    return readJSON(KEYS.recent, []);
  },
  async setRecent(recent) {
    writeJSON(KEYS.recent, recent.slice(0, 30));
  }
};
