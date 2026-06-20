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

// Devuelve los pronosticos de TODOS los jugadores para un partido,
// pero SOLO si el partido ya arranco (antes son secretos).
async function pronosticosDelPartido(partidoId) {
  const { data: partido, error: e1 } = await supabase
    .from('partidos').select('*').eq('id', partidoId).maybeSingle();
  if (e1) throw new Error(e1.message);
  if (!partido) return { error: 'partido_inexistente' };

  // Si todavia no arranco, no se revela nada.
  if (!partidoBloqueado(partido)) return { revelado: false };

  const { data, error } = await supabase
    .from('pronosticos')
    .select('goles_local, goles_visitante, jugadores ( nombre, avatar )')
    .eq('partido_id', partidoId);
  if (error) throw new Error(error.message);

  const pronosticos = data.map((p) => ({
    nombre: p.jugadores ? p.jugadores.nombre : '(jugador)',
    avatar: p.jugadores ? p.jugadores.avatar : '',
    goles_local: p.goles_local,
    goles_visitante: p.goles_visitante,
  }));
  return { revelado: true, pronosticos };
}

module.exports = { guardarPronostico, partidosConMiPronostico, pronosticosDelPartido, partidoBloqueado };
