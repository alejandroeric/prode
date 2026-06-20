// entrar.js — Maneja la entrada del jugador por enlace magico.
// Lee el token de la URL (?token=...), lo valida en el backend y, si entra,
// guarda la sesion del jugador en el navegador.

const estado = document.getElementById('estado');
const CLAVE_SESION = 'jugador_sesion';

function obtenerToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

function mostrarError(texto) {
  estado.textContent = texto;
  estado.style.color = '#ff1744';
}

function mostrarOk(texto) {
  estado.textContent = texto;
  estado.style.color = '#00e676';
}

async function entrar() {
  const token = obtenerToken();
  if (!token) {
    mostrarError('El enlace no trae un código de acceso.');
    return;
  }

  try {
    const res = await fetch('/api/entrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const datos = await res.json();

    if (!res.ok) {
      mostrarError(datos.error || 'No se pudo entrar.');
      return;
    }

    // Guardamos la sesion del jugador para mantenerlo logueado.
    localStorage.setItem(CLAVE_SESION, datos.sesion);

    const nombre = datos.jugador.nombre || 'jugador';
    if (datos.jugador.esNuevo) {
      mostrarOk('¡Bienvenido! (acá irá la pantalla para elegir nombre y avatar)');
    } else {
      mostrarOk('¡Hola de nuevo, ' + nombre + '! Entraste correctamente.');
    }
  } catch {
    mostrarError('No se pudo conectar con el servidor.');
  }
}

entrar();
