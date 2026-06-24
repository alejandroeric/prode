// perfil.js (rutas) — Ficha personal del jugador logueado.

const express = require('express');
const router = express.Router();
const { requiereJugador } = require('../middleware/sesionJugador');
const { perfilDeJugador } = require('../services/puntuacion');
const { obtenerConfig } = require('../services/configuracion');

// GET /api/perfil  ->  stats/posicion (del torneo activo) + historial fecha a fecha.
router.get('/', requiereJugador, async (req, res) => {
  try {
    const config = await obtenerConfig();
    const perfil = await perfilDeJugador(req.jugador.id, req.jugador.grupo_id, config.temporada_activa);
    // Datos basicos del jugador desde la sesion (por si no tiene fila en la tabla).
    perfil.basico = { nombre: req.jugador.nombre, avatar: req.jugador.avatar };
    res.json(perfil);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo obtener el perfil' });
  }
});

module.exports = router;
