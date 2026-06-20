// jugador.js — Rutas de los jugadores: entrar por enlace magico y verificar sesion.

const express = require('express');
const router = express.Router();
const { validarYEntrar, validarSesionJugador } = require('../services/jugadores');

// Mensajes claros para cada motivo de rechazo (los ve el jugador en pantalla).
const MENSAJES = {
  falta_token: 'El enlace no trae un código de acceso.',
  invalido: 'Este enlace no es válido.',
  suspendido: 'Tu acceso fue suspendido. Hablá con el administrador.',
  vencido: 'Este enlace venció. Pedile al administrador uno nuevo.',
};

// POST /api/entrar  ->  recibe { token } del enlace magico, devuelve { sesion, jugador }.
router.post('/entrar', async (req, res) => {
  try {
    const { token } = req.body || {};
    const resultado = await validarYEntrar(token);

    if (resultado.error) {
      return res.status(401).json({ error: MENSAJES[resultado.error] || 'No se pudo entrar' });
    }
    res.json(resultado);
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor', detalle: e.message });
  }
});

// Middleware: bloquea la ruta si quien pide no tiene una sesion de jugador valida.
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

// GET /api/jugador/yo  ->  devuelve los datos del jugador logueado (prueba de sesion).
router.get('/jugador/yo', requiereJugador, (req, res) => {
  res.json({ jugador: req.jugador });
});

module.exports = router;
