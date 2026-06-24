// Tests de la regla de bloqueo de pronosticos (no se pronostica un partido empezado).
// Correr con: npm test
const test = require('node:test');
const assert = require('node:assert');
const { partidoBloqueado } = require('../server/services/pronosticos');

const UN_DIA = 86400000;
const futuro = new Date(Date.now() + UN_DIA).toISOString();
const pasado = new Date(Date.now() - UN_DIA).toISOString();

test('proximo y todavia no empieza -> NO bloqueado', () => {
  assert.strictEqual(partidoBloqueado({ estado: 'proximo', inicio: futuro }), false);
});

test('proximo pero ya paso la hora de inicio -> bloqueado', () => {
  assert.strictEqual(partidoBloqueado({ estado: 'proximo', inicio: pasado }), true);
});

test('partido en juego -> bloqueado', () => {
  assert.strictEqual(partidoBloqueado({ estado: 'en_juego', inicio: futuro }), true);
});

test('partido finalizado -> bloqueado', () => {
  assert.strictEqual(partidoBloqueado({ estado: 'finalizado', inicio: pasado }), true);
});

test('partido suspendido -> bloqueado', () => {
  assert.strictEqual(partidoBloqueado({ estado: 'suspendido', inicio: futuro }), true);
});

test('proximo sin hora de inicio cargada -> NO bloqueado', () => {
  assert.strictEqual(partidoBloqueado({ estado: 'proximo', inicio: null }), false);
});
