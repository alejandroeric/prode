// fixture.js — Sincroniza partidos desde la API hacia la tabla, y los lista.
// Los partidos de la API tienen id_externo; los manuales no. Por eso el "upsert"
// (insertar o actualizar) por id_externo NUNCA pisa los partidos cargados a mano.

const { supabase } = require('./supabase');
const futbolApi = require('./futbolApi');
const apiFootball = require('./apiFootball');

// Convierte un partido normalizado de la API a una fila de la tabla "partidos".
function aFila(p) {
  return {
    id_externo: p.id_externo,
    temporada: p.temporada,
    fecha_numero: p.fecha_numero,
    local: p.local,
    visitante: p.visitante,
    escudo_local: p.escudo_local,
    escudo_visitante: p.escudo_visitante,
    inicio: p.inicio || null, // cada proveedor ya devuelve la fecha lista para guardar
    goles_local: p.goles_local,
    goles_visitante: p.goles_visitante,
    estado: p.estado,
    estadio: p.estadio,
    origen: 'api',
  };
}

// Inserta o actualiza una lista de partidos de la API (por id_externo).
async function guardarPartidos(partidos) {
  if (!partidos || partidos.length === 0) return 0;
  const filas = partidos.map(aFila);
  const { error } = await supabase
    .from('partidos')
    .upsert(filas, { onConflict: 'id_externo' });
  if (error) throw new Error(error.message);
  return filas.length;
}

// Sincroniza los proximos + ultimos partidos que ofrece la API.
async function sincronizarDesdeApi() {
  const [proximos, ultimos] = await Promise.all([
    futbolApi.obtenerProximosPartidos(),
    futbolApi.obtenerUltimosPartidos(),
  ]);
  const todos = [...proximos, ...ultimos];
  const guardados = await guardarPartidos(todos);
  return { recibidos: todos.length, guardados };
}

// Sincroniza una fecha (ronda) concreta de una temporada.
async function sincronizarFecha(numero, temporada) {
  const partidos = await futbolApi.obtenerPartidosPorFecha(numero, temporada);
  const guardados = await guardarPartidos(partidos);
  return { recibidos: partidos.length, guardados };
}

// Importa una temporada COMPLETA y finalizada desde API-Football (datos de prueba).
async function importarTemporada(temporada) {
  const partidos = await apiFootball.obtenerTemporadaCompleta(temporada);
  const guardados = await guardarPartidos(partidos);
  return { recibidos: partidos.length, guardados };
}

// Lista todos los partidos guardados, ordenados por fecha de inicio.
async function listarPartidos() {
  const { data, error } = await supabase
    .from('partidos')
    .select('*')
    .order('inicio', { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data;
}

// Devuelve las temporadas disponibles con sus numeros de fecha.
// Ej: [{ temporada: '2023', fechas: [1,2,3,...] }]
async function temporadasDisponibles() {
  const { data, error } = await supabase.from('partidos').select('temporada, fecha_numero');
  if (error) throw new Error(error.message);

  const mapa = {};
  for (const r of data) {
    if (!r.temporada) continue;
    if (!mapa[r.temporada]) mapa[r.temporada] = new Set();
    if (r.fecha_numero != null) mapa[r.temporada].add(r.fecha_numero);
  }
  return Object.entries(mapa)
    .map(([temporada, set]) => ({ temporada, fechas: [...set].sort((a, b) => a - b) }))
    .sort((a, b) => b.temporada.localeCompare(a.temporada));
}

// Devuelve los partidos de una fecha concreta, ordenados por hora de inicio.
async function partidosDeFecha(temporada, fecha) {
  const { data, error } = await supabase
    .from('partidos')
    .select('*')
    .eq('temporada', temporada)
    .eq('fecha_numero', fecha)
    .order('inicio', { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  sincronizarDesdeApi,
  sincronizarFecha,
  importarTemporada,
  listarPartidos,
  temporadasDisponibles,
  partidosDeFecha,
  guardarPartidos,
};
