// firebase-config.js

// ===== CONFIGURACIÓN DE FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyA2uASDdwH2vKmRtwLDvjvTSMOFImhDUFM",
  authDomain: "encuesta-649b8.firebaseapp.com",
  projectId: "encuesta-649b8",
  storageBucket: "encuesta-649b8.firebasestorage.app",
  messagingSenderId: "226296434450",
  appId: "1:226296434450:web:470fb309d3b73a630a2dcb",
  measurementId: "G-8YTM0C38ST"
};

// ===== INICIALIZACIÓN DE FIREBASE =====
// Inicializar Firebase
try {
    firebase.initializeApp(firebaseConfig);
} catch (error) {
    console.error("Error inicializando Firebase:", error);
}

// Obtener referencias a servicios
const db = firebase.firestore();
const auth = firebase.auth();

// ===== FUNCIONES DE AYUDA =====
/**
 * Genera un código de invitación aleatorio de 6 caracteres
 * @returns {string} Código de invitación
 */
function generateInvitationCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Valida si un código de invitación es válido
 * @param {string} code - Código a validar
 * @returns {boolean} True si es válido
 */
function isValidInvitationCode(code) {
    return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Formatea una fecha para mostrar
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDisplayDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Obtiene el tiempo restante hasta el evento
 * @returns {Object} Días, horas, minutos, segundos restantes
 */
function getTimeUntilEvent() {
    const eventDate = new Date('2026-02-21T19:30:00');
    const now = new Date();
    const diff = eventDate.getTime() - now.getTime();
    
    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
}

/**
 * Obtiene la fecha actual en formato Firestore
 * @returns {firebase.firestore.Timestamp} Timestamp actual
 */
function getCurrentTimestamp() {
    return firebase.firestore.Timestamp.now();
}

/**
 * Registra una acción en el sistema de logs
 * @param {string} action - Tipo de acción
 * @param {string} code - Código de invitación relacionado
 * @param {Object} details - Detalles adicionales
 */
async function logAction(action, code, details = {}) {
    try {
        const logEntry = {
            action,
            invitationCode: code,
            details,
            timestamp: getCurrentTimestamp(),
            userAgent: navigator.userAgent,
            ip: await getClientIP()
        };
        
        await db.collection('logs').add(logEntry);
    } catch (error) {
        console.error('Error logging action:', error);
    }
}

/**
 * Obtiene la IP del cliente (aproximada)
 * @returns {Promise<string>} IP del cliente
 */
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

// ===== OPERACIONES DE INVITADOS =====
/**
 * Obtiene información de un invitado por código
 * @param {string} invitationCode - Código de invitación
 * @returns {Promise<Object|null>} Datos del invitado o null si no existe
 */
async function getGuestByCode(invitationCode) {
    try {
        const doc = await db.collection('guests').doc(invitationCode).get();
        
        if (!doc.exists) {
            return null;
        }
        
        return {
            id: invitationCode,
            ...doc.data()
        };
    } catch (error) {
        console.error('Error getting guest by code:', error);
        throw new Error('Error al cargar la información de la invitación');
    }
}

/**
 * Actualiza el RSVP de un invitado
 * @param {string} invitationCode - Código de invitación
 * @param {string} status - Estado (confirmed/declined)
 * @param {number} confirmedGuests - Número de invitados confirmados
 * @returns {Promise<Object>} Resultado de la operación
 */
async function updateGuestRSVP(invitationCode, status, confirmedGuests = 1) {
    try {
        const guestRef = db.collection('guests').doc(invitationCode);
        const guestDoc = await guestRef.get();
        
        if (!guestDoc.exists) {
            throw new Error('Invitación no encontrada');
        }
        
        const guestData = guestDoc.data();
        
        // Validar número de invitados
        if (status === 'confirmed') {
            if (confirmedGuests < 1 || confirmedGuests > guestData.maxGuests) {
                throw new Error(`Debes confirmar entre 1 y ${guestData.maxGuests} invitados`);
            }
        } else if (status === 'declined') {
            confirmedGuests = 0;
        }
        
        // Preparar datos de actualización
        const updateData = {
            status,
            confirmedGuests,
            responseDate: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp()
        };
        
        // Actualizar en Firestore
        await guestRef.update(updateData);
        
        // Registrar la acción
        await logAction('rsvp_updated', invitationCode, {
            oldStatus: guestData.status,
            newStatus: status,
            confirmedGuests
        });
        
        return {
            success: true,
            message: status === 'confirmed' 
                ? `¡Confirmación exitosa! Has confirmado ${confirmedGuests} invitado(s).`
                : 'Has declinado la invitación correctamente.',
            data: {
                ...guestData,
                ...updateData
            }
        };
        
    } catch (error) {
        console.error('Error updating RSVP:', error);
        throw error;
    }
}

// ===== OPERACIONES DE ADMINISTRACIÓN =====
/**
 * Obtiene estadísticas del evento
 * @returns {Promise<Object>} Estadísticas del evento
 */
async function getEventStats() {
    try {
        const guestsSnapshot = await db.collection('guests').get();
        
        let guestCount = 0;
        let confirmedCount = 0;
        let pendingCount = 0;
        let declinedCount = 0;
        let confirmedTotal = 0;
        
        guestsSnapshot.forEach(doc => {
            const data = doc.data();
            guestCount++;
            
            if (data.status === 'confirmed') {
                confirmedCount++;
                confirmedTotal += data.confirmedGuests || 0;
            } else if (data.status === 'declined') {
                declinedCount++;
            } else {
                pendingCount++;
            }
        });
        
        return {
            guestCount,
            confirmedCount,
            pendingCount,
            declinedCount,
            confirmedTotal,
            confirmationRate: guestCount > 0 ? (confirmedCount / guestCount) * 100 : 0
        };
    } catch (error) {
        console.error('Error getting event stats:', error);
        throw error;
    }
}

/**
 * Obtiene todos los invitados
 * @param {number} limit - Límite de resultados (opcional)
 * @returns {Promise<Object>} Lista de invitados
 */
async function getAllGuests(limit = null) {
    try {
        let query = db.collection('guests');
        
        if (limit) {
            query = query.limit(limit);
        }
        
        const snapshot = await query.get();
        const guests = [];
        
        snapshot.forEach(doc => {
            guests.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Ordenar por fecha de creación (más reciente primero)
        guests.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
        });
        
        return {
            guests,
            total: guests.length
        };
    } catch (error) {
        console.error('Error getting all guests:', error);
        throw error;
    }
}

/**
 * Elimina un invitado
 * @param {string} invitationCode - Código de invitación
 * @returns {Promise<Object>} Resultado de la operación
 */
async function deleteGuest(invitationCode) {
    try {
        const guestRef = db.collection('guests').doc(invitationCode);
        const guestDoc = await guestRef.get();
        
        if (!guestDoc.exists) {
            throw new Error('Invitación no encontrada');
        }
        
        // Guardar datos para el log
        const guestData = guestDoc.data();
        
        // Eliminar el documento
        await guestRef.delete();
        
        // Registrar la acción
        await logAction('guest_deleted', invitationCode, {
            name: guestData.name,
            email: guestData.email
        });
        
        return {
            success: true,
            message: 'Invitación eliminada exitosamente'
        };
    } catch (error) {
        console.error('Error deleting guest:', error);
        throw error;
    }
}

/**
 * Crea múltiples invitados en lote
 * @param {Array<Object>} guestsData - Array de datos de invitados
 * @returns {Promise<Array>} Resultados de cada creación
 */
async function bulkCreateGuests(guestsData) {
    const results = [];
    const batch = db.batch();
    
    try {
        for (const guestData of guestsData) {
            try {
                // Generar código único
                let isUnique = false;
                let invitationCode;
                let attempts = 0;
                const maxAttempts = 10;
                
                while (!isUnique && attempts < maxAttempts) {
                    invitationCode = generateInvitationCode();
                    const existingDoc = await db.collection('guests').doc(invitationCode).get();
                    isUnique = !existingDoc.exists;
                    attempts++;
                }
                
                if (!isUnique) {
                    throw new Error('No se pudo generar un código único');
                }
                
                // Preparar documento
                const guestDoc = {
                    name: guestData.name || '',
                    email: guestData.email || '',
                    maxGuests: guestData.maxGuests,
                    confirmedGuests: 0,
                    status: 'pending',
                    createdAt: getCurrentTimestamp(),
                    updatedAt: getCurrentTimestamp()
                };
                
                // Agregar a batch
                const guestRef = db.collection('guests').doc(invitationCode);
                batch.set(guestRef, guestDoc);
                
                results.push({
                    success: true,
                    invitationCode,
                    guestData: guestDoc
                });
                
            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    guestData
                });
            }
        }
        
        // Ejecutar batch
        if (results.some(r => r.success)) {
            await batch.commit();
            
            // Registrar la acción
            await logAction('bulk_import', 'system', {
                total: guestsData.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            });
        }
        
        return results;
        
    } catch (error) {
        console.error('Error in bulk create:', error);
        throw error;
    }
}

