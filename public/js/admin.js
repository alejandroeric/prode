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
  cargarJugadores();
  cargarConteoPartidos();
}

// Devuelve la cabecera de autorizacion con el token guardado.
function cabeceraAuth() {
  return { Authorization: 'Bearer ' + localStorage.getItem(CLAVE_TOKEN) };
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

// ----- Gestion de jugadores -----

const formJugador = document.getElementById('form-jugador');
const errorJugador = document.getElementById('error-jugador');
const listaJugadores = document.getElementById('lista-jugadores');

// Trae la lista de jugadores del backend y la dibuja en pantalla.
async function cargarJugadores() {
  try {
    const res = await fetch('/api/admin/jugadores', { headers: cabeceraAuth() });
    if (!res.ok) return;
    const jugadores = await res.json();
    dibujarJugadores(jugadores);
  } catch {
    // si falla, simplemente no dibujamos nada
  }
}

// Dibuja cada jugador con su enlace y un boton para copiarlo.
function dibujarJugadores(jugadores) {
  listaJugadores.innerHTML = '';

  if (jugadores.length === 0) {
    listaJugadores.innerHTML = '<li class="vacio">Todavía no hay jugadores. Creá el primero.</li>';
    return;
  }

  for (const j of jugadores) {
    const li = document.createElement('li');
    li.className = 'jugador';

    const nombre = j.nombre || '(sin nombre)';
    const estado = j.ultimo_acceso ? 'ya entró' : 'no entró aún';

    li.innerHTML = `
      <div class="jugador-info">
        <span class="jugador-nombre">${nombre}</span>
        <span class="jugador-estado">${estado}</span>
      </div>
      <div class="jugador-link">
        <input type="text" readonly value="${j.enlace}" />
        <button type="button">Copiar</button>
      </div>
    `;

    const boton = li.querySelector('button');
    boton.addEventListener('click', async () => {
      await navigator.clipboard.writeText(j.enlace);
      boton.textContent = '¡Copiado!';
      setTimeout(() => { boton.textContent = 'Copiar'; }, 1500);
    });

    listaJugadores.appendChild(li);
  }
}

// Crear un jugador nuevo.
formJugador.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  errorJugador.textContent = '';

  const nombre = document.getElementById('nombre-jugador').value;

  try {
    const res = await fetch('/api/admin/jugadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cabeceraAuth() },
      body: JSON.stringify({ nombre }),
    });
    if (res.ok) {
      document.getElementById('nombre-jugador').value = '';
      cargarJugadores();
    } else {
      const datos = await res.json();
      errorJugador.textContent = datos.error || 'No se pudo crear el jugador';
    }
  } catch {
    errorJugador.textContent = 'No se pudo conectar con el servidor';
  }
});

// ----- Fixture (sincronizar desde API) -----

const btnSincronizar = document.getElementById('btn-sincronizar');
const estadoFixture = document.getElementById('estado-fixture');
const conteoPartidos = document.getElementById('conteo-partidos');

// Muestra cuantos partidos hay cargados en la base.
async function cargarConteoPartidos() {
  try {
    const res = await fetch('/api/admin/partidos', { headers: cabeceraAuth() });
    if (!res.ok) return;
    const partidos = await res.json();
    conteoPartidos.textContent = 'Partidos cargados: ' + partidos.length;
  } catch {
    // si falla, dejamos el texto como esta
  }
}

// Dispara la sincronizacion con la API.
btnSincronizar.addEventListener('click', async () => {
  estadoFixture.textContent = 'Sincronizando...';
  btnSincronizar.disabled = true;
  try {
    const res = await fetch('/api/admin/fixture/sincronizar', {
      method: 'POST',
      headers: cabeceraAuth(),
    });
    const datos = await res.json();
    if (res.ok) {
      estadoFixture.textContent =
        'Listo: ' + datos.guardados + ' partidos sincronizados desde la API.';
      cargarConteoPartidos();
    } else {
      estadoFixture.textContent = datos.error || 'No se pudo sincronizar.';
    }
  } catch {
    estadoFixture.textContent = 'No se pudo conectar con el servidor.';
  } finally {
    btnSincronizar.disabled = false;
  }
});

