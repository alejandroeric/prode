// jugador.js — Rutas de los jugadores: entrar por enlace magico y verificar sesion.

const express = require('express');
const router = express.Router();
const { validarYEntrar, actualizarPerfil } = require('../services/jugadores');
const { requiereJugador } = require('../middleware/sesionJugador');

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

// GET /api/jugador/yo  ->  devuelve los datos del jugador logueado (prueba de sesion).
router.get('/jugador/yo', requiereJugador, (req, res) => {
  res.json({ jugador: req.jugador });
});

// PUT /api/jugador/perfil  ->  guarda nombre y avatar (pantalla de bienvenida).
router.put('/jugador/perfil', requiereJugador, async (req, res) => {
  const { nombre, avatar } = req.body || {};

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre es obligatorio.' });
  }

  try {
    const jugador = await actualizarPerfil(req.jugador.id, nombre.trim(), avatar || null);
    res.json({ jugador });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo guardar el perfil', detalle: e.message });
  }
});

module.exports = router;
