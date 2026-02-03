// admin.js - Panel de Control para Hollywood Nights

// Variables globales
let currentUser = null;
let currentTab = 'dashboard';
let currentPage = 1;
let searchQuery = '';
let allGuests = [];
let guestStats = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ Admin Panel inicializando...");
    console.log("URL:", window.location.href);
    console.log("Hostname:", window.location.hostname);
    
    // Inicializar componentes
    initAuth();
    initTabs();
    initForms();
    initModals();
    initMobileMenu();
    
    // Verificar autenticación inicial después de que Firebase se cargue
    setTimeout(() => {
        checkAuthState();
    }, 1500);
});

// ===== AUTENTICACIÓN =====
function initAuth() {
    console.log("🔐 Inicializando autenticación...");
    
    // Botón de login con Google
    const loginBtn = document.getElementById('btn-login-google');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleGoogleLogin);
        console.log("✅ Event listener agregado al botón de login");
        loginBtn.innerHTML = '<i class="fab fa-google"></i> Iniciar sesión con Google';
    } else {
        console.error("❌ No se encontró el botón de login con ID 'btn-login-google'");
        // Intentar encontrar el botón de otra forma
        const googleBtn = document.querySelector('.btn-google');
        if (googleBtn) {
            googleBtn.addEventListener('click', handleGoogleLogin);
            console.log("✅ Event listener agregado al botón .btn-google");
        }
    }
    
    // Botón de logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        console.log("✅ Event listener agregado al botón de logout");
    }
    
    // Escuchar eventos de autenticación
    window.addEventListener('admin-auth-success', handleAuthSuccess);
    window.addEventListener('admin-auth-failed', handleAuthFailed);
    window.addEventListener('admin-auth-signed-out', handleAuthSignedOut);
    
    console.log("✅ Autenticación inicializada correctamente");
}

async function handleGoogleLogin() {
    try {
        console.log("🔄 Intentando login con Google...");
        showLoading();
        
        // Actualizar estado del botón
        const loginBtn = document.getElementById('btn-login-google');
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
            loginBtn.disabled = true;
        }
        
        // Verificar que Firebase esté disponible
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase no está cargado. Recarga la página.');
        }
        
        if (typeof firebase.auth === 'undefined') {
            throw new Error('Firebase Auth no está disponible. Verifica los scripts.');
        }
        
        // Verificar que firebaseApp esté disponible
        if (!window.firebaseApp) {
            console.log("firebaseApp no disponible, intentando inicializar...");
            // Intentar inicializar manualmente
            if (typeof initializeFirebase === 'function') {
                initializeFirebase();
            }
            
            // Esperar un momento
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Verificar que la función de login esté disponible
        if (!window.firebaseApp || !window.firebaseApp.loginWithGoogle) {
            console.error("firebaseApp o loginWithGoogle no disponibles");
            console.log("firebaseApp:", window.firebaseApp);
            console.log("loginWithGoogle:", window.firebaseApp?.loginWithGoogle);
            
            // Intentar usar Firebase directamente como fallback
            if (firebase.auth) {
                console.log("Usando Firebase directamente como fallback...");
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.addScope('profile');
                provider.addScope('email');
                provider.setCustomParameters({ prompt: 'select_account' });
                
                const result = await firebase.auth().signInWithPopup(provider);
                
                if (result.user) {
                    // Verificar si es administrador
                    const isAdmin = await checkAdminAccessDirect(result.user.email);
                    
                    if (isAdmin) {
                        currentUser = result.user;
                        handleAuthSuccess({ detail: { user: result.user, isAdmin: true } });
                        return;
                    } else {
                        await firebase.auth().signOut();
                        throw new Error('No tienes permisos de administrador');
                    }
                }
            }
            
            throw new Error('La función de login no está disponible. Verifica el archivo de configuración.');
        }
        
        console.log("✅ Firebase disponible, llamando a loginWithGoogle...");
        const result = await window.firebaseApp.loginWithGoogle();
        
        if (result.success) {
            currentUser = result.user;
            console.log("✅ Login exitoso como administrador:", currentUser.email);
            // El evento auth-success se disparará automáticamente
        }
        
    } catch (error) {
        console.error("❌ Error en login:", error);
        console.error("Código de error:", error.code);
        console.error("Mensaje de error:", error.message);
        
        // Mostrar mensaje de error detallado
        let errorMessage = error.message || 'Error al iniciar sesión';
        
        if (error.code === 'auth/popup-blocked') {
            errorMessage = 'El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.';
        } else if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'La ventana de inicio de sesión se cerró. Intenta de nuevo.';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = `Este dominio (${window.location.hostname}) no está autorizado. Contacta al administrador.`;
        }
        
        showToast(errorMessage, 'error');
        
    } finally {
        hideLoading();
        
        // Restaurar estado del botón
        const loginBtn = document.getElementById('btn-login-google');
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fab fa-google"></i> Iniciar sesión con Google';
            loginBtn.disabled = false;
        }
    }
}

