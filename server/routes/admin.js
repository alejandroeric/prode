// admin.js — Rutas del administrador (login, verificar sesion, logout).

const express = require('express');
const router = express.Router();
const { login, logout, requiereAdmin } = require('../services/adminAuth');
const { crearJugador, listarJugadores, actualizarJugador, borrarJugador } = require('../services/jugadores');
const { crearGrupo, listarGrupos } = require('../services/grupos');
const {
  sincronizarDesdeApi,
  listarPartidos,
  crearPartidoManual,
  crearPartidosEnLote,
  actualizarPartido,
  borrarPartido,
} = require('../services/fixture');

// Arma el enlace magico completo a partir del token. Usa el host de la peticion,
// asi funciona igual en localhost y, mas adelante, en el dominio real.
function construirEnlace(req, token) {
  return `${req.protocol}://${req.get('host')}/entrar?token=${token}`;
}

// POST /api/admin/login  ->  recibe { usuario, password }, devuelve { token }
router.post('/login', async (req, res) => {
  const { usuario, password } = req.body || {};

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Falta el usuario o la contrasena' });
  }

  const token = await login(usuario, password);
  if (!token) {
    return res.status(401).json({ error: 'Usuario o contrasena incorrectos' });
  }

  res.json({ token });
});

// GET /api/admin/verificar  ->  confirma que el token enviado es valido.
// Protegida: solo responde OK si el admin esta logueado.
router.get('/verificar', requiereAdmin, (req, res) => {
  res.json({ ok: true, mensaje: 'Sesion de admin valida' });
});

// POST /api/admin/logout  ->  cierra la sesion del admin.
router.post('/logout', requiereAdmin, (req, res) => {
  logout();
  res.json({ ok: true });
});

// POST /api/admin/grupos  ->  crea un grupo (liga privada).
router.post('/grupos', requiereAdmin, async (req, res) => {
  const { nombre } = req.body || {};
  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre del grupo es obligatorio' });
  }
  try {
    const grupo = await crearGrupo(nombre.trim());
    res.status(201).json(grupo);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo crear el grupo', detalle: e.message });
  }
});

// GET /api/admin/grupos  ->  lista los grupos.
router.get('/grupos', requiereAdmin, async (req, res) => {
  try {
    res.json(await listarGrupos());
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron listar los grupos', detalle: e.message });
  }
});

// POST /api/admin/jugadores  ->  crea un jugador (en un grupo) y devuelve su enlace magico.
router.post('/jugadores', requiereAdmin, async (req, res) => {
  try {
    const { nombre, grupo_id } = req.body || {};
    const jugador = await crearJugador(nombre, grupo_id);
    res.status(201).json({
      jugador: { id: jugador.id, nombre: jugador.nombre, estado: jugador.estado },
      enlace: construirEnlace(req, jugador.token_magico),
    });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo crear el jugador', detalle: e.message });
  }
});

// GET /api/admin/jugadores  ->  lista los jugadores con su enlace magico y su grupo.
router.get('/jugadores', requiereAdmin, async (req, res) => {
  try {
    const jugadores = await listarJugadores();
    const conEnlace = jugadores.map((j) => ({
      id: j.id,
      nombre: j.nombre,
      estado: j.estado,
      ultimo_acceso: j.ultimo_acceso,
      grupo: j.grupos ? j.grupos.nombre : null,
      grupo_id: j.grupo_id,
      enlace: construirEnlace(req, j.token_magico),
    }));
    res.json(conEnlace);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron listar los jugadores', detalle: e.message });
  }
});

// PUT /api/admin/jugadores/:id  ->  cambiar de grupo y/o suspender/reactivar.
router.put('/jugadores/:id', requiereAdmin, async (req, res) => {
  try {
    const jugador = await actualizarJugador(req.params.id, req.body || {});
    res.json(jugador);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo actualizar el jugador', detalle: e.message });
  }
});

// DELETE /api/admin/jugadores/:id  ->  borra un jugador (y sus pronosticos).
router.delete('/jugadores/:id', requiereAdmin, async (req, res) => {
  try {
    await borrarJugador(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo borrar el jugador', detalle: e.message });
  }
});

// POST /api/admin/fixture/sincronizar  ->  trae partidos de la API a la tabla.
router.post('/fixture/sincronizar', requiereAdmin, async (req, res) => {
  try {
    const resultado = await sincronizarDesdeApi();
    res.json(resultado);
  } catch (e) {
    res.status(502).json({ error: 'No se pudo sincronizar con la API', detalle: e.message });
  }
});

// GET /api/admin/partidos  ->  lista los partidos guardados.
router.get('/partidos', requiereAdmin, async (req, res) => {
  try {
    const partidos = await listarPartidos();
    res.json(partidos);
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron listar los partidos', detalle: e.message });
  }
});

// POST /api/admin/partidos  ->  crea un partido manual.
router.post('/partidos', requiereAdmin, async (req, res) => {
  const { temporada, fecha_numero, local, visitante } = req.body || {};
  if (!temporada || !fecha_numero || !local || !visitante) {
    return res.status(400).json({ error: 'Faltan datos: temporada, fecha, local y visitante son obligatorios' });
  }
  try {
    const partido = await crearPartidoManual(req.body);
    res.status(201).json(partido);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo crear el partido', detalle: e.message });
  }
});

// POST /api/admin/partidos/lote  ->  crea varios partidos de una vez (carga por captura).
router.post('/partidos/lote', requiereAdmin, async (req, res) => {
  const { partidos, origen } = req.body || {};
  if (!Array.isArray(partidos) || partidos.length === 0) {
    return res.status(400).json({ error: 'Falta la lista de partidos' });
  }
  try {
    const guardados = await crearPartidosEnLote(partidos, origen || 'captura');
    res.status(201).json({ guardados });
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron cargar los partidos', detalle: e.message });
  }
});

// PUT /api/admin/partidos/:id  ->  edita un partido (resultado, estado, etc.).
router.put('/partidos/:id', requiereAdmin, async (req, res) => {
  try {
    const partido = await actualizarPartido(req.params.id, req.body || {});
    res.json(partido);
  } catch (e) {
    res.status(500).json({ error: 'No se pudo actualizar el partido', detalle: e.message });
  }
});

// DELETE /api/admin/partidos/:id  ->  borra un partido.
router.delete('/partidos/:id', requiereAdmin, async (req, res) => {
  try {
    await borrarPartido(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo borrar el partido', detalle: e.message });
  }
});

module.exports = router;
