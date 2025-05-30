// js/dashboard.js
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard script cargado y DOMContentLoaded disparado");
  const welcomeMessage = document.getElementById("welcomeMessage");
  const userRoleDisplay = document.getElementById("userRole");
  const dashboardContent = document.getElementById("dashboardContent");
  const btnLogout = document.getElementById("btnLogout");

  console.log("btnLogout elemento:", btnLogout);

  if (!welcomeMessage || !userRoleDisplay || !dashboardContent || !btnLogout) {
    console.error("Elementos del DOM del dashboard no encontrados.");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Usuario está logueado
      console.log("Usuario en dashboard:", user.uid);
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      let userName = "Usuario";
      let role = "Desconocido";

      if (userDoc.exists()) {
        const userData = userDoc.data();
        userName =
          userData.nombres ||
          (user.displayName ? user.displayName.split(" ")[0] : user.email);
        role = userData.role;

        // Guardar en localStorage por si se necesita en otras partes o para persistencia simple
        localStorage.setItem("userName", userName);
        localStorage.setItem("userRole", role);
      } else {
        // Si no hay doc, intentar obtener de localStorage (menos fiable)
        userName =
          localStorage.getItem("userName") ||
          (user.displayName ? user.displayName.split(" ")[0] : user.email);
        role = localStorage.getItem("userRole") || "paciente"; // Default a paciente si no hay nada
        console.warn(
          "Documento de usuario no encontrado en Firestore, usando localStorage o defaults."
        );
      }

      welcomeMessage.textContent = `Bienvenido, ${userName}`;
      userRoleDisplay.textContent = `Rol: ${
        role.charAt(0).toUpperCase() + role.slice(1)
      }`;

      loadDashboardContent(role, dashboardContent); // Pasar dashboardContent como argumento
    } else {
      // Usuario no está logueado, redirigir a login
      console.log("Usuario no logueado, redirigiendo a login.html");
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      window.location.href = "login.html";
    }
  });

  console.log("Añadiendo event listener a btnLogout:", btnLogout); // Log de diagnóstico
  btnLogout.addEventListener("click", async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      console.log("Usuario cerró sesión");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Error al cerrar sesión. Inténtalo de nuevo.");
    }
  });
});

function loadDashboardContent(role, container) {
  container.innerHTML = ""; // Limpiar contenido previo

  const grid = document.createElement("div");
  grid.className = "dashboard-grid"; // Nueva clase para el grid de tarjetas

  if (role === "nutriologo") {
    grid.innerHTML = `
      <div class="dashboard-card">
        <img src="images/icon-home.svg" alt="Inicio">
        <h3>Inicio</h3>
        <p>Bienvenida y resumen de pacientes activos.</p>
        <a href="#" class="btn btn-small">Ver Resumen</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-pacientes.svg" alt="Pacientes">
        <h3>Pacientes</h3>
        <p>Gestionar pacientes, ver perfiles y progreso.</p>
        <a href="#" class="btn btn-small">Administrar Pacientes</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-plan.svg" alt="Planes">
        <h3>Planes de Alimentación</h3>
        <p>Crear y editar dietas personalizadas.</p>
        <a href="#" class="btn btn-small">Gestionar Planes</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-historial.svg" alt="Historial">
        <h3>Historial Clínico</h3>
        <p>Consultar evolución y visitas anteriores.</p>
        <a href="#" class="btn btn-small">Ver Historiales</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-chat.svg" alt="Comunicación">
        <h3>Comunicación</h3>
        <p>Chat directo con tus pacientes.</p>
        <a href="#" class="btn btn-small">Abrir Chat</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-herramientas.svg" alt="Herramientas Pro">
        <h3>Herramientas Pro</h3>
        <p>Reportes PDF, IA, recordatorios y más.</p>
        <a href="#" class="btn btn-small">Acceder Herramientas</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-perfil.svg" alt="Mi Perfil">
        <h3>Mi Perfil</h3>
        <p>Información del nutriólogo y datos de contacto.</p>
        <a href="#" class="btn btn-small">Editar Perfil</a>
      </div>
    `;
  } else if (role === "paciente") {
    grid.innerHTML = `
      <div class="dashboard-card">
        <img src="images/icon-home.svg" alt="Inicio">
        <h3>Inicio</h3>
        <p>Bienvenida y resumen de tu seguimiento.</p>
        <a href="#" class="btn btn-small">Ver Mi Progreso</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-mi-plan.svg" alt="Mi Plan">
        <h3>Mi Plan Alimenticio</h3>
        <p>Ver tus dietas y descargar en PDF.</p>
        <a href="#" class="btn btn-small">Ver Mi Plan</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-citas.svg" alt="Citas">
        <h3>Mis Citas</h3>
        <p>Ver próximas, pasadas y agendar nuevas.</p>
        <a href="#" class="btn btn-small">Gestionar Citas</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-buscar-nutri.svg" alt="Buscar Nutriólogo">
        <h3>Buscar Nutriólogo</h3>
        <p>Ver listado y elegir un profesional.</p>
        <a href="#" class="btn btn-small">Buscar Nutriólogos</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-progreso.svg" alt="Progreso">
        <h3>Progreso</h3>
        <p>Indicadores de tu avance nutricional.</p>
        <a href="#" class="btn btn-small">Ver Mi Progreso</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-chat.svg" alt="Comunicación">
        <h3>Comunicación</h3>
        <p>Chat directo con tu nutriólogo.</p>
        <a href="#" class="btn btn-small">Abrir Chat</a>
      </div>
      <div class="dashboard-card">
        <img src="images/icon-perfil.svg" alt="Mi Perfil">
        <h3>Mi Perfil</h3>
        <p>Datos personales, objetivos y contacto.</p>
        <a href="#" class="btn btn-small">Editar Perfil</a>
      </div>
    `;
  } else {
    container.innerHTML =
      "<p>No se pudo determinar el contenido del dashboard para tu rol.</p>";
    return; // Salir si el rol no es reconocido
  }
  container.appendChild(grid);
}
