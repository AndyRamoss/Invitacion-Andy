// firebase-config.js - Configuración completa para Firebase

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
let app, db, auth;

// Función para inicializar Firebase de forma segura
function initializeFirebase() {
    try {
        // Verificar si Firebase está disponible
        if (typeof firebase === 'undefined') {
            console.error("Firebase no está cargado. Verifica los scripts en HTML.");
            return false;
        }
        
        // Inicializar Firebase solo si no está ya inicializado
        app = firebase.apps.length ? firebase.apps[0] : firebase.initializeApp(firebaseConfig);
        db = firebase.firestore(app);
        auth = firebase.auth(app);
        
        console.log("✅ Firebase inicializado correctamente para:", window.location.hostname);
        
        // Habilitar persistencia de datos
        if (db && db.enablePersistence) {
            db.enablePersistence()
                .then(() => console.log("Persistencia de Firestore habilitada"))
                .catch((err) => {
                    console.warn("Advertencia en persistencia de Firestore:", err);
                    // Esto es normal en algunos navegadores o en incógnito
                });
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ Error crítico inicializando Firebase:", error);
        return false;
    }
}

// Inicializar Firebase cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando Firebase...");
    const initialized = initializeFirebase();
    
    if (!initialized) {
        console.error("No se pudo inicializar Firebase. Verifica la configuración.");
    }
});

// ===== FUNCIONES DE AYUDA =====

/**
 * Obtiene el timestamp actual de Firestore
 */
function getCurrentTimestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
}

/**
 * Formatea una fecha para mostrar
 */
function formatDate(date) {
    if (!date) return 'No disponible';
    
    if (date.toDate) {
        date = date.toDate();
    }
    
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Genera un código de invitación aleatorio de 6 caracteres
 */
function generateInvitationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Valida si un email tiene acceso de administrador
 */
async function checkAdminAccess(email) {
    if (!email) return false;
    
    try {
        // Verificar en colección de administradores
        const adminDoc = await db.collection('admins').doc(email).get();
        
        if (adminDoc.exists) {
            return true;
        }
        
        // Administradores predeterminados
        const defaultAdmins = [
            'andyramoss@gmail.com', // TU email real
            'admin@encuesta-649b8.firebaseapp.com'
        ];
        
        return defaultAdmins.includes(email.toLowerCase());
        
    } catch (error) {
        console.error("Error verificando acceso de administrador:", error);
        return false;
    }
}

/**
 * Obtiene estadísticas del evento
 */
async function getEventStats() {
    try {
        const guestsSnapshot = await db.collection('guests').get();
        
        let stats = {
            total: 0,
            confirmed: 0,
            pending: 0,
            declined: 0,
            confirmedTotal: 0
        };
        
        guestsSnapshot.forEach(doc => {
            const data = doc.data();
            stats.total++;
            
            if (data.status === 'confirmed') {
                stats.confirmed++;
                stats.confirmedTotal += data.confirmedGuests || 1;
            } else if (data.status === 'declined') {
                stats.declined++;
            } else {
                stats.pending++;
            }
        });
        
        stats.confirmationRate = stats.total > 0 ? 
            Math.round((stats.confirmed / stats.total) * 100) : 0;
            
        return stats;
        
    } catch (error) {
        console.error("Error obteniendo estadísticas:", error);
        throw error;
    }
}

/**
 * Crea una nueva invitación
 */
async function createGuestInvitation(name = '', email = '', maxGuests = 2, customCode = '') {
    try {
        // Validar número de invitados
        if (![2, 4, 6, 10].includes(maxGuests)) {
            throw new Error('Número de invitados no válido');
        }
        
        // Generar o usar código personalizado
        let invitationCode = customCode || generateInvitationCode();
        
        if (customCode) {
            // Validar formato del código personalizado
            if (!/^[A-Z0-9]{6}$/.test(customCode)) {
                throw new Error('El código debe tener exactamente 6 caracteres (A-Z, 0-9)');
            }
            
            // Verificar que no exista
            const existingDoc = await db.collection('guests').doc(customCode).get();
            if (existingDoc.exists) {
                throw new Error('El código ya está en uso');
            }
        } else {
            // Asegurar que el código generado sea único
            let isUnique = false;
            let attempts = 0;
            
            while (!isUnique && attempts < 5) {
                const existingDoc = await db.collection('guests').doc(invitationCode).get();
                if (!existingDoc.exists) {
                    isUnique = true;
                } else {
                    invitationCode = generateInvitationCode();
                    attempts++;
                }
            }
            
            if (!isUnique) {
                throw new Error('No se pudo generar un código único');
            }
        }
        
        // Crear documento
        const guestData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            maxGuests: maxGuests,
            confirmedGuests: 0,
            status: 'pending',
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp()
        };
        
        await db.collection('guests').doc(invitationCode).set(guestData);
        
        // Registrar actividad
        await logAction('guest_created', invitationCode, {
            name: name,
            email: email,
            maxGuests: maxGuests
        });
        
        return {
            success: true,
            invitationCode: invitationCode,
            data: guestData,
            link: `${window.location.origin}?p=${maxGuests}&code=${invitationCode}`
        };
        
    } catch (error) {
        console.error("Error creando invitación:", error);
        throw error;
    }
}

