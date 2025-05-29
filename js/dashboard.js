// js/dashboard.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from \"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js\";
import { doc, getDoc } from \"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js\";

document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userRoleDisplay = document.getElementById('userRole');
    const dashboardContent = document.getElementById('dashboardContent');
    const btnLogout = document.getElementById('btnLogout');

    if (!welcomeMessage || !userRoleDisplay || !dashboardContent || !btnLogout) {
        console.error('Elementos del DOM del dashboard no encontrados.');
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Usuario está logueado
            console.log(\"Usuario en dashboard:\", user.uid);
            const userDocRef = doc(db, \"users\", user.uid);
            const userDoc = await getDoc(userDocRef);

            let userName = \"Usuario\";
            let role = \"Desconocido\";

            if (userDoc.exists()) {
                const userData = userDoc.data();
                userName = userData.nombres || (user.displayName ? user.displayName.split(' ')[0] : user.email);
                role = userData.role;
                
                // Guardar en localStorage por si se necesita en otras partes o para persistencia simple
                localStorage.setItem('userName', userName);
                localStorage.setItem('userRole', role);
            } else {
                // Si no hay doc, intentar obtener de localStorage (menos fiable)
                userName = localStorage.getItem('userName') || (user.displayName ? user.displayName.split(' ')[0] : user.email);
                role = localStorage.getItem('userRole') || 'paciente'; // Default a paciente si no hay nada
                console.warn(\"Documento de usuario no encontrado en Firestore, usando localStorage o defaults.\");
            }
            
            welcomeMessage.textContent = \`Bienvenido, ${userName}\`;
            userRoleDisplay.textContent = \`Tipo de Usuario: ${role.charAt(0).toUpperCase() + role.slice(1)}\`;

            loadDashboardContent(role);

        } else {
            // Usuario no está logueado, redirigir a login
            console.log(\"Usuario no logueado, redirigiendo a login.html\");
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            window.location.href = 'login.html';
        }
    });

    btnLogout.addEventListener('click', async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('userName');
            localStorage.removeItem('userRole');
            console.log(\"Usuario cerró sesión\");
            window.location.href = 'login.html';
        } catch (error) {
            console.error(\"Error al cerrar sesión:\", error);
            alert(\"Error al cerrar sesión. Inténtalo de nuevo.\");
        }
    });

    function loadDashboardContent(role) {
        dashboardContent.innerHTML = ''; // Limpiar contenido previo

        if (role === 'paciente') {
            dashboardContent.innerHTML = `
                <h3>Tus Opciones como Paciente:</h3>
                <ul>
                    <li><a href=\"#\">Ver planes alimenticios</a></li>
                    <li><a href=\"#\">Historial de citas</a></li>
                    <li><a href=\"#\">Entrenar modelo IA \"NutriCoach\" con tus lecturas</a></li>
                    <!-- Agrega más elementos según sea necesario -->
                </ul>
            `;
        } else if (role === 'nutriologo') {
            dashboardContent.innerHTML = `
                <h3>Tus Herramientas como Nutriólogo:</h3>
                <ul>
                    <li><a href=\"#\">Registrar pacientes</a></li>
                    <li><a href=\"#\">Crear dietas</a></li>
                    <li><a href=\"#\">Ver historial de pacientes</a></li>
                    <li><a href=\"#\">Acceso a herramientas premium</a></li>
                    <!-- Agrega más elementos según sea necesario -->
                </ul>
            `;
        } else {
            dashboardContent.innerHTML = \"<p>No se pudo determinar el contenido del dashboard para tu rol.</p>\";
        }
    }
});
