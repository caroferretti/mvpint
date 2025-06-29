// Voice AI InterOMed MVP - script.js listo para Vercel con OpenAI API integrada
// Reemplaza 'TU_API_KEY_AQUI' con tu clave secreta en el entorno de Vercel (NO en el cliente)

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

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        let texto = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            texto += event.results[i][0].transcript;
        }
        resultadoDiv.textContent = texto;
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

btnDiagnosticar.addEventListener("click", async () => {
    const texto = resultadoDiv.textContent.trim();
    if (!texto) {
        mensajeIA.textContent = "Por favor grabe o ingrese datos antes de diagnosticar.";
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
            parsearResultadoIA(data.resultado);
            mensajeIA.textContent = "Diagnóstico y plan sugerido completados (validar con profesional).";
        } else {
            mensajeIA.textContent = "No se recibió respuesta de IA.";
        }
    } catch (error) {
        console.error(error);
        mensajeIA.textContent = "Error al consultar la IA.";
    }
});

function parsearResultadoIA(respuestaIA) {
    // Busca y llena campos con IA utilizando tags en la respuesta
    const regexCampos = {
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

    for (const campo in regexCampos) {
        const match = respuestaIA.match(regexCampos[campo]);
        if (match && match[1]) {
            campos[campo].value = match[1].trim();
        }
    }
}