// Función auxiliar para verificar acceso de administrador directamente
async function checkAdminAccessDirect(email) {
    try {
        if (!email) return false;
        
        // Verificar si firebaseApp está disponible
        if (window.firebaseApp && window.firebaseApp.checkAdminAccess) {
            return await window.firebaseApp.checkAdminAccess(email);
        }
        
        // Administradores predeterminados
        const defaultAdmins = [
            'andyramoss@gmail.com',
            'admin@encuesta-649b8.firebaseapp.com'
        ];
        
        return defaultAdmins.includes(email.toLowerCase());
        
    } catch (error) {
        console.error("Error verificando acceso de administrador:", error);
        return false;
    }
}

async function handleLogout() {
    try {
        showLoading();
        
        if (window.firebaseApp && window.firebaseApp.logout) {
            await window.firebaseApp.logout();
        } else {
            // Fallback: usar Firebase directamente
            if (firebase.auth) {
                await firebase.auth().signOut();
            }
        }
        
        console.log("✅ Logout exitoso");
        
    } catch (error) {
        console.error("❌ Error en logout:", error);
        showToast('Error al cerrar sesión', 'error');
    } finally {
        hideLoading();
    }
}

function handleAuthSuccess(event) {
    const user = event.detail.user;
    currentUser = user;
    
    console.log("✅ Autenticación exitosa para:", user.email);
    
    // Mostrar dashboard
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    
    // Actualizar info del usuario
    updateUserInfo(user);
    
    // Cargar datos iniciales
    loadDashboardData();
    
    showToast(`Bienvenido ${user.email}`, 'success');
}

function handleAuthFailed(event) {
    const reason = event.detail?.reason || 'unknown';
    console.log("❌ Auth failed, reason:", reason);
    
    if (reason === 'no-admin') {
        showToast('No tienes permisos de administrador', 'error');
    } else {
        showToast('Error de autenticación', 'error');
    }
    
    // Mostrar login screen
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function handleAuthSignedOut() {
    currentUser = null;
    
    console.log("🔓 Usuario cerró sesión");
    
    // Mostrar login screen
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
    
    // Limpiar datos
    clearDashboardData();
    
    showToast('Sesión cerrada exitosamente', 'info');
}

function checkAuthState() {
    console.log("🔍 Verificando estado de autenticación...");
    
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.log("❌ Firebase no está cargado todavía");
        return;
    }
    
    // Esperar a que Firebase se inicialice
    setTimeout(() => {
        let user = null;
        
        // Intentar obtener usuario de firebaseApp primero
        if (window.firebaseApp && window.firebaseApp.getCurrentUser) {
            user = window.firebaseApp.getCurrentUser();
        } else if (firebase.auth) {
            // Fallback a Firebase directo
            user = firebase.auth().currentUser;
        }
        
        if (user) {
            console.log("✅ Usuario encontrado en sesión:", user.email);
            
            // Verificar si es administrador
            checkAdminAccessDirect(user.email)
                .then(isAdmin => {
                    if (isAdmin) {
                        handleAuthSuccess({ detail: { user, isAdmin } });
                    } else {
                        handleAuthFailed({ detail: { reason: 'no-admin' } });
                    }
                })
                .catch((error) => {
                    console.error("Error verificando admin:", error);
                    handleAuthFailed({ detail: { reason: 'error' } });
                });
        } else {
            // No hay usuario, mostrar login
            console.log("ℹ️ No hay usuario autenticado");
            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('admin-dashboard').style.display = 'none';
        }
    }, 1000);
}

