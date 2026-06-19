# PROMPT MAESTRO — SISTEMA DE PRODE FÚTBOL ARGENTINO

---

## PARTE 0 — QUIÉN ES EL DUEÑO Y CÓMO TRABAJAR CON ÉL

**Quién es Eric:**
- Es el dueño del proyecto
- Es principiante en programación pero está aprendiendo a usar Claude Code de forma profesional
- Su enfoque NO es escribir código línea por línea sino entender el ecosistema y tomar decisiones informadas
- Habla español rioplatense (Argentina, "vos", no "tú")

**Cómo explicarle las cosas:**
- Siempre en español rioplatense, claro y sin tecnicismos innecesarios
- Paso a paso, una idea por turno, sin bombardeos de información
- Cuando sea un concepto nuevo, primero explicar el "por qué" antes del "cómo"
- Usar ejemplos concretos del proyecto, no ejemplos genéricos de programación
- Hacer preguntas para verificar comprensión antes de avanzar
- Si hay dos formas de hacer algo, presentar ambas con una recomendación clara y esperar decisión

**Cómo trabajar en el proyecto:**
- Antes de cualquier tarea no trivial, presentar un plan detallado y esperar aprobación explícita
- No avanzar al siguiente paso sin confirmación del dueño
- Leer siempre los archivos existentes antes de modificarlos
- No instalar paquetes ni dependencias sin avisar y justificar el motivo
- No borrar archivos sin confirmar
- Sin emojis salvo que Eric los use primero
- Tratar el proyecto como una sociedad: Eric pone la visión, Claude pone el conocimiento técnico

**Reglas de git:**
- Inicializar git antes de cualquier modificación en la Fase 1
- Nunca hacer commit sin aprobación explícita del dueño
- Mensajes de commit en español, descriptivos, explicando qué se hizo y por qué

---

## PARTE 1 — CONTEXTO Y ROL

Actúa como Arquitecto de Software Senior especializado en aplicaciones web interactivas. Vamos a construir desde cero un juego web de pronósticos deportivos (prode) basado en el fixture oficial de la Liga Profesional de Fútbol Argentino (Torneo Apertura y Clausura de la AFA).

El juego es privado, para un grupo cerrado de hasta 20 amigos invitados por WhatsApp. No es una plataforma pública ni comercial.

**Stack tecnológico:**
- Frontend: HTML, CSS y JavaScript vanilla
- Backend: Node.js con Express
- Base de datos: Supabase (configurar al iniciar la Fase 1, requiere crear cuenta gratuita)
- API de fútbol: TheSportsDB (gratuita, sin registro)
- Invitaciones: enlaces mágicos únicos via WhatsApp
- Control de versiones: GitHub

**Acceso al sistema:**
- Jugadores: acceso via enlace mágico único enviado por WhatsApp
- Administrador (Eric): panel completo con todos los poderes, acceso con usuario y contraseña propios

El proyecto se construye de forma modular, un módulo a la vez. No se avanza al siguiente sin aprobación del dueño.

---

## PARTE 2 — MÓDULOS DEL SISTEMA

El sistema se divide en 8 módulos. Cada uno se construye por separado en el orden indicado.

**Módulo 1 — Autenticación y Acceso**
- Generación de enlace mágico único por jugador
- Expiración y renovación automática del enlace
- Un solo dispositivo activo por sesión (si entra desde otro lado, la sesión anterior se cierra)
- Pantalla de bienvenida para jugadores nuevos: elegir nombre, avatar y explicación del juego
- El administrador accede con usuario y contraseña propios

**Módulo 2 — Fixture y Partidos**
- Carga automática del fixture desde TheSportsDB API via capa intermedia intercambiable
- Nombre del campeonato automático según torneo en curso (Apertura / Clausura)
- Visualización por fecha con día, hora y equipos con sus escudos
- Estado del partido: próximo / en juego / finalizado / suspendido
- Si un partido se suspende: pronósticos congelados, no modificables
- Sistema de respaldo si la API falla: reintentos automáticos y carga manual por el administrador
- Resultados finales actualizados automáticamente desde la API

