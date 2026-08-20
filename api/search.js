export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { q } = req.query;
  
  if (!q) return res.status(200).json({ success: true, results: [] });

  try {
    // Naya aur working JioSaavn API link
    const apiUrl = `https://saavn.me/search/songs?query=${encodeURIComponent(q)}&page=1&limit=10`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Check agar API ne success response diya hai
    if (data.status === "SUCCESS" && data.data && data.data.results) {
      const results = data.data.results;
      
      const formatted = results.map(song => ({
        id: song.id,
        title: song.name || song.title,
        artist: song.primaryArtists || song.singers || "Aura Artist",
        // saavn.me usually 'link' use karta hai 'url' ki jagah
        cover: song.image?.[2]?.link || song.image?.[1]?.link || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        audioUrl: song.downloadUrl?.[4]?.link || song.downloadUrl?.[3]?.link || song.downloadUrl?.[0]?.link || "",
        duration: song.duration || 218
      })).filter(s => s.audioUrl); // Sirf wahi gaane dikhaye jinki audio available ho

      return res.status(200).json({ success: true, results: formatted });
    } else {
      return res.status(200).json({ success: false, results: [] });
    }

  } catch (e) {
    console.error("API Error:", e.message);
    return res.status(500).json({ success: false, results: [] });
  }
}
