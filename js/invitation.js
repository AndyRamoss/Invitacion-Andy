// invitation.js - Manejo de invitaciones en la página principal

// Variables globales
let currentInvitationCode = null;
let currentGuestData = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log("🎬 Invitation Page inicializando...");
    
    // Obtener parámetros de URL
    const urlParams = new URLSearchParams(window.location.search);
    const maxGuestsParam = urlParams.get('p');
    const invitationCode = urlParams.get('code');
    
    // Inicializar Firebase
    initializeFirebaseForInvitations();
    
    // Verificar invitación si hay código
    if (invitationCode) {
        console.log("Código de invitación detectado:", invitationCode);
        currentInvitationCode = invitationCode;
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
            
            console.log("🔄 Inicializando Firebase con configuración...");
            firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase inicializado para invitaciones");
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

async function checkInvitation(invitationCode) {
    try {
        console.log("🔍 Verificando invitación:", invitationCode);
        
        // Esperar un momento para asegurar que Firebase esté listo
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar que Firebase esté disponible
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.error("❌ Firebase Firestore no está disponible");
            showGenericInfo();
            return;
        }
        
        const db = firebase.firestore();
        console.log("📡 Conectado a Firestore");
        
        // Buscar invitación
        console.log("Buscando documento en colección 'guests':", invitationCode);
        const guestDoc = await db.collection('guests').doc(invitationCode).get();
        
        if (!guestDoc.exists) {
            console.warn("⚠️ Invitación no encontrada:", invitationCode);
            showInvalidInvitation();
            return;
        }
        
        const guestData = guestDoc.data();
        console.log("✅ Invitación válida encontrada:", guestData);
        
        // Guardar datos globalmente
        currentGuestData = guestData;
        
        // Mostrar información del invitado
        showGuestInfo(guestData, invitationCode);
        
    } catch (error) {
        console.error("❌ Error verificando invitación:", error);
        console.error("Detalles del error:", error.message, error.code);
        showGenericInfo();
    }
}

