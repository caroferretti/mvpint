// Voice AI InterOMed MVP - script.js con integración OpenAI lista
// Utiliza Vercel y tu endpoint /api/openai de forma segura

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
    plan: document.getElementById("plan")
};

const btnHablar = document.getElementById("hablar");
const btnDetener = document.getElementById("detener");
const btnDiagnosticar = document.getElementById("diagnosticar");
const resultadoDiv = document.getElementById("resultado");
const mensajeIA = document.getElementById("mensajeIA");

let recognition;
let grabando = false;

// --- CONFIGURAR RECONOCIMIENTO DE VOZ ---
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let texto = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            texto += event.results[i][0].transcript + " ";
        }
        resultadoDiv.textContent = texto.trim();
    };

    recognition.onerror = (event) => {
        console.error("Error de reconocimiento:", event.error);
    };

    recognition.onend = () => {
        grabando = false;
        btnHablar.disabled = false;
        btnDetener.disabled = true;
    };

    btnHablar.addEventListener("click", () => {
        recognition.start();
        grabando = true;
        btnHablar.disabled = true;
        btnDetener.disabled = false;
    });

    btnDetener.addEventListener("click", () => {
        recognition.stop();
        grabando = false;
        btnHablar.disabled = false;
        btnDetener.disabled = true;
    });

} else {
    alert("Tu navegador no soporta reconocimiento de voz.");
}

// --- BOTÓN DIAGNOSTICAR CON IA ---
btnDiagnosticar.addEventListener("click", async () => {
    const texto = resultadoDiv.textContent.trim();
    if (!texto) {
        mensajeIA.textContent = "Por favor, grabe o escriba datos antes de diagnosticar.";
        return;
    }
    mensajeIA.textContent = "Consultando IA...";

    try {
        const response = await fetch("/api/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: texto })
        });

        const data = await response.json();
        if (data.resultado) {
            parsearRespuestaIA(data.resultado);
            mensajeIA.textContent = "IA completó campos sugeridos (requiere validación profesional).";
        } else {
            mensajeIA.textContent = "No se recibió respuesta de la IA.";
        }
    } catch (error) {
        console.error(error);
        mensajeIA.textContent = "Error al consultar la IA.";
    }
});

// --- FUNCION PARA PARSEAR RESPUESTA IA Y COMPLETAR CAMPOS ---
function parsearRespuestaIA(respuesta) {
    const patrones = {
        nombreApellido: /Nombre:\s*(.*)/i,
        genero: /Género:\s*(.*)/i,
        cobertura: /Cobertura:\s*(.*)/i,
        alergias: /Alergias:\s*(.*)/i,
        familiares: /Familiares:\s*(.*)/i,
        preexistentes: /Preexistentes:\s*(.*)/i,
        sintomas: /Síntomas:\s*(.*)/i,
        motivoConsulta: /Motivo:\s*(.*)/i,
        diagnostico: /Diagnóstico:\s*(.*)/i,
        plan: /Plan:\s*(.*)/i
    };

    for (const campo in patrones) {
        const match = respuesta.match(patrones[campo]);
        if (match && match[1]) {
            campos[campo].value = match[1].trim();
        }
    }
}
