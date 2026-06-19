# Contexto del proyecto

## Sobre el dueño

Eric Nofal. Principiante en programación pero aprendiendo a usar Claude Code de forma profesional. Habla español rioplatense (Argentina, "vos").

Su enfoque NO es escribir código línea por línea — es escribir prompts profesionales y entender el ecosistema. Cuando le expliques cosas, hacelo paso a paso, con ejemplos concretos y preguntas para verificar comprensión. Evitá info dumps.

## Stack técnico real

- *Frontend: HTML + CSS + JavaScript vanilla* — sin frameworks (nada de React, Vue, etc.).
- *Backend: Node.js con Express.*
- *Base de datos: Supabase* (cuenta gratuita, se configura en la Fase 1).
- *API de fútbol: TheSportsDB* (gratuita), conectada vía una capa intermedia intercambiable.
- *Control de versiones: GitHub.*
- *NO* usar Python, Flask ni SQLite. El backend es Node + Express únicamente.
- Si se proponen cambios estructurales (split de archivos, build tools, dependencias nuevas, etc.), pedir confirmación del dueño primero.

## Estado actual al iniciar sesión

Verificar al arrancar:
- ¿La carpeta del proyecto tiene .git/? Si NO, proponer git init antes de cualquier modificación.

## Reglas no negociables

### Seguridad
- Secrets (claves de Supabase, credenciales del admin, API keys) *NUNCA en código fuente* ni en el frontend. Van en un archivo `.env` del servidor.
- `.env` debe estar en `.gitignore` — nunca se commitea.
- Sin secrets hardcodeados.

### Control de versiones (git)

*Regla #1 — Inicialización obligatoria:* si la carpeta del proyecto no tiene .git/, ANTES de cualquier modificación proponer git init + primer commit con el estado actual.

*Regla #2 — Commits descriptivos:* mensajes claros, en castellano, que expliquen el "qué" y el "por qué". Evitar mensajes vagos tipo "fix", "update", "cambios", "campeon".

*Regla #3 — No commitear sin pedirlo:* no hacer commits automáticos sin que el dueño los apruebe explícitamente (salvo el primer commit de inicialización, que es esperado).

*Regla #4 — Backup antes de cambios riesgosos:* antes de modificar lógica que toca localStorage o estructura de archivos, sugerir backup primero.

Identidad git ya configurada globalmente: Eric Nofal / alejoanton@hotmail.com.

## Workflow profesional esperado

1. *Plan antes de código*: para tareas no triviales, presentar plan primero. Esperar OK.
2. *Edit > Write*: preferir Edit a Write siempre que se pueda. Solo usar Write para archivos nuevos o reescrituras planeadas.
3. *Leer antes de modificar*: nunca tocar archivo sin haberlo leído antes.
4. *Considerar localStorage*: cualquier cambio que afecte URL/path del archivo requiere plan de backup/restore.
5. *Verificar visualmente*: después de cambios significativos, recomendar abrir la app y confirmar que todo funciona.

## Restricciones generales (defaults)

- *No commitear a git* sin que el dueño lo pida explícitamente.
- *No instalar paquetes nuevos* sin avisar y justificar.
- *No borrar archivos* sin confirmar.
- *Si existen instrucciones contradictorias*, preguntar al dueño cuál usar.

## Estilo de comunicación esperado

- Español rioplatense ("vos", no "tú").
- Paso a paso, con ejemplos concretos y preguntas de verificación.
- Validar el "por qué" antes del "cómo" cuando es un concepto nuevo.
- Sin emojis salvo que el dueño los use primero o los pida.
- Sin info dumps. Una idea por turno.
