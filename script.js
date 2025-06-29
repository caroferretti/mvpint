// ✅ SCRIPT COMPLETO PARA MVP INTEROMED

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

const OPENAI_API_KEY = "TU_API_KEY_AQUI";

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
    if (texto.includes("tengo")) campos.sintomas.value += texto + ", ";
    else if (texto.includes("tuve")) campos.preexistentes.value += texto + ", ";
    else if (texto.includes("mi mamá") || texto.includes("mi papá") || texto.includes("mi hermana") || texto.includes("mi hermano")) campos.familiares.value += texto + ", ";
    else if (texto.includes("motivo de consulta")) campos.motivoConsulta.value += texto + ", ";
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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-preview",
        messages: [{
          role: "system",
          content: "Eres un médico que genera diagnóstico presuntivo y plan terapéutico en español. Devuelve JSON con 'DiagnosticoPresuntivo' y 'PlanTerapeutico'."
        }, {
          role: "user",
          content: `Paciente presenta: ${sintomas}`
        }]
      })
    });
    const data = await response.json();
    const jsonIA = JSON.parse(data.choices[0].message.content);
    campos.diagnostico.value = jsonIA.DiagnosticoPresuntivo;
    campos.plan.value = jsonIA.PlanTerapeutico;
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
  doc.text("Historia Clínica - Interrogatorio por Voz", 10, y);
  y += 10;
  for (const key in campos) {
    const label = key;
    const valor = campos[key].value;
    doc.text(`${label}: ${valor}`, 10, y);
    y += 7;
  }
  doc.save("historia_clinica_interomed.pdf");
});

