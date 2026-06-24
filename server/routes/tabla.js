// tabla.js (rutas) — Tabla de posiciones del grupo del jugador logueado.

const express = require('express');
const router = express.Router();
const { requiereJugador } = require('../middleware/sesionJugador');
const { tablaDeGrupo, campeonesDeGrupo } = require('../services/puntuacion');
const { obtenerConfig } = require('../services/configuracion');

// GET /api/tabla  ->  tabla del torneo activo + premio + campeon anterior (⭐).
router.get('/', requiereJugador, async (req, res) => {
  try {
    const config = await obtenerConfig();
    const base = { premio: config.premio, torneo: config.temporada_activa };

    if (!req.jugador.grupo_id) {
      return res.json({ tabla: [], campeonAnterior: null, ...base });
    }

    // Campeon del torneo anterior (para la estrella).
    const campeonAnterior = await campeonesDeGrupo(req.jugador.grupo_id, config.temporada_anterior);
    const idsCampeon = campeonAnterior ? campeonAnterior.campeonIds : [];

    const filas = await tablaDeGrupo(req.jugador.grupo_id, config.temporada_activa);
    const tabla = filas.map((t) => ({ ...t, campeon: idsCampeon.includes(t.id) }));

    res.json({ tabla, campeonAnterior, ...base });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo armar la tabla' });
  }
});

module.exports = router;
