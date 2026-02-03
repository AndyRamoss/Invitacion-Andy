// invitation.js - Versión CORREGIDA para guardar en Firebase

document.addEventListener('DOMContentLoaded', function() {
    console.log("🎬 Invitation Page inicializando...");
    
    // Inicializar Firebase
    initializeFirebaseForInvitation();
    
    // Obtener parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    const maxGuestsParam = urlParams.get('p');
    const invitationCode = urlParams.get('code');
    
    // Verificar invitación si hay código
    if (invitationCode) {
        console.log("Código de invitación detectado:", invitationCode);
        checkInvitation(invitationCode);
    } else if (maxGuestsParam) {
        // Solo número de invitados (modo simple)
        console.log("Modo simple con", maxGuestsParam, "invitados");
        setupSimpleInvitation(parseInt(maxGuestsParam));
    } else {
        // Modo sin invitación (solo información)
        console.log("Modo informativo - Sin invitación específica");
        showGenericInfo();
    }
    
    // Configurar formulario de RSVP
    setupRSVPForm();
});

// ===== INICIALIZAR FIREBASE PARA INVITACIONES =====
function initializeFirebaseForInvitation() {
    try {
        console.log("🔥 Inicializando Firebase para invitaciones...");
        
        // Verificar que Firebase esté cargado
        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK no está cargado");
            return false;
        }
        
        // Configuración de Firebase (MISMA QUE EL ADMIN)
        const firebaseConfig = {
            apiKey: "AIzaSyA2uASDdwH2vKmRtwLDvjvTSMOFImhDUFM",
            authDomain: "encuesta-649b8.firebaseapp.com",
            projectId: "encuesta-649b8",
            storageBucket: "encuesta-649b8.firebasestorage.app",
            messagingSenderId: "226296434450",
            appId: "1:226296434450:web:470fb309d3b73a630a2dcb",
            measurementId: "G-8YTM0C38ST"
        };
        
        // Inicializar Firebase solo si no está ya inicializado
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase inicializado para invitaciones");
        } else {
            console.log("✅ Firebase ya estaba inicializado");
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ Error inicializando Firebase:", error);
        return false;
    }
}

// ===== VERIFICAR INVITACIÓN =====
async function checkInvitation(invitationCode) {
    try {
        console.log("Verificando invitación:", invitationCode);
        
        // Verificar que Firebase esté disponible
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.warn("Firebase no está disponible");
            showGenericInfo();
            return;
        }
        
        // Esperar a que Firebase se inicialice
        if (firebase.apps.length === 0) {
            await initializeFirebaseForInvitation();
        }
        
        const db = firebase.firestore();
        
        // Buscar invitación
        const guestDoc = await db.collection('guests').doc(invitationCode).get();
        
        if (!guestDoc.exists) {
            console.warn("Invitación no encontrada:", invitationCode);
            showInvalidInvitation();
            return;
        }
        
        const guestData = guestDoc.data();
        console.log("✅ Invitación válida encontrada:", guestData);
        
        // Mostrar información del invitado
        showGuestInfo(guestData, invitationCode);
        
    } catch (error) {
        console.error("❌ Error verificando invitación:", error);
        showGenericInfo();
    }
}

// ===== CONFIGURAR INFO DEL INVITADO =====
function showGuestInfo(guestData, invitationCode) {
    // Actualizar información del invitado
    const maxGuestsElement = document.getElementById('max-guests');
    const guestStatusElement = document.getElementById('guest-status');
    const invitationTitle = document.getElementById('invitation-title');
    
    if (maxGuestsElement) {
        maxGuestsElement.textContent = guestData.maxGuests + " personas";
    }
    
    if (guestStatusElement) {
        const statusText = guestData.status === 'confirmed' ? 'Confirmado' :
                          guestData.status === 'declined' ? 'No asistirá' : 'Pendiente';
        guestStatusElement.textContent = statusText;
        guestStatusElement.style.color = guestData.status === 'confirmed' ? '#4CAF50' :
                                        guestData.status === 'declined' ? '#f44336' : '#ffd700';
    }
    
    if (invitationTitle && guestData.name) {
        invitationTitle.textContent = `Invitación para ${guestData.name}`;
    }
    
    // Configurar campo de cantidad de invitados
    const guestsCountInput = document.getElementById('guests-count');
    const maxAllowedSpan = document.getElementById('max-allowed');
    
    if (guestsCountInput && maxAllowedSpan) {
        guestsCountInput.max = guestData.maxGuests;
        guestsCountInput.value = guestData.confirmedGuests || 1;
        maxAllowedSpan.textContent = guestData.maxGuests;
    }
    
    // Mostrar mensaje personalizado
    const invitationMessage = document.getElementById('invitation-message');
    if (invitationMessage) {
        if (guestData.name) {
            invitationMessage.textContent = `¡Hola ${guestData.name}! Tu invitación es para ${guestData.maxGuests} personas`;
        } else {
            invitationMessage.textContent = `Tu invitación es para ${guestData.maxGuests} personas`;
        }
    }
    
    // Guardar código de invitación para el formulario
    window.invitationCode = invitationCode;
    window.guestData = guestData;
}

