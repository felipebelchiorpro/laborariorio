// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Configuração principal para Autenticação, etc.
const mainFirebaseConfig = {
  projectId: "labflow-dashboard",
  appId: "1:1088551351707:web:321c8e1b7e5dd126e8dd3e",
  storageBucket: "labflow-dashboard.appspot.com",
  apiKey: "AIzaSyD_cv3gzArOeVQW0iB4jrH4pUKuwGNICPU",
  authDomain: "labflow-dashboard.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "1088551351707"
};

// Configuração secundária, apenas para o Storage
const storageFirebaseConfig = {
    apiKey: "AIzaSyDzYzDsb1VpAcYaSyhv1jCM1Dq7oiTQNIE",
    authDomain: "laboratorio-exames-pdf.firebaseapp.com",
    projectId: "laboratorio-exames-pdf",
    storageBucket: "laboratorio-exames-pdf.appspot.com",
    messagingSenderId: "89558771272",
    appId: "1:89558771272:web:f281f8b7e04ab64e711a7d",
    measurementId: "G-F18J5054QP"
};

// Inicializa a app principal (para Auth)
const app = !getApps().length ? initializeApp(mainFirebaseConfig) : getApp();

// Inicializa a app secundária (para Storage), se ainda não existir
let storageApp: FirebaseApp;
const storageAppName = 'storageApp';
const existingStorageApp = getApps().find(app => app.name === storageAppName);

if (existingStorageApp) {
  storageApp = existingStorageApp;
} else {
  storageApp = initializeApp(storageFirebaseConfig, storageAppName);
}

// Obtém o serviço de Storage da app secundária
const storage = getStorage(storageApp);

export { app, storage };
