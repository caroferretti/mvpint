// ✅ SCRIPT FRONTEND PARA MVP INTEROMED CON CLAVE OPENAI OCULTA DE FORMA SEGURA

// Este script:
// - Llama al endpoint /api/diagnostico que maneja la clave en backend.
// - No expone la clave en el frontend.
// - Requiere que configures en Vercel la variable de entorno OPENAI_API_KEY.
// - Preparado para subir a GitHub y Vercel de forma segura.

const campos = {
  nombreApellido: document.getElementById("nombreApellido"),
  fechaNacimiento: document.getElementById("fechaNacimiento"),
  edad: document.getElementById("edad"),
  genero: document.getElementById("genero"),
  cobertura: document.getElementById("cobertura"),
  alergias: document.getElementById("alergias"),
  familiares: document.getElementById("familiares"),
  preexistentes: document.getElementById("preexistentes"),
  sintomas: document.getElementById("sintomas"),
  motivoConsulta: document.getElementById("motivoConsulta"),
  diagnostico: document.getElementById("diagnostico"),
  plan: document.getElementById("plan"),
};

const btnHablar = document.getElementById("hablar");
const btnDetener = document.getElementById("detener");
const btnDescargar = document.getElementById("descargar");
const btnDiagnosticar = document.getElementById("diagnosticar");
const confirmarDiagnostico = document.getElementById("confirmarDiagnostico");
const confirmarPlan = document.getElementById("confirmarPlan");
const mensajeIA = document.getElementById("mensajeIA");

function capitalizar(texto) {
  return texto.replace(/\b\w/g, c => c.toUpperCase());
}

function calcularEdad() {
  const fecha = campos.fechaNacimiento.value;
  if (!fecha) return;
  const hoy = new Date();
  const nacimiento = new Date(fecha);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  campos.edad.value = edad;
}

function actualizarBotonDescarga() {
  btnDescargar.disabled = !(confirmarDiagnostico.checked && confirmarPlan.checked);
}

confirmarDiagnostico.addEventListener("change", actualizarBotonDescarga);
confirmarPlan.addEventListener("change", actualizarBotonDescarga);

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'es-AR';
  recognition.continuous = true;

  btnHablar.addEventListener("click", () => {
    recognition.start();
    mensajeIA.textContent = "🎙️ Grabando...";
  });

  btnDetener.addEventListener("click", () => {
    recognition.stop();
    mensajeIA.textContent = "Grabación detenida.";
  });

  recognition.onresult = (event) => {
    const texto = event.results[event.resultIndex][0].transcript.toLowerCase();
    if (texto.includes("tengo")) campos.sintomas.value += capitalizar(texto) + ". ";
    else if (texto.includes("tuve")) campos.preexistentes.value += capitalizar(texto) + ". ";
    else if (texto.includes("mi mamá") || texto.includes("mi papá") || texto.includes("mi hermana") || texto.includes("mi hermano")) campos.familiares.value += capitalizar(texto) + ". ";
    else if (texto.includes("motivo de consulta")) campos.motivoConsulta.value += capitalizar(texto) + ". ";
  };
} else {
  alert("Tu navegador no soporta reconocimiento de voz");
}

btnDiagnosticar.addEventListener("click", async () => {
  const sintomas = campos.sintomas.value;
  if (!sintomas) {
    mensajeIA.textContent = "Ingrese síntomas para generar diagnóstico.";
    return;
  }
  mensajeIA.textContent = "🔍 Analizando con IA...";
  try {
    const response = await fetch("/api/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sintomas })
    });
    const data = await response.json();
    campos.diagnostico.value = data.diagnostico;
    campos.plan.value = data.plan;
    mensajeIA.textContent = "✅ Diagnóstico y plan generados (requiere validación médica).";
  } catch (error) {
    console.error(error);
    mensajeIA.textContent = "❌ Error al generar diagnóstico con IA.";
  }
});

btnDescargar.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(14);
  doc.text("Historia Clínica - Interrogatorio por Voz", 10, y);
  y += 10;
  for (const key in campos) {
    const label = key;
    const valor = campos[key].value;
    doc.setFontSize(12);
    doc.text(`${label}: ${valor}`, 10, y);
    y += 7;
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  }
  doc.save("historia_clinica_interomed.pdf");
});

