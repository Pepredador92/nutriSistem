// Firebase v9+ modular imports
import { app, db } from "./firebase-config.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection as firestoreCollection, // Renombrado para evitar conflicto con 'collection' de DOM
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
import { obtenerPacientesDeFirestore } from "./pacientes.js";

// --- VARIABLES GLOBALES DE ESTADO ---
let globalCurrentUserIdForCitas = null; // UID del usuario actualmente autenticado, específico para citas.js
let currentUserId = null; // UID del usuario actualmente autenticado
let pacienteSeleccionadoId =
  localStorage.getItem("selectedPacienteIdCitas") || null; // ID del paciente seleccionado
let citasDelPacienteActual = []; // Array para almacenar las citas del paciente seleccionado
let todosLosPacientes = []; // Podría usarse si se necesita una copia local, aunque popularSelectPacientes la obtiene fresca.
let numeroDeDietas = 1; // Contador para los IDs de los planes de dieta

// --- REFERENCIAS GLOBALES A ELEMENTOS DEL DOM (se asignarán en DOMContentLoaded) ---
let formCita;
let listaCitasHistorialDiv;
let seleccionarPacienteCitaSelect;
let nombrePacienteHistorialCitaSpan;
let noPacienteSeleccionadoText;
let citaIdInput;
let pacienteIdCitaInput;
let fechaCitaInput;
let nombreCompletoPacienteDisplaySpan;
let ocupacionPacienteDisplaySpan;
let telefonoPacienteDisplaySpan;
let correoPacienteDisplaySpan;
let fechaRegistroPacienteDisplaySpan;
let generoPacienteDisplaySpan;
let edadPacienteDisplaySpan;
let alturaPacienteDisplaySpan;
let generoPacienteHiddenInput;
let edadPacienteHiddenInput;
let alturaPacienteHiddenInput;
let pesoCitaInput;
let circCinturaCitaInput;
let circCaderaCitaInput;
let circBrazoCitaInput;
let pliegueBicipitalCitaInput;
let pliegueTricipitalCitaInput;
let pliegueSubescapularCitaInput;
let pliegueSuprailiacoCitaInput;
let nivelActividadCitaSelect;
let restriccionCaloricaCitaSelect;
let tmbHarrisBenedictCitaSpan;
let tmbPulgarCitaSpan;
let getTotalCitaSpan;
let caloriasFinalesDietaCitaSpan;
let imcCitaSpan;
let imcDiagnosticoCitaSpan;
let porcGrasaSiriCitaSpan;
let grasaDiagnosticoCitaSpan;
let diagnosticoGeneralCitaTextarea;
let porcCarbsCitaInput;
let porcLipidosCitaInput;
let porcProteinasCitaInput;
let sumaMacrosPorcCitaSpan;
let gramosCarbsCitaSpan;
let gramosLipidosCitaSpan;
let gramosProteinasCitaSpan;
let perdidaSemanalCitaSpan;
let perdida15diasCitaSpan;
let perdida30diasCitaSpan;
let notaNutricionalCitaTextarea;
let contenedorPlanesAlimentacionCitaDiv;
let btnAgregarOtraDietaCita;
let btnCancelarEdicionCita;
let btnExportarPdfCita;

// --- DEFINICIÓN DE FUNCIONES AUXILIARES ---
function setDefaultFechaCita() {
  if (fechaCitaInput && !citaIdInput.value) {
    // Solo poner fecha por defecto si no estamos editando una cita existente
    const today = new Date();
    const year = today.getFullYear();
    const month = ("0" + (today.getMonth() + 1)).slice(-2);
    const day = ("0" + today.getDate()).slice(-2);
    fechaCitaInput.value = `${year}-${month}-${day}`;
  }
}

// Definición de actualizarSumaMacrosPorcentaje (si no existe ya)
// Asumo que esta función ya existe en tu código, si no, deberás añadirla o definirla.
// Por ejemplo, una implementación básica podría ser:
function actualizarSumaMacrosPorcentaje() {
  if (
    !porcCarbsCitaInput ||
    !porcLipidosCitaInput ||
    !porcProteinasCitaInput ||
    !sumaMacrosPorcCitaSpan
  )
    return;
  const porcCarbs = parseFloat(porcCarbsCitaInput.value) || 0;
  const porcLipidos = parseFloat(porcLipidosCitaInput.value) || 0;
  const porcProteinas = parseFloat(porcProteinasCitaInput.value) || 0;
  const suma = porcCarbs + porcLipidos + porcProteinas;
  sumaMacrosPorcCitaSpan.textContent = suma.toFixed(1) + "%";
  if (Math.abs(suma - 100) > 0.5) {
    sumaMacrosPorcCitaSpan.style.color = "red";
  } else {
    sumaMacrosPorcCitaSpan.style.color = "green";
  }
}

async function popularSelectPacientes() {
  if (!seleccionarPacienteCitaSelect) {
    console.warn(
      "El elemento 'seleccionarPacienteCitaSelect' no se encontró en el DOM."
    );
    return;
  }

  seleccionarPacienteCitaSelect.innerHTML =
    '<option value="">Cargando pacientes...</option>'; // Cambiado a "Cargando..."

  console.log("popularSelectPacientes: Iniciando la carga de pacientes...");

  if (!globalCurrentUserIdForCitas) {
    console.warn(
      "popularSelectPacientes: globalCurrentUserIdForCitas es null. No se pueden cargar pacientes."
    );
    seleccionarPacienteCitaSelect.innerHTML =
      '<option value="">Error: Usuario no identificado</option>';
    return;
  }
  console.log(
    "popularSelectPacientes: Usando userId:",
    globalCurrentUserIdForCitas
  );

  try {
    // Pasar el ID del usuario actual a obtenerPacientesDeFirestore
    const pacientes = await obtenerPacientesDeFirestore(
      globalCurrentUserIdForCitas
    );
    console.log(
      "popularSelectPacientes: Pacientes recibidos de obtenerPacientesDeFirestore:",
      pacientes
    );

    if (!pacientes || pacientes.length === 0) {
      console.warn(
        "popularSelectPacientes: No se encontraron pacientes para el usuario actual o la lista está vacía."
      );
      seleccionarPacienteCitaSelect.innerHTML =
        '<option value="">No hay pacientes registrados</option>';
      return;
    }

    // Limpiar opciones previas antes de añadir nuevas, excepto la de "Cargando..." que se reemplaza.
    seleccionarPacienteCitaSelect.innerHTML =
      '<option value="">Seleccione un paciente...</option>';

    // Crear nombreCompleto para cada paciente y luego ordenar
    const pacientesConNombreCompleto = pacientes.map((paciente) => {
      return {
        ...paciente,
        nombreCompleto: `${paciente.nombre || ""} ${
          paciente.apellidoPaterno || ""
        } ${paciente.apellidoMaterno || ""}`.trim(),
      };
    });
    console.log(
      "popularSelectPacientes: Pacientes mapeados con nombreCompleto:",
      pacientesConNombreCompleto
    );

    // Ordenar pacientes alfabéticamente por nombreCompleto
    pacientesConNombreCompleto.sort((a, b) =>
      a.nombreCompleto.localeCompare(b.nombreCompleto)
    );
    console.log(
      "popularSelectPacientes: Pacientes ordenados:",
      pacientesConNombreCompleto
    );

    pacientesConNombreCompleto.forEach((paciente) => {
      const option = document.createElement("option");
      option.value = paciente.id; // Usar el ID del paciente como valor
      option.textContent = paciente.nombreCompleto;
      seleccionarPacienteCitaSelect.appendChild(option);
    });
    console.log("popularSelectPacientes: Select de pacientes populado.");

    // Restaurar selección si existía
    if (pacienteSeleccionadoId) {
      seleccionarPacienteCitaSelect.value = pacienteSeleccionadoId;
      if (seleccionarPacienteCitaSelect.value === pacienteSeleccionadoId) {
        cargarDatosPacienteYCitas(pacienteSeleccionadoId);
      } else {
        // Si el paciente seleccionado anteriormente ya no existe o no es válido, limpiar
        localStorage.removeItem("selectedPacienteIdCitas");
        pacienteSeleccionadoId = null;
        limpiarFormularioCompleto(false);
      }
    }
  } catch (error) {
    console.error("Error al popular el select de pacientes:", error);
    seleccionarPacienteCitaSelect.innerHTML =
      '<option value="">Error al cargar pacientes</option>';
    alert(
      "Error al cargar la lista de pacientes. Por favor, intente de nuevo más tarde."
    );
  }
}

