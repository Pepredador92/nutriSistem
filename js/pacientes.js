import { db } from "./firebase-config.js"; // Importar db para usar Firestore
import { doc, updateDoc, addDoc, getDoc, collection as firestoreCollection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // Importar funciones de Firestore

document.addEventListener('DOMContentLoaded', function() {
    // Verificar si estamos en la página de pacientes para registrar/editar
    if (!document.getElementById('form-paciente')) { // Asumimos que el form solo está en pacientes.html
        return;
    }

    const formPaciente = document.getElementById('form-paciente');
    // const listaPacientesDiv = document.getElementById('lista-pacientes'); // Ya no está en esta página
    const pacienteIdInput = document.getElementById('paciente-id');
    const nombreInput = document.getElementById('nombre');
    const apellidoInput = document.getElementById('apellido');
    const edadInput = document.getElementById('edad');
    const fechaInput = document.getElementById('fecha'); // Cambiado de fechaCitaPacienteInput
    const telefonoInput = document.getElementById('telefono');
    const correoInput = document.getElementById('correo');
    const ocupacionInput = document.getElementById('ocupacion');
    const cancelarEdicionBtn = document.getElementById('cancelar-edicion-paciente');

    // Ya no se necesitan referencias a filtros, select de últimos pacientes, etc., en esta página.
    // const filtroNombreInput = document.getElementById('filtro-nombre-paciente');
    // const filtroFechaCitaInput = document.getElementById('filtro-fecha-cita-paciente');
    // const btnExportarPacientes = document.getElementById('exportar-pacientes-json');
    // const inputImportarPacientes = document.getElementById('importar-pacientes-json');
    // const selectUltimosPacientes = document.getElementById('select-ultimos-pacientes');
    // const historialPacienteSeleccionadoDiv = document.getElementById('historial-paciente-seleccionado');

    // let pacientes = cargarPacientes(); // Ya no se usa el array local de pacientes directamente aquí
                                    // Firestore será la fuente de verdad.

    function setDefaultFecha() { // Cambiado de setDefaultFechaCita
        if (fechaInput && !pacienteIdInput.value) { 
            const today = new Date();
            const year = today.getFullYear();
            const month = ('0' + (today.getMonth() + 1)).slice(-2);
            const day = ('0' + today.getDate()).slice(-2);
            fechaInput.value = `${year}-${month}-${day}`; // Cambiado de fechaCitaPacienteInput
        }
    }

    // Las funciones poblarUltimosPacientes, mostrarHistorialPaciente y renderPacientes (para la lista completa)
    // se moverán o ya están en listado-pacientes.js

    formPaciente.addEventListener('submit', async function(event) { // Marcar la función como async
        event.preventDefault();
        const id = pacienteIdInput.value;
        const nombre = document.getElementById('nombre').value.trim();
        const apellido = document.getElementById('apellido').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const correo = document.getElementById('correo').value.trim();
        const ocupacion = document.getElementById('ocupacion').value.trim();
        const genero = document.getElementById('genero').value;
        const edad = document.getElementById('edad').value;
        const altura = document.getElementById('altura').value;
        const fechaCita = document.getElementById('fecha').value; // Asumo que es fecha de registro

        if (!nombre || !apellidoInput.value || !genero || !edad || !altura || !fechaCita) {
            alert('Por favor, complete todos los campos obligatorios: Nombre, Apellido, Género, Edad, Altura y Fecha de Registro.');
            return;
        }
        if (parseInt(edad) <= 0 || parseInt(altura) <= 0) {
            alert('La edad y la altura deben ser valores positivos.');
            return;
        }

        const paciente = {
            nombre,
            apellido: apellidoInput.value.trim(),
            telefono: telefonoInput.value.trim(),
            correo: correoInput.value.trim(),
            ocupacion: ocupacionInput.value.trim(),
            genero,
            edad: parseInt(edad),
            altura: parseInt(altura),
            fechaRegistro: fechaCita, // Renombrar para claridad si es fecha de registro
            ultimaModificacion: new Date().toISOString()
        };

        try {
            if (id) {
                // Editando paciente existente
                const pacienteRef = doc(db, 'pacientes', id);
                await updateDoc(pacienteRef, paciente);
                alert('Paciente actualizado con éxito.');
            } else {
                // Creando nuevo paciente
                const docRef = await addDoc(firestoreCollection(db, 'pacientes'), paciente);
                alert('Paciente guardado con éxito con ID: ' + docRef.id);
            }
            formPaciente.reset();
            pacienteIdInput.value = ''; // Limpiar ID para nuevo registro
            setDefaultFecha();
        } catch (error) {
            console.error("Error al guardar paciente: ", error);
            alert('Error al guardar el paciente. Verifique la consola para más detalles.');
        }
    });

    // La función editarPaciente ahora solo carga datos en el formulario de esta página.
    // El botón "Editar" en la página de listado deberá redirigir aquí con el ID del paciente
    // o cargar los datos si la edición se hace mediante un modal en la misma página de listado.
    // Por simplicidad, asumimos que la edición se hace en esta página.
    // Para que esto funcione, necesitaríamos una forma de pasar el ID del paciente a esta página (ej. query param)
    // o que el botón "Editar" en listado-pacientes.js guarde el ID en localStorage y esta página lo lea.
    
    // Ejemplo de cómo se podría cargar un paciente para edición si se pasa ID por localStorage:
    function cargarPacienteParaEdicion() {
        const pacienteIdParaEditar = localStorage.getItem('pacienteIdParaEditar'); // Corregido el nombre de la clave
        if (pacienteIdParaEditar) {
            const pacienteRef = doc(db, 'pacientes', pacienteIdParaEditar);
            getDoc(pacienteRef).then((docSnap) => { // Cambiado el nombre de la variable doc a docSnap
                if (docSnap.exists()) {
                    const paciente = docSnap.data();
                    pacienteIdInput.value = docSnap.id;
                    nombreInput.value = paciente.nombre;
                    apellidoInput.value = paciente.apellido;
                    edadInput.value = paciente.edad;
                    // Asegúrate de que el formato de fecha sea compatible con el input type="date" (YYYY-MM-DD)
                    fechaInput.value = paciente.fechaRegistro ? paciente.fechaRegistro.split('T')[0] : ''; // Usar fechaRegistro
                    telefonoInput.value = paciente.telefono || '';
                    correoInput.value = paciente.correo || '';
                    ocupacionInput.value = paciente.ocupacion || '';
                    document.getElementById('genero').value = paciente.genero || '';
                    document.getElementById('altura').value = paciente.altura || '';
                    cancelarEdicionBtn.style.display = 'inline-block';
                } else {
                    console.log("No se encontró el paciente en Firestore para editar.");
                    alert("No se pudo cargar el paciente para editar.");
                }
                localStorage.removeItem('pacienteIdParaEditar'); // Corregido el nombre de la clave
            }).catch((error) => {
                console.error("Error al cargar paciente de Firestore para edición: ", error);
                alert("Error al cargar datos del paciente.");
                localStorage.removeItem('pacienteIdParaEditar'); // Corregido el nombre de la clave
            });
        }
    }

    // window.editarPaciente ya no es necesaria globalmente desde aquí, se manejará en listado-pacientes.js
    // para redirigir o pasar el ID.

    cancelarEdicionBtn.addEventListener('click', function() {
        formPaciente.reset();
        pacienteIdInput.value = '';
        setDefaultFecha(); // Cambiado de setDefaultFechaCita
        cancelarEdicionBtn.style.display = 'none';
    });

    // La función eliminarPaciente se manejará completamente en listado-pacientes.js
    // window.eliminarPaciente = function(id) { ... }
    
    // Las funciones de filtro, exportar/importar también se mueven a listado-pacientes.js

    // Inicialización para la página de registro/edición de pacientes
    setDefaultFecha(); // Cambiado de setDefaultFechaCita
    cargarPacienteParaEdicion(); // Intentar cargar un paciente si se indicó para edición
});
