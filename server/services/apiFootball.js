// apiFootball.js — Segunda fuente de datos (api-sports.io).
//
// La usamos para traer temporadas YA FINALIZADAS completas (gratis cubre 2022-2024),
// utiles como datos de prueba. Traduce al MISMO formato limpio que TheSportsDB,
// asi cualquier parte del sistema las trata igual (capa intercambiable).

const BASE_URL = 'https://v3.football.api-sports.io';
const LIGA_ARGENTINA = 128; // Liga Profesional Argentina en API-Football

// Saca el numero de fecha de textos tipo "Regular Season - 5".
function numeroDeFecha(round) {
  const m = (round || '').match(/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
}

// Traduce el estado de API-Football a NUESTROS 4 estados.
function traducirEstado(short) {
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finalizado';
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(short)) return 'en_juego';
  if (['PST', 'SUSP', 'CANC', 'ABD', 'AWD', 'WO'].includes(short)) return 'suspendido';
  return 'proximo';
}

// Convierte un partido crudo de API-Football a NUESTRO formato limpio.
function normalizarPartido(f) {
  return {
    // Prefijo "af-" para no chocar con los id de TheSportsDB en la misma columna.
    id_externo: 'af-' + f.fixture.id,
    temporada: String(f.league.season),
    fecha_numero: numeroDeFecha(f.league.round),
    local: f.teams.home.name,
    visitante: f.teams.away.name,
    escudo_local: f.teams.home.logo || null,
    escudo_visitante: f.teams.away.logo || null,
    inicio: f.fixture.date, // ya viene en ISO con zona horaria
    goles_local: f.goals.home,
    goles_visitante: f.goals.away,
    estado: traducirEstado(f.fixture.status.short),
    estadio: f.fixture.venue ? f.fixture.venue.name : null,
  };
}

// Trae TODOS los partidos de una temporada de la liga argentina.
async function obtenerTemporadaCompleta(temporada) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('Falta API_FOOTBALL_KEY en el .env');

  const url = `${BASE_URL}/fixtures?league=${LIGA_ARGENTINA}&season=${temporada}`;
  const respuesta = await fetch(url, { headers: { 'x-apisports-key': key } });
  const datos = await respuesta.json();

  if (datos.errors && Object.keys(datos.errors).length > 0) {
    throw new Error('API-Football: ' + JSON.stringify(datos.errors));
  }
  return (datos.response || []).map(normalizarPartido);
}

module.exports = { obtenerTemporadaCompleta, LIGA_ARGENTINA };
