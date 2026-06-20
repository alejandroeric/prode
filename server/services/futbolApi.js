// futbolApi.js — Capa intermedia ("traductor") hacia la API de futbol externa.
//
// HOY el proveedor es TheSportsDB. Si manana cambiamos de proveedor (otra API,
// otra de pago, etc.), SOLO se modifica este archivo: el resto del sistema sigue
// pidiendo los datos con NUESTROS nombres de campo (nombre, escudo, estadio...)
// y nunca se entera de como se llaman las cosas en la API externa.

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

// ID de la liga en TheSportsDB: Argentinian Primera Division.
const LIGA_ARGENTINA = 4406;

// Convierte un equipo del formato CRUDO de TheSportsDB (strTeam, strBadge...)
// a NUESTRO formato limpio y estable.
function normalizarEquipo(crudo) {
  return {
    nombre: crudo.strTeam,
    pais: crudo.strCountry,
    liga: crudo.strLeague,
    estadio: crudo.strStadium,
    escudo: crudo.strBadge,
    descripcion: crudo.strDescriptionES || crudo.strDescriptionEN || null,
  };
}

// Busca un equipo por nombre y devuelve sus datos ya traducidos.
// Devuelve null si no se encontro ningun equipo con ese nombre.
async function buscarEquipo(nombre) {
  const url = `${BASE_URL}/searchteams.php?t=${encodeURIComponent(nombre)}`;
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error(`La API de futbol respondio con estado ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  if (!datos.teams || datos.teams.length === 0) {
    return null;
  }

  return normalizarEquipo(datos.teams[0]);
}

// Traduce el estado crudo de la API a NUESTROS 4 estados del proyecto.
function traducirEstado(strStatus, strPostponed) {
  if (strPostponed && strPostponed.toLowerCase() === 'yes') return 'suspendido';

  const s = (strStatus || '').toUpperCase();
  if (['FT', 'AET', 'PEN', 'MATCH FINISHED'].includes(s)) return 'finalizado';
  if (['1H', '2H', 'HT', 'ET', 'LIVE'].includes(s)) return 'en_juego';
  return 'proximo'; // NS (not started) y cualquier otro
}

// Convierte un numero que puede venir como texto/vacio a numero o null.
function aNumero(valor) {
  return valor === null || valor === undefined || valor === '' ? null : Number(valor);
}

// Convierte un partido del formato CRUDO de TheSportsDB a NUESTRO formato limpio.
function normalizarPartido(crudo) {
  return {
    id_externo: crudo.idEvent,
    temporada: crudo.strSeason,
    fecha_numero: aNumero(crudo.intRound),
    local: crudo.strHomeTeam,
    visitante: crudo.strAwayTeam,
    escudo_local: crudo.strHomeTeamBadge || null,
    escudo_visitante: crudo.strAwayTeamBadge || null,
    fecha: crudo.dateEvent,
    hora: crudo.strTime,
    // strTimestamp viene en UTC sin marca de zona; le agregamos 'Z' para dejarlo listo.
    inicio: crudo.strTimestamp ? crudo.strTimestamp + 'Z' : null,
    goles_local: aNumero(crudo.intHomeScore),
    goles_visitante: aNumero(crudo.intAwayScore),
    estado: traducirEstado(crudo.strStatus, crudo.strPostponed),
    estadio: crudo.strVenue || null,
  };
}

// Pide partidos a un endpoint de la API y los devuelve ya traducidos.
async function pedirPartidos(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`La API de futbol respondio con estado ${respuesta.status}`);
  }
  const datos = await respuesta.json();
  if (!datos.events) return [];
  return datos.events.map(normalizarPartido);
}

// Proximos partidos de la liga argentina.
async function obtenerProximosPartidos() {
  return pedirPartidos(`${BASE_URL}/eventsnextleague.php?id=${LIGA_ARGENTINA}`);
}

// Ultimos partidos jugados de la liga argentina.
async function obtenerUltimosPartidos() {
  return pedirPartidos(`${BASE_URL}/eventspastleague.php?id=${LIGA_ARGENTINA}`);
}

// Partidos de una fecha (ronda) concreta de una temporada.
async function obtenerPartidosPorFecha(numeroFecha, temporada) {
  return pedirPartidos(
    `${BASE_URL}/eventsround.php?id=${LIGA_ARGENTINA}&r=${numeroFecha}&s=${temporada}`
  );
}

module.exports = {
  buscarEquipo,
  obtenerProximosPartidos,
  obtenerUltimosPartidos,
  obtenerPartidosPorFecha,
  LIGA_ARGENTINA,
};
