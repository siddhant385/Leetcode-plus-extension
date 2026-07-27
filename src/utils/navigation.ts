// src/utils/navigation.ts

export function setupNavigationListener() {
  let lastUrl = location.href;
  console.log("[LC Analyzer] 🧭 Global Navigation Dispatcher initialized");
  const handleRouteChange = (event: Event) => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      console.log(
        `[LC Analyzer] 🚦 Route changed via '${event.type}': ${currentUrl}`,
      );
      lastUrl = currentUrl;
      const navEvent = new CustomEvent("lc:navigate", {
        detail: { url: currentUrl },
      });
      document.dispatchEvent(navEvent);
    }
  };

  window.addEventListener("locationchange", handleRouteChange);
  window.addEventListener("replacestate", handleRouteChange);
  window.addEventListener("popstate", handleRouteChange);
}