function updateUserInfo(user) {
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userAvatar = document.getElementById('user-avatar');
    
    if (userName) userName.textContent = user.displayName || user.email.split('@')[0];
    if (userEmail) userEmail.textContent = user.email;
    
    if (userAvatar) {
        if (user.displayName) {
            userAvatar.textContent = user.displayName.charAt(0).toUpperCase();
        } else {
            userAvatar.textContent = user.email.charAt(0).toUpperCase();
        }
    }
}

// ===== TABS Y NAVEGACIÓN =====
function initTabs() {
    console.log("📑 Inicializando pestañas...");
    
    // Tabs del header
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            console.log("Cambiando a pestaña:", tabId);
            switchTab(tabId);
        });
    });
    
    // Botón para crear nueva invitación desde la lista
    const newInvitationBtn = document.getElementById('btn-new-invitation');
    if (newInvitationBtn) {
        newInvitationBtn.addEventListener('click', () => {
            switchTab('new-guest');
            resetNewGuestForm();
        });
    }
    
    // Botón para ver en lista
    const viewGuestBtn = document.getElementById('btn-view-guest');
    if (viewGuestBtn) {
        viewGuestBtn.addEventListener('click', () => {
            switchTab('guests');
            loadGuests();
        });
    }
    
    console.log("✅ Pestañas inicializadas correctamente");
}

function switchTab(tabId) {
    // Actualizar tabs activos
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        }
    });
    
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const targetSection = document.getElementById(`${tabId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentTab = tabId;
        
        // Cargar datos según la pestaña
        switch(tabId) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'guests':
                loadGuests();
                break;
            case 'new-guest':
                resetNewGuestForm();
                break;
            case 'settings':
                loadSettings();
                break;
        }
    }
    
    // Cerrar menú móvil si está abierto
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav && mobileNav.classList.contains('active')) {
        mobileNav.classList.remove('active');
    }
}

// ===== DASHBOARD =====
async function loadDashboardData() {
    try {
        showLoading();
        
        console.log("📊 Cargando datos del dashboard...");
        
        // Cargar estadísticas
        if (window.firebaseApp && window.firebaseApp.getEventStats) {
            guestStats = await window.firebaseApp.getEventStats();
            updateStatsUI(guestStats);
            console.log("✅ Estadísticas cargadas:", guestStats);
        } else {
            console.error("❌ getEventStats no disponible");
        }
        
        // Cargar actividad reciente
        await loadRecentActivity();
        
    } catch (error) {
        console.error("❌ Error cargando dashboard:", error);
        showToast('Error al cargar estadísticas', 'error');
    } finally {
        hideLoading();
    }
}

function updateStatsUI(stats) {
    console.log("Actualizando UI de estadísticas:", stats);
    
    // Actualizar tarjetas de estadísticas
    const statElements = {
        'total': document.getElementById('stat-total-guests'),
        'confirmed': document.getElementById('stat-confirmed-guests'),
        'pending': document.getElementById('stat-pending-guests'),
        'declined': document.getElementById('stat-declined-guests'),
        'confirmedTotal': document.getElementById('stat-confirmed-total'),
        'confirmationRate': document.getElementById('stat-confirmation-rate')
    };
    
    if (statElements.total) statElements.total.textContent = stats.total || 0;
    if (statElements.confirmed) statElements.confirmed.textContent = stats.confirmed || 0;
    if (statElements.pending) statElements.pending.textContent = stats.pending || 0;
    if (statElements.declined) statElements.declined.textContent = stats.declined || 0;
    if (statElements.confirmedTotal) statElements.confirmedTotal.textContent = stats.confirmedTotal || 0;
    if (statElements.confirmationRate) statElements.confirmationRate.textContent = `${stats.confirmationRate || 0}%`;
}

async function loadRecentActivity() {
    try {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        activityList.innerHTML = '<div class="no-data"><i class="fas fa-clock"></i><p>Cargando actividad...</p></div>';
        
        if (!window.firebaseApp || !window.firebaseApp.getDb) {
            activityList.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>Firebase no disponible</p></div>';
            return;
        }
        
        const db = window.firebaseApp.getDb();
        if (!db) {
            activityList.innerHTML = '<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>Base de datos no disponible</p></div>';
            return;
        }
        
        const snapshot = await db.collection('logs')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        if (snapshot.empty) {
            activityList.innerHTML = '<div class="no-data"><i class="fas fa-history"></i><p>No hay actividad reciente</p></div>';
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="table-row">
                    <div>${formatActivityDate(data.timestamp)}</div>
                    <div>${data.target || 'Sistema'}</div>
                    <div><span class="guest-status status-${getStatusClass(data.action)}">${formatAction(data.action)}</span></div>
                    <div>${formatActivityDetails(data.details)}</div>
                </div>
            `;
        });
        
        activityList.innerHTML = html;
        
    } catch (error) {
        console.error("❌ Error cargando actividad:", error);
        document.getElementById('activity-list').innerHTML = 
            '<div class="no-data"><i class="fas fa-exclamation-triangle"></i><p>Error al cargar actividad</p></div>';
    }
}

