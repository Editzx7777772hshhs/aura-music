export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query" });

  // Piped instances (Fastest public mirrors)
  const instances = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.privacy.com.de",
    "https://piped-api.garudalinux.org"
  ];

  for (const instance of instances) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(`${instance}/search?q=${encodeURIComponent(q)}&filter=music_songs`, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        const results = (data.items || []).map((item, idx) => ({
          id: item.url?.replace('/watch?v=', '') || idx,
          title: item.title,
          artist: item.uploaderName,
          cover: item.thumbnail,
          audioUrl: `https://invidious.jing.rocks/latest_version?id=${item.url?.replace('/watch?v=', '')}&itag=140`,
          durationStr: `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`
        }));
        return res.status(200).json({ results });
      }
    } catch (e) {
      console.warn(`Instance ${instance} failed`);
    }
  }
  return res.status(500).json({ error: "No instances available" });
}
