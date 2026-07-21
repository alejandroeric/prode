// apiFootball.js — Segunda fuente de datos (api-sports.io).
//
// La usamos para traer temporadas YA FINALIZADAS completas (gratis cubre 2022-2024),
// utiles como datos de prueba. Traduce al MISMO formato limpio que TheSportsDB,
// asi cualquier parte del sistema las trata igual (capa intercambiable).

const BASE_URL = 'https://v3.football.api-sports.io';
const LIGA_ARGENTINA = 128; // Liga Profesional Argentina en API-Football

// Hace un pedido a API-Football con la clave del .env.
async function pedir(path) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error('Falta API_FOOTBALL_KEY en el .env');
  const res = await fetch(BASE_URL + path, { headers: { 'x-apisports-key': key } });
  return res.json();
}

// Mapa estatico: nombre del equipo -> logo verificado desde TheSportsDB (r2.thesportsdb.com).
// Logos consultados directamente de la API en julio 2026. Sin dependencia de api-sports.io.
const MAPA_EQUIPOS = {
  'River Plate':                         { id: 435,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/03dmi31645539717.png' },
  'Boca Juniors':                         { id: 451,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/bm7krb1775741582.png' },
  'Racing Club':                          { id: 436,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/vi4mu41695734959.png' },
  'Independiente':                        { id: 437,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/eki4nd1580842605.png' },
  'San Lorenzo':                          { id: 442,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/jih7hv1582229717.png' },
  'Huracán':                              { id: 443,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/kppi2b1775776550.png' },
  'Vélez Sarsfield':                      { id: 444,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/jo98m71517769587.png' },
  'Lanús':                                { id: 446,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/ddty0w1769146364.png' },
  'Banfield':                             { id: 447,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/c2ea011775756104.png' },
  'Rosario Central':                      { id: 448,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/y6q1ds1769660256.png' },
  "Newell's Old Boys":                    { id: 449,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/23aftf1580842633.png' },
  'Belgrano':                             { id: 450,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/0twgzi1517768087.png' },
  'Estudiantes de La Plata':              { id: 452,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/pf08dq1760634366.png' },
  'Gimnasia y Esgrima de La Plata':       { id: 453,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/dtqto61775838814.png' },
  'Defensa y Justicia':                   { id: 784,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/3guvlh1775778978.png' },
  'Talleres de Córdoba':                  { id: 716,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/7hum2t1769310938.png' },
  'Platense':                             { id: 717,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/lbs14n1769317149.png' },
  'Tigre':                                { id: 719,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/krryg71765858882.png' },
  'Sarmiento':                            { id: 720,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/xxofu71677634191.png' },
  'Argentinos Juniors':                   { id: 458,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/uqfjuo1769234850.png' },
  'Atlético Tucumán':                     { id: 455,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/m5i2q21775755577.png' },
  'Godoy Cruz':                           { id: 439,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/d3c0ds1517768584.png' },
  'Central Córdoba de Santiago del Estero': { id: 1065, logo: 'https://r2.thesportsdb.com/images/media/team/badge/d62xkc1576101576.png' },
  'Barracas Central':                     { id: 2432, logo: 'https://r2.thesportsdb.com/images/media/team/badge/rbkjba1707458543.png' },
  'Instituto':                            { id: 2294, logo: 'https://r2.thesportsdb.com/images/media/team/badge/jup59w1578825794.png' },
  'Gimnasia y Esgrima de Mendoza':        { id: 2303, logo: 'https://r2.thesportsdb.com/images/media/team/badge/h11mlf1677636958.png' },
  'Unión':                                { id: 2297, logo: 'https://r2.thesportsdb.com/images/media/team/badge/o70np51644976464.png' },
  'Deportivo Riestra':                    { id: 476,  logo: 'https://r2.thesportsdb.com/images/media/team/badge/332h0l1578824392.png' },
  'Independiente Rivadavia':              { id: 2288, logo: 'https://r2.thesportsdb.com/images/media/team/badge/qgzi2b1769406125.png' },
  'Estudiantes de Río Cuarto':            { id: 9665, logo: 'https://r2.thesportsdb.com/images/media/team/badge/391thp1775793121.png' },
};

// Normaliza texto para comparacion flexible.
function normalizar(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// Resuelve un nombre de equipo al objeto de API-Football usando el mapa estatico.
// Usa el mapa primero (exacto o por palabras clave) — no hace pedidos a la API.
async function resolverEquipo(nombre) {
  // 1. Coincidencia exacta en el mapa.
  if (MAPA_EQUIPOS[nombre]) {
    const d = MAPA_EQUIPOS[nombre];
    return { id: d.id, nombre, logo: d.logo, fundado: d.fundado, estadio: d.estadio, ciudad: d.ciudad };
  }
  // 2. Busqueda por normalizacion (ignora acentos y mayusculas).
  const q = normalizar(nombre);
  const entrada = Object.entries(MAPA_EQUIPOS).find(([k]) => normalizar(k) === q);
  if (entrada) {
    const d = entrada[1];
    return { id: d.id, nombre: entrada[0], logo: d.logo, fundado: d.fundado, estadio: d.estadio, ciudad: d.ciudad };
  }
  // 3. Busqueda por palabras clave (ej: "Talleres" encuentra "Talleres de Cordoba").
  const qt = q.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(t => t.length >= 4);
  let mejor = null, mejorScore = 0;
  for (const [k, d] of Object.entries(MAPA_EQUIPOS)) {
    const kt = normalizar(k).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/);
    const score = qt.filter(t => kt.includes(t)).length;
    if (score > mejorScore) { mejorScore = score; mejor = { id: d.id, nombre: k, logo: d.logo, fundado: d.fundado, estadio: d.estadio, ciudad: d.ciudad }; }
  }
  return mejorScore > 0 ? mejor : null;
}

// Historial de enfrentamientos entre dos equipos (por id), ya jugados.
async function headToHead(idA, idB) {
  const data = await pedir(`/fixtures/headtohead?h2h=${idA}-${idB}`);
  return (data.response || [])
    .filter((f) => f.goals.home != null && f.goals.away != null)
    .map((f) => ({
      fecha: f.fixture.date,
      local: f.teams.home.name,
      visitante: f.teams.away.name,
      goles_local: f.goals.home,
      goles_visitante: f.goals.away,
    }));
}

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

module.exports = { obtenerTemporadaCompleta, resolverEquipo, headToHead, LIGA_ARGENTINA };
