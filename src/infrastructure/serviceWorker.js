const CACHE = "tradeup-v3";
const PRECACHE = ["/", "/manifest.webmanifest"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("tradeup-") && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response.ok && response.type !== "opaque") {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(CACHE)
              .then((cache) => cache.put(request, copy))
              .catch(() => undefined),
          );
        }
        return response;
      } catch {
        try {
          const cache = await caches.open(CACHE);
          // Precache fetches and module loads can differ in Origin headers.
          // Only same-origin game resources reach this handler.
          const cached = await cache.match(request, { ignoreVary: true });
          if (cached) return cached;
          if (request.mode === "navigate") {
            const shell = await cache.match("/", { ignoreVary: true });
            if (shell) return shell;
          }
        } catch {
          // Restricted storage must also produce a defined network error.
        }
        return Response.error();
      }
    })(),
  );
});
