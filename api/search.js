export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { q } = req.query;
  
  if (!q) return res.status(200).json({ success: true, results: [] });

  try {
    const apiUrl = `https://jiosaavn-api-privateindeser.vercel.app/search/songs?query=${encodeURIComponent(q)}`;
    console.log("Fetching data from:", apiUrl);

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response Success. Checking data structure...");

    // Data extract logic
    const results = data.data?.results || data.data || data.results || [];
    
    if (results.length === 0) {
      console.log("No results found in the API data object.");
    }

    const formatted = results.map(song => ({
      id: song.id,
      title: song.name || song.title,
      artist: song.primaryArtists || song.artist || "Aura Artist",
      cover: song.image?.[2]?.url || song.image?.[1]?.url || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      audioUrl: song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url || song.media_url,
      duration: song.duration || 218
    }));

    // Check how many songs are being filtered out
    const finalResults = formatted.filter(s => s.audioUrl);
    console.log(`Total songs: ${formatted.length}, Songs with Audio URL: ${finalResults.length}`);

    return res.status(200).json({ success: true, results: finalResults });

  } catch (e) {
    // Ab exact error Vercel logs mein dikhega
    console.error("Search API Failed:", e.message);
    return res.status(500).json({ success: false, error: e.message, results: [] });
  }
}
