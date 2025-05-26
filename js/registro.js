import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app } from "./firebase-config.js"; // Asegúrate que app esté exportada desde firebase-config.js

document.addEventListener("DOMContentLoaded", function () {
  const registroForm = document.getElementById("registro-form");
  const registroError = document.getElementById("registro-error");
  // const STORAGE_KEY_USUARIOS = 'nutriSistemUsuarios'; // Ya no se usará localStorage para usuarios

  const auth = getAuth(app);
  const db = getFirestore(app);

  if (registroForm) {
    registroForm.addEventListener("submit", async function (event) {
      // Convertido a async
      event.preventDefault();
      const nombre = event.target["nombre-registro"].value.trim();
      const apellido = event.target["apellido-registro"].value.trim();
      const email = event.target["email-registro"].value.trim();
      const password = event.target["password-registro"].value;
      const confirmPassword = event.target["confirm-password-registro"].value;

      if (!nombre || !apellido || !email || !password || !confirmPassword) {
        if (registroError)
          registroError.textContent = "Todos los campos son obligatorios.";
        return;
      }

      if (password !== confirmPassword) {
        if (registroError)
          registroError.textContent = "Las contraseñas no coinciden.";
        return;
      }

      try {
        // Crear usuario en Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        // Actualizar perfil de Firebase Auth con nombre y apellido (displayName)
        // Firebase Auth usa displayName para el nombre completo.
        const nombreCompleto = `${nombre} ${apellido}`.trim();
        await updateProfile(user, {
          displayName: nombreCompleto,
        });

        // Guardar información adicional del usuario en Firestore
        // El ID del documento será el UID de Firebase Auth.
        await setDoc(doc(db, "users", user.uid), {
          nombre: nombre,
          apellido: apellido,
          nombreCompleto: nombreCompleto, // Guardamos también el nombre completo
          email: user.email,
          fechaRegistro: serverTimestamp(), // Fecha y hora del servidor
          rol: "nutriologo", // Se puede añadir un rol por defecto
        });

        alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
        window.location.href = "index.html"; // Redirigir a la página de login
      } catch (error) {
        console.error("Error durante el registro:", error);
        if (registroError) {
          // Manejar errores específicos de Firebase Auth
          switch (error.code) {
            case "auth/email-already-in-use":
              registroError.textContent =
                "Este correo electrónico ya está registrado.";
              break;
            case "auth/weak-password":
              registroError.textContent =
                "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
              break;
            case "auth/invalid-email":
              registroError.textContent =
                "El formato del correo electrónico no es válido.";
              break;
            default:
              registroError.textContent =
                "Error al registrar el usuario: " + error.message;
          }
        }
      }
    });
  }
});