/**
 * Obtiene todos los invitados con paginación
 */
async function getAllGuests(page = 1, limit = 20, search = '') {
    try {
        let query = db.collection('guests');
        
        // Aplicar filtro de búsqueda si existe
        if (search) {
            // Búsqueda por código
            query = query.where('__name__', '>=', search)
                        .where('__name__', '<=', search + '\uf8ff');
        }
        
        // Ordenar por fecha de creación
        query = query.orderBy('createdAt', 'desc');
        
        // Calcular offset
        const offset = (page - 1) * limit;
        
        // Obtener datos
        const snapshot = await query.limit(limit).get();
        const guests = [];
        
        snapshot.forEach(doc => {
            guests.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Obtener total (para paginación)
        const totalSnapshot = search ? 
            await db.collection('guests')
                   .where('__name__', '>=', search)
                   .where('__name__', '<=', search + '\uf8ff')
                   .get() :
            await db.collection('guests').get();
                   
        const total = totalSnapshot.size;
        const totalPages = Math.ceil(total / limit);
        
        return {
            guests,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
        
    } catch (error) {
        console.error("Error obteniendo invitados:", error);
        throw error;
    }
}

/**
 * Actualiza el estado de un invitado
 */
async function updateGuestStatus(invitationCode, status, confirmedGuests = 0) {
    try {
        const guestRef = db.collection('guests').doc(invitationCode);
        const guestDoc = await guestRef.get();
        
        if (!guestDoc.exists) {
            throw new Error('Invitación no encontrada');
        }
        
        const guestData = guestDoc.data();
        
        // Validar confirmados
        if (status === 'confirmed' && confirmedGuests > guestData.maxGuests) {
            throw new Error(`No puede confirmar más de ${guestData.maxGuests} personas`);
        }
        
        // Preparar actualización
        const updateData = {
            status,
            confirmedGuests: status === 'confirmed' ? confirmedGuests : 0,
            responseDate: status !== 'pending' ? getCurrentTimestamp() : null,
            updatedAt: getCurrentTimestamp()
        };
        
        await guestRef.update(updateData);
        
        // Registrar actividad
        await logAction('guest_updated', invitationCode, {
            oldStatus: guestData.status,
            newStatus: status,
            confirmedGuests: confirmedGuests
        });
        
        return {
            success: true,
            message: `Estado actualizado a ${status}`
        };
        
    } catch (error) {
        console.error("Error actualizando invitado:", error);
        throw error;
    }
}

/**
 * Elimina un invitado
 */
async function deleteGuest(invitationCode) {
    try {
        const guestRef = db.collection('guests').doc(invitationCode);
        const guestDoc = await guestRef.get();
        
        if (!guestDoc.exists) {
            throw new Error('Invitación no encontrada');
        }
        
        const guestData = guestDoc.data();
        
        // Primero mover a eliminados (backup)
        await db.collection('deleted_guests').doc(invitationCode).set({
            ...guestData,
            deletedAt: getCurrentTimestamp(),
            deletedBy: auth.currentUser?.email || 'system'
        });
        
        // Luego eliminar
        await guestRef.delete();
        
        // Registrar actividad
        await logAction('guest_deleted', invitationCode, {
            name: guestData.name,
            email: guestData.email
        });
        
        return {
            success: true,
            message: 'Invitación eliminada correctamente'
        };
        
    } catch (error) {
        console.error("Error eliminando invitado:", error);
        throw error;
    }
}

/**
 * Importa múltiples invitados
 */
async function bulkImportGuests(guestList) {
    try {
        const results = [];
        const batch = db.batch();
        
        for (const guest of guestList) {
            try {
                const { name, email, maxGuests } = guest;
                
                // Validar datos
                if (!maxGuests || ![2, 4, 6, 10].includes(maxGuests)) {
                    results.push({
                        success: false,
                        guest,
                        error: 'Número de invitados no válido'
                    });
                    continue;
                }
                
                // Generar código único
                let invitationCode = generateInvitationCode();
                let isUnique = false;
                let attempts = 0;
                
                while (!isUnique && attempts < 10) {
                    const existingDoc = await db.collection('guests').doc(invitationCode).get();
                    if (!existingDoc.exists) {
                        isUnique = true;
                    } else {
                        invitationCode = generateInvitationCode();
                        attempts++;
                    }
                }
                
                if (!isUnique) {
                    results.push({
                        success: false,
                        guest,
                        error: 'No se pudo generar código único'
                    });
                    continue;
                }
                
                // Preparar datos
                const guestData = {
                    name: (name || '').trim(),
                    email: (email || '').trim().toLowerCase(),
                    maxGuests: maxGuests,
                    confirmedGuests: 0,
                    status: 'pending',
                    createdAt: getCurrentTimestamp(),
                    updatedAt: getCurrentTimestamp()
                };
                
                // Agregar al batch
                const guestRef = db.collection('guests').doc(invitationCode);
                batch.set(guestRef, guestData);
                
                results.push({
                    success: true,
                    invitationCode,
                    guest: guestData
                });
                
            } catch (error) {
                results.push({
                    success: false,
                    guest,
                    error: error.message
                });
            }
        }
        
        // Ejecutar batch si hay éxitos
        const successfulImports = results.filter(r => r.success);
        if (successfulImports.length > 0) {
            await batch.commit();
            
            // Registrar actividad
            await logAction('bulk_import', 'system', {
                total: guestList.length,
                successful: successfulImports.length,
                failed: results.length - successfulImports.length
            });
        }
        
        return results;
        
    } catch (error) {
        console.error("Error en importación masiva:", error);
        throw error;
    }
}

/**
 * Exporta invitados a CSV
 */
async function exportGuestsToCSV() {
    try {
        const snapshot = await db.collection('guests').get();
        let csv = 'Código,Nombre,Email,Cupos,Estado,Confirmados,Fecha Creación\n';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const row = [
                doc.id,
                `"${(data.name || '').replace(/"/g, '""')}"`,
                data.email || '',
                data.maxGuests || 0,
                data.status || 'pending',
                data.confirmedGuests || 0,
                data.createdAt ? formatDate(data.createdAt) : ''
            ].join(',');
            csv += row + '\n';
        });
        
        return csv;
        
    } catch (error) {
        console.error("Error exportando CSV:", error);
        throw error;
    }
}

/**
 * Registra una actividad en el log
 */
async function logAction(action, target, details = {}) {
    try {
        const user = auth.currentUser;
        
        const logEntry = {
            action,
            target,
            details,
            user: user ? {
                email: user.email,
                uid: user.uid
            } : { email: 'system', uid: 'system' },
            timestamp: getCurrentTimestamp(),
            userAgent: navigator.userAgent,
            hostname: window.location.hostname
        };
        
        await db.collection('logs').add(logEntry);
        
    } catch (error) {
        console.error("Error registrando actividad:", error);
    }
}

// ===== AUTHENTICATION =====

/**
 * Inicia sesión con Google
 */
async function loginWithGoogle() {
    try {
        console.log("Iniciando login con Google...");
        
        // Verificar que Firebase esté inicializado
        if (!auth || typeof auth === 'undefined') {
            throw new Error('Firebase Auth no está inicializado. Reinicia la página.');
        }
        
        // Verificar que firebase.auth esté disponible
        if (!firebase.auth) {
            throw new Error('Firebase Auth no está disponible. Verifica los scripts cargados.');
        }
        
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Agregar scopes
        provider.addScope('profile');
        provider.addScope('email');
        
        // Configurar para que pida seleccionar cuenta cada vez
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        console.log("Provider creado, iniciando popup...");
        
        // Usar signInWithPopup (funciona mejor con GitHub Pages)
        const result = await auth.signInWithPopup(provider);
        
        console.log("✅ Login exitoso:", result.user.email);
        
        // Verificar si es administrador
        const isAdmin = await checkAdminAccess(result.user.email);
        
        if (!isAdmin) {
            // Cerrar sesión si no es admin
            await auth.signOut();
            throw new Error('No tienes permisos de administrador. Contacta al organizador.');
        }
        
        return {
            success: true,
            user: result.user,
            isAdmin: true
        };
        
    } catch (error) {
        console.error("❌ Error en login con Google:", error);
        
        // Manejar errores específicos
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.code === 'auth/popup-blocked') {
            errorMessage = 'El popup fue bloqueado. Por favor, permite popups para este sitio y vuelve a intentar.';
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'El popup fue cerrado antes de completar el login. Intenta de nuevo.';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = 'Este dominio no está autorizado. Contacta al administrador para agregar: ' + window.location.hostname;
        } else if (error.code === 'auth/operation-not-supported-in-this-environment') {
            errorMessage = 'El navegador no soporta popups. Intenta con un navegador diferente o habilita popups.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = 'Solicitud de popup cancelada. Intenta de nuevo.';
        } else if (error.message.includes('permissions') || error.message.includes('admin')) {
            errorMessage = 'No tienes permisos de administrador. Contacta al organizador.';
        } else if (error.message.includes('Firebase')) {
            errorMessage = 'Error de Firebase: ' + error.message;
        }
        
        throw new Error(errorMessage);
    }
}

