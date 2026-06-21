// server.js — Punto de arranque del backend del Prode.
// Levanta un servidor Express que sirve el frontend (carpeta /public)
// y, mas adelante, expondra las rutas de la API (autenticacion, fixture, etc.).

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// En produccion (Render) la app corre detras de un proxy que maneja el HTTPS.
// Esto hace que los enlaces magicos se armen con https correctamente.
app.set('trust proxy', true);

// Permite leer datos en formato JSON en las peticiones (lo usaremos al crear la API).
app.use(express.json());

// Sirve los archivos estaticos del frontend (HTML, CSS, JS) desde /public.
app.use(express.static(path.join(__dirname, '..', 'public')));

// El enlace magico apunta a /entrar (sin .html), asi que servimos esa pagina.
app.get('/entrar', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'entrar.html'));
});

// Ruta de prueba para confirmar que el backend responde.
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, mensaje: 'El servidor del Prode esta vivo' });
});

// Rutas de futbol (datos de equipos, fixture, etc.) bajo el prefijo /api.
app.use('/api', require('./routes/futbol'));

// Rutas del administrador (login, verificar sesion, logout) bajo /api/admin.
app.use('/api/admin', require('./routes/admin'));

// Rutas de los jugadores (entrar por enlace magico, verificar sesion) bajo /api.
app.use('/api', require('./routes/jugador'));

// Rutas de lectura del fixture (partidos por fecha) bajo /api/fixture.
app.use('/api/fixture', require('./routes/fixture'));

// Rutas de pronosticos del jugador bajo /api/pronosticos.
app.use('/api/pronosticos', require('./routes/pronosticos'));

// Tabla de posiciones del grupo del jugador bajo /api/tabla.
app.use('/api/tabla', require('./routes/tabla'));

// Ficha personal del jugador bajo /api/perfil.
app.use('/api/perfil', require('./routes/perfil'));

app.listen(PORT, () => {
  console.log(`Servidor del Prode corriendo en http://localhost:${PORT}`);
});
