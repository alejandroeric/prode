// Service Worker del Prode — permite instalar la app como PWA.
const CACHE = 'prode-v1';
const PRECACHE = [
  '/',
  '/fixture.html',
  '/mis-pronosticos.html',
  '/tabla.html',
  '/perfil.html',
  '/entrar.html',
  '/css/estilos.css',
  '/js/util.js',
  '/js/fixture.js',
  '/js/mis-pronosticos.js',
  '/js/tabla.js',
  '/js/perfil.js',
  '/js/entrar.js',
  '/icono.svg',
  '/manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network first para la API, cache first para los archivos estaticos.
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{"error":"sin conexion"}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, clone));
      return res;
    }))
  );
});
