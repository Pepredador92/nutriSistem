// js/login.js
import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth"; // Cambiado para usar importmap
import {
  doc,
  getDoc,
  setDoc, // Asegurarse de que setDoc está importado si se va a usar
} from "firebase/firestore"; // Cambiado para usar importmap

document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById("formLogin");
  const btnLoginGoogle = document.getElementById("btnLoginGoogle");
  const loginMensaje = document.getElementById("loginMensaje");

  if (!formLogin || !btnLoginGoogle || !loginMensaje) {
    console.error(
      "Elementos del DOM para el formulario de login no encontrados."
    );
    return;
  }

  // Verificar si ya hay un usuario logueado
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Usuario ya está logueado, obtener su rol y redirigir
      console.log("Usuario ya logueado:", user.uid);
      // No redirigir automáticamente desde login.js si ya está logueado,
      // esto podría causar bucles si el dashboard redirige a login si no hay sesión.
      // La redirección principal debe manejarse en las páginas protegidas (dashboard).
    }
  });

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginMensaje.textContent = "";
    loginMensaje.className = "mensaje";

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Obtener el rol del usuario desde Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("Datos del usuario recuperados de Firestore:", userData); // LOG ADICIONAL
        localStorage.setItem("userRole", userData.role);
        localStorage.setItem("userName", userData.nombres || user.email); // Usar nombre si existe
        localStorage.setItem("userId", user.uid); // Guardar userId

        // Redirección basada en rol y verificación de nutriólogo
        console.log(
          "Verificando rol y estado de verificación:",
          "Rol:",
          userData.role,
          "Nutriologo Verificado:",
          userData.nutriologoVerificado
        );

        if (userData.role === "nutriologo" && !userData.nutriologoVerificado) {
          loginMensaje.textContent =
            "Nutriólogo no verificado. Redirigiendo a verificación...";
          loginMensaje.classList.add("warning");
          setTimeout(() => {
            window.location.href = "verificacion-nutriologo.html";
          }, 1500);
        } else {
          loginMensaje.textContent =
            "¡Inicio de sesión exitoso! Redirigiendo...";
          loginMensaje.classList.add("success");
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1500);
        }
      } else {
        console.error("No se encontraron datos de usuario en Firestore.");
        loginMensaje.textContent =
          "Error: No se encontraron datos adicionales del usuario. Por favor, regístrese.";
        loginMensaje.classList.add("error");
        // Considerar desloguear si no hay datos en Firestore tras un login exitoso de Auth
        await auth.signOut();
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      let mensajeError = "Error en el inicio de sesión. Inténtalo de nuevo.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        mensajeError = "Correo electrónico o contraseña incorrectos.";
      } else if (error.code === "auth/too-many-requests") {
        mensajeError = "Demasiados intentos fallidos. Intenta más tarde.";
      }
      loginMensaje.textContent = mensajeError;
      loginMensaje.classList.add("error");
    }
  });

  btnLoginGoogle.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    loginMensaje.textContent = "";
    loginMensaje.className = "mensaje";
    console.log("Botón Google presionado, intentando iniciar sesión...");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Usuario de Google autenticado:", user.uid, user.email);

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log(
          "Datos del usuario de Google recuperados de Firestore:",
          userData
        );
        localStorage.setItem("userRole", userData.role);
        localStorage.setItem(
          "userName",
          userData.nombres ||
            (user.displayName ? user.displayName.split(" ")[0] : user.email)
        );
        localStorage.setItem("userId", user.uid); // Guardar userId

        // Redirección basada en rol y verificación de nutriólogo
        console.log(
          "Verificando rol y estado de verificación (Google Sign-In):",
          "Rol:",
          userData.role,
          "Nutriologo Verificado:",
          userData.nutriologoVerificado
        );

        if (
          userData.role === "nutriologo" &&
          userData.nutriologoVerificado !== true
        ) {
          loginMensaje.textContent =
            "Nutriólogo no verificado. Redirigiendo a verificación...";
          loginMensaje.classList.add("warning");
          setTimeout(() => {
            window.location.href = "verificacion-nutriologo.html";
          }, 1500);
        } else {
          // Para pacientes, o nutriólogos verificados (nutriologoVerificado === true)
          loginMensaje.textContent =
            "¡Inicio de sesión exitoso! Redirigiendo...";
          loginMensaje.classList.add("success");
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1500);
        }
      } else {
        // Si el usuario de Google no existe en Firestore, es un nuevo usuario de Google.
        // En NutriSistem, el registro (ya sea paciente o nutriólogo) debe ocurrir primero.
        console.warn(
          "Usuario de Google no encontrado en Firestore. Esto indica que el usuario no se ha registrado previamente con Google a través de los flujos de registro."
        );

        // Guardar temporalmente la información de Google para el registro
        localStorage.setItem(
          "googleAuthData",
          JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          })
        );

        loginMensaje.textContent =
          "Usuario no registrado. Redirigiendo a la página de registro para completar tu perfil...";
        loginMensaje.classList.add("info");
        setTimeout(() => {
          window.location.href = "registro.html?source=googleSignIn";
        }, 2500);
      }
    } catch (error) {
      console.error("Error con Google Sign-In:", error);
      let mensajeError =
        "Error al iniciar sesión con Google. Inténtalo de nuevo.";
      if (error.code === "auth/popup-closed-by-user") {
        mensajeError =
          "El proceso de inicio de sesión con Google fue cancelado.";
      } else if (error.code === "auth/cancelled-popup-request") {
        mensajeError =
          "Se canceló una solicitud de inicio de sesión con Google.";
      } else if (error.code === "auth/popup-blocked") {
        mensajeError =
          "El navegador bloqueó la ventana emergente de Google. Habilita las ventanas emergentes e inténtalo de nuevo.";
      } else if (error.code === "auth/unauthorized-domain") {
        mensajeError =
          "Este dominio no está autorizado para la autenticación de Firebase. Revisa la configuración de tu proyecto Firebase.";
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        mensajeError =
          "Ya existe una cuenta con este correo electrónico. Intenta iniciar sesión con el método original.";
      }
      loginMensaje.textContent = mensajeError;
      loginMensaje.classList.add("error");
    }
  });
});
