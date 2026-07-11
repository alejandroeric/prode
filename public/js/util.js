// util.js — Funciones compartidas del frontend.

// Escapa texto para insertarlo seguro en HTML (evita XSS con nombres, etc.).
function escaparHtml(texto) {
  if (texto == null) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Captura el evento de instalacion PWA lo antes posible (Android/Chrome).
// Se guarda en window._pwaPrompt para usarlo cuando el jugador lo pida.
window._pwaPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window._pwaPrompt = e;
});

// Registra el Service Worker para habilitar la PWA (instalacion como app).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
