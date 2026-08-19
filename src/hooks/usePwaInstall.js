import { useEffect, useState } from "react";

// Wraps the browser's `beforeinstallprompt` event so Settings can offer a
// real "Install AURA" button. Only Chromium-based browsers (Chrome/Edge/
// Android) fire this event; Safari/iOS has no programmatic install prompt
// (users add-to-home-screen manually there), so `canInstall` will
// correctly stay false on iOS even once the PWA manifest is valid.
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true
  );

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt, promptInstall, isInstalled };
}
