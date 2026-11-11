const CACHE_PREFIX = "bustamante-175-";
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_REVISION__`;
const APP_SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "offline-cache-manifest.json"];

async function offlineFiles() {
  try {
    const response = await fetch(new URL("offline-cache-manifest.json", self.registration.scope), { cache: "no-store" });
    if (!response.ok) return APP_SHELL;
    const manifest = await response.json();
    return [...new Set([...APP_SHELL, ...(manifest.files || [])])];
  } catch {
    return APP_SHELL;
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const files = await offlineFiles();
      await cache.addAll(files.map((file) => new Request(new URL(file, self.registration.scope), { cache: "reload" })));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("index.html", clone));
          }
          return response;
        })
        .catch(() => caches.match(new URL("index.html", self.registration.scope)))
    );
    return;
  }

  if (url.pathname.endsWith("/content/project.json")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(new URL("index.html", self.registration.scope)));
    })
  );
});
