// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Added for Chat
import { getAuth } from "firebase/auth";           // Added for Login
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgPU0gz8eFnV8ZcdOTtZsImBOjMx2qVF8",
  authDomain: "pravaahfeb2026.firebaseapp.com",
  projectId: "pravaahfeb2026",
  storageBucket: "pravaahfeb2026.firebasestorage.app",
  messagingSenderId: "735568165067",
  appId: "1:735568165067:web:87d71d453f24ab3bed834e",
  measurementId: "G-MSYPW68R5B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();
// Export these so we can use them in your app
export const db = getFirestore(app);
export const auth = getAuth(app);
export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);