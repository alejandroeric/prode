// supabase.js — Conexion central a la base de datos Supabase.
//
// Cualquier parte del backend que necesite leer o escribir en la base
// importa el cliente desde aca (no se crea una conexion nueva en cada lugar).
// Usa la SECRET key: tiene privilegios de servidor y NUNCA se expone al frontend.

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  throw new Error(
    'Faltan variables de Supabase. Revisa que el archivo .env tenga ' +
    'SUPABASE_URL y SUPABASE_SECRET_KEY, y que el servidor se inicie cargando el .env.'
  );
}

// persistSession: false porque en el servidor no guardamos sesiones de login en disco.
const supabase = createClient(url, secretKey, {
  auth: { persistSession: false },
});

module.exports = { supabase };
