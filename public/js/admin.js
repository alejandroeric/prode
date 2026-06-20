// admin.js — Logica de la pantalla de administrador.
// Maneja: login, recordar la sesion (localStorage), y cerrar sesion.

const loginView = document.getElementById('login-view');
const panelView = document.getElementById('panel-view');
const form = document.getElementById('form-login');
const errorMsg = document.getElementById('error');

const CLAVE_TOKEN = 'admin_token'; // nombre con el que guardamos el token en el navegador

function mostrarLogin() {
  loginView.style.display = 'block';
  panelView.style.display = 'none';
}

function mostrarPanel() {
  loginView.style.display = 'none';
  panelView.style.display = 'block';
}

// Al cargar la pagina: si ya hay un token guardado y sigue siendo valido,
// mostramos el panel directamente. Si no, mostramos el login.
async function verificarSesion() {
  const token = localStorage.getItem(CLAVE_TOKEN);
  if (!token) {
    mostrarLogin();
    return;
  }
  try {
    const res = await fetch('/api/admin/verificar', {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (res.ok) {
      mostrarPanel();
    } else {
      localStorage.removeItem(CLAVE_TOKEN);
      mostrarLogin();
    }
  } catch {
    mostrarLogin();
  }
}

// Enviar el formulario de login.
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  errorMsg.textContent = '';

  const usuario = document.getElementById('usuario').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    });
    const datos = await res.json();

    if (res.ok) {
      localStorage.setItem(CLAVE_TOKEN, datos.token);
      mostrarPanel();
    } else {
      errorMsg.textContent = datos.error || 'No se pudo entrar';
    }
  } catch {
    errorMsg.textContent = 'No se pudo conectar con el servidor';
  }
});

// Cerrar sesion.
document.getElementById('btn-logout').addEventListener('click', async () => {
  const token = localStorage.getItem(CLAVE_TOKEN);
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
    });
  } catch {
    // aunque falle la llamada, igual cerramos sesion del lado del navegador
  }
  localStorage.removeItem(CLAVE_TOKEN);
  mostrarLogin();
});

verificarSesion();
