// perfil.js (rutas) — Ficha personal del jugador logueado.

const express = require('express');
const router = express.Router();
const { requiereJugador } = require('../middleware/sesionJugador');
const { perfilDeJugador, campeonesDeGrupo } = require('../services/puntuacion');
const { obtenerConfig } = require('../services/configuracion');

// GET /api/perfil  ->  stats/posicion (del torneo activo) + historial + si es campeon (⭐).
router.get('/', requiereJugador, async (req, res) => {
  try {
    const config = await obtenerConfig();
    const perfil = await perfilDeJugador(req.jugador.id, req.jugador.grupo_id, config.temporada_activa);
    perfil.basico = { nombre: req.jugador.nombre, avatar: req.jugador.avatar };

    // Estrella si fue campeon del torneo anterior.
    const camp = await campeonesDeGrupo(req.jugador.grupo_id, config.temporada_anterior);
    perfil.campeon = camp ? camp.campeonIds.includes(req.jugador.id) : false;

    res.json(perfil);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo obtener el perfil' });
  }
});

module.exports = router;
