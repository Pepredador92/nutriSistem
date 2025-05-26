import { app, db } from "./firebase-config.js"; // Importar app y db
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  updateDoc,
  addDoc,
  getDoc,
  getDocs, // Importar getDocs
  collection as firestoreCollection, // Renombrar collection a firestoreCollection para evitar conflictos de nombres
  query, // Importar query
  where, // Importar where
  orderBy, // Importar orderBy para ordenar por nombre
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // Importar funciones de Firestore

// --- AUTENTICACIÓN Y DATOS DE USUARIO ---
let localCurrentUserId = null; // Renombrado de currentUserId. Se establecerá con onAuthStateChanged

// Función para obtener todos los pacientes de Firestore DEL USUARIO ESPECIFICADO
export async function obtenerPacientesDeFirestore(userId) {
  // userId es ahora un parámetro requerido
  // Asegurarse de que userId fue proporcionado
  if (!userId) {
    console.error(
      // Cambiado a error para mayor visibilidad
      "obtenerPacientesDeFirestore: Se requiere userId, pero no fue proporcionado."
    );
    return []; // Devolver array vacío si no hay ID de usuario.
  }

  console.log(
    `obtenerPacientesDeFirestore: Buscando pacientes para el usuario: ${userId}` // Usar el userId pasado como argumento
  );
  const pacientesRef = firestoreCollection(db, "pacientes");
  // Modificar la consulta para que coincida con el índice creado
  // El índice es: userId ASC, nombre ASC, apellido ASC, __name__ ASC
  // Si solo necesitas ordenar por nombre, y luego implícitamente por __name__ (ID del documento),
  // el índice que creaste (userId ASC, nombre ASC, __name__ ASC) debería ser suficiente.
  // Si también ordenas por apellido, asegúrate de que el índice lo incluya y la consulta también.
  // Por ahora, asumimos que el índice que creaste (userId, nombre, __name__) es el objetivo.
  // Si el índice es userId, nombre, apellido, __name__, entonces la consulta debería ser:
  // const q = query(
  //   pacientesRef,
  //   where("userId", "==", userId),
  //   orderBy("nombre"),
  //   orderBy("apellido") // Si este es el caso
  // );
  // Basado en tu descripción del índice: "userId Ascendente nombre Ascendente apellido Ascendente __name__ Ascendente"
  // La consulta debería ser:
  const q = query(
    pacientesRef,
    where("userId", "==", userId),
    orderBy("nombre"),
    orderBy("apellido") // Añadido para que coincida con el índice que especificaste
  );

  try {
    const querySnapshot = await getDocs(q);
    const pacientes = [];
    querySnapshot.forEach((doc) => {
      pacientes.push({ id: doc.id, ...doc.data() });
    });
    console.log("obtenerPacientesDeFirestore: Pacientes obtenidos:", pacientes);
    return pacientes;
  } catch (error) {
    console.error("Error al obtener pacientes de Firestore:", error);
    // Considera mostrar un mensaje de error al usuario o manejar el error de forma más robusta.
    return []; // Devolver array vacío en caso de error
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const auth = getAuth(app); // Ahora app está correctamente importada

  // Proteger la página: si no hay usuario, redirigir a index.html
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log(
        "Usuario no autenticado, redirigiendo al login desde pacientes.js"
      );
      // Redirigir solo si estamos en una página que realmente lo necesita (ej. el formulario de paciente o listado de pacientes)
      // Esto evita redirecciones si pacientes.js solo se usa como módulo.
      if (
        document.getElementById("form-paciente") ||
        window.location.pathname.includes("pacientes.html") ||
        window.location.pathname.includes("listado-pacientes.html")
      ) {
        window.location.href = "index.html";
      }
    } else {
      localCurrentUserId = user.uid; // Establecer el ID del usuario actual para este módulo
      console.log("pacientes.js: Usuario autenticado:", localCurrentUserId);
      // Usuario autenticado, podemos proceder a cargar datos específicos del usuario si es necesario
      // Por ejemplo, llamar a cargarPacienteParaEdicion() aquí si depende del usuario.
      // O asegurar que las funciones que dependen del user.uid se llamen después de esta confirmación.
      if (document.getElementById("form-paciente")) {
        // Solo llamar si el formulario está presente
        cargarPacienteParaEdicion();
      }
    }
  });

  const logoutButtonSidebar = document.getElementById("logout-btn-sidebar");
  if (logoutButtonSidebar) {
    logoutButtonSidebar.addEventListener("click", async () => {
      try {
        await signOut(auth);
        console.log("Sesión cerrada exitosamente desde pacientes.js.");
        window.location.href = "index.html";
      } catch (error) {
        console.error("Error al cerrar sesión desde pacientes.js:", error);
      }
    });
  }

  // Verificar si estamos en la página de pacientes para registrar/editar
  if (!document.getElementById("form-paciente")) {
    // Asumimos que el form solo está en pacientes.html
    return;
  }

  const formPaciente = document.getElementById("form-paciente");
  // const listaPacientesDiv = document.getElementById('lista-pacientes'); // Ya no está en esta página
  const pacienteIdInput = document.getElementById("paciente-id");
  const nombreInput = document.getElementById("nombre");
  const apellidoInput = document.getElementById("apellido");
  const edadInput = document.getElementById("edad");
  const fechaInput = document.getElementById("fecha"); // Cambiado de fechaCitaPacienteInput
  const telefonoInput = document.getElementById("telefono");
  const correoInput = document.getElementById("correo");
  const ocupacionInput = document.getElementById("ocupacion");
  const cancelarEdicionBtn = document.getElementById(
    "cancelar-edicion-paciente"
  );

  // Ya no se necesitan referencias a filtros, select de últimos pacientes, etc., en esta página.
  // const filtroNombreInput = document.getElementById('filtro-nombre-paciente');
  // const filtroFechaCitaInput = document.getElementById('filtro-fecha-cita-paciente');
  // const btnExportarPacientes = document.getElementById('exportar-pacientes-json');
  // const inputImportarPacientes = document.getElementById('importar-pacientes-json');
  // const selectUltimosPacientes = document.getElementById('select-ultimos-pacientes');
  // const historialPacienteSeleccionadoDiv = document.getElementById('historial-paciente-seleccionado');

  // let pacientes = cargarPacientes(); // Ya no se usa el array local de pacientes directamente aquí
  // Firestore será la fuente de verdad.

  function setDefaultFecha() {
    // Cambiado de setDefaultFechaCita
    if (fechaInput && !pacienteIdInput.value) {
      const today = new Date();
      const year = today.getFullYear();
      const month = ("0" + (today.getMonth() + 1)).slice(-2);
      const day = ("0" + today.getDate()).slice(-2);
      fechaInput.value = `${year}-${month}-${day}`; // Cambiado de fechaCitaPacienteInput
    }
  }

  // Las funciones poblarUltimosPacientes, mostrarHistorialPaciente y renderPacientes (para la lista completa)
  // se moverán o ya están en listado-pacientes.js

  formPaciente.addEventListener("submit", async function (event) {
    // Marcar la función como async
    event.preventDefault();

    const user = auth.currentUser; // Obtener el usuario current
    if (!user) {
      alert("No hay un usuario autenticado. Por favor, inicie sesión.");
      return;
    }

    const id = pacienteIdInput.value;
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const ocupacion = document.getElementById("ocupacion").value.trim();
    const genero = document.getElementById("genero").value;
    const edad = document.getElementById("edad").value;
    const altura = document.getElementById("altura").value;
    const fechaCita = document.getElementById("fecha").value; // Asumo que es fecha de registro

    if (
      !nombre ||
      !apellidoInput.value ||
      !genero ||
      !edad ||
      !altura ||
      !fechaCita
    ) {
      alert(
        "Por favor, complete todos los campos obligatorios: Nombre, Apellido, Género, Edad, Altura y Fecha de Registro."
      );
      return;
    }
    if (parseInt(edad) <= 0 || parseInt(altura) <= 0) {
      alert("La edad y la altura deben ser valores positivos.");
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
      ultimaModificacion: new Date().toISOString(),
      // userId: user.uid, // Añadir el userId al crear o actualizar << SE AÑADIRÁ ABAJO SELECTIVAMENTE
    };

    try {
      if (id) {
        // Editando paciente existente
        // Antes de actualizar, idealmente verificaríamos si este paciente pertenece al usuario.
        // Las reglas de Firestore serán la principal protección aquí.
        const pacienteRef = doc(db, "pacientes", id);
        // No se modifica el userId al editar, se asume que ya está y es correcto.
        // Si se quisiera permitir cambiar de "dueño", la lógica sería más compleja y necesitaría reglas de seguridad acordes.
        await updateDoc(pacienteRef, paciente); // paciente ya tiene los campos actualizados, excepto userId
        alert("Paciente actualizado con éxito.");
      } else {
        // Creando nuevo paciente
        paciente.userId = user.uid; // Añadir el userId SOLO al crear un nuevo paciente
        const docRef = await addDoc(
          firestoreCollection(db, "pacientes"),
          paciente
        );
        alert("Paciente guardado con éxito con ID: " + docRef.id);
      }
      formPaciente.reset();
      pacienteIdInput.value = ""; // Limpiar ID para nuevo registro
      setDefaultFecha();
    } catch (error) {
      console.error("Error al guardar paciente: ", error);
      alert(
        "Error al guardar el paciente. Verifique la consola para más detalles."
      );
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
    const pacienteIdParaEditar = localStorage.getItem("pacienteIdParaEditar"); // Corregido el nombre de la clave
    if (pacienteIdParaEditar) {
      const auth = getAuth(app); // Asegurarse de tener auth
      const user = auth.currentUser;

      if (!user) {
        console.log("cargarPacienteParaEdicion: Usuario no logueado.");
        localStorage.removeItem("pacienteIdParaEditar"); // Limpiar para evitar reintentos
        return;
      }

      const pacienteRef = doc(db, "pacientes", pacienteIdParaEditar);
      getDoc(pacienteRef)
        .then((docSnap) => {
          // Cambiado el nombre de la variable doc a docSnap
          if (docSnap.exists()) {
            const pacienteData = docSnap.data(); // Renombrado para claridad

            // Verificar si el paciente pertenece al usuario actual
            if (pacienteData.userId !== user.uid) {
              console.warn(
                "Intento de editar un paciente que no pertenece al usuario actual."
              );
              alert(
                "No tiene permiso para editar este paciente o el paciente no existe."
              );
              localStorage.removeItem("pacienteIdParaEditar");
              formPaciente.reset();
              pacienteIdInput.value = "";
              setDefaultFecha();
              cancelarEdicionBtn.style.display = "none";
              return;
            }

            pacienteIdInput.value = docSnap.id;
            nombreInput.value = pacienteData.nombre;
            apellidoInput.value = pacienteData.apellido;
            edadInput.value = pacienteData.edad;
            // Asegúrate de que el formato de fecha sea compatible con el input type="date" (YYYY-MM-DD)
            fechaInput.value = pacienteData.fechaRegistro
              ? pacienteData.fechaRegistro.split("T")[0]
              : ""; // Usar fechaRegistro
            telefonoInput.value = pacienteData.telefono || "";
            correoInput.value = pacienteData.correo || "";
            ocupacionInput.value = pacienteData.ocupacion || "";
            document.getElementById("genero").value = pacienteData.genero || "";
            document.getElementById("altura").value = pacienteData.altura || "";
            cancelarEdicionBtn.style.display = "inline-block";
          } else {
            console.log("No se encontró el paciente en Firestore para editar.");
            alert("No se pudo cargar el paciente para editar.");
          }
          localStorage.removeItem("pacienteIdParaEditar"); // Corregido el nombre de la clave
        })
        .catch((error) => {
          console.error(
            "Error al cargar paciente de Firestore para edición: ",
            error
          );
          alert("Error al cargar datos del paciente.");
          localStorage.removeItem("pacienteIdParaEditar"); // Corregido el nombre de la clave
        });
    }
  }

  // window.editarPaciente ya no es necesaria globalmente desde aquí, se manejará en listado-pacientes.js
  // para redirigir o pasar el ID.

  cancelarEdicionBtn.addEventListener("click", function () {
    formPaciente.reset();
    pacienteIdInput.value = "";
    setDefaultFecha(); // Cambiado de setDefaultFechaCita
    cancelarEdicionBtn.style.display = "none";
  });

  // La función eliminarPaciente se manejará completamente en listado-pacientes.js
  // window.eliminarPaciente = function(id) { ... }

  // Las funciones de filtro, exportar/importar también se mueven a listado-pacientes.js

  // Inicialización para la página de registro/edición de pacientes
  setDefaultFecha(); // Cambiado de setDefaultFechaCita
  // cargarPacienteParaEdicion(); // Se mueve dentro de onAuthStateChanged para asegurar que user esté disponible
});
