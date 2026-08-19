import { useEffect, useRef, useState } from "react";

// -----------------------------------------------------------------------
// Loads and controls the OFFICIAL YouTube IFrame Player API.
// Playback stays fully within YouTube's embedded player — nothing is
// downloaded, proxied, or redistributed. This hook only manages the
// player lifecycle; track/queue logic stays in App.jsx.
// -----------------------------------------------------------------------
export function useYouTubePlayer({ containerRef, volume, onStateChange }) {
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  // Load the IFrame API script once.
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setPlayerReady(true);
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => setPlayerReady(true);
  }, []);

  // Instantiate the hidden player once the API and container are ready.
  useEffect(() => {
    if (!playerReady || !containerRef.current || playerRef.current) return;
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: "0",
      width: "0",
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, playsinline: 1 },
      events: {
        onReady: (e) => e.target.setVolume(volume),
        onStateChange: (e) => onStateChangeRef.current?.(e)
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerReady]);

  return { playerRef, playerReady };
}
