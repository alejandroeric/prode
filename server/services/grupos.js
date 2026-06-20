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

module.exports = { crearGrupo, listarGrupos };
