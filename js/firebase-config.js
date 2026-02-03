// firebase-config.js - Configuración para la página principal

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA2uASDdwH2vKmRtwLDvjvTSMOFImhDUFM",
    authDomain: "encuesta-649b8.firebaseapp.com",
    projectId: "encuesta-649b8",
    storageBucket: "encuesta-649b8.firebasestorage.app",
    messagingSenderId: "226296434450",
    appId: "1:226296434450:web:470fb309d3b73a630a2dcb",
    measurementId: "G-8YTM0C38ST"
};

// Inicializar Firebase inmediatamente
(function initializeFirebase() {
    console.log("🔥 Inicializando Firebase...");
    
    try {
        // Verificar que Firebase esté cargado
        if (typeof firebase === 'undefined') {
            console.error("❌ Firebase SDK no está cargado");
            return;
        }
        
        // Inicializar Firebase solo si no está ya inicializado
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase inicializado exitosamente");
            
            // Configurar Firestore
            const db = firebase.firestore();
            
            // Configurar para desarrollo
            if (window.location.hostname === 'localhost') {
                db.settings({
                    host: 'localhost:8080',
                    ssl: false
                });
                console.log("🔧 Modo desarrollo: usando emulador local");
            }
            
            console.log("📡 Firestore configurado:", db ? 'Sí' : 'No');
        } else {
            console.log("✅ Firebase ya estaba inicializado");
        }
        
    } catch (error) {
        console.error("❌ Error inicializando Firebase:", error);
        console.error("Detalles:", error.message);
    }
})();

console.log("✅ Configuración de Firebase cargada");
