export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { q } = req.query;
  if (!q) return res.status(200).json({ success: true, results: [] });

  try {
    const response = await fetch(`https://jiosaavn-api-privateindexer.vercel.app/search/songs?query=${encodeURIComponent(q)}`);
    const data = await response.json();
    
    // Data extract logic
    const results = data.data || data.results || [];
    const formatted = results.map(song => ({
      id: song.id,
      title: song.name || song.title,
      artist: song.primaryArtists || song.artist || "Aura Artist",
      cover: song.image?.[2]?.url || song.image?.[1]?.url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500",
      audioUrl: song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url || song.media_url,
      duration: song.duration || 210
    })).filter(s => s.audioUrl);

    return res.status(200).json({ success: true, results: formatted });
  } catch (e) {
    return res.status(200).json({ success: false, results: [] });
  }
}
