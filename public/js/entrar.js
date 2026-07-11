// entrar.js — Maneja la entrada del jugador por enlace magico y la bienvenida.
// 1) Lee el token de la URL, lo valida en el backend y guarda la sesion.
// 2) Si el jugador es nuevo, muestra la pantalla para elegir nombre y avatar.

const estado = document.getElementById('estado');
const bienvenida = document.getElementById('bienvenida');
const avataresDiv = document.getElementById('avatares');
const formPerfil = document.getElementById('form-perfil');
const errorPerfil = document.getElementById('error-perfil');

const CLAVE_SESION = 'jugador_sesion';
const AVATARES = ['🐺', '🦁', '🐯', '🦅', '⚽', '🔥', '👑', '🚀', '🐉', '⚡'];

let avatarElegido = AVATARES[0];

function obtenerToken() {
  return new URLSearchParams(window.location.search).get('token');
}

function mostrarError(texto) {
  estado.textContent = texto;
  estado.style.color = '#ff1744';
}

function mostrarOk(texto) {
  estado.textContent = texto;
  estado.style.color = '#00e676';
  document.getElementById('ir-app').style.display = 'inline-block';
}

// Dibuja los botones de avatar y maneja la seleccion.
function dibujarAvatares() {
  avataresDiv.innerHTML = '';
  for (const emoji of AVATARES) {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'avatar';
    boton.textContent = emoji;
    if (emoji === avatarElegido) boton.classList.add('avatar-elegido');

    boton.addEventListener('click', () => {
      avatarElegido = emoji;
      document.querySelectorAll('.avatar').forEach((b) => b.classList.remove('avatar-elegido'));
      boton.classList.add('avatar-elegido');
    });

    avataresDiv.appendChild(boton);
  }
}

// Paso 1: validar el enlace magico y crear la sesion.
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

    localStorage.setItem(CLAVE_SESION, datos.sesion);

    if (datos.jugador.esNuevo) {
      // Jugador nuevo: mostramos la pantalla de bienvenida.
      estado.style.display = 'none';
      bienvenida.style.display = 'block';
      dibujarAvatares();
    } else {
      const nombre = datos.jugador.nombre || 'jugador';
      mostrarOk('¡Hola de nuevo, ' + nombre + '! Entraste correctamente.');
    }
  } catch {
    mostrarError('No se pudo conectar con el servidor.');
  }
}

// Paso 2: guardar nombre y avatar del jugador nuevo.
formPerfil.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  errorPerfil.textContent = '';

  const nombre = document.getElementById('nombre').value;
  const sesion = localStorage.getItem(CLAVE_SESION);

  try {
    const res = await fetch('/api/jugador/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sesion },
      body: JSON.stringify({ nombre, avatar: avatarElegido }),
    });
    const datos = await res.json();

    if (!res.ok) {
      errorPerfil.textContent = datos.error || 'No se pudo guardar.';
      return;
    }

    // Perfil guardado: mostramos install (si aplica) y luego el tutorial.
    bienvenida.style.display = 'none';
    mostrarInstall();
  } catch {
    errorPerfil.textContent = 'No se pudo conectar con el servidor.';
  }
});

// Detecta qué tipo de instalacion corresponde mostrar (o ninguna).
function detectarInstall() {
  if (localStorage.getItem('prode_pwa_visto')) return 'skip';
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return 'skip';
  if (window._pwaPrompt) return 'android';
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'ios';
  return 'skip';
}

// Muestra la pantalla de instalacion PWA una sola vez al jugador nuevo.
// Cuando termina (instala o salta), abre el tutorial.
function mostrarInstall() {
  const tipo = detectarInstall();
  localStorage.setItem('prode_pwa_visto', '1');

  if (tipo === 'skip') {
    mostrarTutorial();
    return;
  }

  const view = document.getElementById('install-view');
  view.style.display = 'flex';

  if (tipo === 'android') {
    document.getElementById('install-android').style.display = 'block';
    document.getElementById('btn-instalar').addEventListener('click', async () => {
      view.style.display = 'none';
      await window._pwaPrompt.prompt();
      mostrarTutorial();
    });
  } else {
    document.getElementById('install-ios').style.display = 'block';
  }

  document.getElementById('btn-saltar-install').addEventListener('click', () => {
    view.style.display = 'none';
    mostrarTutorial();
  });
}

// Muestra el tutorial y al terminar redirige al Fixture.
function mostrarTutorial() {
  abrirTutorial(() => { window.location.href = '/fixture.html'; });
}

entrar();