function formatActivityDate(timestamp) {
    if (!timestamp) return '--';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-MX', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return '--';
    }
}

function formatAction(action) {
    const actions = {
        'guest_created': 'Invitación creada',
        'guest_updated': 'Invitación actualizada',
        'guest_deleted': 'Invitación eliminada',
        'rsvp_updated': 'RSVP actualizado',
        'bulk_import': 'Importación masiva',
        'login': 'Inicio de sesión'
    };
    
    return actions[action] || action;
}

function getStatusClass(action) {
    const statusMap = {
        'guest_created': 'confirmed',
        'guest_updated': 'pending',
        'guest_deleted': 'declined',
        'rsvp_updated': 'confirmed',
        'bulk_import': 'pending',
        'login': 'confirmed'
    };
    
    return statusMap[action] || 'pending';
}

function formatActivityDetails(details) {
    if (!details) return '--';
    
    if (typeof details === 'string') {
        return details;
    }
    
    if (details.name) {
        return `Nombre: ${details.name}`;
    }
    
    if (details.total) {
        return `${details.successful || 0} de ${details.total} exitosos`;
    }
    
    return JSON.stringify(details);
}

// ===== GESTIÓN DE INVITADOS =====
async function loadGuests() {
    try {
        showLoading();
        
        console.log("👥 Cargando lista de invitados...");
        
        if (!window.firebaseApp || !window.firebaseApp.getAllGuests) {
            throw new Error('Firebase no configurado');
        }
        
        const result = await window.firebaseApp.getAllGuests(currentPage, 20, searchQuery);
        allGuests = result.guests;
        
        console.log(`✅ ${allGuests.length} invitados cargados`);
        
        updateGuestsTable(allGuests);
        updatePagination(result.pagination);
        
    } catch (error) {
        console.error("❌ Error cargando invitados:", error);
        showToast('Error al cargar invitados', 'error');
        
        const guestsList = document.getElementById('guests-list');
        if (guestsList) {
            guestsList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error al cargar invitados</p>
                    <p style="font-size: 0.8rem;">${error.message}</p>
                </div>
            `;
        }
    } finally {
        hideLoading();
    }
}

function updateGuestsTable(guests) {
    const guestsList = document.getElementById('guests-list');
    if (!guestsList) return;
    
    if (!guests || guests.length === 0) {
        guestsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users-slash"></i>
                <p>No hay invitados registrados</p>
                <p style="font-size: 0.8rem;">Crea tu primera invitación en "Nuevo Invitado"</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    guests.forEach(guest => {
        const statusClass = guest.status || 'pending';
        const statusText = getStatusText(guest.status);
        const maxGuests = guest.maxGuests || 2;
        const confirmed = guest.confirmedGuests || 0;
        
        html += `
            <div class="table-row" data-id="${guest.id}">
                <div>
                    <span class="guest-code">${guest.id}</span>
                </div>
                <div>${guest.name || '--'}</div>
                <div>${guest.email || '--'}</div>
                <div>
                    <span class="guest-status status-${statusClass}">${statusText}</span>
                </div>
                <div>${confirmed}/${maxGuests}</div>
                <div class="guest-actions">
                    <button class="btn-action btn-copy" data-id="${guest.id}" title="Copiar enlace">
                        <i class="fas fa-link"></i>
                    </button>
                    <button class="btn-action btn-edit" data-id="${guest.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" data-id="${guest.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    guestsList.innerHTML = html;
    
    // Agregar event listeners a los botones
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', () => copyInvitationLink(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => editGuest(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => deleteGuestConfirmation(btn.getAttribute('data-id')));
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmado',
        'declined': 'No asistirá'
    };
    
    return statusMap[status] || 'Pendiente';
}

function updatePagination(pagination) {
    const pageNumbers = document.getElementById('page-numbers');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    
    if (!pageNumbers || !btnPrev || !btnNext) return;
    
    // Actualizar botones
    btnPrev.disabled = !pagination.hasPrev;
    btnNext.disabled = !pagination.hasNext;
    
    // Event listeners
    btnPrev.onclick = () => {
        if (pagination.hasPrev) {
            currentPage--;
            loadGuests();
        }
    };
    
    btnNext.onclick = () => {
        if (pagination.hasNext) {
            currentPage++;
            loadGuests();
        }
    };
    
    // Generar números de página
    let pagesHtml = '';
    const totalPages = pagination.totalPages || 1;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            pagesHtml += `<button class="page-btn active">${i}</button>`;
        } else if (i === 1 || i === totalPages || 
                  (i >= currentPage - 1 && i <= currentPage + 1)) {
            pagesHtml += `<button class="page-btn" data-page="${i}">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            pagesHtml += `<span class="page-dots">...</span>`;
        }
    }
    
    pageNumbers.innerHTML = pagesHtml;
    
    // Event listeners para números de página
    pageNumbers.querySelectorAll('.page-btn:not(.active)').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.getAttribute('data-page'));
            loadGuests();
        });
    });
}

// ===== FORMULARIOS =====
function initForms() {
    console.log("📝 Inicializando formularios...");
    
    // Formulario de nuevo invitado
    const newGuestForm = document.getElementById('new-guest-form');
    if (newGuestForm) {
        newGuestForm.addEventListener('submit', handleNewGuestSubmit);
        console.log("✅ Formulario nuevo invitado inicializado");
    }
    
    // Búsqueda de invitados
    const searchInput = document.getElementById('search-guests');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            searchQuery = searchInput.value.trim();
            currentPage = 1;
            console.log("Buscando:", searchQuery);
            loadGuests();
        }, 500));
        console.log("✅ Búsqueda inicializada");
    }
    
    // Exportar CSV
    const exportBtn = document.getElementById('btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportCSV);
        console.log("✅ Botón exportar inicializado");
    }
    
    // Importar masivo
    const importBtn = document.getElementById('btn-import');
    if (importBtn) {
        importBtn.addEventListener('click', handleBulkImport);
        console.log("✅ Botón importar inicializado");
    }
    
    console.log("✅ Formularios inicializados correctamente");
}

async function handleNewGuestSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading();
        
        const name = document.getElementById('guest-name').value.trim();
        const email = document.getElementById('guest-email').value.trim();
        const maxGuests = parseInt(document.getElementById('guest-max-guests').value);
        const customCode = document.getElementById('guest-custom-code').value.trim().toUpperCase();
        
        if (!maxGuests) {
            throw new Error('Selecciona el número de cupos');
        }
        
        if (!window.firebaseApp || !window.firebaseApp.createGuestInvitation) {
            throw new Error('Firebase no configurado');
        }
        
        console.log("Creando invitación:", { name, email, maxGuests, customCode });
        
        const result = await window.firebaseApp.createGuestInvitation(name, email, maxGuests, customCode);
        
        if (result.success) {
            showToast('Invitación creada exitosamente', 'success');
            
            // Mostrar enlace generado
            showCreatedInvitation(result.invitationCode, result.link);
            
            // Resetear formulario
            resetNewGuestForm();
            
            // Actualizar dashboard
            loadDashboardData();
        }
        
    } catch (error) {
        console.error("❌ Error creando invitación:", error);
        showToast(error.message || 'Error al crear invitación', 'error');
    } finally {
        hideLoading();
    }
}

function resetNewGuestForm() {
    const form = document.getElementById('new-guest-form');
    if (form) form.reset();
    
    const createdSection = document.getElementById('created-invitation');
    if (createdSection) createdSection.style.display = 'none';
}

function showCreatedInvitation(code, link) {
    const createdSection = document.getElementById('created-invitation');
    const linkInput = document.getElementById('invitation-link');
    const copyBtn = document.getElementById('btn-copy-link');
    
    if (!createdSection || !linkInput || !copyBtn) return;
    
    // Mostrar sección
    createdSection.style.display = 'block';
    
    // Actualizar enlace
    const fullLink = `${window.location.origin}/?p=${link.split('p=')[1]?.split('&')[0] || '2'}`;
    linkInput.value = fullLink;
    
    // Configurar botón de copiar
    copyBtn.onclick = () => {
        copyToClipboard(fullLink);
        showToast('Enlace copiado al portapapeles', 'success');
    };
    
    // Scroll a la sección
    createdSection.scrollIntoView({ behavior: 'smooth' });
}

async function handleExportCSV() {
    try {
        showLoading();
        
        if (!window.firebaseApp || !window.firebaseApp.exportGuestsToCSV) {
            throw new Error('Funcionalidad no disponible');
        }
        
        const csv = await window.firebaseApp.exportGuestsToCSV();
        
        // Crear y descargar archivo
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `invitados-hollywood-nights-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('CSV exportado exitosamente', 'success');
        
    } catch (error) {
        console.error("❌ Error exportando CSV:", error);
        showToast('Error al exportar CSV', 'error');
    } finally {
        hideLoading();
    }
}

