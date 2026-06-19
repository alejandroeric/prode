// futbol.js — Rutas relacionadas con datos de futbol.
// Estas rutas NO hablan directo con la API externa: siempre pasan por la
// capa intermedia (services/futbolApi.js). Asi, si cambia el proveedor,
// estas rutas no se tocan.

const express = require('express');
const router = express.Router();
const { buscarEquipo } = require('../services/futbolApi');

// GET /api/equipo/:nombre  ->  datos de un equipo (escudo, estadio, liga...)
router.get('/equipo/:nombre', async (req, res) => {
  try {
    const equipo = await buscarEquipo(req.params.nombre);

    if (!equipo) {
      return res.status(404).json({ error: 'No se encontro ningun equipo con ese nombre' });
    }

    res.json(equipo);
  } catch (error) {
    res.status(502).json({
      error: 'No se pudo consultar la API de futbol',
      detalle: error.message,
    });
  }
});

module.exports = router;
