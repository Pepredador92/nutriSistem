// js/verificacion-nutriologo.js
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"; // Usar especificador de módulo desnudo
import { doc, setDoc, getDoc } from "firebase/firestore"; // Usar especificador de módulo desnudo

document.addEventListener("DOMContentLoaded", () => {
  const formVerificacion = document.getElementById(
    "formVerificacionNutriologo"
  );
  const verificacionMensaje = document.getElementById("verificacionMensaje");
  const btnGoogleNutriologo = document.getElementById("btnGoogleNutriologo");

  // Elementos del Modal
  const googleKeyModal = document.getElementById("googleKeyModal");
  const closeModalButton = document.getElementById("closeModalButton");
  const btnVerificarClaveGoogle = document.getElementById(
    "btnVerificarClaveGoogle"
  );
  const googleNutriologoClaveAccesoInput = document.getElementById(
    "googleNutriologoClaveAcceso"
  );
  const modalMensaje = document.getElementById("modalMensaje");

  if (
    !formVerificacion ||
    !verificacionMensaje ||
    !btnGoogleNutriologo ||
    !googleKeyModal ||
    !closeModalButton ||
    !btnVerificarClaveGoogle ||
    !googleNutriologoClaveAccesoInput ||
    !modalMensaje
  ) {
    console.error(
      "Elementos del DOM para verificación de nutriólogo o modal no encontrados."
    );
    return;
  }
  console.log(
    "Todos los elementos del DOM para verificación y modal encontrados."
  ); // Log de verificación

  const CLAVE_ACCESO_CORRECTA = "nutriSistem2025";

  formVerificacion.addEventListener("submit", async (e) => {
    e.preventDefault();
    verificacionMensaje.textContent = "";
    verificacionMensaje.className = "mensaje";

    const nombres = document.getElementById("nutriologoNombres").value;
    const apellidos = document.getElementById("nutriologoApellidos").value;
    const email = document.getElementById("nutriologoEmail").value;
    const password = document.getElementById("nutriologoPassword").value;
    const confirmarPassword = document.getElementById(
      "nutriologoConfirmarPassword"
    ).value;
    const claveAcceso = document.getElementById("nutriologoClaveAcceso").value;

    if (password !== confirmarPassword) {
      verificacionMensaje.textContent = "Las contraseñas no coinciden.";
      verificacionMensaje.classList.add("error");
      // Enfocar el primer campo de contraseña para facilitar la corrección
      document.getElementById("nutriologoPassword").focus();
      return;
    }

    if (claveAcceso !== CLAVE_ACCESO_CORRECTA) {
      verificacionMensaje.textContent =
        "Clave de acceso incorrecta. Contacta a soporte para obtener ayuda.";
      verificacionMensaje.classList.add("error");
      // Enfocar el campo de clave de acceso
      document.getElementById("nutriologoClaveAcceso").focus();
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        nombres: nombres,
        apellidos: apellidos,
        email: user.email,
        role: "nutriologo",
        claveVerificada: true, // Marcar que la clave fue verificada
        createdAt: new Date(),
      });

      console.log("Nutriólogo registrado con éxito:", user);
      verificacionMensaje.textContent =
        "¡Verificación y registro exitosos! Redirigiendo al dashboard...";
      verificacionMensaje.classList.add("success");
      localStorage.setItem("userRole", "nutriologo");
      localStorage.setItem("userName", nombres);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 2000);
    } catch (error) {
      console.error("Error en el registro de nutriólogo:", error);
      verificacionMensaje.textContent = `Error: ${error.message}`;
      if (error.code === "auth/email-already-in-use") {
        verificacionMensaje.textContent =
          "Error: El correo electrónico ya está en uso. Intenta iniciar sesión o usa otro correo.";
      }
      verificacionMensaje.classList.add("error");
    }
  });

  // Mostrar el modal al hacer clic en "Continuar con Google"
  if (btnGoogleNutriologo) {
    // Comprobación adicional
    console.log("Adjuntando event listener a btnGoogleNutriologo");
    btnGoogleNutriologo.addEventListener("click", () => {
      console.log("Botón 'Continuar con Google' clickeado"); // Log al hacer clic
      googleKeyModal.classList.remove("hidden");
      googleNutriologoClaveAccesoInput.value = ""; // Limpiar campo
      modalMensaje.textContent = "";
      modalMensaje.className = "mensaje";
    });
  } else {
    console.error("El botón btnGoogleNutriologo no fue encontrado en el DOM.");
  }

  // Cerrar el modal
  if (closeModalButton) {
    // Comprobación adicional
    closeModalButton.addEventListener("click", () => {
      console.log("Botón 'Cerrar Modal' clickeado"); // Log al hacer clic
      googleKeyModal.classList.add("hidden");
    });
  } else {
    console.error("El botón closeModalButton no fue encontrado en el DOM.");
  }

  // Cerrar el modal si se hace clic fuera de él (opcional)
  window.addEventListener("click", (event) => {
    if (event.target === googleKeyModal) {
      googleKeyModal.classList.add("hidden");
    }
  });

  // Manejar la verificación de la clave desde el modal y luego el registro con Google
  if (btnVerificarClaveGoogle) {
    // Comprobación adicional
    btnVerificarClaveGoogle.addEventListener("click", async () => {
      console.log("Botón 'Verificar Clave Google' clickeado"); // Log al hacer clic
      modalMensaje.textContent = "";
      modalMensaje.className = "mensaje";
      const claveAccesoGoogle = googleNutriologoClaveAccesoInput.value;

      if (claveAccesoGoogle !== CLAVE_ACCESO_CORRECTA) {
        modalMensaje.textContent = "Clave de acceso incorrecta.";
        modalMensaje.classList.add("error");
        googleNutriologoClaveAccesoInput.focus();
        return;
      }

      // Si la clave es correcta, proceder con Google Sign-In
      googleKeyModal.classList.add("hidden"); // Ocultar modal
      verificacionMensaje.textContent = "Procesando registro con Google...";
      verificacionMensaje.className = "mensaje info";

      const provider = new GoogleAuthProvider();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("Nutriólogo inició sesión/registró con Google:", user);

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().role === "nutriologo") {
          localStorage.setItem("userRole", "nutriologo");
          localStorage.setItem(
            "userName",
            userDoc.data().nombres || user.displayName.split(" ")[0]
          );
        } else {
          await setDoc(
            userDocRef,
            {
              uid: user.uid,
              nombres: user.displayName ? user.displayName.split(" ")[0] : "",
              apellidos: user.displayName
                ? user.displayName.split(" ").slice(1).join(" ")
                : "",
              email: user.email,
              role: "nutriologo",
              photoURL: user.photoURL,
              claveVerificada: true,
              createdAt: new Date(),
            },
            { merge: true }
          );
          localStorage.setItem("userRole", "nutriologo");
          localStorage.setItem(
            "userName",
            user.displayName ? user.displayName.split(" ")[0] : user.email
          );
        }

        verificacionMensaje.textContent =
          "¡Inicio de sesión con Google exitoso! Redirigiendo...";
        verificacionMensaje.classList.add("success");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 2000);
      } catch (error) {
        console.error("Error con Google Sign-In para Nutriólogo:", error);
        verificacionMensaje.textContent = `Error con Google: ${error.message}`;
        verificacionMensaje.classList.add("error");
      }
    });
  } else {
    console.error(
      "El botón btnVerificarClaveGoogle no fue encontrado en el DOM."
    );
  }
});
