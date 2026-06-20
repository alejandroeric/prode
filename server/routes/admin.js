// admin.js — Rutas del administrador (login, verificar sesion, logout).

const express = require('express');
const router = express.Router();
const { login, logout, requiereAdmin } = require('../services/adminAuth');

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

module.exports = router;