async function cargarDatosPacienteYCitas(pacienteId) {
  if (!pacienteId) {
    console.warn(
      "ID de paciente no proporcionado a cargarDatosPacienteYCitas."
    );
    limpiarFormularioCompleto(false); // Limpiar todo si no hay pacienteId
    return;
  }

  try {
    const pacienteRef = doc(db, "pacientes", pacienteId);
    const pacienteSnap = await getDoc(pacienteRef);

    if (pacienteSnap.exists()) {
      const datosPaciente = pacienteSnap.data();
      console.log("Datos del paciente cargados:", datosPaciente);

      if (currentUserId && datosPaciente.userId !== currentUserId) {
        console.warn(
          "Intento de cargar datos de un paciente que no pertenece al usuario actual."
        );
        alert("No tiene permiso para ver este paciente.");
        limpiarFormularioCompleto(false);
        if (seleccionarPacienteCitaSelect)
          seleccionarPacienteCitaSelect.value = "";
        localStorage.removeItem("selectedPacienteIdCitas");
        pacienteSeleccionadoId = null;
        return;
      }

      if (nombreCompletoPacienteDisplaySpan)
        nombreCompletoPacienteDisplaySpan.textContent = `${
          datosPaciente.nombre || ""
        } ${datosPaciente.apellidoPaterno || ""} ${
          datosPaciente.apellidoMaterno || ""
        }`.trim();
      if (generoPacienteDisplaySpan)
        generoPacienteDisplaySpan.textContent =
          datosPaciente.genero || "No especificado";
      if (edadPacienteDisplaySpan)
        edadPacienteDisplaySpan.textContent = datosPaciente.edad
          ? `${datosPaciente.edad} años`
          : "No especificada";
      if (alturaPacienteDisplaySpan)
        alturaPacienteDisplaySpan.textContent = datosPaciente.altura
          ? `${datosPaciente.altura} cm`
          : "No especificada";
      if (ocupacionPacienteDisplaySpan)
        ocupacionPacienteDisplaySpan.textContent =
          datosPaciente.ocupacion || "N/A";
      if (telefonoPacienteDisplaySpan)
        telefonoPacienteDisplaySpan.textContent =
          datosPaciente.telefono || "N/A";
      if (correoPacienteDisplaySpan)
        correoPacienteDisplaySpan.textContent = datosPaciente.correo || "N/A";
      if (fechaRegistroPacienteDisplaySpan && datosPaciente.fechaRegistro) {
        const fechaReg = datosPaciente.fechaRegistro.toDate
          ? datosPaciente.fechaRegistro.toDate()
          : new Date(datosPaciente.fechaRegistro);
        fechaRegistroPacienteDisplaySpan.textContent =
          fechaReg.toLocaleDateString();
      } else if (fechaRegistroPacienteDisplaySpan) {
        fechaRegistroPacienteDisplaySpan.textContent = "N/A";
      }

      if (pacienteIdCitaInput) pacienteIdCitaInput.value = pacienteId;
      if (generoPacienteHiddenInput)
        generoPacienteHiddenInput.value = datosPaciente.genero || "";
      if (edadPacienteHiddenInput)
        edadPacienteHiddenInput.value = datosPaciente.edad || "";
      if (alturaPacienteHiddenInput)
        alturaPacienteHiddenInput.value = datosPaciente.altura || "";

      if (nombrePacienteHistorialCitaSpan) {
        nombrePacienteHistorialCitaSpan.textContent = `${
          datosPaciente.nombre || ""
        } ${datosPaciente.apellidoPaterno || ""} ${
          datosPaciente.apellidoMaterno || ""
        }`.trim();
      }

      resetearFormularioCita(true);
      await cargarCitasDelPaciente(pacienteId);

      if (formCita) formCita.style.display = "block";
      if (noPacienteSeleccionadoText)
        noPacienteSeleccionadoText.style.display = "none";

      realizarTodosLosCalculos();
    } else {
      console.warn(`No se encontró el paciente con ID: ${pacienteId}`);
      limpiarFormularioCompleto(false);
      alert("Paciente no encontrado. Por favor, seleccione otro paciente.");
    }
  } catch (error) {
    console.error("Error al cargar datos del paciente:", error);
    limpiarFormularioCompleto(false);
    alert("Error al cargar los datos del paciente. Intente de nuevo.");
  }
}

async function cargarCitasDelPaciente(pacienteId) {
  if (!pacienteId || !currentUserId) {
    console.warn(
      "ID de paciente o ID de usuario no disponible para cargar citas."
    );
    citasDelPacienteActual = [];
    renderCitasHistorial();
    return;
  }

  try {
    const citasRef = firestoreCollection(db, "pacientes", pacienteId, "citas");
    const q = query(citasRef, orderBy("fecha", "desc"));
    const querySnapshot = await getDocs(q);
    citasDelPacienteActual = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(
      `Citas cargadas para el paciente ${pacienteId}:`,
      citasDelPacienteActual
    );
  } catch (error) {
    console.error("Error al cargar citas del paciente:", error);
    citasDelPacienteActual = [];
    alert(
      "Error al cargar el historial de citas. Por favor, intente de nuevo."
    );
  }
  renderCitasHistorial();
}

