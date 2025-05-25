// Firebase v9+ modular imports
import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
document.addEventListener("DOMContentLoaded", async function () {
  // Verificar si estamos en la sección de nueva cita
  if (!document.getElementById("citas-section")) {
    // CORREGIDO: ID de la sección principal en citas.html
    console.log(
      "No se encontró 'citas-section', el script de citas no se ejecutará en esta página."
    );
    return;
  }
  console.log("'citas-section' encontrada, inicializando script de citas.");

  // Referencias a elementos del DOM actualizadas según citas.html
  const formCita = document.getElementById("form-cita");
  const listaCitasHistorialDiv = document.getElementById(
    "lista-citas-historial"
  );
  const citaIdInput = document.getElementById("cita-id"); // Hidden input para el ID de la cita en edición
  const pacienteIdCitaInput = document.getElementById("cita-paciente-id"); // Hidden input para el ID del paciente al que pertenece la cita
  const fechaCitaInput = document.getElementById("fecha-cita");

  // Spans y campos ocultos para datos del paciente (cargados al seleccionar paciente)
  const nombreCompletoPacienteDisplaySpan = document.getElementById(
    "nombre-completo-paciente-display"
  );
  const ocupacionPacienteDisplaySpan = document.getElementById(
    "ocupacion-paciente-display"
  );
  const telefonoPacienteDisplaySpan = document.getElementById(
    "telefono-paciente-display"
  );
  const correoPacienteDisplaySpan = document.getElementById(
    "correo-paciente-display"
  );
  const fechaRegistroPacienteDisplaySpan = document.getElementById(
    "fecha-registro-paciente-display"
  );
  const generoPacienteDisplaySpan = document.getElementById(
    "genero-paciente-display"
  );
  const edadPacienteDisplaySpan = document.getElementById(
    "edad-paciente-display"
  );
  const alturaPacienteDisplaySpan = document.getElementById(
    "altura-paciente-display"
  );
  const generoPacienteHiddenInput = document.getElementById(
    "paciente-genero-cita"
  );
  const edadPacienteHiddenInput = document.getElementById("paciente-edad-cita");
  const alturaPacienteHiddenInput = document.getElementById(
    "paciente-altura-cita"
  );

  // Inputs de antropometría de la cita
  const pesoCitaInput = document.getElementById("peso-cita");
  const circCinturaCitaInput = document.getElementById("circ-cintura-cita");
  const circCaderaCitaInput = document.getElementById("circ-cadera-cita");
  const circBrazoCitaInput = document.getElementById("circ-brazo-cita");
  const pliegueBicipitalCitaInput = document.getElementById(
    "pliegue-bicipital-cita"
  );
  const pliegueTricipitalCitaInput = document.getElementById(
    "pliegue-tricipital-cita"
  );
  const pliegueSubescapularCitaInput = document.getElementById(
    "pliegue-subescapular-cita"
  );
  const pliegueSuprailiacoCitaInput = document.getElementById(
    "pliegue-suprailiaco-cita"
  );

  // Campos para cálculos metabólicos y resultados
  const nivelActividadCitaSelect = document.getElementById(
    "nivel-actividad-cita"
  );
  const restriccionCaloricaCitaSelect = document.getElementById(
    "restriccion-calorica-cita"
  );
  const tmbHarrisBenedictCitaSpan = document.getElementById(
    "tmb-harris-benedict-cita"
  ); // Corregido de input a span si es readonly
  const tmbPulgarCitaSpan = document.getElementById("tmb-pulgar-cita"); // Corregido de input a span si es readonly
  const getTotalCitaSpan = document.getElementById("get-total-cita"); // Corregido de input a span si es readonly
  const caloriasFinalesDietaCitaSpan = document.getElementById(
    "calorias-finales-dieta-cita"
  ); // Corregido de input a span si es readonly
  const imcCitaSpan = document.getElementById("imc-cita"); // Corregido de input a span si es readonly
  const imcDiagnosticoCitaSpan = document.getElementById(
    "imc-diagnostico-cita"
  );
  const porcGrasaSiriCitaSpan = document.getElementById("porc-grasa-siri-cita"); // Corregido de input a span si es readonly
  const grasaDiagnosticoCitaSpan = document.getElementById(
    "grasa-diagnostico-cita"
  );
  const diagnosticoGeneralCitaTextarea = document.getElementById(
    "diagnostico-general-cita"
  );

  // Campos para distribución de macronutrientes en %
  const porcCarbsCitaInput = document.getElementById("porc-carbs-cita");
  const porcLipidosCitaInput = document.getElementById("porc-lipidos-cita");
  const porcProteinasCitaInput = document.getElementById("porc-proteinas-cita");
  const sumaMacrosPorcCitaSpan = document.getElementById(
    "suma-macros-porc-cita"
  );

  // Spans para mostrar gramos calculados de macros
  const gramosCarbsCitaSpan = document.getElementById("gramos-carbs-cita");
  const gramosLipidosCitaSpan = document.getElementById("gramos-lipidos-cita");
  const gramosProteinasCitaSpan = document.getElementById(
    "gramos-proteinas-cita"
  );

  // Spans para estimación de pérdida de peso
  const perdidaSemanalCitaSpan = document.getElementById(
    "perdida-semanal-cita"
  );
  const perdida15diasCitaSpan = document.getElementById("perdida-15-dias-cita");
  const perdida30diasCitaSpan = document.getElementById("perdida-30-dias-cita");

  // Nota nutricional
  const notaNutricionalCitaTextarea = document.getElementById(
    "nota-nutricional-cita"
  );

  // Plan de alimentación
  // const tiemposComidaCitaSelect = document.getElementById('tiempos-comida-cita'); // No existe este ID en el HTML proporcionado
  const contenedorPlanesAlimentacionCitaDiv = document.getElementById(
    "contenedor-planes-alimentacion-cita"
  );
  const btnAgregarOtraDietaCita = document.getElementById(
    "btn-agregar-otra-dieta-cita"
  );

  // Botones de acción del formulario
  const btnCancelarEdicionCita = document.getElementById(
    "cancelar-edicion-cita"
  ); // Nombre en HTML es 'cancelar-edicion-cita'
  const btnExportarPdfCita = document.getElementById("btn-exportar-pdf-cita");

  // Select de paciente y display de su nombre en historial
  const seleccionarPacienteCitaSelect = document.getElementById(
    "seleccionar-paciente-cita"
  );
  const nombrePacienteHistorialCitaSpan = document.getElementById(
    "nombre-paciente-historial-cita"
  );

  // Inicializar fecha de la cita con la actual si no tiene valor
  if (fechaCitaInput && !fechaCitaInput.value) {
    fechaCitaInput.valueAsDate = new Date();
  }

  let todosLosPacientes = [];
  let citasDelPacienteActual = [];
  let pacienteSeleccionadoId = localStorage.getItem("selectedPacienteIdCitas"); // Persistir selección entre cargas

  // --- INICIALIZACIÓN Y CARGA DE DATOS ---
  async function popularSelectPacientes() {
    if (!seleccionarPacienteCitaSelect) return;
    seleccionarPacienteCitaSelect.innerHTML =
      '<option value="">Seleccione un paciente...</option>';
    try {
      const pacientesCollectionRef = collection(db, "pacientes");
      const q = query(
        pacientesCollectionRef,
        orderBy("nombre"),
        orderBy("apellido")
      );
      const pacientesSnapshot = await getDocs(q);

      todosLosPacientes = pacientesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      todosLosPacientes.forEach((paciente) => {
        const option = document.createElement("option");
        option.value = paciente.id;
        option.textContent = `${paciente.nombre} ${paciente.apellido}`;
        if (paciente.id === pacienteSeleccionadoId) {
          option.selected = true;
        }
        seleccionarPacienteCitaSelect.appendChild(option);
      });

      if (pacienteSeleccionadoId) {
        await cargarDatosPacienteYCitas(pacienteSeleccionadoId);
        if (formCita) formCita.classList.remove("hidden");
      } else {
        if (formCita) formCita.classList.add("hidden");
        limpiarFormularioCompleto(); // Asegurar que todo esté limpio si no hay paciente
      }
    } catch (error) {
      console.error("Error al popular select de pacientes: ", error);
      seleccionarPacienteCitaSelect.innerHTML =
        '<option value="">Error al cargar pacientes</option>';
      if (formCita) formCita.classList.add("hidden");
    }
  }

  async function cargarDatosPacienteYCitas(pacienteId) {
    if (!pacienteId) {
      limpiarFormularioCompleto();
      if (formCita) formCita.classList.add("hidden");
      return;
    }
    pacienteSeleccionadoId = pacienteId;
    localStorage.setItem("selectedPacienteIdCitas", pacienteId);
    if (pacienteIdCitaInput) pacienteIdCitaInput.value = pacienteId;

    try {
      const pacienteDocRef = doc(db, "pacientes", pacienteId);
      const pacienteDocSnap = await getDoc(pacienteDocRef);

      if (pacienteDocSnap.exists()) {
        const pacienteData = pacienteDocSnap.data();
        if (nombrePacienteHistorialCitaSpan)
          nombrePacienteHistorialCitaSpan.textContent = `${pacienteData.nombre} ${pacienteData.apellido}`;

        // Cargar datos del paciente en spans y campos ocultos
        if (nombreCompletoPacienteDisplaySpan)
          nombreCompletoPacienteDisplaySpan.textContent = `${pacienteData.nombre} ${pacienteData.apellido}`;
        if (ocupacionPacienteDisplaySpan)
          ocupacionPacienteDisplaySpan.textContent =
            pacienteData.ocupacion || "N/A";
        if (telefonoPacienteDisplaySpan)
          telefonoPacienteDisplaySpan.textContent =
            pacienteData.telefono || "N/A";
        if (correoPacienteDisplaySpan)
          correoPacienteDisplaySpan.textContent = pacienteData.correo || "N/A";
        if (fechaRegistroPacienteDisplaySpan)
          fechaRegistroPacienteDisplaySpan.textContent =
            pacienteData.fechaRegistro
              ? new Date(
                  pacienteData.fechaRegistro.seconds * 1000
                ).toLocaleDateString()
              : "N/A";
        if (generoPacienteDisplaySpan)
          generoPacienteDisplaySpan.textContent = pacienteData.genero || "N/A";
        if (edadPacienteDisplaySpan)
          edadPacienteDisplaySpan.textContent = pacienteData.edad
            ? `${pacienteData.edad} años`
            : "N/A";
        if (alturaPacienteDisplaySpan)
          alturaPacienteDisplaySpan.textContent = pacienteData.altura
            ? `${pacienteData.altura} cm`
            : "N/A";

        if (generoPacienteHiddenInput)
          generoPacienteHiddenInput.value = pacienteData.genero || "";
        if (edadPacienteHiddenInput)
          edadPacienteHiddenInput.value = pacienteData.edad || "";
        if (alturaPacienteHiddenInput)
          alturaPacienteHiddenInput.value = pacienteData.altura || "";

        // Cargar historial de citas del paciente (subcolección)
        const citasCollectionRef = collection(
          db,
          "pacientes",
          pacienteId,
          "citas"
        );
        const qCitas = query(citasCollectionRef, orderBy("fecha", "desc"));

        const citasSnapshot = await getDocs(qCitas);
        citasDelPacienteActual = citasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (formCita) formCita.classList.remove("hidden");
        resetearFormularioCita(); // Prepara el form para una nueva cita o carga una existente
        renderCitasHistorial();
        realizarTodosLosCalculos(); // Calcular con los datos del paciente cargados
      } else {
        console.warn("Paciente no encontrado en Firestore:", pacienteId);
        limpiarFormularioCompleto();
        alert(
          "El paciente seleccionado no fue encontrado. Pudo haber sido eliminado."
        );
        if (formCita) formCita.classList.add("hidden");
        return;
      }
    } catch (error) {
      console.error("Error al cargar datos del paciente y citas: ", error);
      alert("Error al cargar la información del paciente o sus citas.");
      limpiarFormularioCompleto();
      if (formCita) formCita.classList.add("hidden");
      return;
    }
  }

  function resetearFormularioCita(mantenerDatosPaciente = true) {
    if (formCita) {
      // Guardar valores de paciente si es necesario
      const pacienteId =
        mantenerDatosPaciente && pacienteIdCitaInput
          ? pacienteIdCitaInput.value
          : "";
      const genero =
        mantenerDatosPaciente && generoPacienteHiddenInput
          ? generoPacienteHiddenInput.value
          : "";
      const edad =
        mantenerDatosPaciente && edadPacienteHiddenInput
          ? edadPacienteHiddenInput.value
          : "";
      const altura =
        mantenerDatosPaciente && alturaPacienteHiddenInput
          ? alturaPacienteHiddenInput.value
          : "";

      formCita.reset(); // Limpia todos los campos del form

      // Restaurar datos del paciente si se indicó
      if (mantenerDatosPaciente) {
        if (pacienteIdCitaInput) pacienteIdCitaInput.value = pacienteId;
        if (generoPacienteHiddenInput) generoPacienteHiddenInput.value = genero;
        if (edadPacienteHiddenInput) edadPacienteHiddenInput.value = edad;
        if (alturaPacienteHiddenInput) alturaPacienteHiddenInput.value = altura;
      }
    }
    if (fechaCitaInput) fechaCitaInput.valueAsDate = new Date(); // Fecha actual por defecto
    if (citaIdInput) citaIdInput.value = ""; // Limpiar ID de cita en edición
    if (btnCancelarEdicionCita) btnCancelarEdicionCita.classList.add("hidden");

    // Valores por defecto para macros si el reset no los pone
    if (porcCarbsCitaInput && !porcCarbsCitaInput.value)
      porcCarbsCitaInput.value = "50";
    if (porcLipidosCitaInput && !porcLipidosCitaInput.value)
      porcLipidosCitaInput.value = "30";
    if (porcProteinasCitaInput && !porcProteinasCitaInput.value)
      porcProteinasCitaInput.value = "20";

    limpiarTextareasPlanAlimentacion(); // Limpiar planes de dieta
    numeroDeDietas = 1; // Resetear contador de dietas
    generarPlanAlimentacionInicial(); // Generar el primer plan
    realizarTodosLosCalculos(); // Recalcular con valores por defecto/paciente
  }

  function limpiarFormularioCompleto() {
    if (nombrePacienteHistorialCitaSpan)
      nombrePacienteHistorialCitaSpan.textContent = "Ninguno seleccionado";
    if (pacienteIdCitaInput) pacienteIdCitaInput.value = "";
    if (nombreCompletoPacienteDisplaySpan)
      nombreCompletoPacienteDisplaySpan.textContent = "N/A";
    if (ocupacionPacienteDisplaySpan)
      ocupacionPacienteDisplaySpan.textContent = "N/A";
    if (telefonoPacienteDisplaySpan)
      telefonoPacienteDisplaySpan.textContent = "N/A";
    if (correoPacienteDisplaySpan)
      correoPacienteDisplaySpan.textContent = "N/A";
    if (fechaRegistroPacienteDisplaySpan)
      fechaRegistroPacienteDisplaySpan.textContent = "N/A";
    if (generoPacienteDisplaySpan)
      generoPacienteDisplaySpan.textContent = "N/A";
    if (edadPacienteDisplaySpan) edadPacienteDisplaySpan.textContent = "N/A";
    if (alturaPacienteDisplaySpan)
      alturaPacienteDisplaySpan.textContent = "N/A";
    if (generoPacienteHiddenInput) generoPacienteHiddenInput.value = "";
    if (edadPacienteHiddenInput) edadPacienteHiddenInput.value = "";
    if (alturaPacienteHiddenInput) alturaPacienteHiddenInput.value = "";

    citasDelPacienteActual = [];
    renderCitasHistorial();
    if (formCita) formCita.reset();
    if (fechaCitaInput) fechaCitaInput.valueAsDate = new Date();
    if (citaIdInput) citaIdInput.value = "";
    if (btnCancelarEdicionCita) btnCancelarEdicionCita.classList.add("hidden");

    limpiarTextareasPlanAlimentacion();
    numeroDeDietas = 1;
    generarPlanAlimentacionInicial();
    limpiarSpansDeCalculo(); // Poner todos los cálculos a 0 o '-'
  }

  function limpiarSpansDeCalculo() {
    const spansCalculados = [
      tmbHarrisBenedictCitaSpan,
      tmbPulgarCitaSpan,
      getTotalCitaSpan,
      caloriasFinalesDietaCitaSpan,
      imcCitaSpan,
      porcGrasaSiriCitaSpan,
      gramosCarbsCitaSpan,
      gramosLipidosCitaSpan,
      gramosProteinasCitaSpan,
      sumaMacrosPorcCitaSpan,
      perdidaSemanalCitaSpan,
      perdida15diasCitaSpan,
      perdida30diasCitaSpan,
    ];
    spansCalculados.forEach((span) => {
      if (span) span.textContent = "0";
    });
    if (imcDiagnosticoCitaSpan) imcDiagnosticoCitaSpan.textContent = "-";
    if (grasaDiagnosticoCitaSpan) grasaDiagnosticoCitaSpan.textContent = "-";
    if (sumaMacrosPorcCitaSpan) sumaMacrosPorcCitaSpan.style.color = "inherit";
  }

  if (seleccionarPacienteCitaSelect) {
    seleccionarPacienteCitaSelect.addEventListener("change", async function () {
      const nuevoPacienteId = this.value;
      await cargarDatosPacienteYCitas(nuevoPacienteId);
    });
  }

  // --- RENDER HISTORIAL DE CITAS ---
  function renderCitasHistorial() {
    if (!listaCitasHistorialDiv) return;
    listaCitasHistorialDiv.innerHTML = "";
    if (!pacienteSeleccionadoId) {
      listaCitasHistorialDiv.innerHTML =
        "<p>Seleccione un paciente para ver su historial de citas.</p>";
      return;
    }
    if (citasDelPacienteActual.length === 0) {
      listaCitasHistorialDiv.innerHTML =
        "<p>Este paciente no tiene citas registradas.</p>";
      return;
    }

    // Ya vienen ordenadas por fecha desc desde Firestore
    citasDelPacienteActual.forEach((cita) => {
      const citaDiv = document.createElement("div");
      citaDiv.classList.add("cita-item-historial");
      const fechaCitaFormateada = cita.fecha
        ? new Date(cita.fecha + "T00:00:00").toLocaleDateString()
        : "Fecha N/A"; // Asegurar que se interprete como local
      citaDiv.innerHTML = `
                <h6>Cita del ${fechaCitaFormateada}</h6>
                <p><strong>Peso:</strong> ${cita.peso || "N/A"} kg</p>
                <p><strong>Cal. Dieta:</strong> ${
                  cita.caloriasDietaFinal || "N/A"
                } kcal</p>
                <div class="acciones-historial">
                    <button class="btn btn-sm btn-info btn-editar-cita-historial" data-id="${
                      cita.id
                    }">Editar</button>
                    <button class="btn btn-sm btn-danger btn-eliminar-cita-historial" data-id="${
                      cita.id
                    }">Eliminar</button>
                </div>
            `;
      listaCitasHistorialDiv.appendChild(citaDiv);
    });

    // Añadir event listeners a los botones del historial
    listaCitasHistorialDiv
      .querySelectorAll(".btn-editar-cita-historial")
      .forEach((btn) => {
        btn.addEventListener("click", () => editarCita(btn.dataset.id));
      });
    listaCitasHistorialDiv
      .querySelectorAll(".btn-eliminar-cita-historial")
      .forEach((btn) => {
        btn.addEventListener("click", () =>
          eliminarCitaDesdeHistorial(btn.dataset.id)
        );
      });
  }

  // --- CÁLCULOS AUTOMÁTICOS ---
  function realizarTodosLosCalculos() {
    if (
      !generoPacienteHiddenInput ||
      !edadPacienteHiddenInput ||
      !alturaPacienteHiddenInput ||
      !pesoCitaInput
    ) {
      limpiarSpansDeCalculo();
      return;
    }

    const peso = parseFloat(pesoCitaInput.value) || 0;
    const alturaCm = parseFloat(alturaPacienteHiddenInput.value) || 0;
    const edad = parseInt(edadPacienteHiddenInput.value) || 0;
    const genero = generoPacienteHiddenInput.value
      ? generoPacienteHiddenInput.value.toLowerCase()
      : "";

    // 1. TMB (Metabolismo Basal)
    let tmbHarris = 0;
    if (peso > 0 && alturaCm > 0 && edad > 0 && genero) {
      if (genero === "masculino") {
        tmbHarris = 88.362 + 13.397 * peso + 4.799 * alturaCm - 5.677 * edad;
      } else if (genero === "femenino") {
        tmbHarris = 447.593 + 9.247 * peso + 3.098 * alturaCm - 4.33 * edad;
      }
    }
    if (tmbHarrisBenedictCitaSpan)
      tmbHarrisBenedictCitaSpan.textContent =
        tmbHarris > 0 ? tmbHarris.toFixed(0) : "0";

    const tmbPulgar = peso > 0 ? peso * 25 : 0;
    if (tmbPulgarCitaSpan) tmbPulgarCitaSpan.textContent = tmbPulgar.toFixed(0);

    const tmbBase = tmbHarris > 0 ? tmbHarris : tmbPulgar > 0 ? tmbPulgar : 0;

    // 2. GET (Gasto Energético Total)
    const factorActividadValor = {
      sedentario: 1.2,
      ligero: 1.375,
      activo: 1.55, // 'activo' en HTML es 1.55
      "muy-activo": 1.725, // 'muy-activo' en HTML es 1.725
    };
    const nivelActividadKey = nivelActividadCitaSelect
      ? nivelActividadCitaSelect.value
      : "sedentario";
    const factorActividad = factorActividadValor[nivelActividadKey] || 1.2;
    const get = tmbBase * factorActividad;
    if (getTotalCitaSpan)
      getTotalCitaSpan.textContent = get > 0 ? get.toFixed(0) : "0";

    // 3. Calorías Finales con Restricción
    const restriccion = restriccionCaloricaCitaSelect
      ? parseInt(restriccionCaloricaCitaSelect.value) || 0
      : 0;
    const caloriasFinales = get - restriccion;
    if (caloriasFinalesDietaCitaSpan)
      caloriasFinalesDietaCitaSpan.textContent =
        caloriasFinales > 0 ? caloriasFinales.toFixed(0) : "0";

    // 4. Distribución de Macronutrientes (Gramos)
    let porcCarbs = porcCarbsCitaInput
      ? parseFloat(porcCarbsCitaInput.value) || 0
      : 0;
    let porcLipidos = porcLipidosCitaInput
      ? parseFloat(porcLipidosCitaInput.value) || 0
      : 0;
    let porcProteinas = porcProteinasCitaInput
      ? parseFloat(porcProteinasCitaInput.value) || 0
      : 0;

    const sumaMacros = porcCarbs + porcLipidos + porcProteinas;
    if (sumaMacrosPorcCitaSpan) {
      sumaMacrosPorcCitaSpan.textContent = sumaMacros.toFixed(1);
      sumaMacrosPorcCitaSpan.style.color =
        Math.abs(sumaMacros - 100) > 0.1 ? "red" : "green";
    }

    const caloriasParaMacros = caloriasFinales > 0 ? caloriasFinales : 0;
    const gramosCarbs = (caloriasParaMacros * (porcCarbs / 100)) / 4;
    const gramosLipidosCalc = (caloriasParaMacros * (porcLipidos / 100)) / 9;
    const gramosProteinasCalc =
      (caloriasParaMacros * (porcProteinas / 100)) / 4;

    if (gramosCarbsCitaSpan)
      gramosCarbsCitaSpan.textContent =
        gramosCarbs > 0 ? gramosCarbs.toFixed(1) : "0.0";
    if (gramosLipidosCitaSpan)
      gramosLipidosCitaSpan.textContent =
        gramosLipidosCalc > 0 ? gramosLipidosCalc.toFixed(1) : "0.0";
    if (gramosProteinasCitaSpan)
      gramosProteinasCitaSpan.textContent =
        gramosProteinasCalc > 0 ? gramosProteinasCalc.toFixed(1) : "0.0";

    // 5. % Grasa Corporal (Siri, usando Durnin & Womersley para Densidad)
    const pliegueBicipital = pliegueBicipitalCitaInput
      ? parseFloat(pliegueBicipitalCitaInput.value) || 0
      : 0;
    const pliegueTricipital = pliegueTricipitalCitaInput
      ? parseFloat(pliegueTricipitalCitaInput.value) || 0
      : 0; // Asegúrate que esta línea use pliegueTricipitalCitaInput
    const pliegueSubescapular = pliegueSubescapularCitaInput
      ? parseFloat(pliegueSubescapularCitaInput.value) || 0
      : 0;
    const pliegueSuprailiaco = pliegueSuprailiacoCitaInput
      ? parseFloat(pliegueSuprailiacoInput.value) || 0
      : 0;
    const suma4Pliegues =
      pliegueBicipital +
      pliegueTricipital +
      pliegueSubescapular +
      pliegueSuprailiaco;

    let densidadCorporal = 0;
    let porcGrasa = 0;
    if (suma4Pliegues > 0 && edad > 0 && genero) {
      const logS4P = Math.log10(suma4Pliegues);
      if (genero === "masculino") {
        if (edad >= 17 && edad <= 19) densidadCorporal = 1.162 - 0.063 * logS4P;
        else if (edad >= 20 && edad <= 29)
          densidadCorporal = 1.1631 - 0.0632 * logS4P;
        else if (edad >= 30 && edad <= 39)
          densidadCorporal = 1.1422 - 0.0544 * logS4P;
        else if (edad >= 40 && edad <= 49)
          densidadCorporal =
            1.162 -
            0.07 *
              logS4P; // Esta constante parece un error en la fórmula original de D&W, debería ser más baja. Usando una aproximación o la de 30-39.
        else if (edad >= 50) densidadCorporal = 1.1715 - 0.0779 * logS4P;
        else densidadCorporal = 1.1631 - 0.0632 * logS4P; // Default para edades fuera de rango
      } else if (genero === "femenino") {
        if (edad >= 17 && edad <= 19)
          densidadCorporal = 1.1549 - 0.0678 * logS4P;
        else if (edad >= 20 && edad <= 29)
          densidadCorporal = 1.1599 - 0.0717 * logS4P;
        else if (edad >= 30 && edad <= 39)
          densidadCorporal = 1.1423 - 0.0632 * logS4P;
        else if (edad >= 40 && edad <= 49)
          densidadCorporal = 1.1333 - 0.0612 * logS4P;
        else if (edad >= 50) densidadCorporal = 1.1339 - 0.0645 * logS4P;
        else densidadCorporal = 1.1599 - 0.0717 * logS4P; // Default
      }
      if (densidadCorporal > 0) {
        porcGrasa = 495 / densidadCorporal - 450;
      }
    }
    if (porcGrasaSiriCitaSpan)
      porcGrasaSiriCitaSpan.textContent =
        porcGrasa > 0 ? porcGrasa.toFixed(1) : "0.0";

    let diagGrasa = "-";
    // Diagnóstico % Grasa (ej. OMS o SEEDO)
    if (porcGrasa > 0 && genero) {
      if (genero === "masculino") {
        if (edad >= 20 && edad <= 39) {
          if (porcGrasa < 8) diagGrasa = "Bajo";
          else if (porcGrasa <= 19) diagGrasa = "Saludable";
          else if (porcGrasa < 25) diagGrasa = "Sobrepeso";
          else diagGrasa = "Obesidad";
        } else if (edad >= 40 && edad <= 59) {
          if (porcGrasa < 11) diagGrasa = "Bajo";
          else if (porcGrasa <= 21) diagGrasa = "Saludable";
          else if (porcGrasa < 28) diagGrasa = "Sobrepeso";
          else diagGrasa = "Obesidad";
        } else if (edad >= 60) {
          if (porcGrasa < 13) diagGrasa = "Bajo";
          else if (porcGrasa <= 24) diagGrasa = "Saludable";
          else if (porcGrasa < 30) diagGrasa = "Sobrepeso";
          else diagGrasa = "Obesidad";
        }
      } else if (genero === "femenino") {
        if (edad >= 20 && edad <= 39) {
          if (porcGrasa < 21) diagGrasa = "Bajo";
          else if (porcGrasa <= 32) diagGrasa = "Saludable";
          else if (porcGrasa < 39) diagGrasa = "Sobrepeso";
          else diagGrasa = "Obesidad";
        } else if (edad >= 40 && edad <= 59) {
          if (porcGrasa < 23) diagGrasa = "Bajo";
          else if (porcGrasa <= 33) diagGrasa = "Saludable";
          else if (porcGrasa < 40) diagGrasa = "Sobrepeso";
          else diagGrasa = "Obesidad";
        } else if (edad >= 60) {
          if (porcGrasa < 24) diagGrasa = "Bajo";
          else if (porcGrasa <= 35) diagGrasa = "Saludable";
          else if (porcGrasa < 42) diagGrasa = "Sobrepeso";
          else diagGrasa = "Obesidad";
        }
      }
    }
    if (grasaDiagnosticoCitaSpan)
      grasaDiagnosticoCitaSpan.textContent = diagGrasa;

    // 6. IMC (Índice de Masa Corporal)
    const alturaM = alturaCm / 100;
    let imc = 0;
    if (peso > 0 && alturaM > 0) {
      imc = peso / (alturaM * alturaM);
    }
    if (imcCitaSpan) imcCitaSpan.textContent = imc > 0 ? imc.toFixed(1) : "0.0";

    let diagIMC = "-";
    if (imc > 0) {
      if (imc < 18.5) diagIMC = "Bajo peso";
      else if (imc < 25) diagIMC = "Normal"; // Ajustado a < 25 para normal
      else if (imc < 30) diagIMC = "Sobrepeso";
      else diagIMC = "Obesidad";
    }
    if (imcDiagnosticoCitaSpan) imcDiagnosticoCitaSpan.textContent = diagIMC;

    // 7. Estimación Pérdida de Peso
    const kcalRestringidasDia = restriccion > 0 ? restriccion : 0;
    const kgPerdidaSemanal =
      kcalRestringidasDia > 0 ? (kcalRestringidasDia * 7) / 7700 : 0;

    if (perdidaSemanalCitaSpan)
      perdidaSemanalCitaSpan.textContent = kgPerdidaSemanal.toFixed(2);
    if (perdida15diasCitaSpan)
      perdida15diasCitaSpan.textContent = (kgPerdidaSemanal * (15 / 7)).toFixed(
        2
      );
    if (perdida30diasCitaSpan)
      perdida30diasCitaSpan.textContent = (kgPerdidaSemanal * (30 / 7)).toFixed(
        2
      );
  }

  // Event listeners para recalcular cuando cambien los inputs relevantes
  const inputsParaRecalculo = [
    pesoCitaInput,
    nivelActividadCitaSelect,
    restriccionCaloricaCitaSelect,
    pliegueBicipitalCitaInput,
    pliegueTricipitalCitaInput,
    pliegueSubescapularCitaInput,
    pliegueSuprailiacoCitaInput,
    porcCarbsCitaInput,
    porcLipidosCitaInput,
    porcProteinasCitaInput,
  ];
  inputsParaRecalculo.forEach((input) => {
    if (input) {
      const eventType =
        input.tagName === "SELECT" || input.type === "number"
          ? "change"
          : "input";
      input.addEventListener(eventType, realizarTodosLosCalculos);
      if (input.type === "number")
        input.addEventListener("input", realizarTodosLosCalculos); // Para que recalcule mientras se escribe
    }
  });

  // --- MANEJO DE CITAS (CRUD) ---
  async function eliminarCitaDesdeHistorial(idCita) {
    if (!idCita || !pacienteSeleccionadoId) {
      alert("ID de cita o paciente no válido para eliminar.");
      return;
    }

    const citaAEliminar = citasDelPacienteActual.find((c) => c.id === idCita);
    if (!citaAEliminar) {
      alert("Cita no encontrada para eliminar.");
      return;
    }
    const fechaCitaEliminar = citaAEliminar.fecha
      ? new Date(citaAEliminar.fecha + "T00:00:00").toLocaleDateString()
      : "desconocida";

    if (
      confirm(
        `¿Está seguro de que desea eliminar la cita del ${fechaCitaEliminar}? Esta acción no se puede deshacer.`
      )
    ) {
      try {
        const citaDocRef = doc(
          db,
          "pacientes",
          pacienteSeleccionadoId,
          "citas",
          idCita
        );
        await deleteDoc(citaDocRef);
        alert("Cita eliminada con éxito.");

        // Si la cita eliminada era la que se estaba editando, limpiar el formulario
        if (citaIdInput && citaIdInput.value === idCita) {
          resetearFormularioCita(true); // Mantener datos del paciente actual
        }
        await cargarDatosPacienteYCitas(pacienteSeleccionadoId); // Recargar y renderizar historial
      } catch (error) {
        console.error("Error al eliminar cita: ", error);
        alert(
          "Error al eliminar la cita. Verifique la consola para más detalles."
        );
      }
    }
  }
  window.eliminarCitaDesdeHistorial = eliminarCitaDesdeHistorial; // Hacerla accesible globalmente para los botones

  let numeroDeDietas = 1; // Contador para los IDs de los planes de dieta

  function generarPlanAlimentacionHTML(indice) {
    return `
            <div class="plan-alimentacion-individual mb-3 p-3 border rounded" id="plan-dieta-${indice}">
                <h5>Dieta ${indice} <button type="button" class="btn btn-sm btn-danger btn-eliminar-dieta float-end" data-indice="${indice}">X</button></h5>
                <div class="form-group">
                    <label for="nombre-dieta-${indice}">Nombre de la Dieta (Ej: Lunes, Día bajo en carbs):</label>
                    <input type="text" id="nombre-dieta-${indice}" name="nombre-dieta-${indice}" class="form-control form-control-sm">
                </div>
                <div class="form-group">
                    <label for="descripcion-dieta-${indice}">Descripción / Indicaciones Generales:</label>
                    <textarea id="descripcion-dieta-${indice}" name="descripcion-dieta-${indice}" class="form-control form-control-sm" rows="2"></textarea>
                </div>
                <h6>Tiempos de Comida:</h6>
                <div id="tiempos-comida-dieta-${indice}">
                    <!-- Tiempos de comida se agregarán aquí -->
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary btn-agregar-tiempo-comida" data-dietaindice="${indice}">Agregar Tiempo de Comida</button>
            </div>
        `;
  }

  function agregarTiempoComidaHTML(dietaIndice, tiempoIndice) {
    const nombresTiemposDefault = [
      "Desayuno",
      "Colación Matutina",
      "Comida",
      "Colación Vespertina",
      "Cena",
      "Colación Nocturna",
    ];
    const nombreSugerido =
      nombresTiemposDefault[tiempoIndice - 1] || `Tiempo ${tiempoIndice}`;
    return `
            <div class="tiempo-comida-individual mb-2 p-2 border-start" id="dieta-${dietaIndice}-tiempo-${tiempoIndice}">
                <div class="form-group mb-1">
                    <label for="nombre-tiempo-${dietaIndice}-${tiempoIndice}" class="form-label-sm">Nombre Tiempo ${tiempoIndice}:</label>
                    <input type="text" id="nombre-tiempo-${dietaIndice}-${tiempoIndice}" name="nombre-tiempo-${dietaIndice}-${tiempoIndice}" class="form-control form-control-sm" value="${nombreSugerido}">
                </div>
                <div class="form-group mb-0">
                    <label for="detalle-tiempo-${dietaIndice}-${tiempoIndice}" class="form-label-sm">Detalle:</label>
                    <textarea id="detalle-tiempo-${dietaIndice}-${tiempoIndice}" name="detalle-tiempo-${dietaIndice}-${tiempoIndice}" class="form-control form-control-sm" rows="2"></textarea>
                </div>
                 <button type="button" class="btn btn-xs btn-outline-danger btn-eliminar-tiempo-comida float-end" data-dietaindice="${dietaIndice}" data-tiempoindice="${tiempoIndice}">x</button>
            </div>
        `;
  }

  function agregarNuevoTiempoComida(dietaIndice) {
    const contenedorTiempos = document.getElementById(
      `tiempos-comida-dieta-${dietaIndice}`
    );
    if (!contenedorTiempos) return;
    const tiempoIndice = contenedorTiempos.children.length + 1;
    const nuevoTiempoHTML = agregarTiempoComidaHTML(dietaIndice, tiempoIndice);
    contenedorTiempos.insertAdjacentHTML("beforeend", nuevoTiempoHTML);
    // Attach listener to new delete button for time slot
    const nuevoBotonEliminar = contenedorTiempos.querySelector(
      `#dieta-${dietaIndice}-tiempo-${tiempoIndice} .btn-eliminar-tiempo-comida`
    );
    if (nuevoBotonEliminar) {
      nuevoBotonEliminar.addEventListener("click", function () {
        document
          .getElementById(
            `dieta-${dietaIndice}-tiempo-${this.dataset.tiempoindice}`
          )
          .remove();
        // Re-indexar si es necesario o simplemente permitir huecos (más simple)
      });
    }
  }

  function generarPlanAlimentacionInicial() {
    if (!contenedorPlanesAlimentacionCitaDiv) return;
    contenedorPlanesAlimentacionCitaDiv.innerHTML =
      generarPlanAlimentacionHTML(1);
    agregarNuevoTiempoComida(1); // Agregar un tiempo de comida por defecto al primer plan
    agregarNuevoTiempoComida(1);
    agregarNuevoTiempoComida(1);
    attachEventListenersPlanAlimentacion(1);
  }

  function limpiarTextareasPlanAlimentacion() {
    if (contenedorPlanesAlimentacionCitaDiv) {
      contenedorPlanesAlimentacionCitaDiv.innerHTML = "";
    }
    numeroDeDietas = 0; // Se reinicia y se creará la primera con generarPlanAlimentacionInicial
  }

  function attachEventListenersPlanAlimentacion(indiceDieta) {
    const btnAgregarTiempo = document.querySelector(
      `#plan-dieta-${indiceDieta} .btn-agregar-tiempo-comida`
    );
    if (btnAgregarTiempo) {
      btnAgregarTiempo.addEventListener("click", function () {
        agregarNuevoTiempoComida(this.dataset.dietaindice);
      });
    }
    const btnEliminarDieta = document.querySelector(
      `#plan-dieta-${indiceDieta} .btn-eliminar-dieta`
    );
    if (btnEliminarDieta) {
      btnEliminarDieta.addEventListener("click", function () {
        document.getElementById(`plan-dieta-${this.dataset.indice}`).remove();
        // Si se elimina la única dieta, se podría generar una nueva vacía o dejarlo así.
        if (contenedorPlanesAlimentacionCitaDiv.children.length === 0) {
          numeroDeDietas = 0; // Resetear contador para que el próximo sea 1
          // Opcional: agregar uno nuevo automáticamente
          // if (btnAgregarOtraDietaCita) btnAgregarOtraDietaCita.click();
        }
      });
    }
    // Listeners para los botones de eliminar tiempos de comida individuales (si ya existen al cargar)
    document
      .querySelectorAll(
        `#plan-dieta-${indiceDieta} .btn-eliminar-tiempo-comida`
      )
      .forEach((btn) => {
        btn.addEventListener("click", function () {
          document
            .getElementById(
              `dieta-${this.dataset.dietaindice}-tiempo-${this.dataset.tiempoindice}`
            )
            .remove();
        });
      });
  }

  if (btnAgregarOtraDietaCita) {
    btnAgregarOtraDietaCita.addEventListener("click", () => {
      numeroDeDietas++;
      const nuevoPlanHTML = generarPlanAlimentacionHTML(numeroDeDietas);
      if (contenedorPlanesAlimentacionCitaDiv) {
        contenedorPlanesAlimentacionCitaDiv.insertAdjacentHTML(
          "beforeend",
          nuevoPlanHTML
        );
        agregarNuevoTiempoComida(numeroDeDietas); // Agregar un tiempo por defecto
        attachEventListenersPlanAlimentacion(numeroDeDietas);
      }
    });
  }

  // --- SUBMIT DEL FORMULARIO DE CITA ---
  if (formCita) {
    formCita.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!pacienteSeleccionadoId) {
        alert("Por favor, seleccione un paciente primero.");
        return;
      }
      if (!fechaCitaInput || !fechaCitaInput.value) {
        alert("La fecha de la cita es obligatoria.");
        fechaCitaInput.focus();
        return;
      }
      const sumaMacrosActual = sumaMacrosPorcCitaSpan
        ? parseFloat(sumaMacrosPorcCitaSpan.textContent)
        : 100;
      if (Math.abs(sumaMacrosActual - 100) > 0.5) {
        alert(
          "La suma de los porcentajes de macronutrientes debe ser aproximadamente 100%. Actualmente es: " +
            sumaMacrosActual.toFixed(1) +
            "%"
        );
        if (porcCarbsCitaInput) porcCarbsCitaInput.focus();
        return;
      }

      const idCitaActual = citaIdInput ? citaIdInput.value : null;

      // Recolectar datos de los planes de alimentación
      const planesAlimentacion = [];
      document
        .querySelectorAll(".plan-alimentacion-individual")
        .forEach((planDiv) => {
          const dietaIndice = planDiv.id.split("-")[2];
          const nombreDietaInput = document.getElementById(
            `nombre-dieta-${dietaIndice}`
          );
          const descripcionDietaInput = document.getElementById(
            `descripcion-dieta-${dietaIndice}`
          );

          const tiemposComida = [];
          planDiv
            .querySelectorAll(".tiempo-comida-individual")
            .forEach((tiempoDiv) => {
              const tiempoFullId = tiempoDiv.id.split("-"); // ej: [dieta, 1, tiempo, 1]
              const tDietaIdx = tiempoFullId[1];
              const tTiempoIdx = tiempoFullId[3];
              const nombreTiempoInput = document.getElementById(
                `nombre-tiempo-${tDietaIdx}-${tTiempoIdx}`
              );
              const detalleTiempoInput = document.getElementById(
                `detalle-tiempo-${tDietaIdx}-${tTiempoIdx}`
              );
              if (nombreTiempoInput && detalleTiempoInput) {
                tiemposComida.push({
                  nombre: nombreTiempoInput.value || `Tiempo ${tTiempoIdx}`,
                  detalle: detalleTiempoInput.value || "",
                });
              }
            });

          planesAlimentacion.push({
            nombre: nombreDietaInput
              ? nombreDietaInput.value
              : `Dieta ${dietaIndice}`,
            descripcion: descripcionDietaInput
              ? descripcionDietaInput.value
              : "",
            tiempos: tiemposComida,
          });
        });

      const citaData = {
        // pacienteId: pacienteSeleccionadoId, // Ya no es necesario si es subcolección
        fecha: fechaCitaInput.value,
        generoRegistrado: generoPacienteHiddenInput
          ? generoPacienteHiddenInput.value
          : null,
        edadRegistrada: edadPacienteHiddenInput
          ? parseInt(edadPacienteHiddenInput.value) || null
          : null,
        alturaRegistradaCm: alturaPacienteHiddenInput
          ? parseFloat(alturaPacienteHiddenInput.value) || null
          : null,

        peso: pesoCitaInput ? parseFloat(pesoCitaInput.value) || null : null,
        medidas: {
          cintura: circCinturaCitaInput
            ? parseFloat(circCinturaCitaInput.value) || null
            : null,
          cadera: circCaderaCitaInput
            ? parseFloat(circCaderaCitaInput.value) || null
            : null,
          brazo: circBrazoCitaInput
            ? parseFloat(circBrazoCitaInput.value) || null
            : null,
        },
        pliegues: {
          bicipital: pliegueBicipitalCitaInput
            ? parseFloat(pliegueBicipitalCitaInput.value) || null
            : null,
          tricipital: pliegueTricipitalCitaInput
            ? parseFloat(pliegueTricipitalCitaInput.value) || null
            : null,
          subescapular: pliegueSubescapularCitaInput
            ? parseFloat(pliegueSubescapularCitaInput.value) || null
            : null,
          suprailiaco: pliegueSuprailiacoCitaInput
            ? parseFloat(pliegueSuprailiacoCitaInput.value) || null
            : null,
          suma4Pliegues:
            ((pliegueBicipitalCitaInput
              ? parseFloat(pliegueBicipitalCitaInput.value)
              : 0) || 0) +
            ((pliegueTricipitalCitaInput
              ? parseFloat(pliegueTricipitalCitaInput.value)
              : 0) || 0) +
            ((pliegueSubescapularCitaInput
              ? parseFloat(pliegueSubescapularCitaInput.value)
              : 0) || 0) +
            ((pliegueSuprailiacoCitaInput
              ? parseFloat(pliegueSuprailiacoInput.value)
              : 0) || 0),
        },
        nivelActividad: nivelActividadCitaSelect
          ? nivelActividadCitaSelect.value
          : null,
        tmbEstimado: {
          harrisBenedict: tmbHarrisBenedictCitaSpan
            ? parseFloat(tmbHarrisBenedictCitaSpan.textContent) || 0
            : 0,
          formulaPulgar: tmbPulgarCitaSpan
            ? parseFloat(tmbPulgarCitaSpan.textContent) || 0
            : 0,
        },
        gastoEnergeticoTotal: getTotalCitaSpan
          ? parseFloat(getTotalCitaSpan.textContent) || 0
          : 0,
        restriccionCaloricaAplicada: restriccionCaloricaCitaSelect
          ? parseInt(restriccionCaloricaCitaSelect.value) || 0
          : 0,
        caloriasDietaFinal: caloriasFinalesDietaCitaSpan
          ? parseFloat(caloriasFinalesDietaCitaSpan.textContent) || 0
          : 0,
        imc: {
          valor: imcCitaSpan ? parseFloat(imcCitaSpan.textContent) || 0 : 0,
          diagnostico: imcDiagnosticoCitaSpan
            ? imcDiagnosticoCitaSpan.textContent
            : null,
        },
        porcentajeGrasaCorporal: {
          valor: porcGrasaSiriCitaSpan
            ? parseFloat(porcGrasaSiriCitaSpan.textContent) || 0
            : 0,
          diagnostico: grasaDiagnosticoCitaSpan
            ? grasaDiagnosticoCitaSpan.textContent
            : null,
        },
        diagnosticoGeneral: diagnosticoGeneralCitaTextarea
          ? diagnosticoGeneralCitaTextarea.value
          : "",
        distribucionMacrosPorcentaje: {
          carbohidratos: porcCarbsCitaInput
            ? parseFloat(porcCarbsCitaInput.value) || 0
            : 0,
          lipidos: porcLipidosCitaInput
            ? parseFloat(porcLipidosCitaInput.value) || 0
            : 0,
          proteinas: porcProteinasCitaInput
            ? parseFloat(porcProteinasCitaInput.value) || 0
            : 0,
        },
        distribucionMacrosGramos: {
          carbohidratos: gramosCarbsCitaSpan
            ? parseFloat(gramosCarbsCitaSpan.textContent) || 0
            : 0,
          lipidos: gramosLipidosCitaSpan
            ? parseFloat(gramosLipidosCitaSpan.textContent) || 0
            : 0,
          proteinas: gramosProteinasCitaSpan
            ? parseFloat(gramosProteinasCitaSpan.textContent) || 0
            : 0,
        },
        estimacionPerdidaPeso: {
          semanalKg: perdidaSemanalCitaSpan
            ? parseFloat(perdidaSemanalCitaSpan.textContent) || 0
            : 0,
          dias15Kg: perdida15diasCitaSpan
            ? parseFloat(perdida15diasCitaSpan.textContent) || 0
            : 0,
          dias30Kg: perdida30diasCitaSpan
            ? parseFloat(perdida30diasCitaSpan.textContent) || 0
            : 0,
        },
        notaNutricional: notaNutricionalCitaTextarea
          ? notaNutricionalCitaTextarea.value
          : "",
        planesAlimentacion: planesAlimentacion, // Array de planes
        ultimaModificacion: serverTimestamp(),
      };

      try {
        const citasCollectionPacienteRef = collection(
          db,
          "pacientes",
          pacienteSeleccionadoId,
          "citas"
        );

        if (idCitaActual) {
          // Editando
          const citaDocRef = doc(citasCollectionPacienteRef, idCitaActual);
          await updateDoc(citaDocRef, citaData);
          alert("Cita actualizada con éxito.");
        } else {
          // Creando
          const docRef = await addDoc(citasCollectionPacienteRef, citaData);
          alert("Cita guardada con éxito con ID: " + docRef.id);
        }
        await cargarDatosPacienteYCitas(pacienteSeleccionadoId); // Recargar y renderizar, esto también resetea el form para nueva cita
        // resetearFormularioCita(true); // No es necesario si cargarDatosPacienteYCitas lo hace
      } catch (error) {
        console.error("Error al guardar cita: ", error);
        alert("Error al guardar la cita. Verifique la consola.");
      }
    });
  }

  // --- EDICIÓN DE CITA ---
  async function editarCita(idCita) {
    const citaAEditar = citasDelPacienteActual.find((c) => c.id === idCita);
    if (citaAEditar && formCita) {
      resetearFormularioCita(false); // Limpiar formulario completamente antes de cargar datos de la cita a editar

      if (citaIdInput) citaIdInput.value = citaAEditar.id;
      if (pacienteIdCitaInput)
        pacienteIdCitaInput.value = pacienteSeleccionadoId; // ID del paciente actual
      if (fechaCitaInput) fechaCitaInput.value = citaAEditar.fecha;

      // Cargar datos del paciente como estaban EN ESA CITA
      if (generoPacienteHiddenInput)
        generoPacienteHiddenInput.value = citaAEditar.generoRegistrado || "";
      if (edadPacienteHiddenInput)
        edadPacienteHiddenInput.value = citaAEditar.edadRegistrada || "";
      if (alturaPacienteHiddenInput)
        alturaPacienteHiddenInput.value = citaAEditar.alturaRegistradaCm || "";

      if (nombreCompletoPacienteDisplaySpan)
        nombreCompletoPacienteDisplaySpan.textContent = `${citaAEditar.nombreRegistrado} ${citaAEditar.apellidoRegistrado}`;
      if (ocupacionPacienteDisplaySpan)
        ocupacionPacienteDisplaySpan.textContent =
          citaAEditar.ocupacion || "N/A";
      if (telefonoPacienteDisplaySpan)
        telefonoPacienteDisplaySpan.textContent = citaAEditar.telefono || "N/A";
      if (correoPacienteDisplaySpan)
        correoPacienteDisplaySpan.textContent = citaAEditar.correo || "N/A";
      if (fechaRegistroPacienteDisplaySpan)
        fechaRegistroPacienteDisplaySpan.textContent = citaAEditar.fechaRegistro
          ? new Date(
              citaAEditar.fechaRegistro.seconds * 1000
            ).toLocaleDateString()
          : "N/A";
      if (generoPacienteDisplaySpan)
        generoPacienteDisplaySpan.textContent =
          citaAEditar.generoRegistrado || "N/A";
      if (edadPacienteDisplaySpan)
        edadPacienteDisplaySpan.textContent = citaAEditar.edadRegistrada
          ? `${citaAEditar.edadRegistrada} años`
          : "N/A";
      if (alturaPacienteDisplaySpan)
        alturaPacienteDisplaySpan.textContent = citaAEditar.alturaRegistradaCm
          ? `${citaAEditar.alturaRegistradaCm} cm`
          : "N/A";

      // Cargar datos de la cita
      if (pesoCitaInput) pesoCitaInput.value = citaAEditar.peso || "";
      if (citaAEditar.medidas) {
        if (circCinturaCitaInput)
          circCinturaCitaInput.value = citaAEditar.medidas.cintura || "";
        if (circCaderaCitaInput)
          circCaderaCitaInput.value = citaAEditar.medidas.cadera || "";
        if (circBrazoCitaInput)
          circBrazoCitaInput.value = citaAEditar.medidas.brazo || "";
      }
      if (citaAEditar.pliegues) {
        if (pliegueBicipitalCitaInput)
          pliegueBicipitalCitaInput.value =
            citaAEditar.pliegues.bicipital || "";
        if (pliegueTricipitalCitaInput)
          pliegueTricipitalCitaInput.value =
            citaAEditar.pliegues.tricipital || "";
        if (pliegueSubescapularCitaInput)
          pliegueSubescapularCitaInput.value =
            citaAEditar.pliegues.subescapular || "";
        if (pliegueSuprailiacoCitaInput)
          pliegueSuprailiacoCitaInput.value =
            citaAEditar.pliegues.suprailiaco || "";
      }

      if (nivelActividadCitaSelect)
        nivelActividadCitaSelect.value =
          citaAEditar.nivelActividad || "sedentario";
      if (restriccionCaloricaCitaSelect)
        restriccionCaloricaCitaSelect.value =
          citaAEditar.restriccionCaloricaAplicada || "0";
      if (diagnosticoGeneralCitaTextarea)
        diagnosticoGeneralCitaTextarea.value =
          citaAEditar.diagnosticoGeneral || "";

      if (citaAEditar.distribucionMacrosPorcentaje) {
        if (porcCarbsCitaInput)
          porcCarbsCitaInput.value =
            citaAEditar.distribucionMacrosPorcentaje.carbohidratos || "";
        if (porcLipidosCitaInput)
          porcLipidosCitaInput.value =
            citaAEditar.distribucionMacrosPorcentaje.lipidos || "";
        if (porcProteinasCitaInput)
          porcProteinasCitaInput.value =
            citaAEditar.distribucionMacrosPorcentaje.proteinas || "";
      }
      if (notaNutricionalCitaTextarea)
        notaNutricionalCitaTextarea.value = citaAEditar.notaNutricional || "";

      // Cargar planes de alimentación
      limpiarTextareasPlanAlimentacion();
      numeroDeDietas = 0;
      if (
        citaAEditar.planesAlimentacion &&
        citaAEditar.planesAlimentacion.length > 0
      ) {
        citaAEditar.planesAlimentacion.forEach((plan, index) => {
          numeroDeDietas++;
          const nuevoPlanHTML = generarPlanAlimentacionHTML(numeroDeDietas);
          if (contenedorPlanesAlimentacionCitaDiv) {
            contenedorPlanesAlimentacionCitaDiv.insertAdjacentHTML(
              "beforeend",
              nuevoPlanHTML
            );
            const nombreDietaInput = document.getElementById(
              `nombre-dieta-${numeroDeDietas}`
            );
            const descripcionDietaInput = document.getElementById(
              `descripcion-dieta-${numeroDeDietas}`
            );
            if (nombreDietaInput) nombreDietaInput.value = plan.nombre || "";
            if (descripcionDietaInput)
              descripcionDietaInput.value = plan.descripcion || "";

            const contenedorTiempos = document.getElementById(
              `tiempos-comida-dieta-${numeroDeDietas}`
            );
            if (contenedorTiempos) contenedorTiempos.innerHTML = ""; // Limpiar antes de agregar

            if (plan.tiempos && plan.tiempos.length > 0) {
              plan.tiempos.forEach((tiempo, tiempoIdx) => {
                const tiempoHTML = agregarTiempoComidaHTML(
                  numeroDeDietas,
                  tiempoIdx + 1
                );
                if (contenedorTiempos)
                  contenedorTiempos.insertAdjacentHTML("beforeend", tiempoHTML);
                const nombreTiempoInput = document.getElementById(
                  `nombre-tiempo-${numeroDeDietas}-${tiempoIdx + 1}`
                );
                const detalleTiempoInput = document.getElementById(
                  `detalle-tiempo-${numeroDeDietas}-${tiempoIdx + 1}`
                );
                if (nombreTiempoInput)
                  nombreTiempoInput.value = tiempo.nombre || "";
                if (detalleTiempoInput)
                  detalleTiempoInput.value = tiempo.detalle || "";
              });
            }
            attachEventListenersPlanAlimentacion(numeroDeDietas);
          }
        });
      } else {
        generarPlanAlimentacionInicial(); // Si no hay planes guardados, generar uno por defecto
      }

      if (btnCancelarEdicionCita)
        btnCancelarEdicionCita.classList.remove("hidden");
      realizarTodosLosCalculos(); // Recalcular todo para actualizar los spans de resultados
      window.scrollTo({ top: formCita.offsetTop - 20, behavior: "smooth" });
    } else {
      console.warn("No se encontró la cita para editar con ID:", idCita);
      alert("No se pudo cargar la cita para edición.");
    }
  }
  window.editarCita = editarCita; // Hacerla accesible globalmente

  // --- BOTÓN CANCELAR EDICIÓN ---
  if (btnCancelarEdicionCita) {
    btnCancelarEdicionCita.addEventListener("click", function () {
      resetearFormularioCita(true); // Limpiar form, mantener datos del paciente actual
      // Los datos del paciente (género, edad, altura) se restauran desde los hidden inputs
      // que fueron cargados al seleccionar el paciente.
      // `realizarTodosLosCalculos` se llama dentro de `resetearFormularioCita`.
    });
  }

  // --- BOTÓN EXPORTAR PDF ---
  if (btnExportarPdfCita) {
    btnExportarPdfCita.addEventListener("click", async () => {
      if (!formCita) {
        alert("El formulario de cita no se encontró.");
        return;
      }
      if (!pacienteSeleccionadoId) {
        alert("Por favor, seleccione un paciente primero.");
        seleccionarPacienteCitaSelect.focus();
        return;
      }
      if (!fechaCitaInput || !fechaCitaInput.value) {
        alert("Por favor, ingrese una fecha para la cita.");
        fechaCitaInput.focus();
        return;
      }

      const { jsPDF } = window.jspdf;
      const html2canvas = window.html2canvas;

      if (!jsPDF || !html2canvas) {
        alert(
          "Las bibliotecas jsPDF o html2canvas no están cargadas. Asegúrese de que los scripts CDN estén en citas.html."
        );
        console.error("jsPDF o html2canvas no encontrados en window.");
        return;
      }

      const nombrePaciente = nombrePacienteHistorialCitaSpan
        ? nombrePacienteHistorialCitaSpan.textContent.trim()
        : "Paciente";
      const fechaCita = fechaCitaInput.value;
      const nombreArchivo = `cita_${nombrePaciente.replace(
        /\s+/g,
        "_"
      )}_${fechaCita}.pdf`;

      const originalButtonText = btnExportarPdfCita.textContent;
      btnExportarPdfCita.textContent = "Generando PDF...";
      btnExportarPdfCita.disabled = true;

      try {
        const doc = new jsPDF({
          orientation: "p",
          unit: "mm",
          format: "a4",
        });

        const opcionesHtml2Canvas = {
          scale: 2,
          useCORS: true,
          logging: false,
          onclone: (documentCloned) => {
            const formClonado = documentCloned.getElementById("form-cita");
            if (formClonado) {
              const selectoresAOcultar = [
                "#btn-agregar-otra-dieta-cita",
                'button[type="submit"]',
                "#btn-exportar-pdf-cita",
                "#cancelar-edicion-cita",
                ".btn-eliminar-dieta",
                ".btn-agregar-tiempo-comida",
                ".btn-eliminar-tiempo-comida",
              ];
              selectoresAOcultar.forEach((selector) => {
                formClonado.querySelectorAll(selector).forEach((el) => {
                  if (el) el.style.display = "none";
                });
              });

              formClonado
                .querySelectorAll("input[readonly]")
                .forEach((input) => {
                  const span = documentCloned.createElement("span");
                  span.textContent =
                    input.value +
                    (input.nextElementSibling &&
                    input.nextElementSibling.tagName === "SPAN" &&
                    input.nextElementSibling.textContent.includes("kcal")
                      ? " kcal"
                      : "");
                  span.style.display = "inline-block";
                  span.style.padding = "5px 0";
                  if (input.parentNode)
                    input.parentNode.insertBefore(span, input);
                  input.style.display = "none";
                });
              formClonado
                .querySelectorAll('input:not([type="hidden"]):not([readonly])')
                .forEach((input) => {
                  const span = documentCloned.createElement("span");
                  span.textContent = input.value;
                  span.style.display = "inline-block";
                  span.style.padding = "5px 0";
                  if (input.parentNode)
                    input.parentNode.insertBefore(span, input);
                  input.style.display = "none";
                });
              formClonado.querySelectorAll("textarea").forEach((textarea) => {
                const div = documentCloned.createElement("div");
                div.style.whiteSpace = "pre-wrap";
                div.style.border = "1px solid #eee";
                div.style.padding = "5px";
                div.style.marginTop = "5px";
                div.style.marginBottom = "5px";
                div.textContent = textarea.value;
                if (textarea.parentNode)
                  textarea.parentNode.insertBefore(div, textarea);
                textarea.style.display = "none";
              });
              formClonado.querySelectorAll("select").forEach((select) => {
                const span = documentCloned.createElement("span");
                if (select.selectedIndex >= 0) {
                  span.textContent = select.options[select.selectedIndex].text;
                } else {
                  span.textContent = " (No seleccionado)";
                }
                span.style.display = "inline-block";
                span.style.padding = "5px 0";
                if (select.parentNode)
                  select.parentNode.insertBefore(span, select);
                select.style.display = "none";
              });
              // Ocultar spans de gramos si están vacíos o son 0, para limpiar la vista
              [
                "#gramos-carbs-cita",
                "#gramos-lipidos-cita",
                "#gramos-proteinas-cita",
              ].forEach((sel) => {
                const el = formClonado.querySelector(sel);
                if (
                  el &&
                  (el.textContent === "0" || el.textContent === "0.0")
                ) {
                  if (el.parentNode) el.parentNode.style.display = "none";
                }
              });
              // Ocultar el span de suma de macros si es 100%
              const sumaMacrosSpan = formClonado.querySelector(
                "#suma-macros-porc-cita"
              );
              if (
                sumaMacrosSpan &&
                sumaMacrosSpan.textContent.startsWith("100")
              ) {
                if (sumaMacrosSpan.parentNode)
                  sumaMacrosSpan.parentNode.style.display = "none";
              }
            }
          },
        };

        await doc.html(formCita, {
          callback: function (doc) {
            doc.save(nombreArchivo);
            btnExportarPdfCita.textContent = originalButtonText;
            btnExportarPdfCita.disabled = false;
          },
          margin: [10, 10, 10, 10],
          autoPaging: "slice",
          x: 0,
          y: 0,
          width: 190,
          windowWidth: formCita.scrollWidth,
          html2canvas: opcionesHtml2Canvas,
        });
      } catch (error) {
        console.error("Error al generar PDF: ", error);
        alert("Error al generar el PDF. Revise la consola para más detalles.");
        btnExportarPdfCita.textContent = originalButtonText;
        btnExportarPdfCita.disabled = false;
      }
    });
  }

  // --- INICIALIZACIÓN AL CARGAR LA PÁGINA ---
  await popularSelectPacientes(); // Carga pacientes y, si hay uno seleccionado, sus datos y citas
  // La lógica de mostrar/ocultar el form y realizar cálculos iniciales ya está en popularSelectPacientes y cargarDatosPacienteYCitas
  // Si no hay paciente seleccionado, el form estará oculto y los cálculos no se harán o se limpiarán.
});
