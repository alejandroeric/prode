// tabla.js (rutas) — Tabla de posiciones del grupo del jugador logueado.

const express = require('express');
const router = express.Router();
const { requiereJugador } = require('../middleware/sesionJugador');
const { tablaDeGrupo } = require('../services/puntuacion');
const { obtenerConfig } = require('../services/configuracion');

// GET /api/tabla  ->  tabla del torneo activo del grupo del jugador + premio.
router.get('/', requiereJugador, async (req, res) => {
  try {
    const config = await obtenerConfig();
    if (!req.jugador.grupo_id) {
      return res.json({ tabla: [], premio: config.premio, torneo: config.temporada_activa });
    }
    const tabla = await tablaDeGrupo(req.jugador.grupo_id, config.temporada_activa);
    res.json({ tabla, premio: config.premio, torneo: config.temporada_activa });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo armar la tabla' });
  }
});

module.exports = router;
