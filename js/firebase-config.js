// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBTgFRKC_2a-9nBpzm7EV6RGOsJ37XPVlc",
  authDomain: "nutri-sistem.firebaseapp.com",
  projectId: "nutri-sistem",
  storageBucket: "nutri-sistem.firebasestorage.app", // Corregido: firebasestorage.app
  messagingSenderId: "548294143160",
  appId: "1:548294143160:web:5360a4b764b1def8a1984d",
  measurementId: "G-HBJF9TPNFS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Analytics can be initialized if needed later

// Export Firebase app instance for use in other modules
export { app };

// Export other Firebase services as needed, for example:
import { getAuth } from "firebase/auth";
export const auth = getAuth(app);

import { getFirestore } from "firebase/firestore";
export const db = getFirestore(app);
