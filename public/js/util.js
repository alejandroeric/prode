// util.js — Funciones compartidas del frontend.

// Escapa texto para insertarlo seguro en HTML (evita XSS con nombres, etc.).
// Convierte < > & " ' en sus entidades, asi nunca se interpreta como codigo.
function escaparHtml(texto) {
  if (texto == null) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
