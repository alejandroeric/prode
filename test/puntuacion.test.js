// Tests de la logica de puntaje (6 exacto / 3 ganador-empate / 0 fallo).
// Correr con: npm test
const test = require('node:test');
const assert = require('node:assert');
const { puntosDe } = require('../server/services/puntuacion');

const partido = (gl, gv) => ({ goles_local: gl, goles_visitante: gv });
const pron = (gl, gv) => ({ goles_local: gl, goles_visitante: gv });

test('resultado exacto -> 6 puntos', () => {
  assert.strictEqual(puntosDe(pron(2, 1), partido(2, 1)), 6);
  assert.strictEqual(puntosDe(pron(0, 0), partido(0, 0)), 6);
});

test('acierta al ganador local (sin exacto) -> 3 puntos', () => {
  assert.strictEqual(puntosDe(pron(3, 0), partido(2, 1)), 3);
});

test('acierta al ganador visitante (sin exacto) -> 3 puntos', () => {
  assert.strictEqual(puntosDe(pron(0, 2), partido(1, 3)), 3);
});

test('acierta el empate (sin exacto) -> 3 puntos', () => {
  assert.strictEqual(puntosDe(pron(1, 1), partido(2, 2)), 3);
});

test('predijo local pero gano visitante -> 0 puntos', () => {
  assert.strictEqual(puntosDe(pron(2, 1), partido(0, 1)), 0);
});

test('predijo empate pero hubo ganador -> 0 puntos', () => {
  assert.strictEqual(puntosDe(pron(1, 1), partido(2, 1)), 0);
});

test('partido sin resultado cargado -> 0 puntos', () => {
  assert.strictEqual(puntosDe(pron(2, 1), partido(null, null)), 0);
});