function resetearFormularioCita(mantenerDatosPaciente = false) {
  const pacienteIdActual = pacienteIdCitaInput ? pacienteIdCitaInput.value : "";
  const generoActual = generoPacienteHiddenInput
    ? generoPacienteHiddenInput.value
    : "";
  const edadActual = edadPacienteHiddenInput
    ? edadPacienteHiddenInput.value
    : "";
  const alturaActual = alturaPacienteHiddenInput
    ? alturaPacienteHiddenInput.value
    : "";

  if (formCita) {
    formCita.reset();
  }

  if (mantenerDatosPaciente) {
    if (pacienteIdCitaInput) pacienteIdCitaInput.value = pacienteIdActual;
    if (generoPacienteHiddenInput)
      generoPacienteHiddenInput.value = generoActual;
    if (edadPacienteHiddenInput) edadPacienteHiddenInput.value = edadActual;
    if (alturaPacienteHiddenInput)
      alturaPacienteHiddenInput.value = alturaActual;
  } else {
    if (pacienteIdCitaInput) pacienteIdCitaInput.value = "";
    if (generoPacienteHiddenInput) generoPacienteHiddenInput.value = "";
    if (edadPacienteHiddenInput) edadPacienteHiddenInput.value = "";
    if (alturaPacienteHiddenInput) alturaPacienteHiddenInput.value = "";
  }

  if (fechaCitaInput) setDefaultFechaCita(); // Llamar aquí para asegurar que se establece al resetear si es nueva cita
  if (citaIdInput) citaIdInput.value = "";
  if (btnCancelarEdicionCita) btnCancelarEdicionCita.classList.add("hidden");

  if (porcCarbsCitaInput) porcCarbsCitaInput.value = "50";
  if (porcLipidosCitaInput) porcLipidosCitaInput.value = "30";
  if (porcProteinasCitaInput) porcProteinasCitaInput.value = "20";

  limpiarTextareasPlanAlimentacion();
  numeroDeDietas = 0;
  generarPlanAlimentacionInicial();

  if (mantenerDatosPaciente) {
    realizarTodosLosCalculos();
  } else {
    limpiarSpansDeCalculo();
  }
}

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

  citasDelPacienteActual.forEach((cita) => {
    const citaDiv = document.createElement("div");
    citaDiv.classList.add("cita-item-historial");
    const fechaCitaFormateada = cita.fecha
      ? new Date(cita.fecha + "T00:00:00").toLocaleDateString() // Asegurar que se interprete como local si solo es YYYY-MM-DD
      : "Fecha N/A";
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

function limpiarSpansDeCalculo() {
  if (tmbHarrisBenedictCitaSpan) tmbHarrisBenedictCitaSpan.textContent = "0";
  if (tmbPulgarCitaSpan) tmbPulgarCitaSpan.textContent = "0";
  if (getTotalCitaSpan) getTotalCitaSpan.textContent = "0";
  if (caloriasFinalesDietaCitaSpan)
    caloriasFinalesDietaCitaSpan.textContent = "0";
  if (imcCitaSpan) imcCitaSpan.textContent = "0.0";
  if (imcDiagnosticoCitaSpan) imcDiagnosticoCitaSpan.textContent = "-";
  if (porcGrasaSiriCitaSpan) porcGrasaSiriCitaSpan.textContent = "0.0";
  if (grasaDiagnosticoCitaSpan) grasaDiagnosticoCitaSpan.textContent = "-";
  if (sumaMacrosPorcCitaSpan) {
    sumaMacrosPorcCitaSpan.textContent = "0.0";
    sumaMacrosPorcCitaSpan.style.color = "green"; // o color por defecto
  }
  if (gramosCarbsCitaSpan) gramosCarbsCitaSpan.textContent = "0.0";
  if (gramosLipidosCitaSpan) gramosLipidosCitaSpan.textContent = "0.0";
  if (gramosProteinasCitaSpan) gramosProteinasCitaSpan.textContent = "0.0";
  if (perdidaSemanalCitaSpan) perdidaSemanalCitaSpan.textContent = "0.00";
  if (perdida15diasCitaSpan) perdida15diasCitaSpan.textContent = "0.00";
  if (perdida30diasCitaSpan) perdida30diasCitaSpan.textContent = "0.00";
  if (diagnosticoGeneralCitaTextarea) diagnosticoGeneralCitaTextarea.value = "";
}

function realizarTodosLosCalculos() {
  limpiarSpansDeCalculo();

  const peso = parseFloat(pesoCitaInput?.value) || 0;
  const alturaCm = parseFloat(alturaPacienteHiddenInput?.value) || 0;
  const edad = parseInt(edadPacienteHiddenInput?.value) || 0;
  const genero = generoPacienteHiddenInput?.value?.toLowerCase() || "";

  if (!genero || !edad || !alturaCm || !peso) {
    console.warn(
      "Faltan datos esenciales (género, edad, altura o peso de la cita) para realizar cálculos."
    );
    return;
  }

  let tmbHarris = 0;
  if (genero === "masculino") {
    tmbHarris = 88.362 + 13.397 * peso + 4.799 * alturaCm - 5.677 * edad;
  } else if (genero === "femenino") {
    tmbHarris = 447.593 + 9.247 * peso + 3.098 * alturaCm - 4.33 * edad;
  }
  if (tmbHarrisBenedictCitaSpan)
    tmbHarrisBenedictCitaSpan.textContent =
      tmbHarris > 0 ? tmbHarris.toFixed(0) : "0";

  const tmbPulgar = peso * 25;
  if (tmbPulgarCitaSpan)
    tmbPulgarCitaSpan.textContent = tmbPulgar > 0 ? tmbPulgar.toFixed(0) : "0";

  const tmbBase = tmbHarris > 0 ? tmbHarris : tmbPulgar > 0 ? tmbPulgar : 0;

  const factorActividadValor = {
    sedentario: 1.2,
    ligero: 1.375,
    activo: 1.55,
    "muy-activo": 1.725,
  };
  const nivelActividadKey = nivelActividadCitaSelect?.value || "sedentario";
  const factorActividad = factorActividadValor[nivelActividadKey] || 1.2;
  const get = tmbBase * factorActividad;
  if (getTotalCitaSpan)
    getTotalCitaSpan.textContent = get > 0 ? get.toFixed(0) : "0";

  const restriccion = parseInt(restriccionCaloricaCitaSelect?.value) || 0;
  const caloriasFinales = get - restriccion;
  if (caloriasFinalesDietaCitaSpan)
    caloriasFinalesDietaCitaSpan.textContent =
      caloriasFinales > 0 ? caloriasFinales.toFixed(0) : "0";

  let porcCarbs = parseFloat(porcCarbsCitaInput?.value) || 0;
  let porcLipidos = parseFloat(porcLipidosCitaInput?.value) || 0;
  let porcProteinas = parseFloat(porcProteinasCitaInput?.value) || 0;

  const sumaMacros = porcCarbs + porcLipidos + porcProteinas;
  if (sumaMacrosPorcCitaSpan) {
    sumaMacrosPorcCitaSpan.textContent = sumaMacros.toFixed(1);
    sumaMacrosPorcCitaSpan.style.color =
      Math.abs(sumaMacros - 100) > 0.5 ? "red" : "green";
  }

  const caloriasParaMacros = caloriasFinales > 0 ? caloriasFinales : 0;
  const gramosCarbs = (caloriasParaMacros * (porcCarbs / 100)) / 4;
  const gramosLipidosCalc = (caloriasParaMacros * (porcLipidos / 100)) / 9;
  const gramosProteinasCalc = (caloriasParaMacros * (porcProteinas / 100)) / 4;

  if (gramosCarbsCitaSpan)
    gramosCarbsCitaSpan.textContent =
      gramosCarbs > 0 ? gramosCarbs.toFixed(1) : "0.0";
  if (gramosLipidosCitaSpan)
    gramosLipidosCitaSpan.textContent =
      gramosLipidosCalc > 0 ? gramosLipidosCalc.toFixed(1) : "0.0";
  if (gramosProteinasCitaSpan)
    gramosProteinasCitaSpan.textContent =
      gramosProteinasCalc > 0 ? gramosProteinasCalc.toFixed(1) : "0.0";

  const pliegueBicipital = parseFloat(pliegueBicipitalCitaInput?.value) || 0;
  const pliegueTricipital = parseFloat(pliegueTricipitalCitaInput?.value) || 0;
  const pliegueSubescapular =
    parseFloat(pliegueSubescapularCitaInput?.value) || 0;
  const pliegueSuprailiaco =
    parseFloat(pliegueSuprailiacoCitaInput?.value) || 0;

  const suma4Pliegues =
    pliegueBicipital +
    pliegueTricipital +
    pliegueSubescapular +
    pliegueSuprailiaco;
  let densidadCorporal = 0;
  let porcGrasa = 0;

  if (suma4Pliegues > 0 && edad > 0) {
    // Asegurar edad para las fórmulas
    const logS4P = Math.log10(suma4Pliegues);
    if (genero === "masculino") {
      if (edad >= 17 && edad <= 19) densidadCorporal = 1.162 - 0.063 * logS4P;
      else if (edad >= 20 && edad <= 29)
        densidadCorporal = 1.1631 - 0.0632 * logS4P;
      else if (edad >= 30 && edad <= 39)
        densidadCorporal = 1.1422 - 0.0544 * logS4P;
      else if (edad >= 40 && edad <= 49)
        densidadCorporal = 1.162 - 0.07 * logS4P; // D&W usan 1.1620 para 40-49
      else if (edad >= 50) densidadCorporal = 1.1715 - 0.0779 * logS4P;
    } else if (genero === "femenino") {
      if (edad >= 16 && edad <= 19)
        // D&W usa 16-19 para mujeres
        densidadCorporal = 1.1549 - 0.0678 * logS4P;
      else if (edad >= 20 && edad <= 29)
        densidadCorporal = 1.1599 - 0.0717 * logS4P;
      else if (edad >= 30 && edad <= 39)
        densidadCorporal = 1.1423 - 0.0632 * logS4P;
      else if (edad >= 40 && edad <= 49)
        densidadCorporal = 1.1333 - 0.0612 * logS4P;
      else if (edad >= 50) densidadCorporal = 1.1339 - 0.0645 * logS4P;
    }
    if (densidadCorporal > 0) {
      porcGrasa = 495 / densidadCorporal - 450;
    }
  }
  if (porcGrasaSiriCitaSpan)
    porcGrasaSiriCitaSpan.textContent =
      porcGrasa > 0 ? porcGrasa.toFixed(1) : "0.0";

  let diagGrasa = "-";
  if (porcGrasa > 0 && edad > 0) {
    // Asegurar edad para diagnóstico
    if (genero === "masculino") {
      if (edad >= 20 && edad <= 39) {
        if (porcGrasa < 8) diagGrasa = "Bajo (<8%)";
        else if (porcGrasa <= 19) diagGrasa = "Saludable (8-19%)";
        else if (porcGrasa < 25) diagGrasa = "Sobrepeso (20-24%)";
        else diagGrasa = "Obesidad (≥25%)";
      } else if (edad >= 40 && edad <= 59) {
        if (porcGrasa < 11) diagGrasa = "Bajo (<11%)";
        else if (porcGrasa <= 21) diagGrasa = "Saludable (11-21%)";
        else if (porcGrasa < 28) diagGrasa = "Sobrepeso (22-27%)";
        else diagGrasa = "Obesidad (≥28%)";
      } else if (edad >= 60) {
        if (porcGrasa < 13) diagGrasa = "Bajo (<13%)";
        else if (porcGrasa <= 24) diagGrasa = "Saludable (13-24%)";
        else if (porcGrasa < 30) diagGrasa = "Sobrepeso (25-29%)";
        else diagGrasa = "Obesidad (≥30%)";
      }
    } else if (genero === "femenino") {
      if (edad >= 20 && edad <= 39) {
        if (porcGrasa < 21) diagGrasa = "Bajo (<21%)";
        else if (porcGrasa <= 32) diagGrasa = "Saludable (21-32%)";
        else if (porcGrasa < 39) diagGrasa = "Sobrepeso (33-38%)";
        else diagGrasa = "Obesidad (≥39%)";
      } else if (edad >= 40 && edad <= 59) {
        if (porcGrasa < 23) diagGrasa = "Bajo (<23%)";
        else if (porcGrasa <= 33) diagGrasa = "Saludable (23-33%)";
        else if (porcGrasa < 40) diagGrasa = "Sobrepeso (34-39%)";
        else diagGrasa = "Obesidad (≥40%)";
      } else if (edad >= 60) {
        if (porcGrasa < 24) diagGrasa = "Bajo (<24%)";
        else if (porcGrasa <= 35) diagGrasa = "Saludable (24-35%)";
        else if (porcGrasa < 42) diagGrasa = "Sobrepeso (36-41%)";
        else diagGrasa = "Obesidad (≥42%)";
      }
    }
  }
  if (grasaDiagnosticoCitaSpan)
    grasaDiagnosticoCitaSpan.textContent = diagGrasa;

  const alturaM = alturaCm / 100;
  let imc = 0;
  if (peso > 0 && alturaM > 0) {
    imc = peso / (alturaM * alturaM);
  }
  if (imcCitaSpan) imcCitaSpan.textContent = imc > 0 ? imc.toFixed(1) : "0.0";

  let diagIMC = "-";
  if (imc > 0) {
    if (imc < 18.5) diagIMC = "Bajo peso (<18.5)";
    else if (imc < 25) diagIMC = "Normal (18.5-24.9)";
    else if (imc < 30) diagIMC = "Sobrepeso (25-29.9)";
    else if (imc < 35) diagIMC = "Obesidad Grado I (30-34.9)";
    else if (imc < 40) diagIMC = "Obesidad Grado II (35-39.9)";
    else diagIMC = "Obesidad Grado III (≥40)";
  }
  if (imcDiagnosticoCitaSpan) imcDiagnosticoCitaSpan.textContent = diagIMC;

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

  if (diagnosticoGeneralCitaTextarea) {
    let diagGeneral = `Paciente ${
      genero === "masculino" ? "masculino" : "femenina"
    } de ${edad} años con ${peso} kg y altura de ${alturaCm} cm.\n`;
    diagGeneral += `IMC: ${imc > 0 ? imc.toFixed(1) : "N/A"} (${diagIMC}).\n`;
    diagGeneral += `% Grasa Corporal (D&W/Siri): ${
      porcGrasa > 0 ? porcGrasa.toFixed(1) : "N/A"
    }% (${diagGrasa}).\n`;
    diagGeneral += `GET: ${
      get > 0 ? get.toFixed(0) : "N/A"
    } kcal. Dieta propuesta: ${
      caloriasFinales > 0 ? caloriasFinales.toFixed(0) : "N/A"
    } kcal (Restricción: ${restriccion} kcal).\n`;
    diagGeneral += `Distribución Macros: CHOs ${porcCarbs}% (${
      gramosCarbs > 0 ? gramosCarbs.toFixed(1) : "0"
    }g), Lípidos ${porcLipidos}% (${
      gramosLipidosCalc > 0 ? gramosLipidosCalc.toFixed(1) : "0"
    }g), Proteínas ${porcProteinas}% (${
      gramosProteinasCalc > 0 ? gramosProteinasCalc.toFixed(1) : "0"
    }g).\n`;
    diagnosticoGeneralCitaTextarea.value = diagGeneral;
  }
}

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
  const nuevoBotonEliminar = contenedorTiempos.querySelector(
    `#dieta-${dietaIndice}-tiempo-${tiempoIndice} .btn-eliminar-tiempo-comida`
  );
  if (nuevoBotonEliminar) {
    nuevoBotonEliminar.addEventListener("click", function () {
      document
        .getElementById(
          `dieta-${this.dataset.dietaindice}-tiempo-${this.dataset.tiempoindice}`
        )
        .remove();
    });
  }
}

function generarPlanAlimentacionInicial() {
  if (!contenedorPlanesAlimentacionCitaDiv) return;
  // Solo genera el plan si no existe ya uno (evita duplicados al resetear)
  if (
    contenedorPlanesAlimentacionCitaDiv.children.length === 0 ||
    numeroDeDietas === 0
  ) {
    numeroDeDietas = 1; // Asegurar que empezamos con la dieta 1
    contenedorPlanesAlimentacionCitaDiv.innerHTML =
      generarPlanAlimentacionHTML(numeroDeDietas);
    agregarNuevoTiempoComida(numeroDeDietas);
    agregarNuevoTiempoComida(numeroDeDietas);
    agregarNuevoTiempoComida(numeroDeDietas);
    attachEventListenersPlanAlimentacion(numeroDeDietas);
  } else if (numeroDeDietas > 0) {
    // Si ya hay dietas (ej. al editar), asegurarse que los listeners están adjuntos
    // Esto es más complejo, podría requerir re-adjuntar a todos los existentes
    // Por ahora, la lógica de edición carga los datos y attachEventListenersPlanAlimentacion
    // se llama al agregar nuevas dietas.
    // Para simplificar, la edición recarga los planes y adjunta listeners.
  }
}

function limpiarTextareasPlanAlimentacion() {
  if (contenedorPlanesAlimentacionCitaDiv) {
    contenedorPlanesAlimentacionCitaDiv.innerHTML = "";
  }
  numeroDeDietas = 0;
}

function attachEventListenersPlanAlimentacion(indiceDieta) {
  const planDietaDiv = document.getElementById(`plan-dieta-${indiceDieta}`);
  if (!planDietaDiv) return;

  const btnAgregarTiempo = planDietaDiv.querySelector(
    `.btn-agregar-tiempo-comida`
  );
  if (btnAgregarTiempo) {
    btnAgregarTiempo.addEventListener("click", function () {
      agregarNuevoTiempoComida(this.dataset.dietaindice);
    });
  }
  const btnEliminarDieta = planDietaDiv.querySelector(`.btn-eliminar-dieta`);
  if (btnEliminarDieta) {
    btnEliminarDieta.addEventListener("click", function () {
      document.getElementById(`plan-dieta-${this.dataset.indice}`).remove();
      // Podríamos querer re-indexar o simplemente permitir huecos.
      // Si se elimina la dieta 1 y numeroDeDietas era 1, resetear numeroDeDietas.
      if (
        contenedorPlanesAlimentacionCitaDiv &&
        contenedorPlanesAlimentacionCitaDiv.children.length === 0
      ) {
        numeroDeDietas = 0; // Para que generarPlanAlimentacionInicial pueda crear la primera.
      }
    });
  }

  // Listeners para los botones de eliminar tiempo de comida (si se añaden dinámicamente)
  // Esto ya se maneja en agregarNuevoTiempoComida
}

function obtenerDatosPlanAlimentacion() {
  const planes = [];
  document
    .querySelectorAll(".plan-alimentacion-individual")
    .forEach((planDiv, i) => {
      const dietaIndice = planDiv.id.split("-")[2]; // Extraer el índice del ID del div
      const nombreDietaInput = document.getElementById(
        `nombre-dieta-${dietaIndice}`
      );
      const descripcionDietaTextarea = document.getElementById(
        `descripcion-dieta-${dietaIndice}`
      );

      const plan = {
        nombre: nombreDietaInput
          ? nombreDietaInput.value
          : `Dieta ${dietaIndice}`,
        descripcion: descripcionDietaTextarea
          ? descripcionDietaTextarea.value
          : "",
        tiempos: [],
      };

      planDiv
        .querySelectorAll(".tiempo-comida-individual")
        .forEach((tiempoDiv, j) => {
          const tiempoOriginalIndice = tiempoDiv.id.split("-")[3]; // Extraer el índice original del tiempo
          const nombreTiempoInput = document.getElementById(
            `nombre-tiempo-${dietaIndice}-${tiempoOriginalIndice}`
          );
          const detalleTiempoTextarea = document.getElementById(
            `detalle-tiempo-${dietaIndice}-${tiempoOriginalIndice}`
          );

          plan.tiempos.push({
            nombre: nombreTiempoInput
              ? nombreTiempoInput.value
              : `Tiempo ${j + 1}`,
            detalle: detalleTiempoTextarea ? detalleTiempoTextarea.value : "",
          });
        });
      planes.push(plan);
    });
  return planes;
}

function poblarPlanAlimentacionConDatos(planesGuardados) {
  if (
    !contenedorPlanesAlimentacionCitaDiv ||
    !planesGuardados ||
    planesGuardados.length === 0
  ) {
    generarPlanAlimentacionInicial(); // Generar uno por defecto si no hay nada
    return;
  }

  limpiarTextareasPlanAlimentacion(); // Limpiar cualquier plan existente
  numeroDeDietas = 0;

  planesGuardados.forEach((planData, index) => {
    numeroDeDietas++;
    const nuevoPlanHTML = generarPlanAlimentacionHTML(numeroDeDietas);
    contenedorPlanesAlimentacionCitaDiv.insertAdjacentHTML(
      "beforeend",
      nuevoPlanHTML
    );

    const nombreDietaInput = document.getElementById(
      `nombre-dieta-${numeroDeDietas}`
    );
    const descripcionDietaTextarea = document.getElementById(
      `descripcion-dieta-${numeroDeDietas}`
    );
    if (nombreDietaInput) nombreDietaInput.value = planData.nombre || "";
    if (descripcionDietaTextarea)
      descripcionDietaTextarea.value = planData.descripcion || "";

    const contenedorTiempos = document.getElementById(
      `tiempos-comida-dieta-${numeroDeDietas}`
    );
    if (contenedorTiempos && planData.tiempos && planData.tiempos.length > 0) {
      planData.tiempos.forEach((tiempoData) => {
        // Llamar a agregarNuevoTiempoComida para crear el HTML y adjuntar listeners
        agregarNuevoTiempoComida(numeroDeDietas);
        // Ahora poblar los campos del último tiempo de comida agregado
        const ultimoTiempoDiv = contenedorTiempos.lastElementChild;
        if (ultimoTiempoDiv) {
          const tiempoIndiceActual = ultimoTiempoDiv.id.split("-")[3];
          const nombreTiempoInput = document.getElementById(
            `nombre-tiempo-${numeroDeDietas}-${tiempoIndiceActual}`
          );
          const detalleTiempoTextarea = document.getElementById(
            `detalle-tiempo-${numeroDeDietas}-${tiempoIndiceActual}`
          );
          if (nombreTiempoInput)
            nombreTiempoInput.value = tiempoData.nombre || "";
          if (detalleTiempoTextarea)
            detalleTiempoTextarea.value = tiempoData.detalle || "";
        }
      });
    } else if (contenedorTiempos) {
      // Si no hay tiempos guardados, agregar uno por defecto
      agregarNuevoTiempoComida(numeroDeDietas);
    }
    attachEventListenersPlanAlimentacion(numeroDeDietas); // Asegurar listeners para la dieta
  });
}

async function guardarCita() {
  // event.preventDefault(); // El listener de submit ya lo hace
  if (!pacienteIdCitaInput || !pacienteIdCitaInput.value) {
    alert("Por favor, seleccione un paciente primero.");
    return;
  }
  if (!currentUserId) {
    alert("Error: Usuario no autenticado. No se puede guardar la cita.");
    return;
  }

  // Verificar propiedad del paciente antes de guardar
  const pacienteRefVerif = doc(db, "pacientes", pacienteIdCitaInput.value);
  try {
    const pacienteSnapVerif = await getDoc(pacienteRefVerif);
    if (pacienteSnapVerif.exists()) {
      const datosPacienteVerif = pacienteSnapVerif.data();
      if (datosPacienteVerif.userId !== currentUserId) {
        alert("Error: No tiene permiso para guardar citas para este paciente.");
        return;
      }
    } else {
      alert("Error: El paciente especificado no existe.");
      return;
    }
  } catch (error) {
    console.error(
      "Error verificando propiedad del paciente antes de guardar cita:",
      error
    );
    alert("Error al verificar permisos. No se guardó la cita.");
    return;
  }

  const datosCita = {
    pacienteId: pacienteIdCitaInput.value,
    fecha: fechaCitaInput.value, // Asegurar formato YYYY-MM-DD
    peso: parseFloat(pesoCitaInput.value) || null,
    circCintura: parseFloat(circCinturaCitaInput.value) || null,
    circCadera: parseFloat(circCaderaCitaInput.value) || null,
    circBrazo: parseFloat(circBrazoCitaInput.value) || null,
    pliegueBicipital: parseFloat(pliegueBicipitalCitaInput.value) || null,
    pliegueTricipital: parseFloat(pliegueTricipitalCitaInput.value) || null,
    pliegueSubescapular: parseFloat(pliegueSubescapularCitaInput.value) || null,
    pliegueSuprailiaco: parseFloat(pliegueSuprailiacoCitaInput.value) || null,
    nivelActividad: nivelActividadCitaSelect.value,
    restriccionCalorica: parseInt(restriccionCaloricaCitaSelect.value) || 0,
    tmbHarrisBenedict:
      parseFloat(tmbHarrisBenedictCitaSpan.textContent) || null,
    tmbPulgar: parseFloat(tmbPulgarCitaSpan.textContent) || null,
    getCalculado: parseFloat(getTotalCitaSpan.textContent) || null,
    caloriasDietaFinal:
      parseFloat(caloriasFinalesDietaCitaSpan.textContent) || null,
    imc: parseFloat(imcCitaSpan.textContent) || null,
    imcDiagnostico: imcDiagnosticoCitaSpan.textContent,
    porcGrasaSiri: parseFloat(porcGrasaSiriCitaSpan.textContent) || null,
    grasaDiagnostico: grasaDiagnosticoCitaSpan.textContent,
    diagnosticoGeneral: diagnosticoGeneralCitaTextarea.value,
    porcCarbs: parseFloat(porcCarbsCitaInput.value) || 0,
    porcLipidos: parseFloat(porcLipidosCitaInput.value) || 0,
    porcProteinas: parseFloat(porcProteinasCitaInput.value) || 0,
    gramosCarbs: parseFloat(gramosCarbsCitaSpan.textContent) || null,
    gramosLipidos: parseFloat(gramosLipidosCitaSpan.textContent) || null,
    gramosProteinas: parseFloat(gramosProteinasCitaSpan.textContent) || null,
    perdidaSemanalEstimada:
      parseFloat(perdidaSemanalCitaSpan.textContent) || null,
    perdida15diasEstimada:
      parseFloat(perdida15diasCitaSpan.textContent) || null,
    perdida30diasEstimada:
      parseFloat(perdida30diasCitaSpan.textContent) || null,
    notaNutricional: notaNutricionalCitaTextarea.value,
    planAlimentacion: obtenerDatosPlanAlimentacion(),
    ultimaModificacion: serverTimestamp(),
  };

  const idCitaEdicion = citaIdInput.value;

  try {
    if (idCitaEdicion) {
      // Editando cita existente
      const citaDocRef = doc(
        db,
        "pacientes",
        datosCita.pacienteId,
        "citas",
        idCitaEdicion
      );
      await updateDoc(citaDocRef, datosCita);
      alert("Cita actualizada con éxito.");
    } else {
      // Creando nueva cita
      datosCita.fechaCreacion = serverTimestamp();
      const citasCollectionRef = firestoreCollection(
        db,
        "pacientes",
        datosCita.pacienteId,
        "citas"
      );
      const docRef = await addDoc(citasCollectionRef, datosCita);
      console.log("Nueva cita guardada con ID: ", docRef.id);
      alert("Cita guardada con éxito.");
    }
    resetearFormularioCita(true); // Mantener datos del paciente
    await cargarDatosPacienteYCitas(datosCita.pacienteId); // Recargar historial
  } catch (error) {
    console.error("Error al guardar la cita: ", error);
    alert("Error al guardar la cita. Verifique la consola para más detalles.");
  }
}

function poblarFormularioConDatosCita(cita) {
  if (!cita) return;

  if (fechaCitaInput)
    fechaCitaInput.value = cita.fecha || new Date().toISOString().split("T")[0];
  if (pesoCitaInput) pesoCitaInput.value = cita.peso || "";
  if (circCinturaCitaInput) circCinturaCitaInput.value = cita.circCintura || "";
  if (circCaderaCitaInput) circCaderaCitaInput.value = cita.circCadera || "";
  if (circBrazoCitaInput) circBrazoCitaInput.value = cita.circBrazo || "";
  if (pliegueBicipitalCitaInput)
    pliegueBicipitalCitaInput.value = cita.pliegueBicipital || "";
  if (pliegueTricipitalCitaInput)
    pliegueTricipitalCitaInput.value = cita.pliegueTricipital || "";
  if (pliegueSubescapularCitaInput)
    pliegueSubescapularCitaInput.value = cita.pliegueSubescapular || "";
  if (pliegueSuprailiacoCitaInput)
    pliegueSuprailiacoCitaInput.value = cita.pliegueSuprailiaco || "";

  if (nivelActividadCitaSelect)
    nivelActividadCitaSelect.value = cita.nivelActividad || "sedentario";
  if (restriccionCaloricaCitaSelect)
    restriccionCaloricaCitaSelect.value = cita.restriccionCalorica || "0";

  // Los spans de resultados se actualizarán con realizarTodosLosCalculos()

  if (diagnosticoGeneralCitaTextarea)
    diagnosticoGeneralCitaTextarea.value = cita.diagnosticoGeneral || "";

  if (porcCarbsCitaInput) porcCarbsCitaInput.value = cita.porcCarbs || "50";
  if (porcLipidosCitaInput)
    porcLipidosCitaInput.value = cita.porcLipidos || "30";
  if (porcProteinasCitaInput)
    porcProteinasCitaInput.value = cita.porcProteinas || "20";

  if (notaNutricionalCitaTextarea)
    notaNutricionalCitaTextarea.value = cita.notaNutricional || "";

  if (citaIdInput) citaIdInput.value = cita.id; // Importante para saber que estamos editando

  poblarPlanAlimentacionConDatos(cita.planAlimentacion);

  realizarTodosLosCalculos(); // Recalcular todo con los datos cargados
  if (btnCancelarEdicionCita) btnCancelarEdicionCita.classList.remove("hidden");
}

async function editarCita(idCita) {
  if (!pacienteSeleccionadoId || !idCita) {
    alert("ID de paciente o cita no válido para editar.");
    return;
  }

  try {
    const citaDocRef = doc(
      db,
      "pacientes",
      pacienteSeleccionadoId,
      "citas",
      idCita
    );
    const citaSnap = await getDoc(citaDocRef);

    if (citaSnap.exists()) {
      const datosCita = { id: citaSnap.id, ...citaSnap.data() };
      // Asegúrate de que los datos base del paciente (género, edad, altura) estén disponibles
      // en los campos ocultos, ya que poblarFormularioConDatosCita y realizarTodosLosCalculos dependen de ellos.
      // Esto normalmente se maneja cuando se selecciona el paciente.

      poblarFormularioConDatosCita(datosCita); // Esta función llena el formulario y llama a realizarTodosLosCalculos

      if (formCita) formCita.scrollIntoView({ behavior: "smooth" });
      if (btnCancelarEdicionCita)
        btnCancelarEdicionCita.classList.remove("hidden");
      // alert("Datos de la cita cargados para edición."); // Opcional: feedback al usuario
    } else {
      alert("No se encontraron los datos de la cita para editar.");
      console.warn(
        `Cita con ID ${idCita} no encontrada para paciente ${pacienteSeleccionadoId}`
      );
    }
  } catch (error) {
    console.error("Error al cargar la cita para editar:", error);
    alert("Error al cargar la cita para editar. Por favor, revise la consola.");
  }
}

async function exportarCitaAPdf(idCita) {
  if (!pacienteSeleccionadoId || !idCita) {
    alert("No hay una cita seleccionada o datos de paciente para exportar.");
    return;
  }

  try {
    const citaDocRef = doc(
      db,
      "pacientes",
      pacienteSeleccionadoId,
      "citas",
      idCita
    );
    const citaSnap = await getDoc(citaDocRef);
    const pacienteDocRef = doc(db, "pacientes", pacienteSeleccionadoId);
    const pacienteSnap = await getDoc(pacienteDocRef);

    if (!citaSnap.exists() || !pacienteSnap.exists()) {
      alert(
        "No se encontraron los datos de la cita o del paciente para generar el PDF."
      );
      return;
    }

    const datosCita = citaSnap.data();
    const datosPaciente = pacienteSnap.data();

    // Asumiendo que jsPDF y autoTable están disponibles globalmente (ej. vía CDN en HTML)
    const pdf = new jsPDF(); // Usa el constructor global jsPDF

    // Título
    pdf.setFontSize(18);
    pdf.text("Resumen de Cita Nutricional", 14, 22);

    // Datos del Paciente
    pdf.setFontSize(12);
    pdf.text("Datos del Paciente:", 14, 32);
    const pacienteInfo = [
      [
        "Nombre:",
        `${datosPaciente.nombre || ""} ${datosPaciente.apellidoPaterno || ""} ${
          datosPaciente.apellidoMaterno || ""
        }`.trim(),
      ],
      [
        "Edad:",
        `${datosPaciente.edad || "N/A"} años`,
        "Género:",
        datosPaciente.genero || "N/A",
      ],
      [
        "Teléfono:",
        datosPaciente.telefono || "N/A",
        "Correo:",
        datosPaciente.correo || "N/A",
      ],
      [
        "Ocupación:",
        datosPaciente.ocupacion || "N/A",
        "Altura:",
        `${datosPaciente.altura || "N/A"} cm`,
      ],
    ];
    autoTable(pdf, {
      startY: 36,
      body: pacienteInfo,
      theme: "plain",
      styles: { fontSize: 10 },
    });
    let currentY = pdf.lastAutoTable.finalY + 10;

    // Datos de la Cita
    pdf.setFontSize(12);
    let fechaCitaObj;
    if (datosCita.fecha && datosCita.fecha.toDate) {
      // Timestamp de Firestore
      fechaCitaObj = datosCita.fecha.toDate();
    } else if (datosCita.fecha) {
      // Fecha como string YYYY-MM-DD
      fechaCitaObj = new Date(datosCita.fecha + "T00:00:00"); // Interpretar como fecha local
    } else {
      fechaCitaObj = new Date(); // Fallback
    }
    pdf.text(
      `Datos de la Cita (Fecha: ${fechaCitaObj.toLocaleDateString()}):`,
      14,
      currentY
    );
    currentY += 4;
    const citaAntropo = [
      [
        "Peso:",
        `${datosCita.peso || "N/A"} kg`,
        "C. Cintura:",
        `${datosCita.circCintura || "N/A"} cm`,
      ],
      [
        "C. Cadera:",
        `${datosCita.circCadera || "N/A"} cm`,
        "C. Brazo:",
        `${datosCita.circBrazo || "N/A"} cm`,
      ],
      [
        "P. Bicipital:",
        `${datosCita.pliegueBicipital || "N/A"} mm`,
        "P. Tricipital:",
        `${datosCita.pliegueTricipital || "N/A"} mm`,
      ],
      [
        "P. Subescapular:",
        `${datosCita.pliegueSubescapular || "N/A"} mm`,
        "P. Suprailiaco:",
        `${datosCita.pliegueSuprailiaco || "N/A"} mm`,
      ],
    ];
    autoTable(pdf, {
      startY: currentY,
      body: citaAntropo,
      theme: "grid",
      headStyles: { fillColor: [220, 220, 220], textColor: 0 },
      columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } },
    });
    currentY = pdf.lastAutoTable.finalY + 6;

    // Resultados y Diagnóstico
    pdf.setFontSize(11);
    pdf.text("Resultados y Diagnóstico:", 14, currentY);
    currentY += 4;
    const resultadosData = [
      [
        "IMC:",
        `${datosCita.imc || "N/A"} (${datosCita.imcDiagnostico || "-"})`,
      ],
      [
        "% Grasa (Siri):",
        `${datosCita.porcGrasaSiri || "N/A"}% (${
          datosCita.grasaDiagnostico || "-"
        })`,
      ],
      [
        "TMB (Harris-B):",
        `${datosCita.tmbHarrisBenedict || "N/A"} kcal`,
        "TMB (Pulgar):",
        `${datosCita.tmbPulgar || "N/A"} kcal`,
      ],
      ["GET:", `${datosCita.getCalculado || "N/A"} kcal`],
      [
        "Calorías Dieta:",
        `${datosCita.caloriasDietaFinal || "N/A"} kcal (Restricción: ${
          datosCita.restriccionCalorica || 0
        } kcal)`,
      ],
    ];
    autoTable(pdf, {
      startY: currentY,
      body: resultadosData,
      theme: "grid",
      columnStyles: { 0: { fontStyle: "bold" } },
    });
    currentY = pdf.lastAutoTable.finalY + 6;

    pdf.setFontSize(10);
    pdf.text("Diagnóstico General:", 14, currentY);
    currentY += 4; // Espacio antes del texto
    pdf.setFontSize(9);
    const diagGeneralLines = pdf.splitTextToSize(
      datosCita.diagnosticoGeneral || "Sin diagnóstico general.",
      180
    );
    pdf.text(diagGeneralLines, 14, currentY);
    // Calcular altura del texto correctamente
    const lineHeightDiag =
      (Math.max(1, pdf.getLineHeightFactor()) * pdf.getFontSize()) /
      pdf.getUnitFactor();
    currentY += diagGeneralLines.length * lineHeightDiag + 6;

    // Distribución de Macronutrientes
    if (currentY > 260) {
      pdf.addPage();
      currentY = 20;
    }
    pdf.setFontSize(11);
    pdf.text("Distribución de Macronutrientes:", 14, currentY);
    currentY += 4;
    const macrosData = [
      [
        "Carbohidratos:",
        `${datosCita.porcCarbs || 0}% (${datosCita.gramosCarbs || 0}g)`,
      ],
      [
        "Lípidos:",
        `${datosCita.porcLipidos || 0}% (${datosCita.gramosLipidos || 0}g)`,
      ],
      [
        "Proteínas:",
        `${datosCita.porcProteinas || 0}% (${datosCita.gramosProteinas || 0}g)`,
      ],
    ];
    autoTable(pdf, {
      startY: currentY,
      body: macrosData,
      theme: "grid",
      columnStyles: { 0: { fontStyle: "bold" } },
    });
    currentY = pdf.lastAutoTable.finalY + 6;

    // Nota Nutricional
    if (datosCita.notaNutricional) {
      if (currentY > 250) {
        pdf.addPage();
        currentY = 20;
      }
      pdf.setFontSize(11);
      pdf.text("Nota Nutricional Adicional:", 14, currentY);
      currentY += 4;
      pdf.setFontSize(9);
      const notaLines = pdf.splitTextToSize(datosCita.notaNutricional, 180);
      pdf.text(notaLines, 14, currentY);
      const lineHeightNota =
        (Math.max(1, pdf.getLineHeightFactor()) * pdf.getFontSize()) /
        pdf.getUnitFactor();
      currentY += notaLines.length * lineHeightNota + 6;
    }

    // Plan de Alimentación
    if (datosCita.planAlimentacion && datosCita.planAlimentacion.length > 0) {
      if (currentY > 230) {
        pdf.addPage();
        currentY = 20;
      } // Más espacio para el título del plan
      pdf.setFontSize(12);
      pdf.text("Plan de Alimentación Sugerido:", 14, currentY);
      currentY += 6;

      datosCita.planAlimentacion.forEach((plan, index) => {
        const planTitleHeight = pdf.getFontSize() * 1.2; // Altura estimada para el título del plan
        const planDescMaxHeight = 50; // Estimación altura descripción
        const tableMinHeight = 30; // Estimación altura mínima tabla tiempos
        if (
          currentY + planTitleHeight + planDescMaxHeight + tableMinHeight >
          280
        ) {
          // Margen inferior de ~10mm (297-10)
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFontSize(10);
        pdf.setFillColor(230, 230, 230); // Gris claro
        const rectY = currentY - pdf.getFontSize() * 0.7; // Ajustar Y para que el texto quede centrado verticalmente
        const rectHeight = pdf.getFontSize() * 1.2;
        pdf.rect(14, rectY, 182, rectHeight, "F");
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, "bold");
        pdf.text(plan.nombre || `Dieta ${index + 1}`, 16, currentY);
        pdf.setFont(undefined, "normal");
        currentY += rectHeight; // Avanzar Y después del rectángulo del título

        if (plan.descripcion) {
          pdf.setFontSize(9);
          const descLines = pdf.splitTextToSize(plan.descripcion, 180);
          // Verificar si la descripción cabe
          const descHeight =
            (descLines.length *
              Math.max(1, pdf.getLineHeightFactor()) *
              pdf.getFontSize()) /
            pdf.getUnitFactor();
          if (currentY + descHeight > 280) {
            pdf.addPage();
            currentY = 20;
          }
          pdf.text(descLines, 16, currentY);
          currentY += descHeight + 3; // Espacio después de la descripción
        }

        if (plan.tiempos && plan.tiempos.length > 0) {
          const tiemposBody = plan.tiempos.map((t) => [t.nombre, t.detalle]);
          // Verificar si la tabla cabe, autoTable maneja saltos de página para el cuerpo si es largo
          autoTable(pdf, {
            startY: currentY,
            head: [["Tiempo de Comida", "Detalle / Alimentos Sugeridos"]],
            body: tiemposBody,
            theme: "striped",
            headStyles: {
              fillColor: [100, 100, 100],
              textColor: [255, 255, 255],
            },
            styles: { fontSize: 8, cellPadding: 1.5 },
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: "auto" } },
            didDrawPage: function (data) {
              // Actualizar currentY si autoTable crea nueva página
              currentY = data.cursor.y + 5;
            },
            willDrawCell: function (data) {
              // Evitar que el texto de la celda se divida torpemente
              if (data.row.section === "body" && data.column.index === 1) {
                if (data.cell.raw && typeof data.cell.raw === "string") {
                  // Truncar texto si es muy largo para una celda y no se maneja bien el salto
                  // o asegurarse que el alto de la fila es suficiente.
                  // autoTable debería manejar esto, pero es un punto a revisar si hay problemas.
                }
              }
            },
          });
          currentY = pdf.lastAutoTable.finalY + 5; // Asegurar que currentY se actualiza
        } else {
          currentY += 3;
        }
      });
    }

    pdf.save(
      `ResumenCita_${(datosPaciente.nombre || "Paciente").replace(
        /\s+/g,
        "_"
      )}_${datosCita.fecha || "sinfecha"}.pdf`
    );
    // alert("PDF generado y descarga iniciada."); // Opcional
  } catch (error) {
    console.error("Error al generar el PDF de la cita:", error);
    alert("Error al generar el PDF. Por favor, revise la consola.");
  }
}

