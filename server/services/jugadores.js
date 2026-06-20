// jugadores.js — Logica de jugadores: crear, listar y (mas adelante) validar sesiones.
// Toda la comunicacion con la base pasa por el cliente central de Supabase.

const crypto = require('crypto');
const { supabase } = require('./supabase');

// Cuantos dias vale un enlace magico antes de vencer.
const DIAS_VALIDEZ = 30;

// Devuelve la fecha de vencimiento (hoy + DIAS_VALIDEZ) en formato ISO.
function calcularExpiracion() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + DIAS_VALIDEZ);
  return fecha.toISOString();
}

// Genera un token aleatorio, secreto e imposible de adivinar para el enlace magico.
function generarToken() {
  return crypto.randomBytes(24).toString('hex');
}

// Crea un jugador nuevo con su token magico y vencimiento. Devuelve la fila creada.
async function crearJugador(nombre) {
  const { data, error } = await supabase
    .from('jugadores')
    .insert({
      nombre: nombre || null,
      token_magico: generarToken(),
      token_expira: calcularExpiracion(),
    })
    .select('id, nombre, token_magico, estado, creado_en')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Lista todos los jugadores, del mas viejo al mas nuevo.
async function listarJugadores() {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id, nombre, token_magico, estado, ultimo_acceso, creado_en')
    .order('creado_en', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

module.exports = { crearJugador, listarJugadores, DIAS_VALIDEZ };
