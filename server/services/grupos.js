// grupos.js — Logica de grupos (ligas privadas): crear y listar.

const { supabase } = require('./supabase');

async function crearGrupo(nombre) {
  const { data, error } = await supabase.from('grupos').insert({ nombre }).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

async function listarGrupos() {
  const { data, error } = await supabase.from('grupos').select('*').order('creado_en', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

// Cambia el nombre de un grupo.
async function actualizarGrupo(id, nombre) {
  const { data, error } = await supabase.from('grupos').update({ nombre }).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

// Borra un grupo. Sus jugadores quedan "sin grupo" (FK on delete set null), no se borran.
async function borrarGrupo(id) {
  const { error } = await supabase.from('grupos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

module.exports = { crearGrupo, listarGrupos, actualizarGrupo, borrarGrupo };
