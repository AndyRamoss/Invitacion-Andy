// Hollywood Nights - Admin Panel
// Complete administration system for event management

// Global state
let adminState = {
    currentUser: null,
    isAdmin: false,
    guests: [],
    filteredGuests: [],
    currentPage: 1,
    itemsPerPage: 20,
    totalPages: 1,
    searchQuery: '',
    isLoading: false,
    eventStats: null,
    sortField: 'createdAt',
    sortDirection: 'desc'
};

// DOM Elements
let elements = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Hollywood Nights Admin Panel Initializing...');
    
    // Cache DOM elements
    cacheElements();
    
    // Initialize event listeners
    initEventListeners();
    
    // Check authentication state
    checkAuthState();
    
    // Initialize Firebase listeners
    initFirebaseListeners();
});

// ===== ELEMENT CACHING =====
function cacheElements() {
    elements = {
        // Login screen
        loginScreen: document.getElementById('login-screen'),
        btnLoginGoogle: document.getElementById('btn-login-google'),
        
        // Admin dashboard
        adminDashboard: document.getElementById('admin-dashboard'),
        
        // Header elements
        userAvatar: document.getElementById('user-avatar'),
        userName: document.getElementById('user-name'),
        userEmail: document.getElementById('user-email'),
        btnLogout: document.getElementById('btn-logout'),
        
        // Navigation
        navTabs: document.querySelectorAll('.nav-tab'),
        mobileMenuButton: document.querySelector('.mobile-menu-button'),
        mobileNav: document.getElementById('mobile-nav'),
        
        // Sections
        contentSections: document.querySelectorAll('.content-section'),
        
        // Dashboard section
        statTotalGuests: document.getElementById('stat-total-guests'),
        statConfirmedGuests: document.getElementById('stat-confirmed-guests'),
        statPendingGuests: document.getElementById('stat-pending-guests'),
        statDeclinedGuests: document.getElementById('stat-declined-guests'),
        statConfirmedTotal: document.getElementById('stat-confirmed-total'),
        statConfirmationRate: document.getElementById('stat-confirmation-rate'),
        activityList: document.getElementById('activity-list'),
        
        // Guests section
        searchGuests: document.getElementById('search-guests'),
        btnExport: document.getElementById('btn-export'),
        guestsList: document.getElementById('guests-list'),
        btnPrev: document.getElementById('btn-prev'),
        btnNext: document.getElementById('btn-next'),
        pageNumbers: document.getElementById('page-numbers'),
        bulkImportText: document.getElementById('bulk-import-text'),
        btnImport: document.getElementById('btn-import'),
        
        // New guest section
        newGuestForm: document.getElementById('new-guest-form'),
        guestName: document.getElementById('guest-name'),
        guestEmail: document.getElementById('guest-email'),
        guestMaxGuests: document.getElementById('guest-max-guests'),
        guestCustomCode: document.getElementById('guest-custom-code'),
        createdInvitation: document.getElementById('created-invitation'),
        invitationLink: document.getElementById('invitation-link'),
        btnCopyLink: document.getElementById('btn-copy-link'),
        btnNewInvitation: document.getElementById('btn-new-invitation'),
        btnViewGuest: document.getElementById('btn-view-guest'),
        
        // Settings section
        adminList: document.getElementById('admin-list'),
        btnAddAdmin: document.getElementById('btn-add-admin'),
        
        // Modals
        modalOverlay: document.getElementById('modal-overlay'),
        modalTitle: document.getElementById('modal-title'),
        modalContent: document.getElementById('modal-content'),
        modalClose: document.getElementById('modal-close'),
        
        // Loading
        loadingOverlay: document.getElementById('loading-overlay'),
        
        // Toast container
        toastContainer: document.getElementById('toast-container')
    };
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Login button
    if (elements.btnLoginGoogle) {
        elements.btnLoginGoogle.addEventListener('click', handleGoogleLogin);
    }
    
    // Logout button
    if (elements.btnLogout) {
        elements.btnLogout.addEventListener('click', handleLogout);
    }
    
    // Navigation tabs
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Mobile menu
    if (elements.mobileMenuButton) {
        elements.mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }
    
    // Modal close
    if (elements.modalClose) {
        elements.modalClose.addEventListener('click', closeModal);
    }
    
    // Modal overlay click to close
    if (elements.modalOverlay) {
        elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === elements.modalOverlay) {
                closeModal();
            }
        });
    }
    
    // Search guests
    if (elements.searchGuests) {
        elements.searchGuests.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Export button
    if (elements.btnExport) {
        elements.btnExport.addEventListener('click', exportToCSV);
    }
    
    // Pagination
    if (elements.btnPrev) {
        elements.btnPrev.addEventListener('click', () => changePage(adminState.currentPage - 1));
    }
    
    if (elements.btnNext) {
        elements.btnNext.addEventListener('click', () => changePage(adminState.currentPage + 1));
    }
    
    // Bulk import
    if (elements.btnImport) {
        elements.btnImport.addEventListener('click', handleBulkImport);
    }
    
    // New guest form
    if (elements.newGuestForm) {
        elements.newGuestForm.addEventListener('submit', handleNewGuestSubmit);
    }
    
    // Copy invitation link
    if (elements.btnCopyLink) {
        elements.btnCopyLink.addEventListener('click', copyInvitationLink);
    }
    
    // New invitation button
    if (elements.btnNewInvitation) {
        elements.btnNewInvitation.addEventListener('click', () => {
            elements.createdInvitation.style.display = 'none';
            elements.newGuestForm.reset();
        });
    }
    
    // View guest button
    if (elements.btnViewGuest) {
        elements.btnViewGuest.addEventListener('click', () => {
            switchTab('guests');
            closeModal();
        });
    }
    
    // Add admin button
    if (elements.btnAddAdmin) {
        elements.btnAddAdmin.addEventListener('click', showAddAdminModal);
    }
    
    // Custom code formatting
    if (elements.guestCustomCode) {
        elements.guestCustomCode.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ===== AUTHENTICATION =====
function checkAuthState() {
    const user = window.firebaseApp?.getCurrentUser();
    if (user) {
        // User is signed in, check if admin
        checkAdminStatus(user);
    } else {
        // No user signed in, show login screen
        showLoginScreen();
    }
}

async function checkAdminStatus(user) {
    try {
        showLoading();
        const isAdmin = await window.firebaseApp.isUserAdmin(user);
        
        if (isAdmin) {
            adminState.currentUser = user;
            adminState.isAdmin = true;
            showAdminDashboard();
            loadDashboardData();
        } else {
            showNotAdminError();
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        showError('Error al verificar permisos de administrador');
    } finally {
        hideLoading();
    }
}

function showLoginScreen() {
    if (elements.loginScreen && elements.adminDashboard) {
        elements.loginScreen.style.display = 'flex';
        elements.adminDashboard.style.display = 'none';
    }
}

function showAdminDashboard() {
    if (elements.loginScreen && elements.adminDashboard) {
        elements.loginScreen.style.display = 'none';
        elements.adminDashboard.style.display = 'block';
        
        // Update user info
        updateUserInfo();
    }
}

async function handleGoogleLogin() {
    try {
        showLoading();
        const user = await window.firebaseApp.loginWithGoogle();
        await checkAdminStatus(user);
    } catch (error) {
        console.error('Login error:', error);
        showError('Error al iniciar sesión con Google');
        hideLoading();
    }
}

async function handleLogout() {
    try {
        await window.firebaseApp.logout();
        adminState.currentUser = null;
        adminState.isAdmin = false;
        showLoginScreen();
        showSuccess('Sesión cerrada exitosamente');
    } catch (error) {
        console.error('Logout error:', error);
        showError('Error al cerrar sesión');
    }
}

function updateUserInfo() {
    if (!adminState.currentUser) return;
    
    const user = adminState.currentUser;
    
    // Update avatar with first letter of display name or email
    const displayName = user.displayName || user.email;
    if (elements.userAvatar) {
        elements.userAvatar.textContent = displayName ? displayName.charAt(0).toUpperCase() : 'U';
    }
    
    // Update name and email
    if (elements.userName) {
        elements.userName.textContent = user.displayName || 'Usuario';
    }
    
    if (elements.userEmail) {
        elements.userEmail.textContent = user.email;
    }
}

function showNotAdminError() {
    showError('No tienes permisos de administrador para acceder a este panel.');
    handleLogout();
}

// ===== FIREBASE LISTENERS =====
function initFirebaseListeners() {
    // Auth state listener
    window.addEventListener('admin-auth-success', (e) => {
        const { user, isAdmin } = e.detail;
        if (isAdmin) {
            adminState.currentUser = user;
            adminState.isAdmin = true;
            showAdminDashboard();
            loadDashboardData();
        }
    });
    
    window.addEventListener('admin-auth-failed', (e) => {
        showNotAdminError();
    });
    
    window.addEventListener('admin-auth-signed-out', () => {
        showLoginScreen();
    });
}

// ===== NAVIGATION =====
function switchTab(tabId) {
    // Update active tab
    elements.navTabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Show corresponding section
    elements.contentSections.forEach(section => {
        if (section.id === `${tabId}-section`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Load section data if needed
    switch (tabId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'guests':
            loadGuests();
            break;
        case 'settings':
            loadSettings();
            break;
    }
    
    // Close mobile menu if open
    if (elements.mobileNav.classList.contains('active')) {
        toggleMobileMenu();
    }
}

function toggleMobileMenu() {
    elements.mobileNav.classList.toggle('active');
    const icon = elements.mobileMenuButton.querySelector('i');
    if (icon) {
        icon.className = elements.mobileNav.classList.contains('active') 
            ? 'fas fa-times' 
            : 'fas fa-bars';
    }
}

// ===== DASHBOARD =====
async function loadDashboardData() {
    try {
        showLoading();
        
        // Load event statistics
        const stats = await window.firebaseApp.getEventStats();
        adminState.eventStats = stats;
        
        // Update statistics cards
        updateStatisticsCards(stats);
        
        // Load recent activity
        await loadRecentActivity();
        
        // Load guests for dashboard
        await loadGuestsForDashboard();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Error al cargar los datos del dashboard');
    } finally {
        hideLoading();
    }
}

function updateStatisticsCards(stats) {
    if (!stats) return;
    
    // Total guests
    if (elements.statTotalGuests) {
        elements.statTotalGuests.textContent = stats.guestCount || 0;
    }
    
    // Confirmed guests
    if (elements.statConfirmedGuests) {
        elements.statConfirmedGuests.textContent = stats.confirmedCount || 0;
    }
    
    // Pending guests
    if (elements.statPendingGuests) {
        elements.statPendingGuests.textContent = stats.pendingCount || 0;
    }
    
    // Declined guests
    if (elements.statDeclinedGuests) {
        elements.statDeclinedGuests.textContent = stats.declinedCount || 0;
    }
    
    // Total confirmed persons
    if (elements.statConfirmedTotal) {
        elements.statConfirmedTotal.textContent = stats.confirmedTotal || 0;
    }
    
    // Confirmation rate
    if (elements.statConfirmationRate) {
        const rate = stats.guestCount > 0 
            ? Math.round((stats.confirmedCount / stats.guestCount) * 100) 
            : 0;
        elements.statConfirmationRate.textContent = `${rate}%`;
    }
}

async function loadRecentActivity() {
    try {
        // Get last 10 guests with activity
        const guestsData = await window.firebaseApp.getAllGuests(10);
        const guests = guestsData.guests;
        
        if (!elements.activityList) return;
        
        if (guests.length === 0) {
            elements.activityList.innerHTML = `
                <div class="no-data">
                    <i class="fas fa-inbox"></i>
                    <p>No hay actividad reciente</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        guests.forEach(guest => {
            const date = guest.responseDate || guest.updatedAt || guest.createdAt;
            const formattedDate = formatDate(date);
            
            let action = 'Invitación creada';
            let details = `Cupos: ${guest.maxGuests}`;
            
            if (guest.status === 'confirmed') {
                action = 'Confirmó asistencia';
                details = `${guest.confirmedGuests} persona(s)`;
            } else if (guest.status === 'declined') {
                action = 'Declinó invitación';
                details = '';
            }
            
            html += `
                <div class="table-row">
                    <div>${formattedDate}</div>
                    <div>${guest.name || guest.id}</div>
                    <div>${action}</div>
                    <div>${details}</div>
                </div>
            `;
        });
        
        elements.activityList.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
        elements.activityList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar la actividad</p>
            </div>
        `;
    }
}

async function loadGuestsForDashboard() {
    try {
        const guestsData = await window.firebaseApp.getAllGuests(50);
        adminState.guests = guestsData.guests;
        adminState.filteredGuests = [...adminState.guests];
        updatePagination();
    } catch (error) {
        console.error('Error loading guests for dashboard:', error);
    }
}

// ===== GUESTS MANAGEMENT =====
async function loadGuests() {
    try {
        showLoading();
        
        // Load all guests (with pagination handled by Firestore)
        const guestsData = await window.firebaseApp.getAllGuests(1000); // Load more for filtering
        adminState.guests = guestsData.guests;
        adminState.filteredGuests = [...adminState.guests];
        
        // Apply current search if any
        if (adminState.searchQuery) {
            filterGuests();
        }
        
        updateGuestsTable();
        updatePagination();
        
    } catch (error) {
        console.error('Error loading guests:', error);
        showError('Error al cargar la lista de invitados');
        elements.guestsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar los invitados</p>
            </div>
        `;
    } finally {
        hideLoading();
    }
}

function updateGuestsTable() {
    if (!elements.guestsList) return;
    
    if (adminState.filteredGuests.length === 0) {
        elements.guestsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users-slash"></i>
                <p>No se encontraron invitados</p>
                ${adminState.searchQuery ? '<p>Intenta con otros términos de búsqueda</p>' : ''}
            </div>
        `;
        return;
    }
    
    // Calculate pagination slice
    const startIndex = (adminState.currentPage - 1) * adminState.itemsPerPage;
    const endIndex = startIndex + adminState.itemsPerPage;
    const pageGuests = adminState.filteredGuests.slice(startIndex, endIndex);
    
    let html = '';
    
    pageGuests.forEach(guest => {
        // Determine status class and text
        let statusClass = 'status-pending';
        let statusText = 'Pendiente';
        
        if (guest.status === 'confirmed') {
            statusClass = 'status-confirmed';
            statusText = `Confirmado (${guest.confirmedGuests})`;
        } else if (guest.status === 'declined') {
            statusClass = 'status-declined';
            statusText = 'No asistirá';
        }
        
        // Format dates
        const createdDate = formatDate(guest.createdAt, true);
        const responseDate = guest.responseDate ? formatDate(guest.responseDate, true) : '-';
        
        html += `
            <div class="table-row">
                <div>
                    <span class="guest-code">${guest.id}</span>
                </div>
                <div class="guest-name">${guest.name || '-'}</div>
                <div class="guest-email">${guest.email || '-'}</div>
                <div class="guest-status">
                    <span class="${statusClass}">${statusText}</span>
                </div>
                <div>${guest.confirmedGuests || 0} / ${guest.maxGuests}</div>
                <div class="guest-actions">
                    <button class="btn-action btn-copy" data-id="${guest.id}" title="Copiar link">
                        <i class="fas fa-copy"></i>
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
    
    elements.guestsList.innerHTML = html;
    
    // Add event listeners to action buttons
    elements.guestsList.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const guestId = e.currentTarget.getAttribute('data-id');
            copyGuestLink(guestId);
        });
    });
    
    elements.guestsList.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const guestId = e.currentTarget.getAttribute('data-id');
            showEditGuestModal(guestId);
        });
    });
    
    elements.guestsList.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const guestId = e.currentTarget.getAttribute('data-id');
            showDeleteGuestModal(guestId);
        });
    });
}

function handleSearch() {
    adminState.searchQuery = elements.searchGuests.value.trim().toLowerCase();
    adminState.currentPage = 1;
    filterGuests();
    updateGuestsTable();
    updatePagination();
}

function filterGuests() {
    if (!adminState.searchQuery) {
        adminState.filteredGuests = [...adminState.guests];
        return;
    }
    
    const query = adminState.searchQuery;
    adminState.filteredGuests = adminState.guests.filter(guest => {
        return (
            guest.id.toLowerCase().includes(query) ||
            (guest.name && guest.name.toLowerCase().includes(query)) ||
            (guest.email && guest.email.toLowerCase().includes(query)) ||
            guest.status.toLowerCase().includes(query)
        );
    });
}

function updatePagination() {
    const totalGuests = adminState.filteredGuests.length;
    adminState.totalPages = Math.ceil(totalGuests / adminState.itemsPerPage);
    
    // Update button states
    elements.btnPrev.disabled = adminState.currentPage === 1;
    elements.btnNext.disabled = adminState.currentPage === adminState.totalPages;
    
    // Generate page numbers
    let pageNumbersHtml = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, adminState.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(adminState.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageNumbersHtml += `
            <button class="page-btn ${i === adminState.currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }
    
    elements.pageNumbers.innerHTML = pageNumbersHtml;
}

function changePage(page) {
    if (page < 1 || page > adminState.totalPages) return;
    
    adminState.currentPage = page;
    updateGuestsTable();
    updatePagination();
    
    // Scroll to top of table
    elements.guestsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copyGuestLink(guestId) {
    const link = `${window.location.origin}/?inv=${guestId}`;
    await navigator.clipboard.writeText(link);
    showSuccess('Link copiado al portapapeles');
}

function showEditGuestModal(guestId) {
    const guest = adminState.guests.find(g => g.id === guestId);
    if (!guest) return;
    
    elements.modalTitle.textContent = 'Editar Invitado';
    
    elements.modalContent.innerHTML = `
        <form id="edit-guest-form">
            <div class="form-row">
                <label class="form-label">Código de Invitación</label>
                <input type="text" class="form-input" value="${guest.id}" readonly>
            </div>
            
            <div class="form-row">
                <label class="form-label">Nombre del Invitado</label>
                <input type="text" id="edit-guest-name" class="form-input" 
                       value="${guest.name || ''}" 
                       placeholder="Nombre del invitado">
            </div>
            
            <div class="form-row">
                <label class="form-label">Email</label>
                <input type="email" id="edit-guest-email" class="form-input" 
                       value="${guest.email || ''}" 
                       placeholder="Email del invitado">
            </div>
            
            <div class="form-row">
                <label class="form-label">Cupos Disponibles</label>
                <select id="edit-guest-max-guests" class="form-select" required>
                    <option value="2" ${guest.maxGuests === 2 ? 'selected' : ''}>2 personas</option>
                    <option value="4" ${guest.maxGuests === 4 ? 'selected' : ''}>4 personas</option>
                    <option value="6" ${guest.maxGuests === 6 ? 'selected' : ''}>6 personas</option>
                    <option value="10" ${guest.maxGuests === 10 ? 'selected' : ''}>10 personas</option>
                </select>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button>
                <button type="submit" class="btn-save">
                    <i class="fas fa-save"></i>
                    Guardar Cambios
                </button>
            </div>
        </form>
    `;
    
    // Add form submit handler
    const form = document.getElementById('edit-guest-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleEditGuestSubmit(guestId);
    });
    
    elements.modalOverlay.classList.add('active');
}

async function handleEditGuestSubmit(guestId) {
    try {
        showLoading();
        
        const updates = {
            name: document.getElementById('edit-guest-name').value.trim() || null,
            email: document.getElementById('edit-guest-email').value.trim() || null,
            maxGuests: parseInt(document.getElementById('edit-guest-max-guests').value)
        };
        
        await window.firebaseApp.updateGuest(guestId, updates);
        
        // Update local state
        const guestIndex = adminState.guests.findIndex(g => g.id === guestId);
        if (guestIndex !== -1) {
            adminState.guests[guestIndex] = {
                ...adminState.guests[guestIndex],
                ...updates
            };
        }
        
        // Update filtered guests
        const filteredIndex = adminState.filteredGuests.findIndex(g => g.id === guestId);
        if (filteredIndex !== -1) {
            adminState.filteredGuests[filteredIndex] = {
                ...adminState.filteredGuests[filteredIndex],
                ...updates
            };
        }
        
        closeModal();
        updateGuestsTable();
        showSuccess('Invitado actualizado exitosamente');
        
    } catch (error) {
        console.error('Error updating guest:', error);
        showError(error.message || 'Error al actualizar el invitado');
    } finally {
        hideLoading();
    }
}

function showDeleteGuestModal(guestId) {
    const guest = adminState.guests.find(g => g.id === guestId);
    if (!guest) return;
    
    elements.modalTitle.textContent = 'Eliminar Invitado';
    
    elements.modalContent.innerHTML = `
        <div style="text-align: center; padding: 2rem 0;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #f44336; margin-bottom: 1rem;"></i>
            <h3 style="color: #fff; margin-bottom: 1rem;">¿Estás seguro?</h3>
            <p style="color: #c0c0c0; margin-bottom: 1rem;">
                Estás a punto de eliminar la invitación de <strong>${guest.name || guest.id}</strong>.
            </p>
            <p style="color: #ff6b6b; margin-bottom: 2rem;">
                Esta acción no se puede deshacer. El invitado ya no podrá acceder a su link.
            </p>
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button>
                <button type="button" id="btn-confirm-delete" class="btn-save" style="background: #f44336;">
                    <i class="fas fa-trash"></i>
                    Eliminar Definitivamente
                </button>
            </div>
        </div>
    `;
    
    // Add confirmation handler
    document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
        await handleDeleteGuest(guestId);
    });
    
    elements.modalOverlay.classList.add('active');
}

async function handleDeleteGuest(guestId) {
    try {
        showLoading();
        
        await window.firebaseApp.deleteGuest(guestId);
        
        // Update local state
        adminState.guests = adminState.guests.filter(g => g.id !== guestId);
        adminState.filteredGuests = adminState.filteredGuests.filter(g => g.id !== guestId);
        
        closeModal();
        updateGuestsTable();
        updatePagination();
        showSuccess('Invitado eliminado exitosamente');
        
        // Reload dashboard stats
        if (adminState.eventStats) {
            const stats = await window.firebaseApp.getEventStats();
            updateStatisticsCards(stats);
        }
        
    } catch (error) {
        console.error('Error deleting guest:', error);
        showError(error.message || 'Error al eliminar el invitado');
    } finally {
        hideLoading();
    }
}

async function handleBulkImport() {
    const text = elements.bulkImportText.value.trim();
    if (!text) {
        showError('Por favor ingresa los datos a importar');
        return;
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    const guestsData = [];
    
    // Parse each line
    for (const line of lines) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length < 3) {
            showError(`Formato incorrecto en línea: "${line}". Debe ser: Nombre, Email, Cupos`);
            return;
        }
        
        const maxGuests = parseInt(parts[2]);
        if (![2, 4, 6, 10].includes(maxGuests)) {
            showError(`Cupos inválidos en línea: "${line}". Debe ser 2, 4, 6 o 10`);
            return;
        }
        
        guestsData.push({
            name: parts[0],
            email: parts[1],
            maxGuests: maxGuests
        });
    }
    
    if (guestsData.length === 0) {
        showError('No se encontraron datos válidos para importar');
        return;
    }
    
    // Show confirmation modal
    elements.modalTitle.textContent = 'Confirmar Importación';
    elements.modalContent.innerHTML = `
        <div style="text-align: center; padding: 2rem 0;">
            <i class="fas fa-file-import" style="font-size: 4rem; color: #d4af37; margin-bottom: 1rem;"></i>
            <h3 style="color: #fff; margin-bottom: 1rem;">Importar ${guestsData.length} invitados</h3>
            <p style="color: #c0c0c0; margin-bottom: 2rem;">
                Se crearán ${guestsData.length} nuevas invitaciones. ¿Deseas continuar?
            </p>
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button>
                <button type="button" id="btn-confirm-import" class="btn-save">
                    <i class="fas fa-upload"></i>
                    Importar ${guestsData.length} Invitados
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('btn-confirm-import').addEventListener('click', async () => {
        await performBulkImport(guestsData);
    });
    
    elements.modalOverlay.classList.add('active');
}

async function performBulkImport(guestsData) {
    try {
        showLoading();
        
        const results = await window.firebaseApp.bulkCreateGuests(guestsData);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        // Clear import textarea
        elements.bulkImportText.value = '';
        
        closeModal();
        
        if (failed > 0) {
            showWarning(`Importación completada con ${failed} error(es). ${successful} invitados creados.`);
        } else {
            showSuccess(`${successful} invitados importados exitosamente`);
        }
        
        // Reload guests list
        await loadGuests();
        
        // Reload dashboard stats
        if (adminState.eventStats) {
            const stats = await window.firebaseApp.getEventStats();
            updateStatisticsCards(stats);
        }
        
    } catch (error) {
        console.error('Error in bulk import:', error);
        showError(error.message || 'Error al importar invitados');
        hideLoading();
    }
}

function exportToCSV() {
    if (adminState.filteredGuests.length === 0) {
        showError('No hay datos para exportar');
        return;
    }
    
    // Prepare CSV headers
    const headers = ['Código', 'Nombre', 'Email', 'Estado', 'Confirmados', 'Cupos', 'Fecha Creación', 'Fecha Respuesta'];
    
    // Prepare CSV rows
    const rows = adminState.filteredGuests.map(guest => [
        guest.id,
        guest.name || '',
        guest.email || '',
        guest.status,
        guest.confirmedGuests || 0,
        guest.maxGuests,
        formatDate(guest.createdAt, false, true),
        guest.responseDate ? formatDate(guest.responseDate, false, true) : ''
    ]);
    
    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `invitados_hollywood_nights_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess(`Exportados ${adminState.filteredGuests.length} invitados a CSV`);
}

// ===== NEW GUEST =====
async function handleNewGuestSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading();
        
        const guestData = {
            name: elements.guestName.value.trim() || null,
            email: elements.guestEmail.value.trim() || null,
            maxGuests: parseInt(elements.guestMaxGuests.value)
        };
        
        const customCode = elements.guestCustomCode.value.trim() || null;
        
        const result = await window.firebaseApp.createGuestInvitation(guestData, customCode);
        
        // Show success message with invitation link
        elements.invitationLink.value = result.invitationLink;
        elements.createdInvitation.style.display = 'block';
        elements.newGuestForm.reset();
        
        // Scroll to show the invitation link
        elements.createdInvitation.scrollIntoView({ behavior: 'smooth' });
        
        // Update dashboard if we're on it
        if (adminState.eventStats) {
            const stats = await window.firebaseApp.getEventStats();
            updateStatisticsCards(stats);
        }
        
        showSuccess('Invitación creada exitosamente');
        
    } catch (error) {
        console.error('Error creating guest:', error);
        showError(error.message || 'Error al crear la invitación');
    } finally {
        hideLoading();
    }
}

async function copyInvitationLink() {
    try {
        await navigator.clipboard.writeText(elements.invitationLink.value);
        showSuccess('Link copiado al portapapeles');
    } catch (error) {
        console.error('Error copying link:', error);
        showError('Error al copiar el link');
    }
}

// ===== SETTINGS =====
async function loadSettings() {
    // For now, just load admin list
    await loadAdminList();
}

async function loadAdminList() {
    try {
        // In a real implementation, you would load admin users from Firestore
        // For now, we'll show a placeholder
        elements.adminList.innerHTML = `
            <div style="color: #c0c0c0; text-align: center; padding: 2rem;">
                <i class="fas fa-user-shield" style="font-size: 3rem; margin-bottom: 1rem; color: rgba(212, 175, 55, 0.5);"></i>
                <p>La gestión de administradores estará disponible próximamente.</p>
            </div>
        `;
    } catch (error) {
        console.error('Error loading admin list:', error);
        elements.adminList.innerHTML = `
            <div style="color: #f44336; text-align: center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error al cargar la lista de administradores</p>
            </div>
        `;
    }
}

function showAddAdminModal() {
    elements.modalTitle.textContent = 'Agregar Administrador';
    
    elements.modalContent.innerHTML = `
        <div style="padding: 1rem 0;">
            <p style="color: #c0c0c0; margin-bottom: 1.5rem;">
                Ingresa el email del usuario que deseas agregar como administrador.
            </p>
            <div class="form-row">
                <label class="form-label">Email del Administrador</label>
                <input type="email" id="admin-email" class="form-input" 
                       placeholder="ejemplo@email.com" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-cancel" onclick="closeModal()">Cancelar</button>
                <button type="button" id="btn-save-admin" class="btn-save">
                    <i class="fas fa-save"></i>
                    Agregar Administrador
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('btn-save-admin').addEventListener('click', async () => {
        const email = document.getElementById('admin-email').value.trim();
        if (!email) {
            showError('Por favor ingresa un email válido');
            return;
        }
        
        // In a real implementation, you would save to Firestore
        showSuccess(`Administrador ${email} agregado (simulado)`);
        closeModal();
    });
    
    elements.modalOverlay.classList.add('active');
}

// ===== MODAL FUNCTIONS =====
function closeModal() {
    elements.modalOverlay.classList.remove('active');
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateString, short = false, csvFormat = false) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        
        if (csvFormat) {
            // For CSV export
            return date.toISOString();
        }
        
        if (short) {
            // Short format for tables
            return date.toLocaleDateString('es-MX', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Full format
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
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

// ===== LOADING INDICATOR =====
function showLoading() {
    adminState.isLoading = true;
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.add('active');
    }
}

function hideLoading() {
    adminState.isLoading = false;
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.remove('active');
    }
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.animation = 'slideInRight 0.3s ease-out';
    
    elements.toastContainer.appendChild(toast);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'error');
}

function showWarning(message) {
    showToast(message, 'info');
}

// ===== KEYBOARD SHORTCUTS =====
function handleKeyboardShortcuts(e) {
    // Don't trigger shortcuts if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch (e.key) {
        case 'Escape':
            closeModal();
            break;
        case '1':
            if (e.ctrlKey) switchTab('dashboard');
            break;
        case '2':
            if (e.ctrlKey) switchTab('guests');
            break;
        case '3':
            if (e.ctrlKey) switchTab('new-guest');
            break;
        case '4':
            if (e.ctrlKey) switchTab('settings');
            break;
        case 'n':
            if (e.ctrlKey) switchTab('new-guest');
            break;
        case 'f':
            if (e.ctrlKey && elements.searchGuests) {
                e.preventDefault();
                elements.searchGuests.focus();
            }
            break;
        case 'r':
            if (e.ctrlKey) {
                e.preventDefault();
                loadDashboardData();
            }
            break;
    }
}

// ===== WINDOW EXPORTS =====
// Make functions available globally for inline onclick handlers
window.changePage = changePage;
window.closeModal = closeModal;

// Initialize when scripts are loaded
console.log('Hollywood Nights Admin Panel initialized successfully');