// -----------------------------------------------------------------------
// Seed / fallback catalog.
//
// This is NOT a live YouTube search. It's a small local dataset used so
// Home/Discover have content to show before a real search backend is
// wired up, and so the app still works offline or if /api/youtube-search
// is unreachable.
//
// Every object here matches the shape returned by
// `src/services/youtubeApi.js`'s `normalizeYouTubeItem()`, so swapping the
// seed data for real API results is a drop-in replacement — nothing in
// the UI layer needs to change.
//
// Track shape:
//   id       - YouTube video ID (string)
//   title    - video/track title
//   artist   - channel title / uploader (stand-in for "artist")
//   mood     - array of mood tags (local-only concept; YouTube doesn't
//              provide this, so it's either curated by hand here or
//              derived heuristically once real search is wired up)
//   hue      - 0-360, drives the generated gradient "cover art"
//   dur      - duration in seconds
//   thumbnail - optional real YouTube thumbnail URL (present once fed by
//              the real API; the demo entries omit it so the app falls
//              back to the gradient art)
// -----------------------------------------------------------------------

export const CATALOG_SEED = [
  { id: "JGwWNGJdvx8", title: "Shape of You", artist: "Ed Sheeran", mood: ["Party", "Romantic"], hue: 268, dur: 233 },
  { id: "kJQP7kiw5Fk", title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", mood: ["Party"], hue: 12, dur: 229 },
  { id: "fJ9rUzIMcZQ", title: "Bohemian Rhapsody", artist: "Queen", mood: ["Focus", "Night"], hue: 200, dur: 355 },
  { id: "RgKAFK5djSk", title: "See You Again", artist: "Wiz Khalifa ft. Charlie Puth", mood: ["Sad", "Night"], hue: 300, dur: 230 },
  { id: "OPf0YbXqDm0", title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", mood: ["Party", "Workout"], hue: 40, dur: 270 },
  { id: "CevxZvSJLk8", title: "Roar", artist: "Katy Perry", mood: ["Workout"], hue: 330, dur: 223 },
  { id: "hT_nvWreIhg", title: "Counting Stars", artist: "OneRepublic", mood: ["Chill", "Focus"], hue: 190, dur: 257 },
  { id: "YQHsXMglC9A", title: "Hello", artist: "Adele", mood: ["Sad", "Night"], hue: 250, dur: 295 },
  { id: "pRpeEdMmmQ0", title: "Waka Waka", artist: "Shakira", mood: ["Party", "Workout"], hue: 20, dur: 210 },
  { id: "09R8_2nJtjg", title: "Sugar", artist: "Maroon 5", mood: ["Romantic", "Chill"], hue: 340, dur: 235 },
  { id: "lp-EO5I60KA", title: "Thinking Out Loud", artist: "Ed Sheeran", mood: ["Romantic", "Night"], hue: 280, dur: 281 },
  { id: "nfWlot6h_JM", title: "Shake It Off", artist: "Taylor Swift", mood: ["Party", "Workout"], hue: 205, dur: 219 },
  { id: "e-ORhEE9VVg", title: "Blank Space", artist: "Taylor Swift", mood: ["Focus", "Chill"], hue: 215, dur: 231 },
  { id: "iS1g8G_njx8", title: "Cheap Thrills", artist: "Sia", mood: ["Party", "Chill"], hue: 160, dur: 224 },
  { id: "2Vv-BfVoq4g", title: "Perfect", artist: "Ed Sheeran", mood: ["Romantic", "Sad"], hue: 290, dur: 263 },
  { id: "SlPhMPnQ58k", title: "Faded", artist: "Alan Walker", mood: ["Focus", "Night"], hue: 195, dur: 212 },
  { id: "60ItHLz5WEA", title: "Fix You", artist: "Coldplay", mood: ["Sad", "Focus"], hue: 230, dur: 296 },
  { id: "btPJPFnesV4", title: "Viva la Vida", artist: "Coldplay", mood: ["Focus", "Party"], hue: 15, dur: 242 },
  { id: "450p7goxZqg", title: "All of Me", artist: "John Legend", mood: ["Romantic", "Night"], hue: 275, dur: 269 },
  { id: "4NRXx6U8ABQ", title: "Believer", artist: "Imagine Dragons", mood: ["Workout", "Party"], hue: 5, dur: 204 }
];
