import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged, // Asegúrate de que onAuthStateChanged esté importado
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase-config.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const googleSignInButton = document.getElementById("google-signin-btn");
  const auth = getAuth(app);
  const db = getFirestore(app);
  const provider = new GoogleAuthProvider();

  // Manejo del estado de autenticación (redirigir si ya está logueado o si no lo está y accede a protegidas)
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (
        window.location.pathname.endsWith("index.html") ||
        window.location.pathname === "/" ||
        window.location.pathname.endsWith("/NutriSistem/")
      ) {
        window.location.href = "dashboard.html";
      }
    } else {
      if (
        window.location.pathname.includes("dashboard.html") ||
        window.location.pathname.includes("citas.html") ||
        window.location.pathname.includes("pacientes.html")
      ) {
        // Añade otras rutas protegidas aquí
        window.location.href = "index.html";
      }
    }
  });

  // Inicio de sesión con Email y Contraseña
  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const email = event.target["email-login"].value;
      const password = event.target.password.value;
      if (!email || !password) {
        if (loginError)
          loginError.textContent =
            "Correo electrónico y contraseña son obligatorios.";
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Redirección manejada por onAuthStateChanged
      } catch (error) {
        console.error(
          "Error durante el inicio de sesión con email/password:",
          error
        );
        if (loginError) {
          switch (error.code) {
            case "auth/user-not-found":
            case "auth/wrong-password":
              loginError.textContent =
                "Correo electrónico o contraseña incorrectos.";
              break;
            case "auth/invalid-email":
              loginError.textContent =
                "El formato del correo electrónico no es válido.";
              break;
            case "auth/invalid-credential":
              loginError.textContent =
                "Credenciales inválidas o usuario no encontrado.";
              break;
            default:
              loginError.textContent =
                "Error al iniciar sesión: " + error.message;
          }
        }
      }
    });
  }

  // Inicio de sesión con Google
  if (googleSignInButton) {
    googleSignInButton.addEventListener("click", async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Usuario logueado con Google:", user);

        // Verificar si el usuario ya existe en Firestore para no sobrescribir datos importantes
        // o para fusionar información si es necesario.
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          // Si el usuario no existe en Firestore, crea un nuevo documento.
          // Esto es similar a lo que se hace en registro.js
          // Puedes decidir qué información guardar. Por defecto, rol 'paciente' o 'usuario'.
          let nombre = "";
          let apellido = "";
          if (user.displayName) {
            const nameParts = user.displayName.split(" ");
            nombre = nameParts[0] || "";
            apellido = nameParts.slice(1).join(" ") || "";
          }

          await setDoc(userDocRef, {
            nombre: nombre,
            apellido: apellido,
            nombreCompleto: user.displayName || "",
            email: user.email,
            fechaRegistro: serverTimestamp(), // Fecha de la primera vez que se registra/loguea con Google
            rol: "paciente", // Asignar un rol por defecto, puede ser diferente a "nutriologo"
            uid: user.uid,
          });
          console.log("Nuevo usuario de Google guardado en Firestore");
        } else {
          console.log("Usuario de Google ya existe en Firestore");
          // Aquí podrías actualizar la fecha del último login si quisieras, o verificar el rol.
        }
        // La redirección a dashboard.html será manejada por el onAuthStateChanged
      } catch (error) {
        console.error("Error durante el inicio de sesión con Google:", error);
        if (loginError) {
          if (error.code === "auth/popup-closed-by-user") {
            loginError.textContent =
              "El proceso de inicio de sesión con Google fue cancelado.";
          } else if (
            error.code === "auth/account-exists-with-different-credential"
          ) {
            loginError.textContent =
              "Ya existe una cuenta con este correo electrónico usando un método de inicio de sesión diferente.";
          } else {
            loginError.textContent =
              "Error al iniciar sesión con Google: " + error.message;
          }
        }
      }
    });
  }
});
