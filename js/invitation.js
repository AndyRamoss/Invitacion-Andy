// invitation.js - Sistema de RSVP automático (sin códigos previos)

// Variables globales
let currentRSVPId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log("🎬 Sistema RSVP automático inicializando...");
    
    // Inicializar Firebase
    initializeFirebaseForInvitations();
    
    // Configurar formulario de RSVP
    setupRSVPForm();
    
    // Mostrar información básica
    showGenericInfo();
});

function initializeFirebaseForInvitations() {
    try {
        // Verificar que Firebase esté cargado
        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK no está cargado");
            return false;
        }
        
        // Inicializar Firebase solo si no está ya inicializado
        if (firebase.apps.length === 0) {
            const firebaseConfig = {
                apiKey: "AIzaSyA2uASDdwH2vKmRtwLDvjvTSMOFImhDUFM",
                authDomain: "encuesta-649b8.firebaseapp.com",
                projectId: "encuesta-649b8",
                storageBucket: "encuesta-649b8.firebasestorage.app",
                messagingSenderId: "226296434450",
                appId: "1:226296434450:web:470fb309d3b73a630a2dcb",
                measurementId: "G-8YTM0C38ST"
            };
            
            console.log("🔄 Inicializando Firebase...");
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase inicializado");
            return true;
        } else {
            console.log("✅ Firebase ya estaba inicializado");
            return true;
        }
        
    } catch (error) {
        console.error("❌ Error inicializando Firebase:", error);
        return false;
    }
}

function showGenericInfo() {
    console.log("ℹ️ Mostrando información genérica");
    
    const maxGuestsElement = document.getElementById('max-guests');
    if (maxGuestsElement) {
        maxGuestsElement.textContent = "Confirmación abierta";
    }
    
    const guestStatusElement = document.getElementById('guest-status');
    if (guestStatusElement) {
        guestStatusElement.textContent = "Nuevo RSVP";
        guestStatusElement.style.color = "#ffd700";
    }
    
    const invitationTitle = document.getElementById('invitation-title');
    if (invitationTitle) {
        invitationTitle.textContent = "Confirmar Asistencia";
    }
    
    const maxAllowedSpan = document.getElementById('max-allowed');
    if (maxAllowedSpan) {
        maxAllowedSpan.textContent = "10"; // Máximo por defecto
    }
    
    const invitationMessage = document.getElementById('invitation-message');
    if (invitationMessage) {
        invitationMessage.textContent = "¡Confirma tu asistencia a Hollywood Nights!";
    }
}

