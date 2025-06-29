// api/openai.js

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { texto } = req.body;

    if (!texto) {
      return res.status(400).json({ error: "No se envió texto" });
    }

    // Llamada a OpenAI con instrucción clara de clasificación
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-preview",
      messages: [
        {
          role: "system",
          content: "Eres un asistente médico que organiza información de historia clínica a partir de un interrogatorio por voz, clasificando cada frase en: Nombre, Edad, Género, Cobertura, Alergias, Enfermedades Familiares, Enfermedades Preexistentes, Síntomas, Motivo de Consulta, Diagnóstico Presuntivo y Plan Terapéutico. Devuelve la respuesta en JSON con estos campos sin explicación."
        },
        {
          role: "user",
          content: texto
        }
      ]
    });

    const respuestaTexto = completion.choices[0].message.content;

    // Intenta parsear a JSON limpio para enviar al front
    let respuestaJSON;
    try {
      respuestaJSON = JSON.parse(respuestaTexto);
    } catch (e) {
      return res.status(500).json({ error: "No se pudo interpretar la respuesta de la IA", raw: respuestaTexto });
    }

    res.status(200).json({ resultado: respuestaJSON });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
  }
}
