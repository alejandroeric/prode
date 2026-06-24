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
  cargarGrupos();
  cargarJugadores();
  cargarConteoPartidos();
  cargarConfig();
  cargarEquipos();
}

// Llena el autocompletado de equipos (los ya cargados en el fixture).
async function cargarEquipos() {
  try {
    const res = await fetch('/api/admin/equipos', { headers: cabeceraAuth() });
    if (!res.ok) return;
    const equipos = await res.json();
    document.getElementById('lista-equipos').innerHTML =
      equipos.map((e) => `<option value="${escaparHtml(e)}"></option>`).join('');
  } catch {
    // si falla, el campo sigue siendo texto libre
  }
}

// Devuelve la cabecera de autorizacion con el token guardado.
function cabeceraAuth() {
  return { Authorization: 'Bearer ' + localStorage.getItem(CLAVE_TOKEN) };
}

// Abre WhatsApp con un mensaje ya escrito (el admin elige el chat y envia).
function enviarWhatsApp(texto) {
  window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
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

// ----- Gestion de grupos -----

const formGrupo = document.getElementById('form-grupo');
const listaGrupos = document.getElementById('lista-grupos');
const selectorGrupoJugador = document.getElementById('grupo-jugador');

let gruposCache = []; // guardamos los grupos para los selectores de "mover jugador"

// Trae los grupos y llena la lista + el selector del formulario de jugador.
async function cargarGrupos() {
  try {
    const res = await fetch('/api/admin/grupos', { headers: cabeceraAuth() });
    if (!res.ok) return;
    const grupos = await res.json();
    gruposCache = grupos;

    listaGrupos.innerHTML = grupos.length
      ? grupos.map((g) => `<li class="grupo-item">
          <span class="grupo-nombre">${escaparHtml(g.nombre)}</span>
          <div class="grupo-acciones">
            <button type="button" class="btn-tabla-wsp" data-id="${g.id}" data-nombre="${escaparHtml(g.nombre)}">📲 Tabla</button>
            <button type="button" class="btn-editar-grupo" data-id="${g.id}" data-nombre="${escaparHtml(g.nombre)}">Editar</button>
            <button type="button" class="btn-borrar-grupo" data-id="${g.id}" data-nombre="${escaparHtml(g.nombre)}">Borrar</button>
          </div>
        </li>`).join('')
      : '<li class="vacio">Todavía no hay grupos.</li>';

    selectorGrupoJugador.innerHTML = grupos
      .map((g) => `<option value="${g.id}">${escaparHtml(g.nombre)}</option>`)
      .join('');
  } catch {
    // si falla, no actualizamos
  }
}

// Compartir la tabla de un grupo por WhatsApp.
async function compartirTabla(grupoId, nombreGrupo) {
  try {
    const res = await fetch('/api/admin/grupos/' + grupoId + '/tabla', { headers: cabeceraAuth() });
    const tabla = await res.json();
    if (!tabla.length) {
      enviarWhatsApp(`🏆 Tabla - ${nombreGrupo}\n(todavía sin puntos)`);
      return;
    }
    const medallas = ['🥇', '🥈', '🥉'];
    const lineas = tabla.map((t, i) => `${medallas[i] || t.posicion + 'º'} ${t.nombre} - ${t.puntos} pts`);
    enviarWhatsApp(`🏆 Tabla - ${nombreGrupo}\n\n${lineas.join('\n')}`);
  } catch {
    alert('No se pudo obtener la tabla.');
  }
}

// Un listener para los botones de cada grupo (compartir / renombrar / borrar).
listaGrupos.addEventListener('click', async (e) => {
  const wsp = e.target.closest('.btn-tabla-wsp');
  if (wsp) { compartirTabla(wsp.dataset.id, wsp.dataset.nombre); return; }

  const editar = e.target.closest('.btn-editar-grupo');
  if (editar) {
    const nuevo = prompt('Nuevo nombre del grupo:', editar.dataset.nombre);
    if (!nuevo || nuevo.trim() === '') return;
    await fetch('/api/admin/grupos/' + editar.dataset.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cabeceraAuth() },
      body: JSON.stringify({ nombre: nuevo.trim() }),
    });
    cargarGrupos();
    cargarJugadores(); // para refrescar el grupo mostrado en cada jugador
    return;
  }

  const borrar = e.target.closest('.btn-borrar-grupo');
  if (borrar) {
    if (!confirm(`¿Borrar el grupo "${borrar.dataset.nombre}"?\nSus jugadores quedan "sin grupo" (no se borran).`)) return;
    await fetch('/api/admin/grupos/' + borrar.dataset.id, { method: 'DELETE', headers: cabeceraAuth() });
    cargarGrupos();
    cargarJugadores();
  }
});