/**
 * Cierra sesión
 */
async function logout() {
    try {
        await auth.signOut();
        console.log("✅ Sesión cerrada exitosamente");
        return { success: true };
    } catch (error) {
        console.error("❌ Error cerrando sesión:", error);
        throw error;
    }
}

/**
 * Verifica el estado de autenticación
 */
function getCurrentUser() {
    return auth ? auth.currentUser : null;
}

/**
 * Verifica si el usuario actual es administrador
 */
async function checkCurrentUserAdmin() {
    const user = getCurrentUser();
    if (!user) return false;
    
    return await checkAdminAccess(user.email);
}

// ===== OBSERVADOR DE AUTENTICACIÓN =====
function setupAuthListener() {
    if (!auth) {
        console.warn("Auth no está disponible para configurar listener");
        return;
    }
    
    auth.onAuthStateChanged(async (user) => {
        console.log("Auth state changed:", user ? user.email : "No user");
        
        if (user) {
            console.log("Usuario autenticado:", user.email);
            
            // Verificar si es administrador
            try {
                const isAdmin = await checkAdminAccess(user.email);
                
                if (isAdmin) {
                    // Disparar evento personalizado para el admin
                    window.dispatchEvent(new CustomEvent('admin-auth-success', {
                        detail: { user, isAdmin }
                    }));
                } else {
                    // No es admin, cerrar sesión
                    await auth.signOut();
                    window.dispatchEvent(new CustomEvent('admin-auth-failed', {
                        detail: { reason: 'no-admin' }
                    }));
                }
            } catch (error) {
                console.error("Error verificando admin:", error);
                try {
                    await auth.signOut();
                } catch (e) {
                    console.error("Error cerrando sesión:", e);
                }
            }
        } else {
            console.log("Usuario no autenticado");
            window.dispatchEvent(new CustomEvent('admin-auth-signed-out'));
        }
    });
}

// Inicializar el listener cuando Firebase esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (auth) {
            setupAuthListener();
        } else {
            console.warn("Auth no disponible para listener inicial");
        }
    }, 1000);
});

// ===== EXPORTAR FUNCIONES =====
window.firebaseApp = {
    // Configuración
    config: firebaseConfig,
    
    // Servicios
    getApp: () => app,
    getDb: () => db,
    getAuth: () => auth,
    
    // Funciones de ayuda
    getCurrentTimestamp,
    formatDate,
    generateInvitationCode,
    checkAdminAccess,
    checkCurrentUserAdmin,
    
    // Estadísticas
    getEventStats,
    
    // Gestión de invitados
    createGuestInvitation,
    getAllGuests,
    updateGuestStatus,
    deleteGuest,
    bulkImportGuests,
    exportGuestsToCSV,
    
    // Autenticación
    loginWithGoogle,
    logout,
    getCurrentUser,
    
    // Logs
    logAction,
    
    // Inicialización
    initializeFirebase
};

console.log("✅ Firebase Config cargado correctamente");