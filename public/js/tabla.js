// tabla.js — Tabla de posiciones del grupo del jugador (podio + lista).

const SESION = localStorage.getItem('jugador_sesion');
const podio = document.getElementById('podio');
const lista = document.getElementById('lista-posiciones');
const estado = document.getElementById('estado');

// Una posicion del podio (puede no existir si hay menos de 3 jugadores).
function lugarPodio(t, clase, medalla) {
  if (!t) return '';
  return `
    <div class="podio-lugar ${clase}">
      <div class="podio-medalla">${medalla}</div>
      <div class="podio-avatar">${escaparHtml(t.avatar) || '👤'}</div>
      <div class="podio-nombre">${escaparHtml(t.nombre)}</div>
      <div class="podio-puntos">${t.puntos} pts</div>
    </div>`;
}

async function cargar() {
  if (!SESION) {
    estado.textContent = 'Entrá con tu enlace mágico para ver la tabla.';
    return;
  }
  try {
    const res = await fetch('/api/tabla', { headers: { Authorization: 'Bearer ' + SESION } });
    if (res.status === 401) {
      estado.textContent = 'Tu sesión no es válida. Entrá de nuevo con tu enlace.';
      return;
    }
    const { tabla, premio, torneo } = await res.json();

    // Banner con el torneo activo y el premio.
    const info = document.getElementById('info-torneo');
    const partes = [];
    if (torneo) partes.push('🏆 ' + torneo);
    if (premio) partes.push('Premio: ' + premio);
    info.textContent = partes.join(' · ');

    if (!tabla || tabla.length === 0) {
      estado.textContent = 'Todavía no hay puntos en este torneo.';
      return;
    }

    // Podio: 2º a la izquierda, 1º al medio (más alto), 3º a la derecha.
    podio.innerHTML =
      lugarPodio(tabla[1], 'plata', '🥈') +
      lugarPodio(tabla[0], 'oro', '🥇') +
      lugarPodio(tabla[2], 'bronce', '🥉');

    // Lista completa con estadisticas.
    lista.innerHTML = tabla.map((t) => `
      <li class="fila-pos">
        <span class="pos-num">${t.posicion}º</span>
        <span class="pos-nombre">${escaparHtml(t.avatar)} ${escaparHtml(t.nombre)}</span>
        <span class="pos-stats">${t.exactos} exactos · ${t.efectividad}%</span>
        <span class="pos-puntos">${t.puntos}</span>
      </li>`).join('');
  } catch {
    estado.textContent = 'No se pudo cargar la tabla.';
  }
}

cargar();
