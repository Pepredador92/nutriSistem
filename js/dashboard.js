// js/dashboard.js
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth(app);
  const logoutButtonSidebar = document.getElementById("logout-btn-sidebar");

  // Proteger la página: si no hay usuario, redirigir a index.html
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      console.log(
        "Usuario no autenticado, redirigiendo al login desde dashboard.js"
      );
      window.location.href = "index.html";
    } else {
      // Opcional: Mostrar nombre de usuario o algo si es necesario
      // const userEmailElement = document.getElementById('user-email');
      // if (userEmailElement) userEmailElement.textContent = user.email;
      console.log("Usuario autenticado:", user.email);
    }
  });

  // Funcionalidad de cerrar sesión
  if (logoutButtonSidebar) {
    logoutButtonSidebar.addEventListener("click", async () => {
      try {
        await signOut(auth);
        console.log("Sesión cerrada exitosamente.");
        window.location.href = "index.html"; // Redirigir a la página de login
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    });
  }

  // Lógica para manejar la navegación de secciones dentro del dashboard (si es necesario aquí)
  // Por ejemplo, la que podría estar en utils.js para mostrar/ocultar secciones
  const sidebarNavLinks = document.querySelectorAll(
    ".sidebar-nav a[data-section]"
  );
  const dashboardSections = document.querySelectorAll(".dashboard-section");

  sidebarNavLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      const sectionId = this.getAttribute("data-section");

      // Si el enlace es solo para navegación interna (href="#")
      if (this.getAttribute("href") === "#") {
        event.preventDefault(); // Prevenir navegación si es un enlace #

        dashboardSections.forEach((section) => {
          if (section.id === sectionId + "-section") {
            section.style.display = "block";
          } else {
            section.style.display = "none";
          }
        });
      }
      // Si es un enlace a otra página (ej. dashboard.html), se deja que navegue normalmente
      // y la lógica de esa página (o su script de dashboard) manejará la sección activa si es necesario.
      // Si el data-section es 'inicio' y estamos en dashboard.html, mostramos la sección inicio.
      else if (
        sectionId === "inicio" &&
        window.location.pathname.includes("dashboard.html")
      ) {
        event.preventDefault();
        dashboardSections.forEach((section) => {
          if (section.id === "inicio-section") {
            section.style.display = "block";
          } else {
            section.style.display = "none";
          }
        });
      }
    });
  });
  // Asegurarse de que la sección de inicio esté visible por defecto si estamos en dashboard.html
  if (window.location.pathname.includes("dashboard.html")) {
    const inicioSection = document.getElementById("inicio-section");
    const estadisticasSection = document.getElementById("estadisticas-section");
    if (inicioSection) inicioSection.style.display = "block";
    if (estadisticasSection) estadisticasSection.style.display = "none";
  }
});
