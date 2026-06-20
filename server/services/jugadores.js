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

// Crea un jugador nuevo con su token magico, vencimiento y grupo. Devuelve la fila creada.
async function crearJugador(nombre, grupoId) {
  const { data, error } = await supabase
    .from('jugadores')
    .insert({
      nombre: nombre || null,
      grupo_id: grupoId || null,
      token_magico: generarToken(),
      token_expira: calcularExpiracion(),
    })
    .select('id, nombre, token_magico, estado, creado_en, grupo_id')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Lista todos los jugadores (con el nombre de su grupo), del mas viejo al mas nuevo.
async function listarJugadores() {
  const { data, error } = await supabase
    .from('jugadores')
    .select('id, nombre, token_magico, estado, ultimo_acceso, creado_en, grupo_id, grupos ( nombre )')
    .order('creado_en', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// Valida un token magico y, si esta todo bien, hace entrar al jugador:
// crea una sesion nueva, registra el acceso y renueva el vencimiento del link.
// Devuelve { error } si algo falla, o { sesion, jugador } si entra OK.
async function validarYEntrar(token) {
  if (!token) return { error: 'falta_token' };

  const { data: jugador, error } = await supabase
    .from('jugadores')
    .select('*')
    .eq('token_magico', token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!jugador) return { error: 'invalido' };
  if (jugador.estado !== 'activo') return { error: 'suspendido' };
  if (jugador.token_expira && new Date(jugador.token_expira) < new Date()) {
    return { error: 'vencido' };
  }

  // esNuevo = todavia no entro nunca (sirve para la pantalla de bienvenida).
  const esNuevo = !jugador.ultimo_acceso;

  // Nueva sesion: al pisar sesion_token, cualquier otro dispositivo queda afuera.
  const sesion = crypto.randomBytes(32).toString('hex');

  const { error: errUpd } = await supabase
    .from('jugadores')
    .update({
      sesion_token: sesion,
      ultimo_acceso: new Date().toISOString(),
      token_expira: calcularExpiracion(), // renovacion automatica del enlace
    })
    .eq('id', jugador.id);

  if (errUpd) throw new Error(errUpd.message);

  return {
    sesion,
    jugador: { id: jugador.id, nombre: jugador.nombre, avatar: jugador.avatar, esNuevo },
  };
}

// Dado un token de sesion, devuelve el jugador si la sesion es valida y activa.
// Como sesion_token es unico por jugador y se pisa al reentrar, esto tambien
// hace cumplir la regla de "un solo dispositivo activo".
async function validarSesionJugador(sesionToken) {
  if (!sesionToken) return null;

  const { data, error } = await supabase
    .from('jugadores')
    .select('id, nombre, avatar, estado')
    .eq('sesion_token', sesionToken)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data || data.estado !== 'activo') return null;
  return data;
}

// Guarda el nombre y avatar elegidos por el jugador (pantalla de bienvenida).
async function actualizarPerfil(id, nombre, avatar) {
  const { data, error } = await supabase
    .from('jugadores')
    .update({ nombre, avatar })
    .eq('id', id)
    .select('id, nombre, avatar')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

module.exports = {
  crearJugador,
  listarJugadores,
  validarYEntrar,
  validarSesionJugador,
  actualizarPerfil,
  DIAS_VALIDEZ,
};
