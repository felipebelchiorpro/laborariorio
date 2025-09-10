// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Configuração principal para Autenticação E Storage
const firebaseConfig = {
  projectId: "labflow-dashboard",
  appId: "1:1088551351707:web:321c8e1b7e5dd126e8dd3e",
  storageBucket: "labflow-dashboard.appspot.com",
  apiKey: "AIzaSyD_cv3gzArOeVQW0iB4jrH4pUKuwGNICPU",
  authDomain: "labflow-dashboard.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "1088551351707"
};

// Inicializa a app principal (para Auth e Storage)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Obtém o serviço de Storage da app principal
const storage = getStorage(app);

export { app, storage };