function setupRSVPForm() {
    const rsvpForm = document.getElementById('rsvp-form');
    if (!rsvpForm) {
        console.error("❌ No se encontró el formulario RSVP");
        return;
    }
    
    console.log("✅ Formulario RSVP encontrado, configurando...");
    
    // Mostrar/ocultar campos según selección
    const attendanceSelect = document.getElementById('attendance');
    const guestsCountGroup = document.getElementById('guests-count-group');
    const noteGroup = document.getElementById('note-group');
    const nameGroup = document.getElementById('name-group');
    
    // Mostrar todos los campos siempre
    if (nameGroup) nameGroup.style.display = 'block';
    if (guestsCountGroup) guestsCountGroup.style.display = 'block';
    if (noteGroup) noteGroup.style.display = 'block';
    
    if (attendanceSelect) {
        attendanceSelect.addEventListener('change', function() {
            console.log("Cambio en selección de asistencia:", this.value);
            if (this.value === 'yes') {
                if (guestsCountGroup) guestsCountGroup.style.display = 'block';
                if (noteGroup) noteGroup.style.display = 'block';
            } else if (this.value === 'no') {
                if (guestsCountGroup) guestsCountGroup.style.display = 'none';
                if (noteGroup) noteGroup.style.display = 'block';
            }
        });
    }
    
    // Configurar máximo de invitados
    const guestsCountInput = document.getElementById('guests-count');
    if (guestsCountInput) {
        guestsCountInput.min = 1;
        guestsCountInput.max = 10;
        guestsCountInput.value = 2;
    }
    
    // Manejar envío del formulario
    rsvpForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log("📤 Enviando formulario RSVP...");
        
        try {
            // Mostrar loading
            const submitBtn = this.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;
            
            // Obtener datos del formulario
            const name = document.getElementById('guest-name').value.trim();
            const email = document.getElementById('guest-email')?.value.trim() || '';
            const attendance = document.getElementById('attendance').value;
            const guestsCount = document.getElementById('guests-count').value || 1;
            const note = document.getElementById('note').value.trim() || '';
            
            console.log("Datos del formulario:", {
                name,
                email,
                attendance,
                guestsCount,
                note
            });
            
            // Validar
            if (!name) {
                throw new Error('Por favor, escribe tu nombre');
            }
            
            if (!attendance) {
                throw new Error('Selecciona si asistirás o no');
            }
            
            if (attendance === 'yes') {
                if (!guestsCount || guestsCount < 1 || guestsCount > 10) {
                    throw new Error('Selecciona un número válido de personas (1-10)');
                }
            }
            
            // Preparar datos para enviar
            const rsvpData = {
                name: name,
                email: email,
                attendance: attendance,
                guestsCount: attendance === 'yes' ? parseInt(guestsCount) : 0,
                note: note,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                ip: await getClientIP()
            };
            
            console.log("RSVP Data preparado:", rsvpData);
            
            // Guardar en Firebase
            console.log("Guardando en Firebase...");
            const result = await saveRSVPToFirebase(rsvpData);
            console.log("Resultado de Firebase:", result);
            
            // Mostrar mensaje de confirmación
            showConfirmationMessage(rsvpData, result.id);
            
        } catch (error) {
            console.error("❌ Error enviando RSVP:", error);
            showErrorMessage(error.message);
        } finally {
            // Restaurar botón
            const submitBtn = rsvpForm.querySelector('.btn-submit');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Confirmar Asistencia';
                submitBtn.disabled = false;
            }
        }
    });
    
    console.log("✅ Formulario RSVP configurado correctamente");
}

async function saveRSVPToFirebase(rsvpData) {
    console.log("🔄 Guardando RSVP en Firebase...");
    
    try {
        // Verificar que Firebase esté disponible
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.error("❌ Firebase Firestore no disponible");
            throw new Error('Servicio no disponible. Intenta recargar la página.');
        }
        
        const db = firebase.firestore();
        console.log("✅ Conectado a Firestore");
        
        // Generar ID único para este RSVP
        const rsvpId = generateRSVPId(rsvpData.name);
        currentRSVPId = rsvpId;
        
        // Preparar datos para Firestore
        const firestoreData = {
            name: rsvpData.name,
            email: rsvpData.email || '',
            maxGuests: 10, // Máximo permitido
            confirmedGuests: rsvpData.guestsCount,
            status: rsvpData.attendance === 'yes' ? 'confirmed' : 'declined',
            attendance: rsvpData.attendance,
            note: rsvpData.note || '',
            userAgent: rsvpData.userAgent,
            ip: rsvpData.ip,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            responseDate: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            source: 'public_form'
        };
        
        console.log("Guardando en documento:", rsvpId);
        console.log("Datos a guardar:", firestoreData);
        
        // Guardar en Firestore
        await db.collection('guests').doc(rsvpId).set(firestoreData);
        console.log("✅ RSVP guardado en Firestore con ID:", rsvpId);
        
        // Registrar actividad en logs
        try {
            const logData = {
                action: 'rsvp_created',
                target: rsvpId,
                details: {
                    name: rsvpData.name,
                    status: firestoreData.status,
                    guestsCount: firestoreData.confirmedGuests
                },
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                hostname: window.location.hostname,
                userAgent: rsvpData.userAgent
            };
            
            await db.collection('logs').add(logData);
            console.log("✅ Actividad registrada en logs");
            
        } catch (logError) {
            console.warn("⚠️ No se pudo registrar en logs:", logError);
        }
        
        return {
            success: true,
            id: rsvpId,
            message: 'Confirmación guardada exitosamente',
            data: firestoreData
        };
        
    } catch (error) {
        console.error("❌ Error guardando en Firebase:", error);
        console.error("Código de error:", error.code);
        console.error("Mensaje de error:", error.message);
        
        let errorMessage = 'No se pudo guardar la confirmación. ';
        
        if (error.code === 'permission-denied') {
            errorMessage += 'Error de permisos. Contacta al administrador.';
            console.error("🔒 ERROR DE PERMISOS: Verifica las reglas de Firestore");
        } else if (error.code === 'unavailable') {
            errorMessage += 'Servicio no disponible. Verifica tu conexión.';
        } else {
            errorMessage += 'Intenta de nuevo.';
        }
        
        throw new Error(errorMessage);
    }
}

