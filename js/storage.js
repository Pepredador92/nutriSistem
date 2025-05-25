// Funciones para manejar el almacenamiento de datos (localStorage y JSON)

const STORAGE_KEY_PACIENTES = 'nutriSistemPacientes';
const STORAGE_KEY_CITAS = 'nutriSistemCitas';

// --- Funciones Genéricas para localStorage ---

function guardarEnLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Error guardando en localStorage (${key}):`, error);
        return false;
    }
}

function cargarDesdeLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error cargando desde localStorage (${key}):`, error);
        return [];
    }
}

// --- Funciones para exportar/importar JSON ---

function descargarJSON(data, filename) {
    if (!data || data.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }
    const jsonString = JSON.stringify(data, null, 2); // null, 2 para formatear con indentación
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importarJSON(event, callback) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                if (callback && typeof callback === 'function') {
                    callback(jsonData);
                }
            } catch (error) {
                console.error("Error al parsear el archivo JSON:", error);
                alert("Error al leer el archivo JSON. Asegúrate de que el formato es correcto.");
            }
        };
        reader.readAsText(file);
    }
}

// --- Funciones específicas para Pacientes ---

function guardarPacientes(pacientes) {
    return guardarEnLocalStorage(STORAGE_KEY_PACIENTES, pacientes);
}

function cargarPacientes() {
    return cargarDesdeLocalStorage(STORAGE_KEY_PACIENTES);
}

// --- Funciones específicas para Citas ---

function guardarCitas(citas) {
    // Las citas se guardan como un objeto donde la clave es el ID del paciente
    // y el valor es un array de sus citas.
    // Ejemplo: { "pacienteId1": [cita1, cita2], "pacienteId2": [cita3] }
    return guardarEnLocalStorage(STORAGE_KEY_CITAS, citas);
}

function cargarCitas() {
    const citas = cargarDesdeLocalStorage(STORAGE_KEY_CITAS);
    return citas && typeof citas === 'object' && !Array.isArray(citas) ? citas : {};
}

function cargarCitasDePaciente(pacienteId) {
    const todasLasCitas = cargarCitas();
    return todasLasCitas[pacienteId] || [];
}

function guardarCitasDePaciente(pacienteId, citasPaciente) {
    const todasLasCitas = cargarCitas();
    todasLasCitas[pacienteId] = citasPaciente;
    return guardarCitas(todasLasCitas);
}

// --- Funciones para exportar toda la data ---
function exportarTodaLaData() {
    const pacientes = cargarPacientes();
    const citas = cargarCitas();
    const todaLaData = {
        pacientes: pacientes,
        citas: citas,
        fechaExportacion: new Date().toISOString()
    };
    descargarJSON(todaLaData, 'nutrisistem_backup_pacientes_y_citas.json');
}

// --- Funciones para importar toda la data ---
function importarTodaLaData(event, callbackPacientes, callbackCitas) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                if (jsonData && jsonData.pacientes && jsonData.citas) {
                    if (callbackPacientes && typeof callbackPacientes === 'function') {
                        callbackPacientes(jsonData.pacientes);
                    }
                    if (callbackCitas && typeof callbackCitas === 'function') {
                        callbackCitas(jsonData.citas);
                    }
                    alert("Datos importados correctamente. Refresca la página si es necesario.");
                } else {
                    alert("El archivo JSON no tiene el formato esperado para una importación completa.");
                }
            } catch (error) {
                console.error("Error al parsear el archivo JSON de backup:", error);
                alert("Error al leer el archivo JSON de backup.");
            }
        };
        reader.readAsText(file);
        // Limpiar el valor del input para permitir importar el mismo archivo de nuevo si es necesario
        event.target.value = null; 
    }
}


// Inicializar botón de exportar toda la data si existe en la página (ej. dashboard)
document.addEventListener('DOMContentLoaded', () => {
    const btnExportarTodo = document.getElementById('exportar-toda-la-data-btn');
    if (btnExportarTodo) {
        btnExportarTodo.addEventListener('click', exportarTodaLaData);
    }

    const inputImportarTodo = document.getElementById('importar-toda-la-data-input');
    if (inputImportarTodo) {
        inputImportarTodo.addEventListener('change', (event) => {
            if (confirm("¿Estás seguro de que quieres importar todos los datos? Esto sobrescribirá los datos locales existentes.")) {
                importarTodaLaData(event, guardarPacientes, guardarCitas);
            } else {
                event.target.value = null; // Limpiar el input si el usuario cancela
            }
        });
    }
});
