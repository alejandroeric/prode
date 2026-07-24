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
// Solo guarda los que coincidan con el TORNEO ACTIVO para no mezclar temporadas.
async function sincronizarDesdeApi() {
  const { obtenerConfig } = require('./configuracion');
  const { temporada_activa } = await obtenerConfig();

  const [proximos, ultimos] = await Promise.all([
    futbolApi.obtenerProximosPartidos(),
    futbolApi.obtenerUltimosPartidos(),
  ]);
  const todos = [...proximos, ...ultimos];

  // Filtrar solo los del torneo activo (evita mezclar con otras temporadas).
  const filtrados = temporada_activa
    ? todos.filter(p => p.temporada === temporada_activa)
    : todos;

  const guardados = await guardarPartidos(filtrados);
  return { recibidos: todos.length, guardados, filtrados: filtrados.length };
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

// Busca el escudo de un equipo por su nombre usando el mapa estatico de equipos argentinos.
// 100% estatico: sin llamadas externas, sin riesgo de traer escudos de otros paises.
// Si el equipo no esta en el mapa, devuelve null.
async function buscarEscudo(nombre) {
  try {
    const entrada = await apiFootball.resolverEquipo(nombre);
    return entrada ? entrada.logo : null;
  } catch {
    return null;
  }
}

// Recorre todos los partidos y reaplica los escudos usando el mapa estatico.
// Usar una sola vez cuando los escudos guardados en la DB son incorrectos.
// Recorre todos los partidos, aplica escudos del mapa estático y reporta
// los equipos que siguen sin escudo (nombre no reconocido en el mapa).
async function repararEscudos() {
  const { data: partidos, error } = await supabase
    .from('partidos')
    .select('id, local, visitante, escudo_local, escudo_visitante');
  if (error) throw new Error(error.message);

  let reparados = 0;
  const sinEscudo = new Set();

  for (const p of partidos) {
    const [escudoLocal, escudoVisitante] = await Promise.all([
      buscarEscudo(p.local),
      buscarEscudo(p.visitante),
    ]);
    if (!escudoLocal) sinEscudo.add(p.local);
    if (!escudoVisitante) sinEscudo.add(p.visitante);

    const update = {};
    if (escudoLocal) update.escudo_local = escudoLocal;
    if (escudoVisitante) update.escudo_visitante = escudoVisitante;
    if (Object.keys(update).length > 0) {
      await supabase.from('partidos').update(update).eq('id', p.id);
      reparados++;
    }
  }
  return { reparados, sinEscudo: [...sinEscudo].sort() };
}

// Crea un partido cargado a mano (origen 'manual'). Intenta completar los escudos solo.
async function crearPartidoManual(datos) {
  const { data: existente } = await supabase
    .from('partidos').select('id')
    .eq('temporada', datos.temporada).eq('fecha_numero', datos.fecha_numero)
    .eq('local', datos.local).eq('visitante', datos.visitante)
    .maybeSingle();
  if (existente) throw new Error(`Ya existe ${datos.local} vs ${datos.visitante} en la fecha ${datos.fecha_numero}`);

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

  // Filtrar los que ya existen (evita duplicados si se llama dos veces).
  const existencias = await Promise.all(partidos.map(async (p) => {
    const { data } = await supabase
      .from('partidos').select('id')
      .eq('temporada', p.temporada).eq('fecha_numero', p.fecha_numero)
      .eq('local', p.local).eq('visitante', p.visitante)
      .maybeSingle();
    return !!data;
  }));
  const nuevos = partidos.filter((_, i) => !existencias[i]);
  if (nuevos.length === 0) return 0;

  // Juntar todos los equipos distintos y buscar sus escudos una sola vez.
  const equipos = new Set();
  nuevos.forEach((p) => { equipos.add(p.local); equipos.add(p.visitante); });
  const escudos = {};
  await Promise.all([...equipos].map(async (e) => { escudos[e] = await buscarEscudo(e); }));

  const filas = nuevos.map((p) => ({
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

// Detecta partidos duplicados (mismo local+visitante+fecha+temporada), migra los
// pronósticos al registro con resultado y elimina los duplicados sin resultado.
async function repararDuplicados() {
  const { data: partidos, error } = await supabase
    .from('partidos')
    .select('id, temporada, fecha_numero, local, visitante, goles_local, goles_visitante, estado')
    .order('inicio', { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);

  const grupos = {};
  for (const p of partidos) {
    const key = `${p.temporada}||${p.fecha_numero}||${p.local}||${p.visitante}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(p);
  }

  let pronosticosMigrados = 0;
  let partidosEliminados = 0;
  const detalle = [];

  for (const lista of Object.values(grupos)) {
    if (lista.length <= 1) continue;

    // El "correcto": primero los que tienen resultado (finalizado), luego por antigüedad.
    lista.sort((a, b) => {
      const peso = (p) => (p.estado === 'finalizado' ? 2 : p.goles_local != null ? 1 : 0);
      return peso(b) - peso(a) || new Date(a.created_at) - new Date(b.created_at);
    });

    const correcto = lista[0];
    const aEliminar = lista.slice(1);

    for (const dup of aEliminar) {
      const { data: prons } = await supabase
        .from('pronosticos').select('id, jugador_id').eq('partido_id', dup.id);

      if (prons && prons.length > 0) {
        for (const pron of prons) {
          const { data: ya } = await supabase
            .from('pronosticos').select('id')
            .eq('partido_id', correcto.id).eq('jugador_id', pron.jugador_id)
            .maybeSingle();
          if (!ya) {
            await supabase.from('pronosticos').update({ partido_id: correcto.id }).eq('id', pron.id);
            pronosticosMigrados++;
          }
        }
      }
      await supabase.from('pronosticos').delete().eq('partido_id', dup.id);
      await supabase.from('partidos').delete().eq('id', dup.id);
      partidosEliminados++;
    }

    detalle.push(`${correcto.local} vs ${correcto.visitante} (fecha ${correcto.fecha_numero}): ${aEliminar.length} duplicado(s) eliminado(s)`);
  }

  return { pronosticosMigrados, partidosEliminados, detalle };
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
  repararEscudos,
  repararDuplicados,
};