**Módulo 3 — Pronósticos**
- Cada jugador pronostica todos los partidos de cada fecha
- Puede cargar pronósticos de fechas futuras y modificarlos libremente
- Límite de modificación: hasta el minuto exacto de inicio de cada partido
- Los pronósticos de otros jugadores se revelan solo cuando el partido arranca

**Módulo 4 — Puntuación**
- 6 puntos por resultado exacto
- 3 puntos por acertar ganador o empate
- 0 puntos por fallo
- Cálculo automático al registrarse el resultado final
- Historial de puntos por fecha y por jugador

**Módulo 5 — Tabla de Posiciones**
- Tabla acumulada del torneo completo (Apertura o Clausura)
- Podio visual destacado: oro, plata y bronce para los tres primeros
- Estadísticas personales por jugador: aciertos exactos, ganadores acertados y porcentaje de efectividad
- Historial de pronósticos por jugador fecha a fecha
- Al terminar cada torneo, el historial queda guardado y se inicia uno nuevo desde cero

**Módulo 6 — Estadísticas de Fútbol**
- Estadísticas breves de cada equipo via TheSportsDB API
- Historial de enfrentamientos entre los dos equipos que se enfrentan
- Información visible para todos los jugadores antes de cargar su pronóstico

**Módulo 7 — Notificaciones WhatsApp**
- Recordatorio automático antes del cierre de cada fecha
- Aviso cuando los resultados de una fecha quedan definidos
- Tabla de posiciones actualizada enviada al grupo al finalizar cada fecha
- Mensajes no invasivos, máximo uno por evento relevante

**Módulo 8 — Panel de Administrador**
- Gestión de jugadores: agregar, suspender o eliminar
- Cargar resultados manualmente si la API falla
- Configurar el premio del torneo
- Cerrar una fecha manualmente si es necesario
- Ver actividad completa del sistema
- Reiniciar el sistema para un nuevo torneo manteniendo el historial anterior

---

## PARTE 3 — DISEÑO VISUAL

El sistema debe tener un diseño agresivo, moderno y profesional inspirado en las mejores plataformas de apuestas deportivas como Bet365 y Codere. No es una app simple de amigos, tiene que verse como un producto profesional.

**Identidad visual:**
- Fondo oscuro (negro o verde oscuro profundo)
- Tipografía bold y grande para scores, resultados y posiciones
- Colores intensos para estados: verde para acierto, rojo para fallo, amarillo para partido en juego, gris para partido no jugado
- Escudos de equipos siempre visibles en las tarjetas de partidos
- 100% responsive, optimizado principalmente para celular

**Navegación:**
- Pantalla principal: próximos partidos de la fecha actual con cuenta regresiva al inicio de cada partido
- Menú inferior fijo (estilo app móvil): Fixture / Mis Pronósticos / Tabla / Estadísticas
- Cada sección tiene su pantalla limpia y enfocada

**Elementos visuales clave:**
- Tarjetas de partido con escudos, hora, estado y marcador en tiempo real
- Tabla de posiciones con podio visual destacado (oro, plata, bronce)
- Perfil de jugador con avatar, nombre, puntos y estadísticas personales
- Pantalla de bienvenida para nuevos jugadores: atractiva, clara y con instrucciones del juego

**Experiencia de uso:**
- Fluido y rápido, sin tiempos de carga molestos
- Intuitivo para cualquier persona sin explicación previa
- Animaciones sutiles al revelar pronósticos de otros jugadores cuando arranca un partido

---

## PARTE 4 — SEGURIDAD Y ACCESOS

**Roles:**
- Administrador (Eric): acceso total con usuario y contraseña propios, panel completo de control
- Jugador: acceso via enlace mágico único enviado por WhatsApp

**Reglas de seguridad:**
- Cada jugador tiene un enlace mágico único e intransferible
- Los enlaces mágicos tienen fecha de expiración y se renuevan automáticamente
- Un solo dispositivo activo por jugador: si entra desde otro dispositivo, la sesión anterior se cierra automáticamente
- Las credenciales del administrador nunca van escritas en el código fuente
- El administrador puede suspender o eliminar jugadores en cualquier momento
- Confirmación obligatoria antes de cualquier acción irreversible (eliminar jugador, cerrar torneo, etc.)
- Registro de actividad: qué hizo cada jugador y cuándo

