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
