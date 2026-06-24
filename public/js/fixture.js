// fixture.js — Pantalla del fixture: muestra los partidos de cada fecha.

const selectorTemporada = document.getElementById('selector-temporada');
const fechaActualEl = document.getElementById('fecha-actual');
const contenedor = document.getElementById('partidos');
const btnAnterior = document.getElementById('fecha-anterior');
const btnSiguiente = document.getElementById('fecha-siguiente');

let temporadas = [];   // [{ temporada, fechas: [...] }]
let temporadaActual = null;
let indiceFecha = 0;   // posicion dentro del array de fechas de la temporada

// Texto y color segun el estado del partido.
const ESTADOS = {
  proximo: { texto: 'Próximo', clase: 'estado-proximo' },
  en_juego: { texto: 'EN JUEGO', clase: 'estado-jugando' },
  finalizado: { texto: 'Finalizado', clase: 'estado-finalizado' },
  suspendido: { texto: 'Suspendido', clase: 'estado-suspendido' },
};

// Formatea la fecha/hora de inicio a algo legible (dia y hora local).
function formatearInicio(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-AR', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// Dibuja una tarjeta de partido.
function tarjetaPartido(p) {
  const est = ESTADOS[p.estado] || ESTADOS.proximo;
  const finalizado = p.estado === 'finalizado';
  const golesL = p.goles_local != null ? p.goles_local : '';
  const golesV = p.goles_visitante != null ? p.goles_visitante : '';
  const escudo = (url) => url ? `<img src="${url}" alt="" class="escudo" />` : '<span class="escudo"></span>';

  return `
    <article class="tarjeta-partido">
      <div class="equipo">
        ${escudo(p.escudo_local)}
        <span class="equipo-nombre">${escaparHtml(p.local)}</span>
        <span class="gol">${golesL}</span>
      </div>
      <div class="equipo">
        ${escudo(p.escudo_visitante)}
        <span class="equipo-nombre">${escaparHtml(p.visitante)}</span>
        <span class="gol">${golesV}</span>
      </div>
      <div class="partido-pie">
        <span class="badge ${est.clase}">${est.texto}</span>
        <span class="partido-hora">${finalizado ? (p.estadio || '') : formatearInicio(p.inicio)}</span>
      </div>
      <div class="acciones-partido">
        <button type="button" class="btn-datos" data-partido="${p.id}">📊 Datos</button>
        <button type="button" class="btn-pronos" data-partido="${p.id}">🔮 Pronósticos</button>
      </div>
      <div class="datos-partido" id="datos-${p.id}"></div>
      <div class="datos-partido" id="pronos-${p.id}"></div>
    </article>
  `;
}

// Dibuja la lista de pronosticos del grupo (con "sin datos" para los que no cargaron).
function dibujarPronosticos(lista) {
  if (!lista.length) return '<p class="texto-ayuda">No hay jugadores en tu grupo.</p>';
  const filas = lista.map((p) => {
    const res = (p.goles_local != null && p.goles_visitante != null)
      ? `${p.goles_local}-${p.goles_visitante}`
      : '<span class="sin-datos">sin datos</span>';
    return `<div class="grupo-fila"><span>${escaparHtml(p.avatar)} ${escaparHtml(p.nombre)}${p.campeon ? ' ⭐' : ''}</span><span class="grupo-gol">${res}</span></div>`;
  }).join('');
  return `<h4 class="h2h-titulo">Pronósticos del grupo</h4>${filas}`;
}

// Dibuja el panel de datos (equipos + head-to-head).
function dibujarDatos(s) {
  const equipo = (e) => `
    <div class="datos-equipo">
      ${e.logo ? `<img src="${escaparHtml(e.logo)}" class="escudo" />` : '<span class="escudo"></span>'}
      <div>
        <strong>${escaparHtml(e.nombre)}</strong>
        <small>${escaparHtml([e.estadio, e.ciudad, e.fundado ? 'desde ' + e.fundado : ''].filter(Boolean).join(' · '))}</small>
      </div>
    </div>`;

  const h2h = s.h2h.length
    ? s.h2h.map((h) => `
        <div class="h2h-fila">
          <span class="h2h-fecha">${h.fecha.slice(0, 10)}</span>
          <span>${escaparHtml(h.local)} <b>${h.goles_local}-${h.goles_visitante}</b> ${escaparHtml(h.visitante)}</span>
        </div>`).join('')
    : '<p class="texto-ayuda">Sin enfrentamientos en el registro.</p>';

  return `${equipo(s.local)}${equipo(s.visitante)}
    <h4 class="h2h-titulo">Últimos enfrentamientos</h4>${h2h}`;
}

// Listener para "Datos" (equipos + head-to-head).
contenedor.addEventListener('click', async (e) => {
  const boton = e.target.closest('.btn-datos');
  if (!boton) return;
  const panel = document.getElementById('datos-' + boton.dataset.partido);
  if (panel.innerHTML.trim() !== '') { panel.innerHTML = ''; return; } // segundo clic: ocultar
  panel.innerHTML = '<p class="texto-ayuda">Cargando datos...</p>';
  try {
    const res = await fetch('/api/fixture/' + boton.dataset.partido + '/stats');
    const stats = await res.json();
    panel.innerHTML = dibujarDatos(stats);
  } catch {
    panel.innerHTML = '<p class="texto-ayuda">No se pudieron cargar los datos.</p>';
  }
});

// Listener para "Pronósticos del grupo" (solo si el partido ya arranco).
contenedor.addEventListener('click', async (e) => {
  const boton = e.target.closest('.btn-pronos');
  if (!boton) return;
  const panel = document.getElementById('pronos-' + boton.dataset.partido);
  if (panel.innerHTML.trim() !== '') { panel.innerHTML = ''; return; }

  const sesion = localStorage.getItem('jugador_sesion');
  if (!sesion) {
    panel.innerHTML = '<p class="texto-ayuda">Entrá con tu enlace mágico para ver los pronósticos del grupo.</p>';
    return;
  }
  panel.innerHTML = '<p class="texto-ayuda">Cargando...</p>';
  try {
    const res = await fetch('/api/pronosticos/partido/' + boton.dataset.partido, {
      headers: { Authorization: 'Bearer ' + sesion },
    });
    if (res.status === 401) {
      panel.innerHTML = '<p class="texto-ayuda">Tu sesión no es válida. Entrá de nuevo con tu enlace.</p>';
      return;
    }
    const datos = await res.json();
    if (!datos.revelado) {
      panel.innerHTML = '<p class="texto-ayuda">🔒 Se revelan cuando arranca el partido.</p>';
      return;
    }
    panel.innerHTML = dibujarPronosticos(datos.pronosticos);
  } catch {
    panel.innerHTML = '<p class="texto-ayuda">No se pudieron cargar.</p>';
  }
});

// Pide y dibuja los partidos de la fecha actual.
async function cargarFecha() {
  if (!temporadaActual) return;
  const numeroFecha = temporadaActual.fechas[indiceFecha];
  fechaActualEl.textContent = 'Fecha ' + numeroFecha;
  contenedor.innerHTML = '<p class="estado">Cargando...</p>';

  // Habilitar/deshabilitar flechas en los extremos.
  btnAnterior.disabled = indiceFecha === 0;
  btnSiguiente.disabled = indiceFecha === temporadaActual.fechas.length - 1;

  try {
    const res = await fetch(`/api/fixture?temporada=${temporadaActual.temporada}&fecha=${numeroFecha}`);
    const partidos = await res.json();
    if (!partidos.length) {
      contenedor.innerHTML = '<p class="estado">No hay partidos en esta fecha.</p>';
      return;
    }
    contenedor.innerHTML = partidos.map(tarjetaPartido).join('');
  } catch {
    contenedor.innerHTML = '<p class="estado">No se pudo cargar el fixture.</p>';
  }
}

// Cambia la temporada elegida.
function elegirTemporada(nombre) {
  temporadaActual = temporadas.find((t) => t.temporada === nombre);
  indiceFecha = 0;
  cargarFecha();
}

btnAnterior.addEventListener('click', () => {
  if (indiceFecha > 0) { indiceFecha--; cargarFecha(); }
});
btnSiguiente.addEventListener('click', () => {
  if (indiceFecha < temporadaActual.fechas.length - 1) { indiceFecha++; cargarFecha(); }
});
selectorTemporada.addEventListener('change', (e) => elegirTemporada(e.target.value));

// Arranque: traer temporadas disponibles.
async function iniciar() {
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
    // Arrancamos en la temporada con MAS fechas cargadas (la de datos mas completos).
    const principal = temporadas.reduce((a, b) => (b.fechas.length > a.fechas.length ? b : a));
    selectorTemporada.value = principal.temporada;
    elegirTemporada(principal.temporada);
  } catch {
    contenedor.innerHTML = '<p class="estado">No se pudo conectar con el servidor.</p>';
  }
}

iniciar();
