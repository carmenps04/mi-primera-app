const CACHE_NAME = "finanzas-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn("No se pudo precachear el app shell:", err))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .catch(() => {})
  );
  self.clients.claim();
});

// Cache-first para el app shell, con actualización en segundo plano (stale-while-revalidate)
// para que la app siga funcionando sin conexión tras la primera visita. Si el almacenamiento
// de caché falla por lo que sea, se cae de vuelta a fetch normal en vez de romper la petición.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches
      .match(event.request)
      .catch(() => undefined)
      .then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, response.clone()))
                .catch(() => {});
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
  );
});
