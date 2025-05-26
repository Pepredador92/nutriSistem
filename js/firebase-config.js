import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Tu configuración de Firebase (¡asegúrate de usar tus valores reales!)
const firebaseConfig = {
  apiKey: "AIzaSyBTgFRKC_2a-9nBpzm7EV6RGOsJ37XPVlc",
  authDomain: "nutri-sistem.firebaseapp.com",
  projectId: "nutri-sistem",
  storageBucket: "nutri-sistem.firebasestorage.app",
  messagingSenderId: "548294143160",
  appId: "1:548294143160:web:5360a4b764b1def8a1984d",
  measurementId: "G-HBJF9TPNFS", // Tu ID de propiedad de GA
};

// Inicializa Firebase y **EXPORTA** la instancia de la aplicación
const app = initializeApp(firebaseConfig);

// Ahora exporta 'app' para que otros archivos (como registro.js) puedan importarlo
// export { app }; // Se exportará junto con db más abajo

// Puedes exportar otras cosas si las inicializas aquí, por ejemplo:
// import { getFirestore } from 'firebase/firestore';
const db = getFirestore(app);
export { app, db }; // Si también necesitas la instancia de Firestore en otros lugares
