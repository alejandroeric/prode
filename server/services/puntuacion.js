// puntuacion.js — Calcula puntos (6/3/0) y arma la tabla de posiciones por grupo.

const { supabase } = require('./supabase');

// Signo de la diferencia: 1 gana local, -1 gana visitante, 0 empate.
function signo(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
}

// Puntos de un pronostico contra el resultado real de un partido.
// 6 = resultado exacto | 3 = acerto ganador/empate | 0 = fallo.
function puntosDe(pron, partido) {
  if (partido.goles_local == null || partido.goles_visitante == null) return 0;
  if (pron.goles_local === partido.goles_local && pron.goles_visitante === partido.goles_visitante) {
    return 6;
  }
  if (signo(pron.goles_local, pron.goles_visitante) === signo(partido.goles_local, partido.goles_visitante)) {
    return 3;
  }
  return 0;
}

// Arma la tabla de posiciones acumulada de un grupo (solo cuentan partidos finalizados).
async function tablaDeGrupo(grupoId) {
  const { data: jugadores, error: e1 } = await supabase
    .from('jugadores').select('id, nombre, avatar')
    .eq('grupo_id', grupoId).eq('estado', 'activo');
  if (e1) throw new Error(e1.message);

  const ids = jugadores.map((j) => j.id);
  let prons = [];
  if (ids.length) {
    const { data, error: e2 } = await supabase
      .from('pronosticos')
      .select('jugador_id, goles_local, goles_visitante, partidos ( goles_local, goles_visitante, estado )')
      .in('jugador_id', ids);
    if (e2) throw new Error(e2.message);
    prons = data;
  }

  // Inicializar estadisticas por jugador.
  const stats = {};
  jugadores.forEach((j) => {
    stats[j.id] = { id: j.id, nombre: j.nombre, avatar: j.avatar, puntos: 0, exactos: 0, aciertos: 0, jugados: 0 };
  });

  for (const p of prons) {
    const partido = p.partidos;
    if (!partido || partido.estado !== 'finalizado') continue;
    if (partido.goles_local == null || partido.goles_visitante == null) continue;

    const s = stats[p.jugador_id];
    s.jugados++;
    const pts = puntosDe(p, partido);
    s.puntos += pts;
    if (pts === 6) s.exactos++;
    else if (pts === 3) s.aciertos++;
  }

  const lista = Object.values(stats).map((s) => ({
    ...s,
    efectividad: s.jugados ? Math.round(((s.exactos + s.aciertos) / s.jugados) * 100) : 0,
  }));

  // Ordenar: mas puntos, luego mas exactos.
  lista.sort((a, b) => b.puntos - a.puntos || b.exactos - a.exactos);

  // Asignar posiciones; los que empatan en puntos Y exactos COMPARTEN puesto.
  let posicion = 0;
  lista.forEach((s, i) => {
    const ant = lista[i - 1];
    if (i === 0 || s.puntos !== ant.puntos || s.exactos !== ant.exactos) {
      posicion = i + 1;
    }
    s.posicion = posicion;
  });

  return lista;
}

module.exports = { puntosDe, tablaDeGrupo };
