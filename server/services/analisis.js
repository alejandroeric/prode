// analisis.js — Genera el analisis de un partido usando la API de Claude.
// Se llama UNA sola vez por partido (admin lo dispara); el resultado se guarda en DB.

const Anthropic = require('@anthropic-ai/sdk');
const { supabase } = require('./supabase');

function crearCliente() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Falta ANTHROPIC_API_KEY en .env');
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Llama a Claude y devuelve el objeto { analisis, historial, dato_curioso, resultado_probable }.
async function generarAnalisisPartido(local, visitante, temporada) {
  const client = crearCliente();

  const prompt = `Sos un analista de fútbol argentino experto en la Liga Profesional.
Analizá el partido ${local} vs ${visitante} del torneo ${temporada}.

Respondé ÚNICAMENTE con un JSON válido, sin texto extra, con exactamente estos 4 campos:
{
  "analisis": "2 o 3 oraciones sobre ambos equipos: estilo de juego, momento actual, por qué es un partido interesante.",
  "historial": "1 o 2 oraciones sobre el historial de enfrentamientos recientes entre los dos equipos.",
  "dato_curioso": "Un dato curioso, récord histórico o anécdota sobre este partido o estos equipos.",
  "resultado_probable": "X-X"
}`;

  const mensaje = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const texto = mensaje.content[0].text.trim();

  // Extraer el JSON aunque Claude agregue texto antes/despues.
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  if (inicio === -1 || fin === -1) throw new Error('Claude no devolvio un JSON valido');
  return JSON.parse(texto.slice(inicio, fin + 1));
}

// Genera y guarda el analisis de todos los partidos de una fecha que aun no lo tienen.
// Devuelve { generados, saltados, errores }.
async function analizarFecha(temporada, fechaNumero) {
  const { data: partidos, error } = await supabase
    .from('partidos')
    .select('id, local, visitante, temporada, analisis')
    .eq('temporada', temporada)
    .eq('fecha_numero', fechaNumero);

  if (error) throw new Error(error.message);
  if (!partidos || partidos.length === 0) return { generados: 0, saltados: 0, errores: 0 };

  let generados = 0;
  let saltados = 0;
  let errores = 0;

  for (const p of partidos) {
    // Si ya tiene analisis, saltar (no gastar API de nuevo).
    if (p.analisis) { saltados++; continue; }

    try {
      const resultado = await generarAnalisisPartido(p.local, p.visitante, p.temporada);
      const { error: upErr } = await supabase
        .from('partidos')
        .update({ analisis: resultado })
        .eq('id', p.id);
      if (upErr) throw new Error(upErr.message);
      generados++;
    } catch {
      errores++;
    }
  }

  return { generados, saltados, errores };
}

// Devuelve el analisis de un partido. Si no existe, lo genera y guarda en DB.
async function obtenerOGenerarAnalisis(partidoId) {
  const { data: partido, error } = await supabase
    .from('partidos')
    .select('id, local, visitante, temporada, analisis')
    .eq('id', partidoId)
    .single();

  if (error || !partido) throw new Error('Partido no encontrado');
  if (partido.analisis) return partido.analisis;

  // Si Claude falla o devuelve JSON malformado, guardamos un fallback para no reintentar.
  let resultado;
  try {
    resultado = await generarAnalisisPartido(partido.local, partido.visitante, partido.temporada);
  } catch {
    resultado = {
      analisis: 'No se pudo generar el análisis para este partido.',
      historial: '',
      dato_curioso: '',
      resultado_probable: '?-?',
    };
  }

  await supabase.from('partidos').update({ analisis: resultado }).eq('id', partidoId);
  return resultado;
}

module.exports = { analizarFecha, obtenerOGenerarAnalisis };
