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

// Devuelve la lista de equipos ya cargados (nombres unicos), para el autocompletado.
// Por defecto muestra solo los del TORNEO ACTIVO (evita duplicados entre temporadas).
// Si el torneo activo no tiene equipos cargados, muestra todos (fallback).
async function equiposCargados() {
  const { obtenerConfig } = require('./configuracion');
  const activa = (await obtenerConfig()).temporada_activa;

  let consulta = supabase.from('partidos').select('local, visitante');
  if (activa) consulta = consulta.eq('temporada', activa);
  let { data, error } = await consulta;
  if (error) throw new Error(error.message);

  if (activa && (!data || data.length === 0)) {
    const r = await supabase.from('partidos').select('local, visitante');
    data = r.data || [];
  }

  const set = new Set();
  for (const p of data) {
    if (p.local) set.add(p.local);
    if (p.visitante) set.add(p.visitante);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

// Busca el escudo de un equipo por su nombre (best-effort: null si no lo encuentra).
async function buscarEscudo(nombre) {
  try {
    const eq = await futbolApi.buscarEquipo(nombre);
    return eq ? eq.escudo : null;
  } catch {
    return null;
  }
}

// Crea un partido cargado a mano (origen 'manual'). Intenta completar los escudos solo.
async function crearPartidoManual(datos) {
  const [escudoLocal, escudoVisitante] = await Promise.all([
    buscarEscudo(datos.local),
    buscarEscudo(datos.visitante),
  ]);

  // Si se cargan ambos goles, el partido entra como finalizado; si no, proximo.
  const golesLocal = datos.goles_local === '' || datos.goles_local == null ? null : Number(datos.goles_local);
  const golesVisitante = datos.goles_visitante === '' || datos.goles_visitante == null ? null : Number(datos.goles_visitante);
  const estado = golesLocal != null && golesVisitante != null ? 'finalizado' : 'proximo';

  const { data, error } = await supabase
    .from('partidos')
    .insert({
      temporada: datos.temporada,
      fecha_numero: datos.fecha_numero,
      local: datos.local,
      visitante: datos.visitante,
      inicio: datos.inicio || null,
      estadio: datos.estadio || null,
      escudo_local: escudoLocal,
      escudo_visitante: escudoVisitante,
      goles_local: golesLocal,
      goles_visitante: golesVisitante,
      estado,
      origen: 'manual',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Crea VARIOS partidos de una sola vez (usado por la carga via captura de pantalla).
// Busca los escudos de cada equipo una sola vez para ser eficiente.
async function crearPartidosEnLote(partidos, origen = 'captura') {
  if (!partidos || partidos.length === 0) return 0;

  // Juntar todos los equipos distintos y buscar sus escudos una sola vez.
  const equipos = new Set();
  partidos.forEach((p) => { equipos.add(p.local); equipos.add(p.visitante); });
  const escudos = {};
  await Promise.all([...equipos].map(async (e) => { escudos[e] = await buscarEscudo(e); }));

  const filas = partidos.map((p) => ({
    temporada: p.temporada,
    fecha_numero: p.fecha_numero,
    local: p.local,
    visitante: p.visitante,
    inicio: p.inicio || null,
    estadio: p.estadio || null,
    escudo_local: escudos[p.local] || null,
    escudo_visitante: escudos[p.visitante] || null,
    goles_local: p.goles_local ?? null,
    goles_visitante: p.goles_visitante ?? null,
    estado: p.estado || 'proximo',
    origen,
  }));

  const { error } = await supabase.from('partidos').insert(filas);
  if (error) throw new Error(error.message);
  return filas.length;
}

// Actualiza un partido (solo campos permitidos: resultado, estado, datos basicos).
async function actualizarPartido(id, cambios) {
  const permitidos = {};
  const campos = ['goles_local', 'goles_visitante', 'estado', 'inicio', 'estadio',
    'local', 'visitante', 'fecha_numero', 'temporada'];
  for (const c of campos) {
    if (cambios[c] !== undefined) permitidos[c] = cambios[c];
  }

  const { data, error } = await supabase
    .from('partidos')
    .update(permitidos)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Borra un partido por su id.
async function borrarPartido(id) {
  const { error } = await supabase.from('partidos').delete().eq('id', id);
  if (error) throw new Error(error.message);
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
  equiposCargados,
  crearPartidoManual,
  crearPartidosEnLote,
  actualizarPartido,
  borrarPartido,
  guardarPartidos,
};
