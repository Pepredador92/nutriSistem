// js/registro.js
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const roleSelectionDiv = document.getElementById("roleSelection");
  const btnPaciente = document.getElementById("btnPaciente");
  const btnNutriologo = document.getElementById("btnNutriologo");
  const formPaciente = document.getElementById("formPaciente");
  const registroMensaje = document.getElementById("registroMensaje");

  if (!roleSelectionDiv || !btnPaciente || !btnNutriologo || !formPaciente) {
    console.error(
      "Elementos del DOM para selección de rol o formulario de paciente no encontrados."
    );
    return;
  }

  btnPaciente.addEventListener("click", () => {
    roleSelectionDiv.classList.add("hidden");
    formPaciente.classList.remove("hidden");
  });

  btnNutriologo.addEventListener("click", () => {
    // Redirigir a la página de verificación de nutriólogo
    window.location.href = "verificacion-nutriologo.html";
  });

  // Manejo del formulario de registro de paciente
  formPaciente.addEventListener("submit", async (e) => {
    e.preventDefault();
    registroMensaje.textContent = ""; // Limpiar mensajes previos
    registroMensaje.className = "mensaje";

    const nombres = document.getElementById("pacienteNombres").value;
    const apellidos = document.getElementById("pacienteApellidos").value;
    const fechaNacimiento = document.getElementById(
      "pacienteFechaNacimiento"
    ).value;
    const telefono = document.getElementById("pacienteTelefono").value;
    const email = document.getElementById("pacienteEmail").value;
    const password = document.getElementById("pacientePassword").value;
    const passwordConfirm = document.getElementById(
      "pacientePasswordConfirm"
    ).value; // Obtener valor

    // Validar que las contraseñas coincidan
    if (password !== passwordConfirm) {
      registroMensaje.textContent = "Las contraseñas no coinciden.";
      registroMensaje.className = "mensaje error"; // Aplicar clase de error
      return; // Detener el proceso si no coinciden
    }

    try {
      // NO es necesario verificar aquí si el usuario ya existe con createUserWithEmailAndPassword.
      // Firebase Auth se encarga de esto y lanzará un error 'auth/email-already-in-use'
      // si el correo electrónico ya está registrado. Este error se captura en el bloque catch.
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Guardar información adicional en Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        nombres: nombres,
        apellidos: apellidos,
        fechaNacimiento: fechaNacimiento,
        telefono: telefono,
        email: user.email,
        role: "paciente",
        createdAt: new Date(),
      });

      console.log("Paciente registrado con éxito:", user);
      registroMensaje.textContent =
        "¡Registro exitoso! Redirigiendo al dashboard...";
      registroMensaje.classList.add("success");
      // Guardar rol en localStorage para el dashboard
      localStorage.setItem("userRole", "paciente");
      localStorage.setItem("userName", nombres);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 2000);
    } catch (error) {
      console.error("Error en el registro de paciente:", error);
      if (error.code === "auth/email-already-in-use") {
        registroMensaje.textContent =
          "Este correo electrónico ya está registrado. Intenta iniciar sesión.";
      } else {
        registroMensaje.textContent = `Error: ${error.message}`;
      }
      registroMensaje.classList.add("error");
    }
  });

  // Manejo del registro con Google para Paciente
  const btnGooglePaciente = document.getElementById("btnGooglePaciente");
  if (btnGooglePaciente) {
    btnGooglePaciente.addEventListener("click", async () => {
      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Paciente inició sesión/registró con Google:", user);

        const userDocRef = doc(db, "users", user.uid);
        // Para Google Sign-In, signInWithPopup maneja tanto el inicio de sesión de usuarios existentes
        // como el registro de nuevos usuarios. No necesitamos verificar explícitamente 'auth/email-already-in-use' aquí
        // porque si el usuario de Google ya existe en Firebase Auth, simplemente iniciará sesión.
        // La lógica de setDoc con { merge: true } actualizará o creará el documento en Firestore según sea necesario.

        await setDoc(
          userDocRef,
          {
            uid: user.uid,
            nombres: user.displayName ? user.displayName.split(" ")[0] : "",
            apellidos: user.displayName
              ? user.displayName.split(" ").slice(1).join(" ")
              : "",
            email: user.email,
            role: "paciente",
            photoURL: user.photoURL,
            createdAt: new Date(), // o mantener el original si ya existe
          },
          { merge: true }
        ); // merge:true para no sobreescribir si ya existe

        registroMensaje.textContent =
          "¡Inicio de sesión con Google exitoso! Redirigiendo...";
        registroMensaje.classList.add("success");
        localStorage.setItem("userRole", "paciente");
        localStorage.setItem(
          "userName",
          user.displayName ? user.displayName.split(" ")[0] : user.email
        );

        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 2000);
      } catch (error) {
        console.error("Error con Google Sign-In para paciente:", error);
        registroMensaje.textContent = `Error con Google: ${error.message}`;
        registroMensaje.classList.add("error");
      }
    });
  }
});