// ===== AUTENTICACIÓN =====
/**
 * Inicia sesión con Google
 * @returns {Promise<Object>} Usuario autenticado
 */
async function loginWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
        return result.user;
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
    }
}

/**
 * Cierra sesión
 * @returns {Promise<void>}
 */
async function logout() {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}

/**
 * Obtiene el usuario actual
 * @returns {Object|null} Usuario actual
 */
function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Verifica si un usuario es administrador
 * @param {Object} user - Usuario de Firebase
 * @returns {Promise<boolean>} True si es administrador
 */
async function isUserAdmin(user) {
    try {
        if (!user || !user.email) return false;
        
        // Verificar en la colección de administradores
        const adminDoc = await db.collection('admins').doc(user.email).get();
        
        if (adminDoc.exists) {
            return true;
        }
        
        // También verificar si el email está en una lista de administradores predeterminados
        const defaultAdmins = [
            'juan.encuesta649b8@gmail.com', // Cambia esto por tu email real
            user.email.toLowerCase()
        ];
        
        return defaultAdmins.includes(user.email.toLowerCase());
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// ===== EXPORTS =====
// Hacer las funciones globalmente disponibles
window.firebaseApp = {
    // Configuration
    config: firebaseConfig,
    
    // Services
    db,
    auth,
    
    // Helper Functions
    generateInvitationCode,
    isValidInvitationCode,
    formatDisplayDate,
    getTimeUntilEvent,
    getCurrentTimestamp,
    
    // Guest Operations
    getGuestByCode,
    updateGuestRSVP,
    
    // Admin Operations
    getEventStats,
    createGuestInvitation,
    getAllGuests,
    updateGuest,
    deleteGuest,
    bulkCreateGuests,
    
    // Authentication
    loginWithGoogle,
    logout,
    getCurrentUser,
    isUserAdmin,
    
    // Constants
    VALID_MAX_GUESTS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    
    // Logging
    logAction
};

// Eventos de autenticación para el panel de administración
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const isAdmin = await isUserAdmin(user);
        if (isAdmin) {
            window.dispatchEvent(new CustomEvent('admin-auth-success', {
                detail: { user, isAdmin }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('admin-auth-failed'));
        }
    } else {
        window.dispatchEvent(new CustomEvent('admin-auth-signed-out'));
    }
});

console.log('Firebase config loaded successfully');