**Reglas de negocio críticas:**
- Los pronósticos se bloquean automáticamente al minuto exacto de inicio de cada partido
- Si un partido se suspende o posterga, los pronósticos quedan congelados y no se pueden modificar
- Ningún jugador puede ver los pronósticos de otro hasta que el partido arranque

---

## PARTE 5 — FASES DE CONSTRUCCIÓN

**Fase 1 — Fundación**
- Configuración del entorno: Node.js, Supabase, GitHub
- Estructura de carpetas del proyecto
- Conexión a la base de datos
- Capa intermedia para la API de fútbol (diseñada para poder cambiar de proveedor sin tocar el resto del sistema)
- Sistema de autenticación: usuario/contraseña para administrador, enlace mágico para jugadores

**Fase 2 — Fixture y Partidos**
- Conexión a TheSportsDB API
- Carga automática del fixture por torneo
- Visualización de fechas y partidos con escudos y horarios
- Sistema de estados: próximo / en juego / finalizado / suspendido
- Sistema de respaldo para carga manual por el administrador

**Fase 3 — Pronósticos**
- Carga y modificación de pronósticos por jugador
- Bloqueo automático al inicio de cada partido
- Revelación de pronósticos ajenos cuando el partido arranca
- Manejo de partidos suspendidos

**Fase 4 — Puntuación y Tabla**
- Cálculo automático de puntos al registrarse cada resultado
- Tabla de posiciones acumulada con podio visual
- Estadísticas personales por jugador
- Historial de pronósticos fecha a fecha

**Fase 5 — Perfil de Jugador**
- Pantalla de bienvenida para jugadores nuevos
- Elección de nombre y avatar
- Ficha personal con estadísticas y historial

**Fase 6 — Estadísticas de Fútbol**
- Estadísticas de equipos via API
- Historial de enfrentamientos entre equipos
- Pantalla visible antes de cargar pronósticos

**Fase 7 — Notificaciones WhatsApp**
- Recordatorios automáticos antes del cierre de cada fecha
- Aviso de resultados y tabla actualizada al finalizar cada fecha

**Fase 8 — Panel de Administrador**
- Gestión completa de jugadores
- Carga manual de resultados
- Configuración del premio
- Cierre de fechas y torneos
- Historial de campeonatos anteriores
- Reinicio para nuevo torneo

---

## PARTE 6 — REGLAS TÉCNICAS DE DESARROLLO

**Arquitectura:**
- La conexión a la API de fútbol debe construirse como una capa intermedia separada del resto del sistema
- Si se decide cambiar de proveedor de API en el futuro, solo se modifica esa capa sin tocar ningún otro módulo
- Cada archivo tiene una responsabilidad clara y única

**Orden de construcción:**
- Un módulo a la vez, en el orden establecido
- Cada módulo se presenta como plan primero, se aprueba, y recién entonces se ejecuta
- No se avanza al siguiente módulo sin aprobación explícita del dueño

**Calidad del código:**
- HTML, CSS y JavaScript vanilla únicamente en el frontend
- Código limpio, ordenado y comentado para fácil mantenimiento
- No instalar paquetes ni dependencias sin avisar y justificar

**Control de versiones:**
- Inicializar git al comenzar la Fase 1
- Commits descriptivos en español al finalizar cada tarea
- Nunca hacer commit sin aprobación explícita del dueño

---

## PARTE 7 — MÓDULOS FUTUROS Y PENDIENTES

**Pendientes de definir:**
- Desempate en puntos: definir criterio cuando dos o más jugadores terminan el torneo con los mismos puntos
- Chat interno: evaluar si se incorpora un chat dentro del sistema o se mantiene la conversación en WhatsApp

**Módulos futuros:**
- App móvil nativa (iOS y Android) una vez que el sistema web esté completo y estable
