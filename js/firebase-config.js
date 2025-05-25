import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTgFRKC_2a-9nBpzm7EV6RGOsJ37XPVlc",
  authDomain: "nutri-sistem.firebaseapp.com",
  projectId: "nutri-sistem",
  storageBucket: "nutri-sistem.appspot.com", // ✅ Corregido según tus instrucciones
  messagingSenderId: "548294143160",
  appId: "1:548294143160:web:5360a4b764b1def8a1984d",
  measurementId: "G-HBJF9TPNFS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