// ----- Carga manual y edicion de partidos -----

const formPartido = document.getElementById('form-partido');
const errorPartido = document.getElementById('error-partido');
const listaAdminPartidos = document.getElementById('lista-admin-partidos');

// Crear un partido manual.
formPartido.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  errorPartido.textContent = '';

  const inicioLocal = document.getElementById('m-inicio').value;
  const cuerpo = {
    temporada: document.getElementById('m-temporada').value,
    fecha_numero: Number(document.getElementById('m-fecha').value),
    local: document.getElementById('m-local').value,
    visitante: document.getElementById('m-visitante').value,
    // datetime-local es hora local; lo pasamos a formato universal.
    inicio: inicioLocal ? new Date(inicioLocal).toISOString() : null,
    estadio: document.getElementById('m-estadio').value,
  };

  try {
    const res = await fetch('/api/admin/partidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cabeceraAuth() },
      body: JSON.stringify(cuerpo),
    });
    if (res.ok) {
      formPartido.reset();
      cargarConteoPartidos();
      // Si el visor esta mirando esa misma fecha, lo refrescamos.
      verPartidosDeFecha();
    } else {
      const datos = await res.json();
      errorPartido.textContent = datos.error || 'No se pudo cargar el partido';
    }
  } catch {
    errorPartido.textContent = 'No se pudo conectar con el servidor';
  }
});

// Ver los partidos de una temporada + fecha para editarlos o borrarlos.
async function verPartidosDeFecha() {
  const temporada = document.getElementById('v-temporada').value;
  const fecha = document.getElementById('v-fecha').value;
  if (!temporada || !fecha) return;

  try {
    const res = await fetch(`/api/fixture?temporada=${temporada}&fecha=${fecha}`);
    const partidos = await res.json();
    dibujarAdminPartidos(partidos);
  } catch {
    listaAdminPartidos.innerHTML = '<li class="vacio">No se pudo cargar.</li>';
  }
}

// Dibuja cada partido con campos para resultado/estado y boton de borrar.
function dibujarAdminPartidos(partidos) {
  listaAdminPartidos.innerHTML = '';
  if (!partidos.length) {
    listaAdminPartidos.innerHTML = '<li class="vacio">No hay partidos en esa fecha.</li>';
    return;
  }

  const estados = ['proximo', 'en_juego', 'finalizado', 'suspendido'];

  for (const p of partidos) {
    const li = document.createElement('li');
    li.className = 'jugador';
    const opciones = estados
      .map((e) => `<option value="${e}" ${e === p.estado ? 'selected' : ''}>${e}</option>`)
      .join('');

    li.innerHTML = `
      <div class="jugador-info">
        <span class="jugador-nombre">${p.local} vs ${p.visitante}</span>
      </div>
      <div class="editar-partido">
        <input type="number" class="gol-input" value="${p.goles_local ?? ''}" placeholder="-" />
        <input type="number" class="gol-input" value="${p.goles_visitante ?? ''}" placeholder="-" />
        <select class="select-estado">${opciones}</select>
        <button type="button" class="btn-guardar">Guardar</button>
        <button type="button" class="btn-borrar">Borrar</button>
      </div>
    `;

    const [golL, golV] = li.querySelectorAll('.gol-input');
    const selEstado = li.querySelector('.select-estado');

    li.querySelector('.btn-guardar').addEventListener('click', async () => {
      await fetch(`/api/admin/partidos/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...cabeceraAuth() },
        body: JSON.stringify({
          goles_local: golL.value === '' ? null : Number(golL.value),
          goles_visitante: golV.value === '' ? null : Number(golV.value),
          estado: selEstado.value,
        }),
      });
      verPartidosDeFecha();
    });

    li.querySelector('.btn-borrar').addEventListener('click', async () => {
      await fetch(`/api/admin/partidos/${p.id}`, { method: 'DELETE', headers: cabeceraAuth() });
      cargarConteoPartidos();
      verPartidosDeFecha();
    });

    listaAdminPartidos.appendChild(li);
  }
}

document.getElementById('btn-ver-fecha').addEventListener('click', verPartidosDeFecha);

verificarSesion();