function generateRSVPId(name) {
    // Generar ID único basado en nombre y timestamp
    const timestamp = Date.now().toString(36);
    const nameCode = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    return `${nameCode}${timestamp}${random}`;
}

async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

function showConfirmationMessage(rsvpData, rsvpId) {
    console.log("✅ Mostrando mensaje de confirmación con ID:", rsvpId);
    
    const rsvpForm = document.getElementById('rsvp-form-container');
    if (!rsvpForm) {
        console.error("❌ No se encontró el contenedor del formulario");
        return;
    }
    
    let message = '';
    
    if (rsvpData.attendance === 'yes') {
        message = `
            <div class="confirmation-message">
                <div class="message-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3 class="font-cinzel">¡Confirmación Exitosa!</h3>
                <p>Gracias <strong>${rsvpData.name}</strong>, has confirmado asistencia para <strong>${rsvpData.guestsCount} persona${rsvpData.guestsCount > 1 ? 's' : ''}</strong>.</p>
                <p>Te esperamos en la alfombra roja el <strong>21 de Febrero 2026</strong>.</p>
                ${rsvpData.note ? `<p class="message-note"><strong>Tu mensaje:</strong> "${rsvpData.note}"</p>` : ''}
                <p style="margin-top: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                    <i class="fas fa-info-circle"></i> Tu confirmación ha sido registrada con el código: <strong>${rsvpId}</strong>
                </p>
                <p style="margin-top: 10px; font-size: 0.8rem; color: rgba(255,255,255,0.5);">
                    Guarda este código por si necesitas modificar tu confirmación.
                </p>
            </div>
        `;
    } else {
        message = `
            <div class="confirmation-message">
                <div class="message-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <h3 class="font-cinzel">Confirmación Registrada</h3>
                <p>Gracias <strong>${rsvpData.name}</strong> por informarnos que no podrás asistir.</p>
                <p>Lamentamos no poder contar con tu presencia.</p>
                ${rsvpData.note ? `<p class="message-note"><strong>Tu mensaje:</strong> "${rsvpData.note}"</p>` : ''}
                <p style="margin-top: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                    <i class="fas fa-info-circle"></i> Tu respuesta ha sido registrada con el código: <strong>${rsvpId}</strong>
                </p>
            </div>
        `;
    }
    
    rsvpForm.innerHTML = message;
    
    console.log("✅ Mensaje de confirmación mostrado");
}

function showErrorMessage(errorMessage) {
    console.error("❌ Mostrando mensaje de error:", errorMessage);
    
    const errorDiv = document.getElementById('error-message');
    if (!errorDiv) {
        console.error("❌ No se encontró el div de error");
        return;
    }
    
    errorDiv.style.display = 'block';
    document.getElementById('error-details').textContent = errorMessage;
    
    // Ocultar después de 8 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 8000);
}

console.log("✅ Sistema RSVP automático cargado correctamente");