function setupSimpleInvitation(maxGuests) {
    // Actualizar UI con número de invitados
    const maxGuestsElement = document.getElementById('max-guests');
    const guestStatusElement = document.getElementById('guest-status');
    
    if (maxGuestsElement) {
        maxGuestsElement.textContent = maxGuests + " personas";
    }
    
    if (guestStatusElement) {
        guestStatusElement.textContent = "Pendiente de confirmación";
        guestStatusElement.style.color = "#ffd700";
    }
    
    // Configurar campo de cantidad de invitados
    const guestsCountInput = document.getElementById('guests-count');
    const maxAllowedSpan = document.getElementById('max-allowed');
    
    if (guestsCountInput && maxAllowedSpan) {
        guestsCountInput.max = maxGuests;
        guestsCountInput.value = maxGuests;
        maxAllowedSpan.textContent = maxGuests;
    }
    
    // Mostrar mensaje personalizado
    const invitationMessage = document.getElementById('invitation-message');
    if (invitationMessage) {
        invitationMessage.textContent = `Tu invitación es para ${maxGuests} personas`;
    }
}

function showGenericInfo() {
    const maxGuestsElement = document.getElementById('max-guests');
    if (maxGuestsElement) {
        maxGuestsElement.textContent = "2 personas (predeterminado)";
    }
    
    const maxAllowedSpan = document.getElementById('max-allowed');
    if (maxAllowedSpan) {
        maxAllowedSpan.textContent = "2";
    }
    
    const invitationMessage = document.getElementById('invitation-message');
    if (invitationMessage) {
        invitationMessage.textContent = "¡Bienvenido a Hollywood Nights!";
    }
}

function showInvalidInvitation() {
    const rsvpForm = document.getElementById('rsvp-form-container');
    if (rsvpForm) {
        rsvpForm.innerHTML = `
            <div class="error-message">
                <div class="message-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3 class="font-cinzel">Invitación No Válida</h3>
                <p>El código de invitación no es válido o ha expirado.</p>
                <p class="message-note">Contacta al organizador para obtener un enlace válido.</p>
            </div>
        `;
    }
}

// ===== CONFIGURAR FORMULARIO DE RSVP =====
function setupRSVPForm() {
    const rsvpForm = document.getElementById('rsvp-form');
    if (!rsvpForm) return;
    
    // Mostrar/ocultar campos según selección
    const attendanceSelect = document.getElementById('attendance');
    const guestsCountGroup = document.getElementById('guests-count-group');
    const noteGroup = document.getElementById('note-group');
    const nameGroup = document.getElementById('name-group');
    
    if (attendanceSelect) {
        attendanceSelect.addEventListener('change', function() {
            if (this.value === 'yes') {
                guestsCountGroup.style.display = 'block';
                noteGroup.style.display = 'block';
                if (nameGroup) nameGroup.style.display = 'block';
            } else if (this.value === 'no') {
                guestsCountGroup.style.display = 'none';
                noteGroup.style.display = 'block';
                if (nameGroup) nameGroup.style.display = 'block';
            } else {
                guestsCountGroup.style.display = 'none';
                noteGroup.style.display = 'none';
                if (nameGroup) nameGroup.style.display = 'none';
            }
        });
    }
    
    // Manejar envío del formulario
    rsvpForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            // Mostrar loading
            const submitBtn = this.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;
            
            // Obtener datos del formulario
            const name = document.getElementById('guest-name')?.value.trim() || '';
            const attendance = document.getElementById('attendance').value;
            const guestsCount = document.getElementById('guests-count')?.value || 1;
            const note = document.getElementById('note')?.value.trim() || '';
            
            // Validar
            if (!attendance) {
                throw new Error('Selecciona si asistirás o no');
            }
            
            if (attendance === 'yes' && (!guestsCount || guestsCount < 1)) {
                throw new Error('Selecciona el número de personas que asistirán');
            }
            
            // Preparar datos para enviar
            const rsvpData = {
                name: name,
                attendance: attendance,
                guestsCount: attendance === 'yes' ? parseInt(guestsCount) : 0,
                note: note,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                ip: await getClientIP()
            };
            
            console.log("📤 Enviando RSVP:", rsvpData);
            
            // Guardar en Firebase
            const saved = await saveRSVPToFirebase(rsvpData);
            
            if (saved) {
                // Mostrar mensaje de confirmación
                showConfirmationMessage(rsvpData);
            } else {
                throw new Error('No se pudo guardar la confirmación');
            }
            
        } catch (error) {
            console.error("❌ Error enviando RSVP:", error);
            showErrorMessage(error.message);
        } finally {
            // Restaurar botón
            const submitBtn = rsvpForm.querySelector('.btn-submit');
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Confirmar Asistencia';
            submitBtn.disabled = false;
        }
    });
}

