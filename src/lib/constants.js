import { Home, Compass, Search, ListMusic, Heart, Clock, Settings } from "lucide-react";

export const MOODS = ["Chill", "Workout", "Sad", "Focus", "Party", "Romantic", "Night"];

export const NAV = [
  { id: "home", label: "Home", icon: Home },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "search", label: "Search", icon: Search },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "liked", label: "Liked Songs", icon: Heart },
  { id: "recent", label: "Recently Played", icon: Clock },
  { id: "settings", label: "Settings", icon: Settings }
];

export const MOBILE_NAV = ["home", "discover", "search", "playlists"];
