// Format seconds as m:ss
export function fmtTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Generate the signature AURA gradient "album art" from a hue value.
export function artStyle(hue, extra = {}) {
  return {
    background: `radial-gradient(circle at 30% 20%, hsl(${hue} 85% 65%), hsl(${(hue + 60) % 360} 70% 35%) 60%, hsl(${(hue + 20) % 360} 60% 15%) 100%)`,
    ...extra
  };
}