function setupSimpleInvitation(maxGuests) {
    console.log("📝 Configurando invitación simple para", maxGuests, "personas");
    
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

function showGuestInfo(guestData, invitationCode) {
    console.log("👤 Mostrando información del invitado:", guestData);
    
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
        const maxGuests = guestData.maxGuests || 2;
        const confirmedGuests = guestData.confirmedGuests || 1;
        
        guestsCountInput.max = maxGuests;
        guestsCountInput.value = Math.min(confirmedGuests, maxGuests);
        maxAllowedSpan.textContent = maxGuests;
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
}

function showGenericInfo() {
    console.log("ℹ️ Mostrando información genérica");
    
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
    console.log("❌ Mostrando mensaje de invitación inválida");
    
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
    
    if (attendanceSelect) {
        attendanceSelect.addEventListener('change', function() {
            console.log("Cambio en selección de asistencia:", this.value);
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
        console.log("📤 Enviando formulario RSVP...");
        
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
            
            console.log("Datos del formulario:", {
                name,
                attendance,
                guestsCount,
                note,
                currentInvitationCode,
                hasGuestData: !!currentGuestData
            });
            
            // Validar
            if (!attendance) {
                throw new Error('Selecciona si asistirás o no');
            }
            
            if (attendance === 'yes') {
                if (!guestsCount || guestsCount < 1) {
                    throw new Error('Selecciona el número de personas que asistirán');
                }
                
                // Si hay invitación específica, verificar límite
                if (currentGuestData) {
                    const maxGuests = currentGuestData.maxGuests || 2;
                    if (parseInt(guestsCount) > maxGuests) {
                        throw new Error(`Máximo ${maxGuests} personas permitidas`);
                    }
                }
            }
            
            // Preparar datos para enviar
            const rsvpData = {
                name: name,
                attendance: attendance,
                guestsCount: attendance === 'yes' ? parseInt(guestsCount) : 0,
                note: note,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            console.log("RSVP Data preparado:", rsvpData);
            
            // Actualizar en Firebase si hay código de invitación
            if (currentInvitationCode) {
                console.log("Actualizando en Firebase con código:", currentInvitationCode);
                const result = await updateInvitationInFirebase(rsvpData);
                console.log("Resultado de Firebase:", result);
            } else {
                // Si no hay código, solo mostrar confirmación local
                console.log("RSVP sin código de invitación:", rsvpData);
            }
            
            // Mostrar mensaje de confirmación
            showConfirmationMessage(rsvpData);
            
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
    
    console.log("✅ Formulario RSVP configurado correctamente");
}

async function updateInvitationInFirebase(rsvpData) {
    console.log("🔄 Iniciando actualización en Firebase...");
    
    try {
        // Verificar que Firebase esté disponible
        if (typeof firebase === 'undefined' || !firebase.firestore) {
            console.error("❌ Firebase Firestore no disponible");
            throw new Error('Servicio no disponible. Intenta recargar la página.');
        }
        
        const db = firebase.firestore();
        console.log("✅ Conectado a Firestore");
        
        if (!currentInvitationCode) {
            console.warn("⚠️ No hay código de invitación para actualizar");
            return { success: false, message: 'No hay código de invitación' };
        }
        
        console.log("📝 Actualizando documento:", currentInvitationCode);
        
        // Preparar datos de actualización
        const updateData = {
            status: rsvpData.attendance === 'yes' ? 'confirmed' : 'declined',
            confirmedGuests: rsvpData.attendance === 'yes' ? rsvpData.guestsCount : 0,
            responseDate: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastResponse: rsvpData
        };
        
        // Si el usuario proporcionó nombre, actualizarlo
        if (rsvpData.name) {
            updateData.name = rsvpData.name;
        }
        
        // Si el usuario proporcionó nota, guardarla
        if (rsvpData.note) {
            updateData.note = rsvpData.note;
        }
        
        console.log("Datos a actualizar:", updateData);
        
        // Actualizar en Firestore
        console.log("Enviando actualización a Firestore...");
        await db.collection('guests').doc(currentInvitationCode).update(updateData);
        console.log("✅ Documento actualizado en Firestore");
        
        // Registrar actividad en logs
        try {
            const logData = {
                action: 'rsvp_updated',
                target: currentInvitationCode,
                details: {
                    name: rsvpData.name || currentGuestData?.name || 'Invitado',
                    status: updateData.status,
                    guestsCount: updateData.confirmedGuests,
                    previousStatus: currentGuestData?.status || 'pending'
                },
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                hostname: window.location.hostname,
                userAgent: navigator.userAgent,
                ip: 'web-client' // No podemos obtener IP desde cliente web sin backend
            };
            
            await db.collection('logs').add(logData);
            console.log("✅ Actividad registrada en logs");
            
        } catch (logError) {
            console.warn("⚠️ No se pudo registrar en logs:", logError);
            // No fallar si no se puede registrar el log
        }
        
        // Actualizar datos locales
        if (currentGuestData) {
            currentGuestData.status = updateData.status;
            currentGuestData.confirmedGuests = updateData.confirmedGuests;
            if (rsvpData.name) currentGuestData.name = rsvpData.name;
        }
        
        return {
            success: true,
            message: 'Confirmación guardada exitosamente',
            data: updateData
        };
        
    } catch (error) {
        console.error("❌ Error actualizando en Firebase:", error);
        console.error("Código de error:", error.code);
        console.error("Mensaje de error:", error.message);
        
        let errorMessage = 'No se pudo guardar la confirmación. ';
        
        if (error.code === 'permission-denied') {
            errorMessage += 'Error de permisos. Contacta al administrador.';
            console.error("🔒 ERROR DE PERMISOS: Verifica las reglas de Firestore");
        } else if (error.code === 'not-found') {
            errorMessage += 'Invitación no encontrada.';
        } else if (error.code === 'unavailable') {
            errorMessage += 'Servicio no disponible. Verifica tu conexión.';
        } else {
            errorMessage += 'Intenta de nuevo.';
        }
        
        throw new Error(errorMessage);
    }
}

function showConfirmationMessage(rsvpData) {
    console.log("✅ Mostrando mensaje de confirmación");
    
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
                <p>${rsvpData.name ? `Gracias ${rsvpData.name}, ` : ''}has confirmado asistencia para ${rsvpData.guestsCount} persona${rsvpData.guestsCount > 1 ? 's' : ''}.</p>
                <p>Te esperamos en la alfombra roja el 21 de Febrero 2026.</p>
                ${rsvpData.note ? `<p class="message-note">Tu mensaje: "${rsvpData.note}"</p>` : ''}
                <p style="margin-top: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
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
                <p style="margin-top: 20px; font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                    <i class="fas fa-info-circle"></i> Tu respuesta ha sido guardada en el sistema.
                </p>
            </div>
        `;
    }
    
    rsvpForm.innerHTML = message;
    
    // Actualizar estado en la UI si hay invitación
    if (currentGuestData) {
        const guestStatusElement = document.getElementById('guest-status');
        if (guestStatusElement) {
            guestStatusElement.textContent = rsvpData.attendance === 'yes' ? 'Confirmado' : 'No asistirá';
            guestStatusElement.style.color = rsvpData.attendance === 'yes' ? '#4CAF50' : '#f44336';
        }
    }
    
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

console.log("✅ Invitation JS cargado correctamente");
