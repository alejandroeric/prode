// fixture.js (rutas) — Endpoints publicos de lectura del fixture (para mostrarlo).

const express = require('express');
const router = express.Router();
const { temporadasDisponibles, partidosDeFecha } = require('../services/fixture');
const { estadisticasDePartido } = require('../services/estadisticas');
const { obtenerOGenerarAnalisis } = require('../services/analisis');

// GET /api/fixture/temporadas  ->  temporadas disponibles con sus fechas.
router.get('/temporadas', async (req, res) => {
  try {
    res.json(await temporadasDisponibles());
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron obtener las temporadas' });
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
    res.status(500).json({ error: 'No se pudieron obtener los partidos' });
  }
});

// GET /api/fixture/:id/stats  ->  datos de los equipos + head-to-head del partido.
router.get('/:id/stats', async (req, res) => {
  try {
    const stats = await estadisticasDePartido(req.params.id);
    if (!stats) return res.status(404).json({ error: 'El partido no existe' });
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron obtener las estadisticas' });
  }
});

// Proteccion de abuso: max 30 generaciones nuevas por hora (no aplica a analisis ya cacheados).
const MAX_GENERACIONES_POR_HORA = 30;
const VENTANA_GENERACION_MS = 60 * 60 * 1000;
let generacionesRecientes = [];

// IDs de partidos cuyo analisis se esta generando ahora (evita llamadas duplicadas en paralelo).
const enGeneracion = new Set();

// GET /api/fixture/:id/analisis  ->  devuelve el analisis del partido (lo genera si no existe).
router.get('/:id/analisis', async (req, res) => {
  const id = req.params.id;

  // Si ya hay una generacion en curso para este partido, rechazar.
  if (enGeneracion.has(id)) {
    return res.status(429).json({ error: 'El análisis se está generando, intentá en unos segundos.' });
  }

  try {
    // Si ya existe en DB, devolverlo directo sin contar el limite.
    const { data: partido } = await require('../services/supabase').supabase
      .from('partidos').select('analisis').eq('id', id).single();
    if (partido && partido.analisis) {
      return res.json(partido.analisis);
    }

    // Verificar el limite de generaciones nuevas.
    const ahora = Date.now();
    generacionesRecientes = generacionesRecientes.filter((t) => ahora - t < VENTANA_GENERACION_MS);
    if (generacionesRecientes.length >= MAX_GENERACIONES_POR_HORA) {
      return res.status(429).json({ error: 'Límite de análisis alcanzado, intentá más tarde.' });
    }

    enGeneracion.add(id);
    generacionesRecientes.push(ahora);
    const analisis = await obtenerOGenerarAnalisis(id);
    res.json(analisis);
  } catch (e) {
    res.status(500).json({ error: e.message || 'No se pudo generar el análisis' });
  } finally {
    enGeneracion.delete(id);
  }
});

module.exports = router;
