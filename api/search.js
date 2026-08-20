export default async function handler(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query required" });
  try {
    const response = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(q)}`);
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Fetch failed" });
  }
}
