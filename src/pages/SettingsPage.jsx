import React from "react";
import { User, Moon, Sun, Download } from "lucide-react";
import { usePwaInstall } from "../hooks/usePwaInstall";

export default function SettingsPage({ theme, setTheme, stats, playlists, liked }) {
  const { canInstall, promptInstall, isInstalled } = usePwaInstall();

  return (
    <div className="page">
      <div className="page-title-row">
        <h1>Settings</h1>
        <p>Your profile & preferences.</p>
      </div>

      <div className="settings-grid">
        <div className="glass panel">
          <div className="profile-block">
            <div className="profile-avatar">
              <User size={26} />
            </div>
            <div>
              <div className="t-title">Guest Listener</div>
              <div className="t-sub">Local device only — no account system is wired up yet</div>
            </div>
          </div>
        </div>

        <div className="glass panel">
          <h3>Listening Stats</h3>
          <div className="stat-row"><span>Tracks played</span><b>{stats.plays}</b></div>
          <div className="stat-row"><span>Minutes listened</span><b>{stats.minutes}</b></div>
          <div className="stat-row"><span>Top artist</span><b>{stats.topArtist}</b></div>
          <div className="stat-row"><span>Playlists</span><b>{playlists.length}</b></div>
          <div className="stat-row"><span>Liked songs</span><b>{liked.size}</b></div>
        </div>

        <div className="glass panel">
          <h3>Appearance</h3>
          <div className="theme-toggle">
            <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}>
              <Moon size={14} /> Dark
            </button>
            <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}>
              <Sun size={14} /> Light
            </button>
          </div>
        </div>

        <div className="glass panel">
          <h3>Install App</h3>
          {isInstalled ? (
            <p className="muted-text">AURA is already installed on this device.</p>
          ) : canInstall ? (
            <>
              <p className="muted-text">Install AURA to your home screen for an app-like experience.</p>
              <button className="btn-primary sm" onClick={promptInstall}>
                <Download size={14} /> Install AURA
              </button>
            </>
          ) : (
            <p className="muted-text">
              Your browser hasn't offered an install prompt yet (some browsers only show this after a build is served
              over HTTPS with the PWA manifest/service worker registered, e.g. after `npm run build` + deploy).
            </p>
          )}
        </div>

        <div className="glass panel">
          <h3>Background</h3>
          <p className="muted-text">Your profile background follows the aurora of whatever's currently playing.</p>
        </div>

        <div className="glass panel">
          <h3>Keyboard Shortcuts</h3>
          <div className="kbd-row"><kbd>Space</kbd><span>Play / Pause</span></div>
          <div className="kbd-row"><kbd>→</kbd><span>Next track</span></div>
          <div className="kbd-row"><kbd>←</kbd><span>Previous track</span></div>
          <div className="kbd-row"><kbd>M</kbd><span>Mute</span></div>
        </div>

        <div className="glass panel">
          <h3>About this build</h3>
          <p className="muted-text">
            Playback uses YouTube's official embedded IFrame Player — nothing is downloaded or redistributed. Search
            uses a small local demo catalog unless a real backend is deployed (see <code>api/youtube-search.js</code>
            and <code>.env.example</code>). Playlists/likes/history persist to this browser only, via localStorage
            (see <code>src/services/storageService.js</code>) — no server database or accounts are connected yet.
          </p>
        </div>
      </div>
    </div>
  );
}