// Crear un grupo nuevo.
formGrupo.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const nombre = document.getElementById('nombre-grupo').value;
  try {
    const res = await fetch('/api/admin/grupos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cabeceraAuth() },
      body: JSON.stringify({ nombre }),
    });
    if (res.ok) {
      document.getElementById('nombre-grupo').value = '';
      cargarGrupos();
    }
  } catch {
    // ignoramos
  }
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

// Dibuja los jugadores AGRUPADOS por grupo (cada grupo con sus jugadores).
function dibujarJugadores(jugadores) {
  listaJugadores.innerHTML = '';

  if (jugadores.length === 0) {
    listaJugadores.innerHTML = '<li class="vacio">Todavía no hay jugadores. Creá el primero.</li>';
    return;
  }

  // Agrupar por nombre de grupo.
  const porGrupo = {};
  for (const j of jugadores) {
    const g = j.grupo || 'Sin grupo';
    (porGrupo[g] = porGrupo[g] || []).push(j);
  }

  for (const grupoNombre of Object.keys(porGrupo).sort()) {
    const bloque = document.createElement('li');
    bloque.className = 'grupo-bloque';

    // Botón-encabezado del grupo (se toca para abrir/cerrar).
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'grupo-toggle';
    toggle.innerHTML = `<span class="flecha">▸</span> ${escaparHtml(grupoNombre)} (${porGrupo[grupoNombre].length})`;

    // Contenedor de los jugadores del grupo (arranca contraído).
    const cont = document.createElement('ul');
    cont.className = 'grupo-jugadores';
    cont.hidden = true;
    for (const j of porGrupo[grupoNombre]) {
      cont.appendChild(crearItemJugador(j));
    }

    toggle.addEventListener('click', () => {
      cont.hidden = !cont.hidden;
      toggle.querySelector('.flecha').textContent = cont.hidden ? '▸' : '▾';
    });

    bloque.appendChild(toggle);
    bloque.appendChild(cont);
    listaJugadores.appendChild(bloque);
  }
}

// Crea el item (li) de un jugador con sus controles.
function crearItemJugador(j) {
  const li = document.createElement('li');
  li.className = 'jugador';

  const nombre = j.nombre || '(sin nombre)';
  const suspendido = j.estado === 'suspendido';
  const estado = suspendido ? '⏸️ suspendido' : (j.ultimo_acceso ? 'ya entró' : 'no entró aún');

  const opcionesGrupo = gruposCache
    .map((g) => `<option value="${g.id}" ${g.id === j.grupo_id ? 'selected' : ''}>${g.nombre}</option>`)
    .join('');

  li.innerHTML = `
    <div class="jugador-info">
      <span class="jugador-nombre">${escaparHtml(nombre)}</span>
      <span class="jugador-estado">${estado}</span>
    </div>
    <div class="jugador-link">
      <input type="text" readonly value="${j.enlace}" />
      <button type="button" class="btn-copiar">Copiar</button>
      <button type="button" class="btn-wsp" title="Invitar por WhatsApp">📲</button>
    </div>
    <div class="jugador-controles">
      <select class="sel-grupo">${opcionesGrupo}</select>
      <button type="button" class="btn-suspender">${suspendido ? 'Reactivar' : 'Suspender'}</button>
      <button type="button" class="btn-borrar-jug">Borrar</button>
    </div>
  `;

  const btnCopiar = li.querySelector('.btn-copiar');
  btnCopiar.addEventListener('click', async () => {
    await navigator.clipboard.writeText(j.enlace);
    btnCopiar.textContent = '¡Copiado!';
    setTimeout(() => { btnCopiar.textContent = 'Copiar'; }, 1500);
  });

  li.querySelector('.btn-wsp').addEventListener('click', () => {
    const msg = `¡Te sumo al Prode! ⚽\n${nombre}, entrá con tu enlace personal (no lo compartas):\n${j.enlace}`;
    enviarWhatsApp(msg);
  });

  li.querySelector('.sel-grupo').addEventListener('change', async (e) => {
    await actualizarJugador(j.id, { grupo_id: e.target.value });
    cargarJugadores();
  });

  li.querySelector('.btn-suspender').addEventListener('click', async () => {
    await actualizarJugador(j.id, { estado: suspendido ? 'activo' : 'suspendido' });
    cargarJugadores();
  });

  li.querySelector('.btn-borrar-jug').addEventListener('click', async () => {
    if (!confirm(`¿Borrar a ${nombre}? Se eliminan también sus pronósticos.`)) return;
    await fetch(`/api/admin/jugadores/${j.id}`, { method: 'DELETE', headers: cabeceraAuth() });
    cargarJugadores();
  });

  return li;
}

