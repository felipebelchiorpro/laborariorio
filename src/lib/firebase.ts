// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "labflow-dashboard",
  appId: "1:1088551351707:web:321c8e1b7e5dd126e8dd3e",
  storageBucket: "labflow-dashboard.firebasestorage.app",
  apiKey: "AIzaSyD_cv3gzArOeVQW0iB4jrH4pUKuwGNICPU",
  authDomain: "labflow-dashboard.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "1088551351707"
};

// Initialize Firebase
// To avoid re-initializing the app on every hot-reload, we check if it's already initialized.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