// ===== GUARDAR EN FIREBASE =====
async function saveRSVPToFirebase(rsvpData) {
    try {
        // Verificar que Firebase esté disponible
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.error("Firebase no disponible");
            return false;
        }
        
        const db = firebase.firestore();
        const invitationCode = window.invitationCode;
        
        console.log("💾 Guardando en Firebase...");
        console.log("Código de invitación:", invitationCode);
        console.log("Datos de invitación:", window.guestData);
        
        if (invitationCode && window.guestData) {
            // Caso 1: Tenemos código de invitación específico
            console.log("📝 Actualizando invitación existente:", invitationCode);
            
            const updateData = {
                status: rsvpData.attendance === 'yes' ? 'confirmed' : 'declined',
                confirmedGuests: rsvpData.attendance === 'yes' ? rsvpData.guestsCount : 0,
                responseDate: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Si el usuario proporcionó nombre, actualizarlo
            if (rsvpData.name && rsvpData.name.trim() !== '') {
                updateData.name = rsvpData.name;
            }
            
            console.log("📊 Datos a actualizar:", updateData);
            
            // Actualizar en Firestore
            await db.collection('guests').doc(invitationCode).update(updateData);
            
            // Registrar actividad
            await db.collection('logs').add({
                action: 'rsvp_updated',
                target: invitationCode,
                details: {
                    name: rsvpData.name || window.guestData.name,
                    status: updateData.status,
                    guestsCount: updateData.confirmedGuests
                },
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                hostname: window.location.hostname,
                source: 'invitation_page'
            });
            
            console.log("✅ RSVP actualizado en Firebase para invitación:", invitationCode);
            
        } else {
            // Caso 2: No hay código específico (modo simple)
            console.log("📝 Creando nueva entrada en Firestore (modo simple)");
            
            // Generar un ID único para esta respuesta
            const responseId = 'simple_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const responseData = {
                name: rsvpData.name,
                attendance: rsvpData.attendance,
                guestsCount: rsvpData.guestsCount,
                note: rsvpData.note,
                maxGuests: parseInt(document.getElementById('max-allowed')?.textContent || 2),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                source: 'simple_invitation',
                pageUrl: window.location.href
            };
            
            // Guardar en colección de respuestas
            await db.collection('responses').doc(responseId).set(responseData);
            
            console.log("✅ Respuesta simple guardada en Firebase:", responseId);
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ Error guardando en Firebase:", error);
        console.error("Mensaje:", error.message);
        console.error("Código:", error.code);
        console.error("Stack:", error.stack);
        return false;
    }
}

// ===== FUNCIONES DE AYUDA =====
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

function showConfirmationMessage(rsvpData) {
    const rsvpForm = document.getElementById('rsvp-form-container');
    if (!rsvpForm) return;
    
    let message = '';
    
    if (rsvpData.attendance === 'yes') {
        message = `
            <div class="confirmation-message">
                <div class="message-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3 class="font-cinzel">¡Confirmación Exitosa!</h3>
                <p>${rsvpData.name ? `Gracias ${rsvpData.name}, ` : ''}has confirmado asistencia para ${rsvpData.guestsCount} persona${rsvpData.guestsCount > 1 ? 's' : ''}.</p>
                <p>Te esperamos en la alfombra roja el 21 de Febrero 2026.</p>
                ${rsvpData.note ? `<p class="message-note">Tu mensaje: "${rsvpData.note}"</p>` : ''}
                <p style="margin-top: 20px; font-size: 0.9rem; color: #888;">
                    <i class="fas fa-info-circle"></i> Tu confirmación ha sido guardada en el sistema.
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
                <p>${rsvpData.name ? `Gracias ${rsvpData.name} ` : 'Gracias '}por informarnos que no podrás asistir.</p>
                <p>Lamentamos no poder contar con tu presencia.</p>
                ${rsvpData.note ? `<p class="message-note">Tu mensaje: "${rsvpData.note}"</p>` : ''}
                <p style="margin-top: 20px; font-size: 0.9rem; color: #888;">
                    <i class="fas fa-info-circle"></i> Tu respuesta ha sido guardada en el sistema.
                </p>
            </div>
        `;
    }
    
    rsvpForm.innerHTML = message;
    
    // También mostrar en consola para debug
    console.log("✅ Confirmación mostrada al usuario:", rsvpData);
}

function showErrorMessage(errorMessage) {
    const rsvpForm = document.getElementById('rsvp-form-container');
    if (!rsvpForm) return;
    
    // Mostrar mensaje de error
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'block';
        document.getElementById('error-details').textContent = errorMessage;
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

console.log("✅ Invitation JS cargado correctamente");
