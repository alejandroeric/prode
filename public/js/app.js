// app.js — Logica del frontend.
// Por ahora solo confirma que el frontend puede hablar con el backend
// llamando a la ruta de prueba /api/ping.

async function verificarServidor() {
  const estado = document.getElementById('estado');
  try {
    const respuesta = await fetch('/api/ping');
    const datos = await respuesta.json();
    estado.textContent = datos.mensaje;
    estado.style.color = '#00e676';
  } catch (error) {
    estado.textContent = 'No se pudo conectar con el servidor';
    estado.style.color = '#ff1744';
  }
}

verificarServidor();