async function handleBulkImport() {
    const textarea = document.getElementById('bulk-import-text');
    if (!textarea) return;
    
    const content = textarea.value.trim();
    if (!content) {
        showToast('Pega los datos de los invitados primero', 'info');
        return;
    }
    
    try {
        showLoading();
        
        // Parsear datos
        const lines = content.split('\n').filter(line => line.trim());
        const guestList = [];
        
        for (const line of lines) {
            const parts = line.split(',').map(part => part.trim());
            
            if (parts.length >= 3) {
                guestList.push({
                    name: parts[0],
                    email: parts[1],
                    maxGuests: parseInt(parts[2])
                });
            }
        }
        
        if (guestList.length === 0) {
            throw new Error('Formato incorrecto. Revisa el ejemplo.');
        }
        
        console.log(`Importando ${guestList.length} invitados...`);
        
        if (!window.firebaseApp || !window.firebaseApp.bulkImportGuests) {
            throw new Error('Funcionalidad no disponible');
        }
        
        const results = await window.firebaseApp.bulkImportGuests(guestList);
        
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        showToast(`Importación completada: ${successful} exitosos, ${failed} fallidos`, 'success');
        
        // Limpiar textarea
        textarea.value = '';
        
        // Recargar lista de invitados
        if (successful > 0) {
            loadGuests();
            loadDashboardData();
        }
        
    } catch (error) {
        console.error("❌ Error en importación masiva:", error);
        showToast(error.message || 'Error en importación masiva', 'error');
    } finally {
        hideLoading();
    }
}

