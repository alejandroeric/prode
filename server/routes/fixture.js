// fixture.js (rutas) — Endpoints publicos de lectura del fixture (para mostrarlo).

const express = require('express');
const router = express.Router();
const { temporadasDisponibles, partidosDeFecha } = require('../services/fixture');
const { estadisticasDePartido } = require('../services/estadisticas');

// GET /api/fixture/temporadas  ->  temporadas disponibles con sus fechas.
router.get('/temporadas', async (req, res) => {
  try {
    res.json(await temporadasDisponibles());
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron obtener las temporadas', detalle: e.message });
  }
});

// GET /api/fixture?temporada=2023&fecha=1  ->  partidos de esa fecha.
router.get('/', async (req, res) => {
  const { temporada, fecha } = req.query;
  if (!temporada || !fecha) {
    return res.status(400).json({ error: 'Falta temporada o fecha' });
  }
  try {
    res.json(await partidosDeFecha(temporada, Number(fecha)));
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron obtener los partidos', detalle: e.message });
  }
});

// GET /api/fixture/:id/stats  ->  datos de los equipos + head-to-head del partido.
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await estadisticasDePartido(req.params.id);
    if (!stats) return res.status(404).json({ error: 'El partido no existe' });
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron obtener las estadisticas', detalle: e.message });
  }
});

module.exports = router;
