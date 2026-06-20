// pronosticos.js (rutas) — Endpoints del jugador para cargar y ver SUS pronosticos.
// Todas requieren sesion de jugador valida.

const express = require('express');
const router = express.Router();
const { requiereJugador } = require('../middleware/sesionJugador');
const { guardarPronostico, partidosConMiPronostico, pronosticosDelPartido } = require('../services/pronosticos');

// GET /api/pronosticos?temporada=2023&fecha=1
// Devuelve los partidos de esa fecha con el pronostico propio y si estan bloqueados.
router.get('/', requiereJugador, async (req, res) => {
  const { temporada, fecha } = req.query;
  if (!temporada || !fecha) {
    return res.status(400).json({ error: 'Falta temporada o fecha' });
  }
  try {
    const partidos = await partidosConMiPronostico(req.jugador.id, temporada, Number(fecha));
    res.json(partidos);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron obtener los pronosticos', detalle: e.message });
  }
});

// GET /api/pronosticos/partido/:id  ->  pronosticos de TODOS (solo si el partido arranco).
router.get('/partido/:id', requiereJugador, async (req, res) => {
  try {
    const resultado = await pronosticosDelPartido(req.params.id);
    if (resultado.error === 'partido_inexistente') {
      return res.status(404).json({ error: 'El partido no existe' });
    }
    res.json(resultado);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron obtener los pronosticos', detalle: e.message });
  }
});

// POST /api/pronosticos  ->  body { partido_id, goles_local, goles_visitante }
router.post('/', requiereJugador, async (req, res) => {
  const { partido_id, goles_local, goles_visitante } = req.body || {};

  if (!partido_id || goles_local == null || goles_visitante == null) {
    return res.status(400).json({ error: 'Faltan datos del pronostico' });
  }

  try {
    const resultado = await guardarPronostico(
      req.jugador.id, partido_id, Number(goles_local), Number(goles_visitante)
    );

    if (resultado.error === 'partido_inexistente') {
      return res.status(404).json({ error: 'El partido no existe' });
    }
    if (resultado.error === 'bloqueado') {
      return res.status(403).json({ error: 'Este partido ya empezó o está cerrado: no se puede pronosticar.' });
    }
    res.json(resultado.pronostico);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo guardar el pronostico', detalle: e.message });
  }
});

module.exports = router;
