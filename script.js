`const campos = {
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
const btnGuardar = document.getElementById("guardar");
const resultadoDiv = document.getElementById("resultado");
const mensajeIA = document.getElementById("mensajeIA");
const mensajeGuardado = document.getElementById("mensajeGuardado");

let recognition;
let grabando = false;
let textoAcumulado = "";

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-AR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        let texto = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            texto += event.results[i][0].transcript + " ";
        }
        textoAcumulado += texto.trim() + ". ";
        resultadoDiv.textContent = textoAcumulado.trim();
        procesarTranscripcion(texto.toLowerCase().trim());
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

btnGuardar.addEventListener("click", async () => {
    const fechaConsulta = new Date().toISOString();
    const datos = {
        nombreApellido: campos.nombreApellido.value,
        fechaNacimiento: campos.fechaNacimiento.value,
        edad: campos.edad.value,
        genero: campos.genero.value,
        cobertura: campos.cobertura.value,
        alergias: campos.alergias.value,
        familiares: campos.familiares.value,
        preexistentes: campos.preexistentes.value,
        sintomas: campos.sintomas.value,
        motivoConsulta: campos.motivoConsulta.value,
        diagnostico: campos.diagnostico.value,
        plan: campos.plan.value,
        fechaConsulta: fechaConsulta
    };
    try {
        await fetch("/api/guardarHC", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        mensajeGuardado.textContent = "✅ Historia clínica guardada correctamente.";
    } catch (error) {
        console.error(error);
        mensajeGuardado.textContent = "❌ Error al guardar la historia clínica.";
    }
});

function procesarTranscripcion(frase) {
    const mapeoSintomas = {
        "me duele la panza": "dolor abdominal",
        "me duele mucho la panza": "dolor abdominal",
        "me duele la cabeza": "cefalea",
        "tengo fiebre": "fiebre",
        "me siento mareada": "vértigo",
        "tengo dolor de garganta": "odinofagia"
    };
    if (mapeoSintomas[frase]) {
        campos.sintomas.value = mapeoSintomas[frase];
        return;
    }
    if (frase.startsWith("alérgica a ") || frase.startsWith("alergico a ")) {
        const alergeno = frase.replace("alérgica a ", "").replace("alergico a ", "").trim();
        campos.alergias.value = alergeno;
        return;
    }
    if (frase.startsWith("motivo de consulta ")) {
        const motivo = frase.replace("motivo de consulta ", "").trim();
        campos.motivoConsulta.value = motivo;
        return;
    }
}

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
}`;

// ✅ Con esto tienes el `index.html` y `script.js` listos con:
// - Grabación ilimitada y carga estructurada.
// - Integración con IA para sugerencias.
// - Fecha de consulta automática.
// - Mensaje de confirmación de guardado.
