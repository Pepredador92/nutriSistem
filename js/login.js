// js/login.js
import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
        localStorage.setItem("userRole", userData.role);
        localStorage.setItem("userName", userData.nombres || user.email); // Usar nombre si existe

        loginMensaje.textContent = "¡Inicio de sesión exitoso! Redirigiendo...";
        loginMensaje.classList.add("success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } else {
        // Esto no debería pasar si el registro siempre crea un documento de usuario
        console.error("No se encontraron datos de usuario en Firestore.");
        loginMensaje.textContent =
          "Error: No se encontraron datos adicionales del usuario.";
        loginMensaje.classList.add("error");
        // Opcionalmente, cerrar sesión si los datos son inconsistentes
        // await auth.signOut();
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      loginMensaje.textContent = `Error: ${error.message}`;
      loginMensaje.classList.add("error");
    }
  });

  btnLoginGoogle.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    loginMensaje.textContent = "";
    loginMensaje.className = "mensaje";

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem("userRole", userData.role);
        localStorage.setItem(
          "userName",
          userData.nombres || user.displayName.split(" ")[0]
        );

        loginMensaje.textContent =
          "¡Inicio de sesión con Google exitoso! Redirigiendo...";
        loginMensaje.classList.add("success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      } else {
        // Si el usuario de Google no existe en Firestore, podría ser un primer inicio de sesión
        // y no se completó un registro previo (ej. si solo se autenticó pero no se guardó el rol)
        // Para NutriSistem, el registro con Google ya debería crear el doc.
        // Si es un paciente, el registro.js lo maneja.
        // Si es un nutriólogo, verificacion-nutriologo.js lo manejaría.
        // Considerar este caso como un error o redirigir a completar perfil.
        console.warn(
          "Usuario de Google no encontrado en Firestore. Puede necesitar completar registro."
        );
        // Por ahora, lo trataremos como un paciente por defecto si no hay info,
        // pero esto debería ser más robusto.
        await setDoc(
          userDocRef,
          {
            uid: user.uid,
            nombres: user.displayName ? user.displayName.split(" ")[0] : "",
            apellidos: user.displayName
              ? user.displayName.split(" ").slice(1).join(" ")
              : "",
            email: user.email,
            role: "paciente", // Rol por defecto, podría necesitar ajuste
            photoURL: user.photoURL,
            createdAt: new Date(),
          },
          { merge: true }
        );

        localStorage.setItem("userRole", "paciente");
        localStorage.setItem(
          "userName",
          user.displayName ? user.displayName.split(" ")[0] : user.email
        );

        loginMensaje.textContent =
          "¡Inicio de sesión con Google exitoso! Redirigiendo...";
        loginMensaje.classList.add("success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 1500);
      }
    } catch (error) {
      console.error("Error con Google Sign-In:", error);
      loginMensaje.textContent = `Error con Google: ${error.message}`;
      loginMensaje.classList.add("error");
    }
  });
});
