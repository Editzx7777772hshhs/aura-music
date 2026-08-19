// -----------------------------------------------------------------------
// Client-side YouTube search service.
//
// IMPORTANT — HONESTY NOTE:
// This module never calls the YouTube Data API directly and never holds
// an API key. It calls YOUR backend at `${API_BASE_URL}/api/youtube-search`,
// which is implemented as a serverless function in /api/youtube-search.js.
//
// Out of the box, that serverless function is NOT deployed anywhere —
// it's source code you deploy yourself (e.g. to Vercel/Netlify) and wire
// up with a YOUTUBE_API_KEY environment variable. Until you do that and
// point VITE_API_BASE_URL / your hosting at it, `searchYouTube()` below
// will fail its fetch and this module will transparently fall back to
// the local CATALOG_SEED so the UI keeps working in demo mode.
//
// Once the backend is live, delete/ignore the fallback path (or keep it
// as an offline safety net) — no other code in the app needs to change,
// because normalizeYouTubeItem() below produces the exact same track
// shape as CATALOG_SEED.
// -----------------------------------------------------------------------

import { CATALOG_SEED } from "../data/catalogSeed";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// A handful of hues so real API results still get a nice generated
// gradient "cover" if a thumbnail fails to load or isn't wanted.
const HUE_POOL = [268, 12, 200, 300, 40, 330, 190, 250, 20, 340, 280, 205, 215, 160, 290, 195, 230, 15, 275, 5];
function hueFor(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return HUE_POOL[h % HUE_POOL.length];
}

// Converts a single item from the YouTube Data API `search.list` /
// `videos.list` response into AURA's internal track shape.
export function normalizeYouTubeItem(item) {
  const videoId = typeof item.id === "string" ? item.id : item.id?.videoId;
  const snippet = item.snippet || {};
  const durationSeconds = item.durationSeconds ?? null; // populate via videos.list contentDetails if needed

  return {
    id: videoId,
    title: snippet.title || "Untitled",
    artist: snippet.channelTitle || "Unknown",
    mood: [], // YouTube has no mood concept — leave empty or derive later
    hue: hueFor(videoId || snippet.title || "x"),
    dur: durationSeconds || 0,
    thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || null
  };
}

/**
 * Search for tracks. Calls the backend serverless proxy so the YouTube
 * API key is never exposed to the browser. Falls back to the local demo
 * catalog if the backend isn't deployed/configured yet.
 *
 * @param {string} query
 * @returns {Promise<{results: Array, source: 'live' | 'demo-fallback'}>}
 */
export async function searchYouTube(query) {
  if (!query || !query.trim()) return { results: [], source: "live" };

  try {
    const res = await fetch(`${API_BASE_URL}/api/youtube-search?q=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/json" }
    });
    if (!res.ok) throw new Error(`Search backend returned ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];
    return { results: items.map(normalizeYouTubeItem).filter((t) => t.id), source: "live" };
  } catch (err) {
    // Backend not deployed/configured yet, or network error — fall back
    // to filtering the local demo catalog so the UI still works.
    console.warn("[AURA] Live YouTube search unavailable, using demo catalog fallback:", err.message);
    const q = query.toLowerCase();
    const results = CATALOG_SEED.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.mood.some((m) => m.toLowerCase().includes(q))
    );
    return { results, source: "demo-fallback" };
  }
}
