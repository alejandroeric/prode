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

// Mapa estatico: nombre del equipo (como lo usamos en el Prode) -> id en API-Football.
// Obtenido de la temporada 2023 de la liga argentina. Incluye equipos del Clausura 2026.
const MAPA_EQUIPOS = {
  'River Plate': { id: 435, logo: 'https://media.api-sports.io/football/teams/435.png', fundado: 1901, estadio: 'Estadio Monumental', ciudad: 'Buenos Aires' },
  'Boca Juniors': { id: 451, logo: 'https://media.api-sports.io/football/teams/451.png', fundado: 1905, estadio: 'Estadio Alberto J. Armando', ciudad: 'Buenos Aires' },
  'Racing Club': { id: 436, logo: 'https://media.api-sports.io/football/teams/436.png', fundado: 1903, estadio: 'Estadio Juan Domingo Perón', ciudad: 'Avellaneda' },
  'Independiente': { id: 437, logo: 'https://media.api-sports.io/football/teams/437.png', fundado: 1905, estadio: 'Estadio Libertadores de América', ciudad: 'Avellaneda' },
  'San Lorenzo': { id: 442, logo: 'https://media.api-sports.io/football/teams/442.png', fundado: 1908, estadio: 'Estadio Pedro Bidegain', ciudad: 'Buenos Aires' },
  'Huracán': { id: 443, logo: 'https://media.api-sports.io/football/teams/443.png', fundado: 1908, estadio: 'Estadio Tomás Adolfo Ducó', ciudad: 'Buenos Aires' },
  'Vélez Sarsfield': { id: 444, logo: 'https://media.api-sports.io/football/teams/444.png', fundado: 1910, estadio: 'Estadio José Amalfitani', ciudad: 'Buenos Aires' },
  'Lanús': { id: 446, logo: 'https://media.api-sports.io/football/teams/446.png', fundado: 1915, estadio: 'Estadio Ciudad de Lanús', ciudad: 'Lanús' },
  'Banfield': { id: 447, logo: 'https://media.api-sports.io/football/teams/447.png', fundado: 1896, estadio: 'Estadio Florencio Sola', ciudad: 'Banfield' },
  'Rosario Central': { id: 448, logo: 'https://media.api-sports.io/football/teams/448.png', fundado: 1889, estadio: 'Estadio Gigante de Arroyito', ciudad: 'Rosario' },
  "Newell's Old Boys": { id: 449, logo: 'https://media.api-sports.io/football/teams/449.png', fundado: 1903, estadio: 'Estadio Marcelo Bielsa', ciudad: 'Rosario' },
  'Belgrano': { id: 450, logo: 'https://media.api-sports.io/football/teams/450.png', fundado: 1905, estadio: 'Estadio Mario Alberto Kempes', ciudad: 'Córdoba' },
  'Estudiantes de La Plata': { id: 452, logo: 'https://media.api-sports.io/football/teams/452.png', fundado: 1905, estadio: 'Estadio Jorge Luis Hirschi', ciudad: 'La Plata' },
  'Gimnasia y Esgrima de La Plata': { id: 453, logo: 'https://media.api-sports.io/football/teams/453.png', fundado: 1887, estadio: 'Estadio Juan Carlos Zerillo', ciudad: 'La Plata' },
  'Defensa y Justicia': { id: 784, logo: 'https://media.api-sports.io/football/teams/784.png', fundado: 1935, estadio: 'Estadio Norberto Tomaghello', ciudad: 'Florencio Varela' },
  'Talleres de Córdoba': { id: 435, logo: 'https://media.api-sports.io/football/teams/716.png', fundado: 1913, estadio: 'Estadio Mario Alberto Kempes', ciudad: 'Córdoba' },
  'Platense': { id: 717, logo: 'https://media.api-sports.io/football/teams/717.png', fundado: 1905, estadio: 'Estadio Ciudad de Vicente López', ciudad: 'Buenos Aires' },
  'Tigre': { id: 719, logo: 'https://media.api-sports.io/football/teams/719.png', fundado: 1902, estadio: 'Estadio José Dellagiovanna', ciudad: 'Victoria' },
  'Sarmiento': { id: 720, logo: 'https://media.api-sports.io/football/teams/720.png', fundado: 1911, estadio: 'Estadio Eva Perón', ciudad: 'Junín' },
  'Argentinos Juniors': { id: 440, logo: 'https://media.api-sports.io/football/teams/440.png', fundado: 1904, estadio: 'Estadio Diego Armando Maradona', ciudad: 'Buenos Aires' },
  'Atlético Tucumán': { id: 716, logo: 'https://media.api-sports.io/football/teams/2283.png', fundado: 1902, estadio: 'Estadio Monumental José Fierro', ciudad: 'Tucumán' },
  'Central Córdoba de Santiago del Estero': { id: 2289, logo: 'https://media.api-sports.io/football/teams/2289.png', fundado: 1906, estadio: 'Estadio Madre de Ciudades', ciudad: 'Santiago del Estero' },
  'Barracas Central': { id: 7839, logo: 'https://media.api-sports.io/football/teams/7839.png', fundado: 1904, estadio: 'Estadio Guido Martino', ciudad: 'Buenos Aires' },
  'Aldosivi': { id: 2283, logo: 'https://media.api-sports.io/football/teams/2283.png', fundado: 1913, estadio: 'Estadio José María Minella', ciudad: 'Mar del Plata' },
  'Instituto': { id: 2294, logo: 'https://media.api-sports.io/football/teams/2294.png', fundado: 1918, estadio: 'Estadio Juan Domingo Perón', ciudad: 'Córdoba' },
  'Gimnasia y Esgrima de Mendoza': { id: 2303, logo: 'https://media.api-sports.io/football/teams/2303.png', fundado: 1904, estadio: 'Estadio Mundialista', ciudad: 'Mendoza' },
  'Unión': { id: 2297, logo: 'https://media.api-sports.io/football/teams/2297.png', fundado: 1907, estadio: 'Estadio 15 de Abril', ciudad: 'Santa Fe' },
  'Deportivo Riestra': { id: 8765, logo: 'https://media.api-sports.io/football/teams/8765.png', fundado: 1916, estadio: 'Estadio Guillermo Laza', ciudad: 'Buenos Aires' },
  'Independiente Rivadavia': { id: 2288, logo: 'https://media.api-sports.io/football/teams/2288.png', fundado: 1906, estadio: 'Estadio Bautista Gargantini', ciudad: 'Mendoza' },
  'Estudiantes de Río Cuarto': { id: 9665, logo: 'https://media.api-sports.io/football/teams/9665.png', fundado: 1919, estadio: 'Estadio Ciudad de Río Cuarto', ciudad: 'Río Cuarto' },
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
