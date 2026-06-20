// tabla.js (rutas) — Tabla de posiciones del grupo del jugador logueado.

const express = require('express');
const router = express.Router();
const { requiereJugador } = require('../middleware/sesionJugador');
const { tablaDeGrupo } = require('../services/puntuacion');

// GET /api/tabla  ->  tabla de posiciones del grupo del jugador.
router.get('/', requiereJugador, async (req, res) => {
  try {
    if (!req.jugador.grupo_id) {
      return res.json({ tabla: [] });
    }
    const tabla = await tablaDeGrupo(req.jugador.grupo_id);
    res.json({ tabla });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo armar la tabla', detalle: e.message });
  }
});

module.exports = router;