// Helper: PUT a un jugador (mover de grupo o cambiar estado).
async function actualizarJugador(id, cambios) {
  await fetch(`/api/admin/jugadores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...cabeceraAuth() },
    body: JSON.stringify(cambios),
  });
}

// Crear un jugador nuevo.
formJugador.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  errorJugador.textContent = '';

  const nombre = document.getElementById('nombre-jugador').value;
  const grupoId = selectorGrupoJugador.value;

  if (!grupoId) {
    errorJugador.textContent = 'Primero creá un grupo y elegilo.';
    return;
  }

  try {
    const res = await fetch('/api/admin/jugadores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cabeceraAuth() },
      body: JSON.stringify({ nombre, grupo_id: grupoId }),
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
    // Goles opcionales: si se cargan, el backend lo marca como finalizado.
    goles_local: document.getElementById('m-goles-local').value,
    goles_visitante: document.getElementById('m-goles-visitante').value,
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
        <span class="jugador-nombre">${escaparHtml(p.local)} vs ${escaparHtml(p.visitante)}</span>
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

// ----- Configuracion del torneo (premio + torneo activo) -----

const formConfig = document.getElementById('form-config');
const estadoConfig = document.getElementById('estado-config');

// Trae la configuracion actual y llena: el formulario, el datalist y los
// desplegables de temporada del Fixture (carga manual + editar por fecha).
async function cargarConfig() {
  try {
    let activa = '';
    const res = await fetch('/api/admin/config', { headers: cabeceraAuth() });
    if (res.ok) {
      const cfg = await res.json();
      activa = cfg.temporada_activa || '';
      document.getElementById('cfg-premio').value = cfg.premio || '';
      document.getElementById('cfg-torneo').value = activa;
    }

    const resT = await fetch('/api/fixture/temporadas');
    if (resT.ok) {
      const temporadas = (await resT.json()).map((t) => t.temporada);

      // Datalist del torneo activo (en Config).
      document.getElementById('lista-temporadas').innerHTML =
        temporadas.map((t) => `<option value="${escaparHtml(t)}"></option>`).join('');

      // Desplegables de temporada en el Fixture.
      const opciones = temporadas.map((t) => `<option value="${escaparHtml(t)}">${escaparHtml(t)}</option>`).join('');
      const mTemp = document.getElementById('m-temporada');
      const vTemp = document.getElementById('v-temporada');
      mTemp.innerHTML = opciones;
      vTemp.innerHTML = `<option value="">Elegí temporada…</option>` + opciones;
      // En la carga manual, dejamos preseleccionado el torneo activo.
      if (activa && temporadas.includes(activa)) mTemp.value = activa;
    }
  } catch {
    // si falla, dejamos los campos como esten
  }
}

formConfig.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  // Confirmacion de seguridad (por si se toca sin querer).
  const torneo = document.getElementById('cfg-torneo').value;
  const aviso = `¿Guardar la configuración?\n\nTorneo activo: "${torneo}"\n\nSi cambiaste el torneo activo, la tabla pasará a mostrar ese torneo (el anterior queda guardado).`;
  if (!confirm(aviso)) {
    return;
  }

  estadoConfig.textContent = 'Guardando...';
  try {
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...cabeceraAuth() },
      body: JSON.stringify({
        premio: document.getElementById('cfg-premio').value,
        temporada_activa: document.getElementById('cfg-torneo').value,
      }),
    });
    estadoConfig.textContent = res.ok ? 'Guardado ✅' : 'No se pudo guardar';
  } catch {
    estadoConfig.textContent = 'No se pudo conectar con el servidor';
  }
});

// Recordatorio generico al grupo por WhatsApp.
document.getElementById('btn-recordatorio').addEventListener('click', () => {
  enviarWhatsApp('⏰ ¡Recordatorio del Prode!\nNo te olvides de cargar tus pronósticos de la próxima fecha antes de que empiecen los partidos. ⚽🔮');
});

// ----- Pestañas del panel de admin -----
const tabsAdmin = document.querySelectorAll('.tab-admin');
const panelesAdmin = document.querySelectorAll('.tab-panel');
tabsAdmin.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabsAdmin.forEach((t) => t.classList.toggle('activo', t === tab));
    panelesAdmin.forEach((p) => { p.hidden = p.dataset.panel !== tab.dataset.tab; });
  });
});

verificarSesion();
