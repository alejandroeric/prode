// configuracion.js — Ajustes globales del sistema (premio y torneo activo).
// Es una sola fila (id = 1) en la tabla configuracion.

const { supabase } = require('./supabase');

async function obtenerConfig() {
  const { data, error } = await supabase.from('configuracion').select('*').eq('id', 1).maybeSingle();
  if (error) throw new Error(error.message);
  return data || { premio: null, temporada_activa: null };
}

async function actualizarConfig(cambios) {
  const actual = await obtenerConfig();
  const permitidos = {};
  if (cambios.premio !== undefined) permitidos.premio = cambios.premio;

  if (cambios.temporada_activa !== undefined) {
    permitidos.temporada_activa = cambios.temporada_activa;
    // Si cambia el torneo activo, el que estaba pasa a ser el "torneo anterior"
    // (de ahi sale el campeon con la estrella en el torneo nuevo).
    if (actual.temporada_activa && cambios.temporada_activa !== actual.temporada_activa) {
      permitidos.temporada_anterior = actual.temporada_activa;
    }
  }
  permitidos.actualizado_en = new Date().toISOString();

  const { data, error } = await supabase
    .from('configuracion').update(permitidos).eq('id', 1).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

module.exports = { obtenerConfig, actualizarConfig };
