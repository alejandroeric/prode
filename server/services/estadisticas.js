// estadisticas.js — Datos de los equipos de un partido + historial de enfrentamientos.

const { supabase } = require('./supabase');
const apiFootball = require('./apiFootball');

// Devuelve info de los dos equipos de un partido y su head-to-head.
async function estadisticasDePartido(partidoId) {
  const { data: partido, error } = await supabase
    .from('partidos').select('local, visitante').eq('id', partidoId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!partido) return null;

  const [eqL, eqV] = await Promise.all([
    apiFootball.resolverEquipo(partido.local).catch(() => null),
    apiFootball.resolverEquipo(partido.visitante).catch(() => null),
  ]);

  let h2h = [];
  if (eqL && eqV) {
    try {
      const todos = await apiFootball.headToHead(eqL.id, eqV.id);
      // De mas nuevo a mas viejo, los ultimos 8.
      h2h = todos.sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '')).slice(0, 8);
    } catch {
      h2h = [];
    }
  }

  const info = (e, nombreFallback) => e
    ? { nombre: e.nombre, logo: e.logo, fundado: e.fundado, estadio: e.estadio, ciudad: e.ciudad }
    : { nombre: nombreFallback, logo: null, fundado: null, estadio: null, ciudad: null };

  return {
    local: info(eqL, partido.local),
    visitante: info(eqV, partido.visitante),
    h2h,
  };
}

module.exports = { estadisticasDePartido };
