// futbolApi.js — Capa intermedia ("traductor") hacia la API de futbol externa.
//
// HOY el proveedor es TheSportsDB. Si manana cambiamos de proveedor (otra API,
// otra de pago, etc.), SOLO se modifica este archivo: el resto del sistema sigue
// pidiendo los datos con NUESTROS nombres de campo (nombre, escudo, estadio...)
// y nunca se entera de como se llaman las cosas en la API externa.

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

// Convierte un equipo del formato CRUDO de TheSportsDB (strTeam, strBadge...)
// a NUESTRO formato limpio y estable.
function normalizarEquipo(crudo) {
  return {
    nombre: crudo.strTeam,
    pais: crudo.strCountry,
    liga: crudo.strLeague,
    estadio: crudo.strStadium,
    escudo: crudo.strBadge,
    descripcion: crudo.strDescriptionES || crudo.strDescriptionEN || null,
  };
}

// Busca un equipo por nombre y devuelve sus datos ya traducidos.
// Devuelve null si no se encontro ningun equipo con ese nombre.
async function buscarEquipo(nombre) {
  const url = `${BASE_URL}/searchteams.php?t=${encodeURIComponent(nombre)}`;
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error(`La API de futbol respondio con estado ${respuesta.status}`);
  }

  const datos = await respuesta.json();
  if (!datos.teams || datos.teams.length === 0) {
    return null;
  }

  return normalizarEquipo(datos.teams[0]);
}

module.exports = { buscarEquipo };
