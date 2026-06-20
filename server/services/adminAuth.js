// adminAuth.js — Logica de autenticacion del administrador.
//
// El admin entra con usuario + contrasena (guardados en .env, la contrasena
// como hash). Si son correctos, se genera un "token de sesion" aleatorio que
// se guarda en memoria. Mientras el servidor este prendido, ese token sirve
// para identificar al admin sin que tenga que reescribir la contrasena.

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Token de la sesion de admin activa. Vive en memoria (se borra al reiniciar
// el servidor). Solo puede haber UNO: si el admin entra de nuevo, se pisa.
let sesionActiva = null;

// Verifica usuario + contrasena. Si son correctos, crea y devuelve un token.
// Si no, devuelve null.
async function login(usuario, password) {
  const hash = process.env.ADMIN_PASSWORD_HASH || '';

  // Siempre comparamos contra bcrypt (aunque el usuario este mal) para no
  // delatar por tiempos de respuesta cual de los dos datos fallo.
  const passwordOk = await bcrypt.compare(password, hash);
  const usuarioOk = usuario === process.env.ADMIN_USUARIO;

  if (!usuarioOk || !passwordOk) {
    return null;
  }

  sesionActiva = crypto.randomBytes(32).toString('hex');
  return sesionActiva;
}

// Indica si un token corresponde a la sesion de admin activa.
function esSesionValida(token) {
  return Boolean(token) && token === sesionActiva;
}

// Cierra la sesion del admin.
function logout() {
  sesionActiva = null;
}

// Middleware de Express: bloquea la ruta si quien pide no es el admin logueado.
function requiereAdmin(req, res, next) {
  const cabecera = req.headers['authorization'] || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;

  if (!esSesionValida(token)) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

module.exports = { login, esSesionValida, logout, requiereAdmin };
