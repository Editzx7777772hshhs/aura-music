export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  const instances = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.privacy.com.de",
    "https://piped-api.garudalinux.org"
  ];

  for (const instance of instances) {
    try {
      const searchRes = await fetch(`${instance}/search?q=${encodeURIComponent(q)}&filter=music_songs`);
      if (!searchRes.ok) continue;

      const data = await searchRes.json();
      const items = data.items || [];

      if (!items.length) continue;

      const results = items.slice(0, 15).map((item, idx) => {
        const videoId = item.url ? item.url.replace("/watch?v=", "") : `track-${idx}`;
        return {
          id: videoId,
          title: item.title || "Unknown Track",
          artist: item.uploaderName || "Unknown Artist",
          cover: item.thumbnail || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
          durationStr: item.duration ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}` : "03:45",
          audioUrl: `https://invidious.jing.rocks/latest_version?id=${videoId}&itag=140`,
          theme: ["#fed000", "#e63946", "#9ef01a", "#00f2fe", "#f72585"][idx % 5],
          lyrics: `Track: "${item.title}"\nArtist: ${item.uploaderName}\n\nFull-length stream powered by Aura Engine.`
        };
      });

      return res.status(200).json({ results });
    } catch (err) {
      console.warn(`Instance failed: ${instance}`);
    }
  }

  return res.status(500).json({ error: "Failed to resolve stream from mirrors" });
}
