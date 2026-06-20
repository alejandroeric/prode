// mis-pronosticos.js — Pantalla donde el jugador carga y modifica sus pronosticos.
// Requiere sesion de jugador (token guardado al entrar por el enlace magico).

const selectorTemporada = document.getElementById('selector-temporada');
const fechaActualEl = document.getElementById('fecha-actual');
const contenedor = document.getElementById('partidos');
const btnAnterior = document.getElementById('fecha-anterior');
const btnSiguiente = document.getElementById('fecha-siguiente');
const barraGuardar = document.getElementById('barra-guardar');
const estadoGuardado = document.getElementById('estado-guardado');
const btnGuardarTodo = document.getElementById('btn-guardar-todo');

const SESION = localStorage.getItem('jugador_sesion');
const cabeceraAuth = { Authorization: 'Bearer ' + SESION };

let temporadas = [];
let temporadaActual = null;
let indiceFecha = 0;

function formatearInicio(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-AR', {
    weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

// Tarjeta de un partido: con inputs si se puede pronosticar, o bloqueada si ya cerro.
function tarjetaPartido(p) {
  const escudo = (url) => url ? `<img src="${url}" alt="" class="escudo" />` : '<span class="escudo"></span>';
  const pl = p.mi_pronostico ? p.mi_pronostico.goles_local : '';
  const pv = p.mi_pronostico ? p.mi_pronostico.goles_visitante : '';

  if (p.bloqueado) {
    const resultado = p.estado === 'finalizado'
      ? `${p.goles_local ?? '-'} - ${p.goles_visitante ?? '-'}`
      : '🔒';
    const miTexto = p.mi_pronostico ? `Tu pronóstico: ${pl}-${pv}` : 'No pronosticaste';
    return `
      <article class="tarjeta-partido bloqueada">
        <div class="equipo">${escudo(p.escudo_local)}<span class="equipo-nombre">${p.local}</span></div>
        <div class="equipo">${escudo(p.escudo_visitante)}<span class="equipo-nombre">${p.visitante}</span></div>
        <div class="partido-pie">
          <span class="badge estado-suspendido">Cerrado</span>
          <span class="partido-hora">${resultado} · ${miTexto}</span>
        </div>
      </article>`;
  }

  return `
    <article class="tarjeta-partido" data-id="${p.id}">
      <div class="equipo">
        ${escudo(p.escudo_local)}
        <span class="equipo-nombre">${p.local}</span>
        <input type="number" class="gol-input pron-local" min="0" value="${pl}" placeholder="-" />
      </div>
      <div class="equipo">
        ${escudo(p.escudo_visitante)}
        <span class="equipo-nombre">${p.visitante}</span>
        <input type="number" class="gol-input pron-visitante" min="0" value="${pv}" placeholder="-" />
      </div>
      <div class="partido-pie">
        <span class="badge estado-proximo">Abierto</span>
        <span class="partido-hora">${formatearInicio(p.inicio)}</span>
      </div>
    </article>`;
}

async function cargarFecha() {
  if (!temporadaActual) return;
  const numeroFecha = temporadaActual.fechas[indiceFecha];
  fechaActualEl.textContent = 'Fecha ' + numeroFecha;
  contenedor.innerHTML = '<p class="estado">Cargando...</p>';
  btnAnterior.disabled = indiceFecha === 0;
  btnSiguiente.disabled = indiceFecha === temporadaActual.fechas.length - 1;

  try {
    const res = await fetch(`/api/pronosticos?temporada=${encodeURIComponent(temporadaActual.temporada)}&fecha=${numeroFecha}`, { headers: cabeceraAuth });
    if (res.status === 401) {
      contenedor.innerHTML = '<p class="estado">Tu sesión no es válida. Entrá de nuevo con tu enlace mágico.</p>';
      barraGuardar.style.display = 'none';
      return;
    }
    const partidos = await res.json();
    if (!partidos.length) {
      contenedor.innerHTML = '<p class="estado">No hay partidos en esta fecha.</p>';
      barraGuardar.style.display = 'none';
      return;
    }
    contenedor.innerHTML = partidos.map(tarjetaPartido).join('');
    // Mostramos el boton solo si hay al menos un partido abierto.
    const hayAbiertos = partidos.some((p) => !p.bloqueado);
    barraGuardar.style.display = hayAbiertos ? 'flex' : 'none';
    estadoGuardado.textContent = '';
  } catch {
    contenedor.innerHTML = '<p class="estado">No se pudo cargar.</p>';
  }
}

// Guarda todos los pronosticos cargados (los partidos abiertos con ambos goles).
async function guardarTodo() {
  const tarjetas = contenedor.querySelectorAll('.tarjeta-partido[data-id]');
  let guardados = 0, fallidos = 0;

  for (const t of tarjetas) {
    const gl = t.querySelector('.pron-local').value;
    const gv = t.querySelector('.pron-visitante').value;
    if (gl === '' || gv === '') continue; // sin completar, lo salteamos

    try {
      const res = await fetch('/api/pronosticos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cabeceraAuth },
        body: JSON.stringify({ partido_id: t.dataset.id, goles_local: gl, goles_visitante: gv }),
      });
      res.ok ? guardados++ : fallidos++;
    } catch {
      fallidos++;
    }
  }

  estadoGuardado.textContent = `Guardados: ${guardados}` + (fallidos ? ` · Fallaron: ${fallidos}` : ' ✅');
}

function elegirTemporada(nombre) {
  temporadaActual = temporadas.find((t) => t.temporada === nombre);
  indiceFecha = 0;
  cargarFecha();
}

btnAnterior.addEventListener('click', () => { if (indiceFecha > 0) { indiceFecha--; cargarFecha(); } });
btnSiguiente.addEventListener('click', () => { if (indiceFecha < temporadaActual.fechas.length - 1) { indiceFecha++; cargarFecha(); } });
selectorTemporada.addEventListener('change', (e) => elegirTemporada(e.target.value));
btnGuardarTodo.addEventListener('click', guardarTodo);

async function iniciar() {
  if (!SESION) {
    contenedor.innerHTML = '<p class="estado">Necesitás entrar con tu enlace mágico para cargar pronósticos.</p>';
    return;
  }
  try {
    const res = await fetch('/api/fixture/temporadas');
    temporadas = await res.json();
    if (!temporadas.length) {
      contenedor.innerHTML = '<p class="estado">Todavía no hay partidos cargados.</p>';
      return;
    }
    selectorTemporada.innerHTML = temporadas
      .map((t) => `<option value="${t.temporada}">Temporada ${t.temporada}</option>`)
      .join('');
    const principal = temporadas.reduce((a, b) => (b.fechas.length > a.fechas.length ? b : a));
    selectorTemporada.value = principal.temporada;
    elegirTemporada(principal.temporada);
  } catch {
    contenedor.innerHTML = '<p class="estado">No se pudo conectar con el servidor.</p>';
  }
}

iniciar();