// ===== ACCIONES SOBRE INVITADOS =====
async function copyInvitationLink(invitationCode) {
    try {
        if (!invitationCode) return;
        
        console.log("Copiando enlace para:", invitationCode);
        
        // Obtener datos del invitado para saber los cupos
        if (window.firebaseApp && window.firebaseApp.getDb) {
            const db = window.firebaseApp.getDb();
            if (db) {
                const guestDoc = await db.collection('guests').doc(invitationCode).get();
                
                if (guestDoc.exists) {
                    const data = guestDoc.data();
                    const maxGuests = data.maxGuests || 2;
                    const link = `${window.location.origin}/?p=${maxGuests}`;
                    
                    await copyToClipboard(link);
                    showToast('Enlace copiado al portapapeles', 'success');
                    return;
                }
            }
        }
        
        // Fallback
        const link = `${window.location.origin}/?p=2`;
        await copyToClipboard(link);
        showToast('Enlace copiado', 'success');
        
    } catch (error) {
        console.error("❌ Error copiando enlace:", error);
        showToast('Error al copiar enlace', 'error');
    }
}

async function editGuest(invitationCode) {
    try {
        if (!invitationCode || !window.firebaseApp || !window.firebaseApp.getDb) return;
        
        const db = window.firebaseApp.getDb();
        if (!db) return;
        
        const guestDoc = await db.collection('guests').doc(invitationCode).get();
        
        if (!guestDoc.exists) {
            showToast('Invitación no encontrada', 'error');
            return;
        }
        
        const data = guestDoc.data();
        
        // Mostrar modal de edición
        showModal('Editar Invitado', `
            <div class="form-row">
                <label class="form-label">Nombre</label>
                <input type="text" id="edit-guest-name" class="form-input" value="${data.name || ''}">
            </div>
            <div class="form-row">
                <label class="form-label">Email</label>
                <input type="email" id="edit-guest-email" class="form-input" value="${data.email || ''}">
            </div>
            <div class="form-row">
                <label class="form-label">Estado</label>
                <select id="edit-guest-status" class="form-select">
                    <option value="pending" ${data.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                    <option value="confirmed" ${data.status === 'confirmed' ? 'selected' : ''}>Confirmado</option>
                    <option value="declined" ${data.status === 'declined' ? 'selected' : ''}>No asistirá</option>
                </select>
            </div>
            <div class="form-row" id="edit-confirmed-container" style="${data.status === 'confirmed' ? '' : 'display: none;'}">
                <label class="form-label">Personas confirmadas (máximo: ${data.maxGuests || 2})</label>
                <input type="number" id="edit-guest-confirmed" class="form-input" 
                       min="1" max="${data.maxGuests || 2}" 
                       value="${data.confirmedGuests || 1}">
            </div>
        `, async () => {
            // Guardar cambios
            try {
                showLoading();
                
                const name = document.getElementById('edit-guest-name').value.trim();
                const email = document.getElementById('edit-guest-email').value.trim();
                const status = document.getElementById('edit-guest-status').value;
                const confirmed = status === 'confirmed' ? 
                    parseInt(document.getElementById('edit-guest-confirmed').value) || 1 : 0;
                
                const updateData = {
                    name: name,
                    email: email,
                    status: status,
                    confirmedGuests: confirmed,
                    updatedAt: window.firebaseApp.getCurrentTimestamp()
                };
                
                if (status === 'confirmed') {
                    updateData.responseDate = window.firebaseApp.getCurrentTimestamp();
                }
                
                await db.collection('guests').doc(invitationCode).update(updateData);
                
                showToast('Invitación actualizada', 'success');
                loadGuests();
                loadDashboardData();
                
            } catch (error) {
                console.error("❌ Error actualizando invitado:", error);
                showToast('Error al actualizar', 'error');
            } finally {
                hideLoading();
            }
        });
        
        // Mostrar/ocultar campo de confirmados según estado
        const statusSelect = document.getElementById('edit-guest-status');
        const confirmedContainer = document.getElementById('edit-confirmed-container');
        
        if (statusSelect && confirmedContainer) {
            statusSelect.addEventListener('change', () => {
                if (statusSelect.value === 'confirmed') {
                    confirmedContainer.style.display = 'block';
                } else {
                    confirmedContainer.style.display = 'none';
                }
            });
        }
        
    } catch (error) {
        console.error("❌ Error editando invitado:", error);
        showToast('Error al cargar datos', 'error');
    }
}

