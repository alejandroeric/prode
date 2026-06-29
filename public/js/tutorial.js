// tutorial.js — Tutorial reutilizable (ícono ⓘ en todas las pantallas del jugador).

const PASOS_TUTORIAL = [
  {
    icono: '📲',
    titulo: 'Instalá la app en tu celu',
    texto: '<b>Android (Chrome):</b> tocá los 3 puntitos → "Instalar app" o "Agregar a pantalla de inicio".<br><br><b>iPhone (Safari):</b> tocá el botón compartir → "Agregar a pantalla de inicio".<br><br>Así tenés el ícono del Prode como si fuera una app real.',
  },
  {
    icono: '📅',
    titulo: 'Fixture',
    texto: 'Acá ves todos los partidos de la fecha actual: equipos, día y horario.<br><br>Pasá de fecha con las flechas ◀ ▶ y elegí la temporada en el selector de arriba.',
  },
  {
    icono: '✏️',
    titulo: 'Pronósticos',
    texto: 'Escribí el resultado que creés que va a salir en cada partido y tocá <b>"Guardar mis pronósticos"</b>.<br><br>⚠️ <b>Se cierran al minuto exacto de inicio del partido.</b> Después no podés modificarlos.',
  },
  {
    icono: '🔮',
    titulo: 'Ver pronósticos del grupo',
    texto: 'Una vez que un partido <b>arrancó</b>, tocá "🔮 Pronósticos" en la tarjeta para ver qué pronosticaron todos.<br><br>Antes de que empiece, los pronósticos son <b>secretos</b>.',
  },
  {
    icono: '🏆',
    titulo: 'Tabla y puntaje',
    texto: '<b>6 puntos</b> → resultado exacto.<br><b>3 puntos</b> → acertás el ganador o empate.<br><b>0 puntos</b> → error.<br><br>La <b>Tabla</b> muestra la clasificación de tu grupo con podio en tiempo real.',
  },
  {
    icono: '👤',
    titulo: 'Tu perfil',
    texto: 'En <b>Perfil</b> ves tus estadísticas personales: posición en el grupo, exactos, efectividad e historial fecha a fecha.',
  },
  {
    icono: '🔗',
    titulo: 'Tu enlace mágico',
    texto: 'El enlace que recibiste por WhatsApp es <b>personal e intransferible</b>.<br><br>No lo compartas: si alguien más entra con él, tu sesión se cierra automáticamente.',
  },
];

let pasoTutorial = 0;
let alTerminar = null;

function abrirTutorial(onFin) {
  alTerminar = onFin || null;
  pasoTutorial = 0;
  renderTutorial();
  document.getElementById('tutorial-modal').style.display = 'flex';
}

function renderTutorial() {
  const paso = PASOS_TUTORIAL[pasoTutorial];
  document.getElementById('tut-icono').textContent = paso.icono;
  document.getElementById('tut-titulo').textContent = paso.titulo;
  document.getElementById('tut-texto').innerHTML = paso.texto;
  document.getElementById('tut-contador').textContent = (pasoTutorial + 1) + ' / ' + PASOS_TUTORIAL.length;
  const btn = document.getElementById('tut-siguiente');
  btn.textContent = pasoTutorial === PASOS_TUTORIAL.length - 1 ? '¡Listo! ⚽' : 'Siguiente →';
}

document.getElementById('tut-siguiente').addEventListener('click', () => {
  if (pasoTutorial < PASOS_TUTORIAL.length - 1) {
    pasoTutorial++;
    renderTutorial();
  } else {
    document.getElementById('tutorial-modal').style.display = 'none';
    if (alTerminar) alTerminar();
  }
});

// Boton de ayuda flotante (ⓘ) — presente en todas las pantallas del jugador.
const btnAyuda = document.getElementById('btn-ayuda');
if (btnAyuda) btnAyuda.addEventListener('click', () => abrirTutorial());
