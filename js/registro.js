document.addEventListener('DOMContentLoaded', function() {
    const registroForm = document.getElementById('registro-form');
    const registroError = document.getElementById('registro-error');
    const STORAGE_KEY_USUARIOS = 'nutriSistemUsuarios';

    if (registroForm) {
        registroForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const nombre = event.target['nombre-registro'].value;
            const apellido = event.target['apellido-registro'].value;
            const email = event.target['email-registro'].value;
            const password = event.target['password-registro'].value;
            const confirmPassword = event.target['confirm-password-registro'].value;

            if (password !== confirmPassword) {
                if(registroError) registroError.textContent = 'Las contraseñas no coinciden.';
                return;
            }

            // Cargar usuarios existentes o inicializar si no hay
            let usuarios = JSON.parse(localStorage.getItem(STORAGE_KEY_USUARIOS)) || [];

            // Verificar si el email ya está registrado
            if (usuarios.some(user => user.email === email)) {
                if(registroError) registroError.textContent = 'Este correo electrónico ya está registrado.';
                return;
            }

            // Crear nuevo usuario
            const nuevoUsuario = {
                id: 'user_' + Date.now(), // ID único simple
                nombre,
                apellido,
                email,
                password // En una aplicación real, la contraseña debería ser hasheada
            };

            usuarios.push(nuevoUsuario);
            localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));

            alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
            window.location.href = 'index.html'; // Redirigir a la página de login
        });
    }
});
