// perfil.js — Ficha personal del jugador: stats, posicion e historial fecha a fecha.

const SESION = localStorage.getItem('jugador_sesion');
const ficha = document.getElementById('ficha');
const historialEl = document.getElementById('historial');
const tituloHist = document.getElementById('titulo-historial');
const estado = document.getElementById('estado');

async function cargar() {
  if (!SESION) {
    estado.textContent = 'Entrá con tu enlace mágico para ver tu perfil.';
    return;
  }
  try {
    const res = await fetch('/api/perfil', { headers: { Authorization: 'Bearer ' + SESION } });
    if (res.status === 401) {
      estado.textContent = 'Tu sesión no es válida. Entrá de nuevo con tu enlace.';
      return;
    }
    const data = await res.json();
    const j = data.jugador;
    const nombre = (j && j.nombre) || (data.basico && data.basico.nombre) || 'jugador';
    const avatar = (j && j.avatar) || (data.basico && data.basico.avatar) || '👤';

    ficha.innerHTML = `
      <div class="ficha-avatar">${escaparHtml(avatar)}</div>
      <div class="ficha-nombre">${escaparHtml(nombre)}${data.campeon ? ' ⭐' : ''}</div>
      ${data.campeon ? '<div class="ficha-campeon">⭐ Campeón del torneo anterior</div>' : ''}
      <div class="ficha-puesto">${j ? `${j.posicion}º en tu grupo · ${j.puntos} pts` : 'Sin puntos todavía'}</div>
      <div class="ficha-stats">
        <div class="stat"><span class="stat-num">${j ? j.exactos : 0}</span><span class="stat-lbl">exactos</span></div>
        <div class="stat"><span class="stat-num">${j ? j.aciertos : 0}</span><span class="stat-lbl">aciertos</span></div>
        <div class="stat"><span class="stat-num">${j ? j.jugados : 0}</span><span class="stat-lbl">jugados</span></div>
        <div class="stat"><span class="stat-num">${j ? j.efectividad : 0}%</span><span class="stat-lbl">efectividad</span></div>
      </div>`;

    if (data.historial && data.historial.length) {
      tituloHist.style.display = 'block';
      historialEl.innerHTML = data.historial.map((h) => `
        <li class="fila-pos">
          <span class="pos-nombre">${escaparHtml(h.temporada)} · Fecha ${escaparHtml(h.fecha)}</span>
          <span class="pos-stats">${h.exactos} exactos · ${h.jugados} jug.</span>
          <span class="pos-puntos">${h.puntos}</span>
        </li>`).join('');
    } else {
      estado.textContent = 'Todavía no tenés fechas jugadas.';
    }
  } catch {
    estado.textContent = 'No se pudo cargar el perfil.';
  }
}

cargar();