// --- INICIALIZACIÓN DE LA PÁGINA ---
async function initializeCitasPage() {
  // Asignación de elementos del DOM
  formCita = document.getElementById("form-cita");
  listaCitasHistorialDiv = document.getElementById("lista-citas-historial");
  seleccionarPacienteCitaSelect = document.getElementById(
    "seleccionar-paciente-cita"
  );
  nombrePacienteHistorialCitaSpan = document.getElementById(
    "nombre-paciente-historial-cita"
  );
  noPacienteSeleccionadoText = document.getElementById(
    "no-paciente-seleccionado-text"
  );
  citaIdInput = document.getElementById("cita-id");
  pacienteIdCitaInput = document.getElementById("paciente-id-cita");
  fechaCitaInput = document.getElementById("fecha-cita");
  nombreCompletoPacienteDisplaySpan = document.getElementById(
    "nombre-completo-paciente-display"
  );
  ocupacionPacienteDisplaySpan = document.getElementById(
    "ocupacion-paciente-display"
  );
  telefonoPacienteDisplaySpan = document.getElementById(
    "telefono-paciente-display"
  );
  correoPacienteDisplaySpan = document.getElementById(
    "correo-paciente-display"
  );
  fechaRegistroPacienteDisplaySpan = document.getElementById(
    "fecha-registro-paciente-display"
  );
  generoPacienteDisplaySpan = document.getElementById(
    "genero-paciente-display"
  );
  edadPacienteDisplaySpan = document.getElementById("edad-paciente-display");
  alturaPacienteDisplaySpan = document.getElementById(
    "altura-paciente-display"
  );
  generoPacienteHiddenInput = document.getElementById("genero-paciente-hidden");
  edadPacienteHiddenInput = document.getElementById("edad-paciente-hidden");
  alturaPacienteHiddenInput = document.getElementById("altura-paciente-hidden");
  pesoCitaInput = document.getElementById("peso-cita");
  circCinturaCitaInput = document.getElementById("circ-cintura-cita");
  circCaderaCitaInput = document.getElementById("circ-cadera-cita");
  circBrazoCitaInput = document.getElementById("circ-brazo-cita");
  pliegueBicipitalCitaInput = document.getElementById("pliegue-bicipital-cita");
  pliegueTricipitalCitaInput = document.getElementById(
    "pliegue-tricipital-cita"
  );
  pliegueSubescapularCitaInput = document.getElementById(
    "pliegue-subescapular-cita"
  );
  pliegueSuprailiacoCitaInput = document.getElementById(
    "pliegue-suprailiaco-cita"
  );
  nivelActividadCitaSelect = document.getElementById("nivel-actividad-cita");
  restriccionCaloricaCitaSelect = document.getElementById(
    "restriccion-calorica-cita"
  );
  tmbHarrisBenedictCitaSpan = document.getElementById(
    "tmb-harris-benedict-cita"
  );
  tmbPulgarCitaSpan = document.getElementById("tmb-pulgar-cita");
  getTotalCitaSpan = document.getElementById("get-total-cita");
  caloriasFinalesDietaCitaSpan = document.getElementById(
    "calorias-finales-dieta-cita"
  );
  imcCitaSpan = document.getElementById("imc-cita");
  imcDiagnosticoCitaSpan = document.getElementById("imc-diagnostico-cita");
  porcGrasaSiriCitaSpan = document.getElementById("porc-grasa-siri-cita");
  grasaDiagnosticoCitaSpan = document.getElementById("grasa-diagnostico-cita");
  diagnosticoGeneralCitaTextarea = document.getElementById(
    "diagnostico-general-cita"
  );
  porcCarbsCitaInput = document.getElementById("porc-carbs-cita");
  porcLipidosCitaInput = document.getElementById("porc-lipidos-cita");
  porcProteinasCitaInput = document.getElementById("porc-proteinas-cita");
  sumaMacrosPorcCitaSpan = document.getElementById("suma-macros-porc-cita");
  gramosCarbsCitaSpan = document.getElementById("gramos-carbs-cita");
  gramosLipidosCitaSpan = document.getElementById("gramos-lipidos-cita");
  gramosProteinasCitaSpan = document.getElementById("gramos-proteinas-cita");
  perdidaSemanalCitaSpan = document.getElementById("perdida-semanal-cita");
  perdida15diasCitaSpan = document.getElementById("perdida-15dias-cita");
  perdida30diasCitaSpan = document.getElementById("perdida-30dias-cita");
  notaNutricionalCitaTextarea = document.getElementById(
    "nota-nutricional-cita"
  );
  contenedorPlanesAlimentacionCitaDiv = document.getElementById(
    "contenedor-planes-alimentacion-cita"
  );
  btnAgregarOtraDietaCita = document.getElementById(
    "btn-agregar-otra-dieta-cita"
  );
  btnCancelarEdicionCita = document.getElementById("btn-cancelar-edicion-cita");
  btnExportarPdfCita = document.getElementById("btn-exportar-pdf-cita");

  const auth = getAuth(app);
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      globalCurrentUserIdForCitas = user.uid;
      console.log(
        "citas.js: Usuario autenticado:",
        globalCurrentUserIdForCitas
      );
      // Ahora que tenemos el ID del usuario, poblamos el select de pacientes.
      await popularSelectPacientes(); // Asegurarse de que se llame aquí y sea awaited.

      // Si ya había un paciente seleccionado en localStorage, intentar cargarlo.
      // Esto se movió dentro de popularSelectPacientes para asegurar que el select esté lleno primero.
      // if (pacienteSeleccionadoId && seleccionarPacienteCitaSelect) {
      //   seleccionarPacienteCitaSelect.value = pacienteSeleccionadoId;
      //   // Verificar si la opción realmente existe después de popular
      //   if (seleccionarPacienteCitaSelect.value === pacienteSeleccionadoId) {
      //     cargarDatosPacienteYCitas(pacienteSeleccionadoId);
      //   } else {
      //     // Si el paciente seleccionado anteriormente ya no existe, limpiar
      //     localStorage.removeItem("selectedPacienteIdCitas");
      //     pacienteSeleccionadoId = null;
      //     limpiarFormularioCompleto(false);
      //   }
      // }
    } else {
      console.log(
        "Usuario no autenticado, redirigiendo al login desde citas.js"
      );
      globalCurrentUserIdForCitas = null;
      window.location.href = "index.html";
    }
  });

  if (seleccionarPacienteCitaSelect) {
    seleccionarPacienteCitaSelect.addEventListener("change", (event) => {
      pacienteSeleccionadoId = event.target.value;
      localStorage.setItem("selectedPacienteIdCitas", pacienteSeleccionadoId);
      if (pacienteSeleccionadoId) {
        cargarDatosPacienteYCitas(pacienteSeleccionadoId);
      } else {
        limpiarFormularioCompleto(false); // Limpiar si se selecciona "Seleccione un paciente"
      }
    });
  } else {
    console.warn(
      "El elemento 'seleccionarPacienteCitaSelect' no se encontró durante la inicialización de listeners."
    );
  }

  if (btnExportarPdfCita) {
    btnExportarPdfCita.addEventListener("click", function () {
      // ... (código existente para exportar PDF) ...
    });
  } else {
    console.warn("El botón 'btnExportarPdfCita' no se encontró en el DOM.");
  }

  if (formCita) {
    formCita.addEventListener("submit", (event) => {
      event.preventDefault(); // Prevenir el envío por defecto del formulario
      guardarCita();
    });
  } else {
    console.warn("El formulario 'formCita' no se encontró en el DOM.");
  }

  if (btnCancelarEdicionCita) {
    btnCancelarEdicionCita.addEventListener("click", () => {
      resetearFormularioCita(true); // Mantener datos del paciente, limpiar campos de cita
      // Opcional: limpiar selección de paciente si es necesario
      // if (seleccionarPacienteCitaSelect) seleccionarPacienteCitaSelect.value = "";
      // limpiarFormularioCompleto(false);
    });
  } else {
    // Comentado para evitar el error si el botón no siempre está presente.
    // console.warn("El botón 'btnCancelarEdicionCita' no se encontró en el DOM.");
  }

  if (btnAgregarOtraDietaCita) {
    btnAgregarOtraDietaCita.addEventListener("click", function () {
      numeroDeDietas++;
      const nuevoPlanHTML = generarPlanAlimentacionHTML(numeroDeDietas);
      contenedorPlanesAlimentacionCitaDiv.insertAdjacentHTML(
        "beforeend",
        nuevoPlanHTML
      );
      // Agregar tiempos de comida por defecto al nuevo plan
      agregarNuevoTiempoComida(numeroDeDietas);
      agregarNuevoTiempoComida(numeroDeDietas);
      agregarNuevoTiempoComida(numeroDeDietas);
      attachEventListenersPlanAlimentacion(numeroDeDietas);
    });
  } else {
    console.warn(
      "El botón 'btnAgregarOtraDietaCita' no se encontró en el DOM."
    );
  }

  // Event listeners para campos de macronutrientes y otros que disparan cálculos
  [
    porcCarbsCitaInput,
    porcLipidosCitaInput,
    porcProteinasCitaInput,
    pesoCitaInput,
    nivelActividadCitaSelect,
    restriccionCaloricaCitaSelect,
    pliegueBicipitalCitaInput,
    pliegueTricipitalCitaInput,
    pliegueSubescapularCitaInput,
    pliegueSuprailiacoCitaInput,
  ].forEach((input) => {
    if (input) {
      input.addEventListener("input", realizarTodosLosCalculos);
    } else {
      // console.warn("Un input para cálculos no fue encontrado durante la asignación de listeners.");
    }
  });

  setDefaultFechaCita(); // Establecer la fecha por defecto al cargar la página
  actualizarSumaMacrosPorcentaje(); // Para inicializar la suma en 0% o el valor por defecto
  generarPlanAlimentacionInicial(); // Generar el primer plan de alimentación
  limpiarFormularioCompleto(false); // Asegurar un estado limpio inicial si no hay paciente
}

