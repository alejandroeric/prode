// Service Worker del Prode — permite instalar la app como PWA.
// Estrategia: network-first para HTML y JS (siempre frescos tras un deploy),
// cache-first solo para assets que cambian poco (iconos, manifest).
const CACHE = 'prode-v9';
const SOLO_CACHE = ['/icono.svg', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SOLO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // API: network-first, fallback de error si no hay conexión.
  if (url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('{"error":"sin conexion"}', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // Iconos y manifest: cache-first (cambian muy poco).
  if (url.includes('/icono.svg') || url.includes('/manifest.json')) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
    return;
  }

  // HTML, JS, CSS: network-first. Si falla la red, intenta el caché.
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
