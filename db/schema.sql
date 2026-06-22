-- =====================================================================
-- schema.sql — Plano de la base de datos del Prode (Supabase / PostgreSQL)
-- =====================================================================
-- Este archivo documenta la estructura de las tablas. Si hace falta
-- recrear la base desde cero, se corre este SQL en el editor de Supabase.
-- No se ejecuta automaticamente: es la referencia versionada del esquema.
-- ---------------------------------------------------------------------

-- Tabla de jugadores del Prode
create table jugadores (
  id            uuid primary key default gen_random_uuid(),
  nombre        text,
  avatar        text,
  token_magico  text unique not null,
  token_expira  timestamptz,
  sesion_token  text,
  estado        text not null default 'activo',
  creado_en     timestamptz not null default now(),
  ultimo_acceso timestamptz
);

-- Seguridad: bloquea el acceso directo desde el navegador.
-- Solo el backend (con la secret key) puede tocar esta tabla.
alter table jugadores enable row level security;

-- Tabla de partidos (fixture). Recibe datos de 3 origenes: api, manual y captura.
create table partidos (
  id               uuid primary key default gen_random_uuid(),
  id_externo       text unique,        -- id del partido en la API (NULL si es manual)
  temporada        text,
  fecha_numero     integer,
  local            text not null,
  visitante        text not null,
  escudo_local     text,
  escudo_visitante text,
  inicio           timestamptz,        -- dia y hora exactos del partido
  goles_local      integer,
  goles_visitante  integer,
  estado           text not null default 'proximo',  -- proximo/en_juego/finalizado/suspendido
  estadio          text,
  origen           text not null default 'api',       -- api / manual
  creado_en        timestamptz not null default now()
);

alter table partidos enable row level security;

-- Tabla de pronosticos: la prediccion de cada jugador para cada partido.
create table pronosticos (
  id              uuid primary key default gen_random_uuid(),
  jugador_id      uuid not null references jugadores(id) on delete cascade,
  partido_id      uuid not null references partidos(id) on delete cascade,
  goles_local     integer not null,
  goles_visitante integer not null,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  unique (jugador_id, partido_id)   -- un pronostico por jugador y por partido
);

alter table pronosticos enable row level security;

-- Configuracion global del sistema (una sola fila): premio y torneo en curso.
create table configuracion (
  id               integer primary key default 1,
  premio           text,
  temporada_activa text,
  actualizado_en   timestamptz not null default now()
);

insert into configuracion (id) values (1);

alter table configuracion enable row level security;

-- Tabla de grupos (ligas privadas): cada grupo tiene sus propios jugadores y su tabla.
-- El fixture (partidos) es compartido por todos los grupos.
create table grupos (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  creado_en timestamptz not null default now()
);

alter table grupos enable row level security;

-- Cada jugador pertenece a un grupo. Si se borra el grupo, el jugador queda sin grupo (no se borra).
alter table jugadores add column grupo_id uuid references grupos(id) on delete set null;
