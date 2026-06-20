// sesionJugador.js — Middleware compartido: exige una sesion de jugador valida.
// Lee el token del header Authorization y, si es valido, deja al jugador en req.jugador.

const { validarSesionJugador } = require('../services/jugadores');

async function requiereJugador(req, res, next) {
  try {
    const cabecera = req.headers['authorization'] || '';
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;
    const jugador = await validarSesionJugador(token);

    if (!jugador) {
      return res.status(401).json({ error: 'Tu sesión no es válida o se cerró desde otro dispositivo.' });
    }
    req.jugador = jugador;
    next();
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' });
  }
}

module.exports = { requiereJugador };