function limpiarFormularioCompleto(mantenerSeleccionPaciente = false) {
  resetearFormularioCita(false); // Esto ya llama a setDefaultFechaCita y limpiarSpansDeCalculo

  if (!mantenerSeleccionPaciente && seleccionarPacienteCitaSelect) {
    seleccionarPacienteCitaSelect.value = "";
    localStorage.removeItem("selectedPacienteIdCitas");
    pacienteSeleccionadoId = null;
  }

  if (nombreCompletoPacienteDisplaySpan)
    nombreCompletoPacienteDisplaySpan.textContent = "-";
  if (generoPacienteDisplaySpan) generoPacienteDisplaySpan.textContent = "-";
  if (edadPacienteDisplaySpan) edadPacienteDisplaySpan.textContent = "-";
  if (alturaPacienteDisplaySpan) alturaPacienteDisplaySpan.textContent = "-";
  if (ocupacionPacienteDisplaySpan)
    ocupacionPacienteDisplaySpan.textContent = "-";
  if (telefonoPacienteDisplaySpan)
    telefonoPacienteDisplaySpan.textContent = "-";
  if (correoPacienteDisplaySpan) correoPacienteDisplaySpan.textContent = "-";
  if (fechaRegistroPacienteDisplaySpan)
    fechaRegistroPacienteDisplaySpan.textContent = "-";

  if (nombrePacienteHistorialCitaSpan)
    nombrePacienteHistorialCitaSpan.textContent = "-";
  if (listaCitasHistorialDiv)
    listaCitasHistorialDiv.innerHTML =
      "<p>Seleccione un paciente para ver su historial.</p>";
  if (noPacienteSeleccionadoText)
    noPacienteSeleccionadoText.style.display = "block";
  if (formCita) formCita.style.display = "none";

  // Los campos ocultos de paciente se limpian en resetearFormularioCita si no se mantienen datos
}

document.addEventListener("DOMContentLoaded", initializeCitasPage);
