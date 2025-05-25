document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    // Credenciales hardcodeadas
    const validUsername = 'nutri';
    const validPassword = '123';

    const STORAGE_KEY_USUARIOS = 'nutriSistemUsuarios'; // Definir la clave también aquí

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const emailLogin = event.target.username.value; // Cambiado de username a emailLogin para claridad
            const passwordLogin = event.target.password.value;

            let usuarios = JSON.parse(localStorage.getItem(STORAGE_KEY_USUARIOS)) || [];
            
            // Añadir el usuario hardcodeado a la lista si no existe (para mantener la compatibilidad inicial)
            if (!usuarios.some(user => user.email === validUsername)) {
                usuarios.push({ id: 'user_admin', nombre: 'Admin', apellido: 'Nutri', email: validUsername, password: validPassword });
                localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
            }

            const usuarioEncontrado = usuarios.find(user => user.email === emailLogin && user.password === passwordLogin);

            if (usuarioEncontrado) {
                localStorage.setItem('loggedInUser', usuarioEncontrado.email); // Guardar email del usuario logueado
                window.location.href = 'dashboard.html';
            } else {
                if(loginError) loginError.textContent = 'Correo electrónico o contraseña incorrectos.';
            }
        });
    }

    // Si ya está logueado y trata de acceder a index.html, redirigir a dashboard
    if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        if (localStorage.getItem('loggedInUser')) {
            window.location.href = 'dashboard.html';
        }
    }
});