async function deleteGuestConfirmation(invitationCode) {
    showModal('Confirmar Eliminación', `
        <p style="color: #fff; margin-bottom: 1.5rem;">
            ¿Estás seguro de eliminar esta invitación?
        </p>
        <p style="color: #c0c0c0; font-size: 0.9rem;">
            Esta acción no se puede deshacer. El invitado perderá acceso al formulario.
        </p>
    `, async () => {
        try {
            showLoading();
            
            if (window.firebaseApp && window.firebaseApp.deleteGuest) {
                await window.firebaseApp.deleteGuest(invitationCode);
                showToast('Invitación eliminada', 'success');
                loadGuests();
                loadDashboardData();
            }
            
        } catch (error) {
            console.error("❌ Error eliminando invitado:", error);
            showToast(error.message || 'Error al eliminar', 'error');
        } finally {
            hideLoading();
        }
    });
}

// ===== MODALES =====
function initModals() {
    console.log("🎭 Inicializando modales...");
    
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                hideModal();
            }
        });
    }
    
    if (modalClose) {
        modalClose.addEventListener('click', hideModal);
    }
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            hideModal();
        }
    });
    
    console.log("✅ Modales inicializados correctamente");
}

let modalCallback = null;

function showModal(title, content, callback = null) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    
    if (!modalOverlay || !modalTitle || !modalContent) return;
    
    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    
    // Agregar botones de acción
    const actions = document.createElement('div');
    actions.className = 'form-actions';
    actions.innerHTML = `
        <button type="button" class="btn-cancel" id="modal-cancel">Cancelar</button>
        <button type="button" class="btn-save" id="modal-confirm">Confirmar</button>
    `;
    
    modalContent.appendChild(actions);
    
    // Guardar callback
    modalCallback = callback;
    
    // Mostrar modal
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Event listeners para botones
    setTimeout(() => {
        const cancelBtn = document.getElementById('modal-cancel');
        const confirmBtn = document.getElementById('modal-confirm');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', hideModal);
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (modalCallback) {
                    modalCallback();
                }
                hideModal();
            });
        }
    }, 10);
}

function hideModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    modalCallback = null;
}

// ===== MENÚ MÓVIL =====
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-button');
    const mobileNav = document.getElementById('mobile-nav');
    
    if (menuBtn && mobileNav) {
        menuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            menuBtn.innerHTML = mobileNav.classList.contains('active') ?
                '<i class="fas fa-times"></i>' :
                '<i class="fas fa-bars"></i>';
        });
    }
    
    // Cerrar menú al hacer clic en un tab
    const mobileTabs = mobileNav ? mobileNav.querySelectorAll('.nav-tab') : [];
    mobileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            if (menuBtn) {
                menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
}

// ===== UTILIDADES =====
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('active');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

function clearDashboardData() {
    // Limpiar estadísticas
    const statElements = [
        'stat-total-guests',
        'stat-confirmed-guests',
        'stat-pending-guests',
        'stat-declined-guests',
        'stat-confirmed-total',
        'stat-confirmation-rate'
    ];
    
    statElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0';
    });
    
    // Limpiar lista de invitados
    const guestsList = document.getElementById('guests-list');
    if (guestsList) {
        guestsList.innerHTML = '';
    }
    
    // Limpiar actividad
    const activityList = document.getElementById('activity-list');
    if (activityList) {
        activityList.innerHTML = '';
    }
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback para navegadores antiguos
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            return true;
        } catch (err) {
            console.error('Fallback copy failed:', err);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== CONFIGURACIONES =====
function loadSettings() {
    console.log("⚙️ Cargando configuración...");
    
    // Por ahora, solo mostrar información básica
    const adminList = document.getElementById('admin-list');
    if (adminList) {
        adminList.innerHTML = `
            <div style="color: #c0c0c0; margin-bottom: 1rem;">
                <p>Administradores autorizados:</p>
                <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
                    <li><strong>andyramoss@gmail.com</strong> (principal)</li>
                    <li>Usuarios agregados manualmente en Firebase</li>
                </ul>
                <p style="margin-top: 1rem; font-size: 0.9rem;">
                    Para agregar más administradores, ve a Firebase Console > 
                    Firestore > Colección "admins" y agrega documentos con el email como ID.
                </p>
            </div>
        `;
    }
    
    // Configurar botón para agregar admin (solo como placeholder por ahora)
    const addAdminBtn = document.getElementById('btn-add-admin');
    if (addAdminBtn) {
        addAdminBtn.addEventListener('click', () => {
            showModal('Agregar Administrador', `
                <p style="color: #fff; margin-bottom: 1.5rem;">
                    Para agregar administradores, debes hacerlo manualmente en Firebase Console.
                </p>
                <div class="form-row">
                    <label class="form-label">Email del nuevo administrador</label>
                    <input type="email" id="new-admin-email" class="form-input" placeholder="ejemplo@gmail.com">
                </div>
                <p style="color: #c0c0c0; font-size: 0.9rem; margin-top: 1rem;">
                    Nota: Esta funcionalidad requiere configuración manual en Firestore.
                    Ve a la colección "admins" y crea un documento con el email como ID.
                </p>
            `, () => {
                const email = document.getElementById('new-admin-email').value.trim();
                if (email) {
                    showToast(`Agrega manualmente a ${email} en Firestore`, 'info');
                }
            });
        });
    }
}

// ===== INICIALIZACIÓN FINAL =====
console.log("✅ Admin Panel completamente cargado y listo");
console.log("===========================================");