# AURA — Music, Your Vibe

A YouTube-powered music discovery app with a glassmorphism player UI, built
as a real Vite + React project. This README covers what's real, what's
stubbed, and exactly how to run and deploy it.

## What's actually implemented vs. stubbed

| Feature | Status |  
|---|---|
| UI (home, discover, search, playlists, liked, recent, settings) | ✅ Fully working, same design as the original artifact |
| Playback | ✅ Real, via YouTube's official embedded IFrame Player API. No downloading/redistribution. |
| Local demo catalog | ✅ 20 real, embeddable YouTube videos, used as fallback content |
| Live YouTube search | ⚠️ **Backend code is written** (`api/youtube-search.js`) but **not deployed anywhere by default**. Until you deploy it with a `YOUTUBE_API_KEY`, Search falls back to filtering the local demo catalog and shows a small "demo catalog" banner. |
| Playlists / Likes / History persistence | ✅ Real persistence to the browser's `localStorage` (survives refresh/reopen on the same device). ❌ Not a shared server database — no accounts, no cross-device sync yet. |
| PWA / installable app | ✅ Manifest + service worker via `vite-plugin-pwa`, real install prompt wired up in Settings. Only takes effect in a production build served over HTTPS. |

Nothing above is oversold — see the in-app Settings page and the code
comments in `src/services/*` for the same disclosures.

## Project structure

```
aura-music/
├── api/
│   └── youtube-search.js      # Serverless proxy — the ONLY place the YouTube API key is used
├── public/
│   ├── icons/                 # PWA icons (192, 512, maskable 512)
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── shared/             # TrackArt, TrackRow, TrackCard, Section, EmptyState
│   │   ├── layout/              # Sidebar, Topbar, MobileNav, Toasts
│   │   ├── player/              # PlayerBar, QueueDrawer
│   │   └── modals/              # AddToPlaylistModal
│   ├── pages/                  # HomePage, DiscoverPage, SearchPage, PlaylistsPage,
│   │                            # PlaylistDetail, TrackListPage, SettingsPage
│   ├── hooks/
│   │   ├── useYouTubePlayer.js  # Wraps the official YT IFrame Player API
│   │   └── usePwaInstall.js     # Wraps the beforeinstallprompt event
│   ├── services/
│   │   ├── youtubeApi.js        # Frontend search client — calls /api/youtube-search, falls back to demo catalog
│   │   └── storageService.js    # Playlists/likes/history persistence (localStorage today, DB-ready interface)
│   ├── data/catalogSeed.js      # Local demo catalog (20 tracks)
│   ├── lib/                    # utils.js, constants.js
│   ├── styles/                 # index.css, aura.css (the glassmorphism design, unchanged)
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js               # Includes vite-plugin-pwa config
├── package.json
├── .env.example
└── vercel.json                  # Optional — only relevant if you deploy to Vercel
```

## 1. Run it locally

```bash
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`). The app
works immediately — playback, playlists, likes, and the demo catalog all
function with zero configuration. Search will use the demo-catalog
fallback until you complete step 3 below.

## 2. Build for production

```bash
npm run build
npm run preview   # optional local check of the production build
```

`npm run build` outputs a static site to `dist/`, plus the PWA manifest
and service worker. `npm run preview` serves that build locally over
HTTP so you can confirm the install prompt / offline shell work before
deploying (full installability generally requires real HTTPS, which
`preview` doesn't provide — test that after deploying).

## 3. Turn on real YouTube search (optional but recommended)

Live search requires a backend, because the YouTube Data API key must
never reach the browser.

1. Get a YouTube Data API v3 key: https://console.cloud.google.com/apis/library/youtube.googleapis.com
2. Copy `.env.example` to `.env` for local dev, and set:
   ```
   YOUTUBE_API_KEY=your-real-key
   ```
3. Run the serverless function locally. The included `api/youtube-search.js`
   is written in Vercel's serverless function format. The simplest path:
   ```bash
   npm i -g vercel
   vercel dev
   ```
   This serves both the Vite app and `/api/youtube-search` together. If you
   deploy elsewhere (Netlify Functions, Cloudflare Workers, a small Express
   server, etc.), port the logic inside `api/youtube-search.js` — the
   fetch-and-shape-the-response logic is platform-agnostic even though the
   handler signature isn't.
4. Once `/api/youtube-search?q=...` returns real results, `src/services/youtubeApi.js`
   automatically stops falling back to the demo catalog — no frontend code
   changes needed.

## 4. Deploy

### Vercel (recommended — matches the included `api/` function format)
```bash
vercel
```
Set `YOUTUBE_API_KEY` (and any DB/auth vars you add later) in the Vercel
project's Environment Variables settings — not in a committed `.env`.

### Any static host + separate backend (Netlify, Cloudflare Pages, S3/CloudFront, etc.)
- Deploy the contents of `dist/` (after `npm run build`) as the static site.
- Deploy `api/youtube-search.js`'s logic as a function on that platform's
  serverless product, and set `VITE_API_BASE_URL` (in `.env`, at build
  time) to that function's base URL if it's on a different origin.

## 5. Install as an app (PWA)

Once deployed over HTTPS, open the site in Chrome/Edge (desktop or
Android) and use Settings → **Install App**, or the browser's own
"Install app" / "Add to Home Screen" menu option. iOS Safari doesn't
support the programmatic install prompt — there, users add it via the
Share sheet → **Add to Home Screen**, which still works because the
manifest and icons are in place.

## Next steps toward a fully production system

- Swap `src/services/storageService.js`'s localStorage calls for real
  `fetch()` calls to backend routes backed by a database (Postgres,
  Supabase, etc.) — the function signatures are already async and DB-shaped.
- Add real authentication (Auth.js, Clerk, Supabase Auth, etc.) so
  playlists/likes/history are tied to an account instead of a device.
- Consider caching/rate-limiting `api/youtube-search.js` (e.g. with a
  small Redis cache) since the YouTube Data API has daily quota limits.
