import { useEffect, useState } from "react";

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        const checkForUpdates = () => {
          console.log("Checking for PWA updates...");
          reg.update();
        };

        // Check immediately
        checkForUpdates();

        // Check when window regains focus (user returns to app)
        window.addEventListener("focus", checkForUpdates);

        // Check when app becomes visible (tab switching)
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            checkForUpdates();
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Listen for new service worker waiting
        const handleUpdateFound = () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setNeedRefresh(true);
              }
            });
          }
        };

        reg.addEventListener("updatefound", handleUpdateFound);

        // Check if there's already a waiting worker
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setNeedRefresh(true);
        }

        return () => {
          window.removeEventListener("focus", checkForUpdates);
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          reg.removeEventListener("updatefound", handleUpdateFound);
        };
      });
    }
  }, []);

  const updateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      waitingWorker.addEventListener("statechange", (e) => {
        const target = e.target as ServiceWorker;
        if (target.state === "activated") {
          window.location.reload();
        }
      });
    }
  };

  const dismissUpdate = () => {
    setNeedRefresh(false);
  };

  return {
    needRefresh,
    updateApp,
    dismissUpdate,
  };
}
