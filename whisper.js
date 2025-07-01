// api/whisper.js

import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";

// Configuración necesaria para manejar archivos en Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Tu clave se usa aquí automáticamente
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al procesar el archivo de audio" });
    }

    try {
      const filePath = files.audio[0].filepath; // Para formidable@3+
      
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1",
        language: "es", // Español
      });

      res.status(200).json({ texto: transcription.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error al transcribir con Whisper", detalle: error.message });
    }
  });
}
