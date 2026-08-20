export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ success: false, message: "Query missing" });
  }

  const cleanQuery = encodeURIComponent(q.trim());
  const endpoints = [
    `https://saavn.dev/api/search/songs?query=${cleanQuery}&limit=40`,
    `https://jiosaavn-api-privateindexer.vercel.app/search/songs?query=${cleanQuery}`,
    `https://saavn.me/search/songs?query=${cleanQuery}`
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      const items = data?.data?.results || data?.data || data?.results || [];

      if (Array.isArray(items) && items.length > 0) {
        const formatted = items.map((song) => {
          const audioUrl =
            song.downloadUrl?.[4]?.url ||
            song.downloadUrl?.[3]?.url ||
            song.downloadUrl?.[2]?.url ||
            song.downloadUrl?.[0]?.url ||
            (typeof song.downloadUrl === "string" ? song.downloadUrl : song.media_url) ||
            "";

          const cover =
            song.image?.[2]?.url ||
            song.image?.[1]?.url ||
            song.image?.[0]?.url ||
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500";

          const artist = Array.isArray(song.artists?.primary)
            ? song.artists.primary.map((a) => a.name).join(", ")
            : (song.primaryArtists || song.artist || "Aura Artist");

          const dur = Number(song.duration) || 210;

          return {
            id: song.id || String(Math.random()),
            title: song.name || song.title || "Track",
            artist: artist,
            cover: cover,
            audioUrl: audioUrl,
            duration: dur
          };
        }).filter((t) => t.audioUrl && t.audioUrl.startsWith("http"));

        if (formatted.length > 0) {
          return res.status(200).json({ success: true, results: formatted });
        }
      }
    } catch {
      continue;
    }
  }

  return res.status(200).json({ success: false, results: [] });
}
