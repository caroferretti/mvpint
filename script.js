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
const btnGuardar = document.getElementById("guardar");
const resultadoDiv = document.getElementById("resultado");
const mensajeIA = document.getElementById("mensajeIA");
const mensajeGuardado = document.getElementById("mensajeGuardado");

let recognition;
let grabando = false;
let textoAcumulado = "";

// Reconocimiento de voz
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

// Diagnóstico con IA
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
            body: JSON.stringify({ texto: texto }) // ✅ CAMBIO: se envía { texto } y NO { prompt }
        });

        const data = await response.json();
        if (data.resultado) {
            parsearRespuestaIA(data.resultado);
            mensajeIA.textContent = "✅ IA completó campos sugeridos (verificar antes de guardar).";
        } else if (data.raw) {
            mensajeIA.textContent = "⚠️ Error de formato en la respuesta de la IA.";
            console.log(data.raw);
        } else {
            mensajeIA.textContent = "⚠️ No se recibió respuesta de la IA.";
        }
    } catch (error) {
        console.error(error);
        mensajeIA.textContent = "❌ Error al consultar la IA.";
    }
});

// Guardar en HC
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

// Procesar frases directas en tiempo real durante grabación
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

// Parsear la respuesta de la IA y llenar campos automáticamente
function parsearRespuestaIA(respuesta) {
    try {
        const camposIA = respuesta;

        if (camposIA["Nombre y Apellido"]) campos.nombreApellido.value = camposIA["Nombre y Apellido"];
        if (camposIA["Fecha de Nacimiento"]) campos.fechaNacimiento.value = camposIA["Fecha de Nacimiento"];
        if (camposIA["Edad"]) campos.edad.value = camposIA["Edad"];
        if (camposIA["Género"]) campos.genero.value = camposIA["Género"];
        if (camposIA["Cobertura"]) campos.cobertura.value = camposIA["Cobertura"];
        if (camposIA["Alergias"]) campos.alergias.value = camposIA["Alergias"];
        if (camposIA["Enfermedades Familiares"]) campos.familiares.value = camposIA["Enfermedades Familiares"];
        if (camposIA["Enfermedades Preexistentes"]) campos.preexistentes.value = camposIA["Enfermedades Preexistentes"];
        if (camposIA["Síntomas"]) campos.sintomas.value = camposIA["Síntomas"];
        if (camposIA["Motivo de Consulta"]) campos.motivoConsulta.value = camposIA["Motivo de Consulta"];
        if (camposIA["Diagnóstico Presuntivo"]) campos.diagnostico.value = camposIA["Diagnóstico Presuntivo"];
        if (camposIA["Plan Terapéutico"]) campos.plan.value = camposIA["Plan Terapéutico"];

    } catch (e) {
        console.error("Error al parsear respuesta IA:", e);
        mensajeIA.textContent = "❌ Error al parsear la respuesta de la IA.";
    }
}
