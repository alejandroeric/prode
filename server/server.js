// server.js — Punto de arranque del backend del Prode.
// Levanta un servidor Express que sirve el frontend (carpeta /public)
// y, mas adelante, expondra las rutas de la API (autenticacion, fixture, etc.).

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Permite leer datos en formato JSON en las peticiones (lo usaremos al crear la API).
app.use(express.json());

// Sirve los archivos estaticos del frontend (HTML, CSS, JS) desde /public.
app.use(express.static(path.join(__dirname, '..', 'public')));

// Ruta de prueba para confirmar que el backend responde.
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, mensaje: 'El servidor del Prode esta vivo' });
});

app.listen(PORT, () => {
  console.log(`Servidor del Prode corriendo en http://localhost:${PORT}`);
});
