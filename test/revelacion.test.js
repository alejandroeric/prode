// Tests de la revelacion de pronosticos del grupo:
// que cada jugador reciba SU pronostico (sin cruzarse) y "sin datos" si no cargo.
const test = require('node:test');
const assert = require('node:assert');
const { combinarPronosticos } = require('../server/services/pronosticos');

test('cada jugador recibe SU propio pronostico (no se cruzan los datos)', () => {
  const jugadores = [
    { id: 'a', nombre: 'Ana', avatar: '🐺' },
    { id: 'b', nombre: 'Beto', avatar: '🦁' },
    { id: 'c', nombre: 'Cami', avatar: '🐯' },
  ];
  // A proposito en orden distinto al de los jugadores (Cami primero, Ana despues).
  const prons = [
    { jugador_id: 'c', goles_local: 0, goles_visitante: 3 },
    { jugador_id: 'a', goles_local: 2, goles_visitante: 1 },
  ];

  const r = combinarPronosticos(jugadores, prons);
  const ana = r.find((x) => x.nombre === 'Ana');
  const beto = r.find((x) => x.nombre === 'Beto');
  const cami = r.find((x) => x.nombre === 'Cami');

  assert.deepStrictEqual([ana.goles_local, ana.goles_visitante], [2, 1], 'Ana debe tener SU 2-1');
  assert.deepStrictEqual([cami.goles_local, cami.goles_visitante], [0, 3], 'Cami debe tener SU 0-3');
  assert.deepStrictEqual([beto.goles_local, beto.goles_visitante], [null, null], 'Beto no cargo -> sin datos');
});

test('sin pronosticos -> todos sin datos', () => {
  const jugadores = [{ id: 'a', nombre: 'Ana', avatar: '' }];
  const r = combinarPronosticos(jugadores, []);
  assert.strictEqual(r[0].goles_local, null);
  assert.strictEqual(r[0].goles_visitante, null);
});
