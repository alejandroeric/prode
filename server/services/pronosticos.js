// pronosticos.js — Logica de pronosticos: guardar (con bloqueo) y consultar.

const { supabase } = require('./supabase');

// Un partido esta BLOQUEADO para pronosticar si ya no es "proximo"
// (en juego, finalizado o suspendido) o si ya llego su hora de inicio.
function partidoBloqueado(partido) {
  if (partido.estado !== 'proximo') return true;
  if (partido.inicio && new Date(partido.inicio) <= new Date()) return true;
  return false;
}

// Guarda (o actualiza) el pronostico de un jugador para un partido.
// Devuelve { error } si no se puede, o { pronostico } si salio bien.
async function guardarPronostico(jugadorId, partidoId, golesLocal, golesVisitante) {
  const { data: partido, error: e1 } = await supabase
    .from('partidos').select('*').eq('id', partidoId).maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!partido) return { error: 'partido_inexistente' };
  if (partidoBloqueado(partido)) return { error: 'bloqueado' };

  const { data, error } = await supabase
    .from('pronosticos')
    .upsert(
      {
        jugador_id: jugadorId,
        partido_id: partidoId,
        goles_local: golesLocal,
        goles_visitante: golesVisitante,
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'jugador_id,partido_id' }
    )
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return { pronostico: data };
}

// Devuelve los partidos de una fecha + el pronostico propio de ese jugador
// + si cada partido esta bloqueado (para mostrarlo en pantalla).
async function partidosConMiPronostico(jugadorId, temporada, fecha) {
  const { data: partidos, error } = await supabase
    .from('partidos').select('*')
    .eq('temporada', temporada).eq('fecha_numero', fecha)
    .order('inicio', { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);

  const ids = partidos.map((p) => p.id);
  let mios = [];
  if (ids.length) {
    const { data, error: e2 } = await supabase
      .from('pronosticos').select('*')
      .eq('jugador_id', jugadorId).in('partido_id', ids);
    if (e2) throw new Error(e2.message);
    mios = data;
  }
  const porPartido = {};
  mios.forEach((m) => { porPartido[m.partido_id] = m; });

  return partidos.map((p) => ({
    ...p,
    bloqueado: partidoBloqueado(p),
    mi_pronostico: porPartido[p.id]
      ? { goles_local: porPartido[p.id].goles_local, goles_visitante: porPartido[p.id].goles_visitante }
      : null,
  }));
}

// Devuelve los pronosticos de TODOS los jugadores DEL GRUPO para un partido,
// pero SOLO si el partido ya arranco (antes son secretos).
// Incluye a los que NO pronosticaron (con goles en null = "sin datos").
async function pronosticosDelPartido(partidoId, grupoId) {
  const { data: partido, error: e1 } = await supabase
    .from('partidos').select('*').eq('id', partidoId).maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!partido) return { error: 'partido_inexistente' };

  // Si todavia no arranco, no se revela nada.
  if (!partidoBloqueado(partido)) return { revelado: false };

  // Todos los jugadores activos del grupo.
  const { data: jugadores, error: e2 } = await supabase
    .from('jugadores').select('id, nombre, avatar')
    .eq('grupo_id', grupoId).eq('estado', 'activo')
    .order('nombre', { ascending: true });
  if (e2) throw new Error(e2.message);

  // Pronosticos de esos jugadores para este partido.
  const ids = jugadores.map((j) => j.id);
  let prons = [];
  if (ids.length) {
    const { data, error: e3 } = await supabase
      .from('pronosticos')
      .select('jugador_id, goles_local, goles_visitante')
      .eq('partido_id', partidoId).in('jugador_id', ids);
    if (e3) throw new Error(e3.message);
    prons = data;
  }
  // Campeon del torneo anterior (para marcar la estrella).
  const { obtenerConfig } = require('./configuracion');
  const { campeonesDeGrupo } = require('./puntuacion');
  const camp = await campeonesDeGrupo(grupoId, (await obtenerConfig()).temporada_anterior);
  const idsCampeon = camp ? camp.campeonIds : [];

  return { revelado: true, pronosticos: combinarPronosticos(jugadores, prons, idsCampeon) };
}

// Combina cada jugador con SU propio pronostico (busca por jugador_id, no por orden).
// El que no pronostico queda con goles en null ("sin datos"). Funcion pura (testeable).
// campeonIds: ids de los campeones del torneo anterior (para la estrella).
function combinarPronosticos(jugadores, prons, campeonIds = []) {
  const porJugador = {};
  (prons || []).forEach((p) => { porJugador[p.jugador_id] = p; });

  return jugadores.map((j) => {
    const p = porJugador[j.id];
    return {
      nombre: j.nombre || '(jugador)',
      avatar: j.avatar || '',
      goles_local: p ? p.goles_local : null,
      goles_visitante: p ? p.goles_visitante : null,
      campeon: campeonIds.includes(j.id),
    };
  });
}

module.exports = {
  guardarPronostico,
  partidosConMiPronostico,
  pronosticosDelPartido,
  combinarPronosticos,
  partidoBloqueado,
};
