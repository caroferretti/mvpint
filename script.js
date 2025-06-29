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
const btnPausar = document.getElementById("pausar");
const btnReanudar = document.getElementById("reanudar");
const btnDetener = document.getElementById("detener");
const btnDescargar = document.getElementById("descargar");
const btnDiagnosticar = document.getElementById("diagnosticar");
const resultadoDiv = document.getElementById("resultado");
const mensajeIA = document.getElementById("mensajeIA");

let recognition;
let textoCompleto = "";
let grabacionActiva = false;

// Diccionario médico simple
const diccionarioMedico = {
  "dolor de panza": "dolor abdominal",
  "me duele la cabeza": "cefalea",
  "no puedo comer sal": "hipertensión",
  "tengo mocos": "rinitis",
  "me falta el aire": "disnea",
  "me pica la piel": "prurito",
  "me duelen las piernas": "dolor en extremidades inferiores",
  "estoy cansado": "astenia",
  "tengo fiebre": "hipertermia",
  "me duele el pecho": "dolor torácico",
  "no puedo respirar bien": "disnea",
  "tengo vómitos": "emesis"
};

function aplicarDiccionario(texto) {
  for (const coloquial in diccionarioMedico) {
    const regex = new RegExp(coloquial, "gi");
    texto = texto.replace(regex, diccionarioMedico[coloquial]);
  }
  return texto;
}

function capitalizar(texto) {
  return texto.replace(/\b\w/g, c => c.toUpperCase());
}

function agregarCampoSinRepetir(campo, textoNuevo) {
  let actual = campo.value.trim();
  if (!actual.includes(textoNuevo)) {
    campo.value = actual ? actual + ", " + textoNuevo : textoNuevo;
  }
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

if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
  alert("Tu navegador no soporta reconocimiento de voz.");
} else {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'es-AR';
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        textoCompleto += event.results[i][0].transcript + " ";
        procesarTexto(textoCompleto);
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    resultadoDiv.textContent = textoCompleto + interim;
  };

  recognition.onerror = (event) => {
    console.error("Error en reconocimiento:", event.error);
  };

  recognition.onend = () => {
    grabacionActiva = false;
    btnHablar.disabled = false;
    btnPausar.disabled = true;
    btnReanudar.disabled = true;
    btnDetener.disabled = true;
  };
}

function procesarTexto(textoFinal) {
  textoFinal = textoFinal.toLowerCase();

  if (!textoFinal.includes("alérgico") && !textoFinal.includes("alérgica") && !textoFinal.includes("alergia")) {
    const nombreMatch = textoFinal.match(/soy ([a-záéíóúñ\s]+)/);
    if (nombreMatch) campos.nombreApellido.value = capitalizar(nombreMatch[1].trim());
  }

  const coberturaMatch = textoFinal.match(/(obra social|prepaga|cobertura) ([a-záéíóúñ\s]+)/);
  if (coberturaMatch) campos.cobertura.value = capitalizar(coberturaMatch[2].trim());

  const alergiaMatch = textoFinal.match(/(?:alergia a|alérgico a|tengo alergia a) ([a-záéíóúñ\s,]+)/);
  if (alergiaMatch) agregarCampoSinRepetir(campos.alergias, capitalizar(alergiaMatch[1].trim()));

  const familiarMatch = textoFinal.match(/(?:mi mamá|mi papá|mi hermano|mi hermana|mi abuelo|mi abuela).*(tuvo|tiene) ([a-záéíóúñ\s,]+)/);
  if (familiarMatch) agregarCampoSinRepetir(campos.familiares, capitalizar(familiarMatch[2].trim()));

  const sintomasMatch = textoFinal.match(/(?:síntoma|siento|tengo|me duele|me siento) ([a-záéíóúñ\s,]+)/);
  if (sintomasMatch) agregarCampoSinRepetir(campos.sintomas, capitalizar(aplicarDiccionario(sintomasMatch[1].trim())));

  calcularEdad();
}

// BOTONES
btnHablar.addEventListener("click", () => {
  if (!grabacionActiva) {
    recognition.start();
    grabacionActiva = true;
    btnHablar.disabled = true;
    btnPausar.disabled = false;
    btnDetener.disabled = false;
    btnReanudar.disabled = true;
  }
});

btnPausar.addEventListener("click", () => {
  recognition.stop();
  grabacionActiva = false;
  btnPausar.disabled = true;
  btnReanudar.disabled = false;
});

btnReanudar.addEventListener("click", () => {
  recognition.start();
  grabacionActiva = true;
  btnReanudar.disabled = true;
  btnPausar.disabled = false;
});

btnDetener.addEventListener("click", () => {
  recognition.stop();
  grabacionActiva = false;
  btnHablar.disabled = false;
  btnPausar.disabled = true;
  btnReanudar.disabled = true;
  btnDetener.disabled = true;
});

btnDescargar.addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(14);
  doc.text("Historia Clínica - Interrogatorio por Voz", 10, y);
  y += 10;

  for (const key in campos) {
    const label = labelCampo(key);
    const valor = campos[key].value || "";
    const lineHeight = 7;
    doc.setFontSize(12);
    doc.text(`${label}:`, 10, y);
    y += lineHeight;
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(valor, 180);
    doc.text(splitText, 12, y);
    y += splitText.length * lineHeight + 3;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  }

  doc.save("historia_clinica_interrogatorio.pdf");
});

function labelCampo(campo) {
  switch(campo) {
    case "nombreApellido": return "Nombre y Apellido";
    case "fechaNacimiento": return "Fecha de Nacimiento";
    case "edad": return "Edad";
    case "genero": return "Género";
    case "cobertura": return "Cobertura";
    case "alergias": return "Alergias";
    case "familiares": return "Enfermedades Familiares";
    case "preexistentes": return "Enfermedades Preexistentes";
    case "sintomas": return "Síntomas";
    case "motivoConsulta": return "Motivo de Consulta";
    case "diagnostico": return "Diagnóstico Presuntivo";
    case "plan": return "Plan Terapéutico";
    default: return campo;
  }
}

// Llamada a la API segura en /api/diagnostico
btnDiagnosticar.addEventListener("click", async () => {
  const sintomas = campos.sintomas.value.trim();
  if (!sintomas) {
    mensajeIA.textContent = "Por favor, ingrese síntomas para generar un diagnóstico.";
    return;
  }

  mensajeIA.textContent = "Consultando IA médica...";

  try {
    const respuesta = await fetch("/api/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sintomas })
    });

    const data = await respuesta.json();
    const respuestaIA = data.resultado;

    mensajeIA.textContent = "Diagnóstico sugerido por IA (validar con profesional):";
    campos.diagnostico.value = respuestaIA.split("Plan terapéutico:")[0].trim();
    campos.plan.value = (respuestaIA.split("Plan terapéutico:")[1] || "").trim();
  } catch (error) {
    mensajeIA.textContent = "Error al conectar con IA médica.";
    console.error(error);
  }
});

