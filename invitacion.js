// Hollywood Nights - Invitation System
// Sistema de invitación con parámetro p para cupo máximo

// Variable global para almacenar el máximo permitido
let MAX_PERMITIDO = null;
let INVITATION_ID = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Hollywood Nights Invitation System Initializing...');
    
    // Initialize all components
    initInvitationSystem();
    initCountdownTimer();
    initRSVPForm();
    initScrollAnimations();
    initNavigation();
    initResponsiveDesign();
    
    // Show initial loader briefly
    showPageLoader();
});

// ===== PAGE LOADER =====
function showPageLoader() {
    // Create loader if it doesn't exist
    if (!document.getElementById('page-loader')) {
        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.className = 'page-loader';
        loader.innerHTML = `
            <div class="loader-clapperboard">
                <i class="fas fa-film"></i>
            </div>
            <div style="margin-top: 20px; color: #d4af37; font-family: 'Cinzel';">
                CARGANDO HOLLYWOOD NIGHTS...
            </div>
        `;
        document.body.appendChild(loader);
    }
    
    // Remove loader after animations complete
    setTimeout(() => {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => loader.remove(), 500);
        }
    }, 1500);
}

// ===== INVITATION SYSTEM =====
function initInvitationSystem() {
    console.log('Initializing invitation system...');
    
    // Get parameter p from URL
    const urlParams = new URLSearchParams(window.location.search);
    const p = urlParams.get('p');
    
    if (!p) {
        showInvalidInvitation('No se proporcionó el parámetro p');
        return;
    }
    
    // Validate p parameter
    const maxPermitido = parseInt(p);
    
    if (isNaN(maxPermitido) || maxPermitido < 1 || maxPermitido > 10) {
        showInvalidInvitation('El parámetro p debe ser un número entre 1 y 10');
        return;
    }
    
    // Store the maximum allowed
    MAX_PERMITIDO = maxPermitido;
    
    // Generate unique invitation ID
    INVITATION_ID = generateInvitationId();
    
    // Show invitation information
    showInvitationInfo(maxPermitido);
    
    // Check if already responded
    checkExistingResponse();
}

function generateInvitationId() {
    // Generate unique ID based on timestamp and random string
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `inv_${timestamp}_${random}`.toUpperCase();
}

function showInvitationInfo(maxPermitido) {
    console.log('Showing invitation for', maxPermitido, 'people');
    
    // Update invitation message in hero section
    const invitationMessage = document.getElementById('invitation-message');
    if (invitationMessage) {
        invitationMessage.textContent = `Invitación para ${maxPermitido} persona${maxPermitido !== 1 ? 's' : ''}`;
    }
    
    // Update invitation title
    const invitationTitle = document.getElementById('invitation-title');
    if (invitationTitle) {
        invitationTitle.textContent = `Invitación para ${maxPermitido} persona${maxPermitido !== 1 ? 's' : ''}`;
    }
    
    // Update max guests display
    const maxGuestsElement = document.getElementById('max-guests');
    if (maxGuestsElement) {
        maxGuestsElement.textContent = `${maxPermitido} persona${maxPermitido !== 1 ? 's' : ''}`;
    }
    
    // Update max allowed in form
    const maxAllowedElement = document.getElementById('max-allowed');
    if (maxAllowedElement) {
        maxAllowedElement.textContent = maxPermitido;
    }
    
    // Set max attribute on guests count input
    const guestsCountInput = document.getElementById('guests-count');
    if (guestsCountInput) {
        guestsCountInput.max = maxPermitido;
        guestsCountInput.value = 1; // Default value
    }
}

function showInvalidInvitation(errorMessage) {
    console.log('Invalid invitation:', errorMessage);
    
    // Hide RSVP form
    const rsvpForm = document.getElementById('rsvp-form-container');
    if (rsvpForm) {
        rsvpForm.style.display = 'none';
    }
    
    // Hide guest info
    const guestInfo = document.getElementById('guest-info');
    if (guestInfo) {
        guestInfo.style.display = 'none';
    }
    
    // Create error message in hero section
    const invitationInfo = document.getElementById('invitation-info');
    if (invitationInfo) {
        invitationInfo.innerHTML = `
            <div class="invalid-invitation">
                <div class="invalid-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="color: #f44336; margin-bottom: 20px;">INVITACIÓN INVÁLIDA</h3>
                <p class="invalid-message">${errorMessage}</p>
                <p class="invalid-message">Usa un link de invitación válido con el parámetro p (ej: ?p=2)</p>
            </div>
        `;
    }
    
    // Update page title
    document.title = 'Invitación Inválida - Hollywood Nights';
}

async function checkExistingResponse() {
    try {
        if (!INVITATION_ID || !MAX_PERMITIDO) return;
        
        // Check if response exists in Firebase
        const responseData = await window.firebaseApp.getInvitationResponse(INVITATION_ID);
        
        if (responseData) {
            // Already responded, show confirmation
            disableRSVPForm(responseData);
            updateGuestUI(responseData);
        }
    } catch (error) {
        console.log('No existing response found or error:', error);
        // Continue with normal flow
    }
}

function updateGuestUI(responseData) {
    const guestInfo = document.getElementById('guest-info');
    const guestStatusElement = document.getElementById('guest-status');
    
    if (!guestInfo || !guestStatusElement) return;
    
    // Determine status text and color
    let statusText = 'Pendiente de confirmación';
    let statusColor = '#ffd700'; // Gold for pending
    let statusIcon = 'fas fa-clock';
    
    if (responseData.estado === 'confirmed') {
        statusText = `Confirmado (${responseData.personasConfirmadas} personas)`;
        statusColor = '#4CAF50'; // Green for confirmed
        statusIcon = 'fas fa-check-circle';
    } else if (responseData.estado === 'declined') {
        statusText = 'No asistirá';
        statusColor = '#f44336'; // Red for declined
        statusIcon = 'fas fa-times-circle';
    }
    
    // Update guest status
    guestStatusElement.textContent = statusText;
    guestStatusElement.style.color = statusColor;
}

// ===== COUNTDOWN TIMER =====
function initCountdownTimer() {
    console.log('Initializing countdown timer...');
    
    // Event date: February 21, 2026, 7:30 PM
    const eventDate = new Date('2026-02-21T19:30:00-06:00');
    
    // Update countdown immediately
    updateCountdown(eventDate);
    
    // Update every second
    setInterval(() => updateCountdown(eventDate), 1000);
}

function updateCountdown(eventDate) {
    const now = new Date();
    const timeRemaining = eventDate - now;
    
    if (timeRemaining <= 0) {
        // Event has passed
        document.getElementById('days').textContent = '000';
        document.getElementById('hours').textContent = '00';
        document.getElementById('minutes').textContent = '00';
        document.getElementById('seconds').textContent = '00';
        
        // Add event-passed class for styling
        document.querySelectorAll('.countdown-number').forEach(el => {
            el.style.color = '#8b0000';
            el.style.textShadow = '0 0 20px rgba(139, 0, 0, 0.5)';
        });
        
        return;
    }
    
    // Calculate time components
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    // Get elements
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    // Update with animation if value changed
    updateCountdownElement(daysElement, days.toString().padStart(3, '0'));
    updateCountdownElement(hoursElement, hours.toString().padStart(2, '0'));
    updateCountdownElement(minutesElement, minutes.toString().padStart(2, '0'));
    updateCountdownElement(secondsElement, seconds.toString().padStart(2, '0'));
    
    // Special effects for certain milestones
    if (days === 0 && hours < 24) {
        // Less than 24 hours remaining - add pulse animation
        document.querySelectorAll('.countdown-item').forEach(item => {
            item.classList.add('countdown-pulse');
        });
    }
}

function updateCountdownElement(element, newValue) {
    if (element.textContent !== newValue) {
        // Add flip animation
        element.classList.add('countdown-flip');
        
        // Update value after animation starts
        setTimeout(() => {
            element.textContent = newValue;
        }, 300);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            element.classList.remove('countdown-flip');
        }, 600);
    }
}

// ===== RSVP FORM =====
function initRSVPForm() {
    console.log('Initializing RSVP form...');
    
    const form = document.getElementById('rsvp-form');
    if (!form) return;
    
    const attendanceSelect = document.getElementById('attendance');
    const guestsCountGroup = document.getElementById('guests-count-group');
    const guestsCountInput = document.getElementById('guests-count');
    const noteGroup = document.getElementById('note-group');
    
    // Handle attendance selection change
    attendanceSelect.addEventListener('change', (e) => {
        if (e.target.value === 'yes') {
            guestsCountGroup.style.display = 'block';
            noteGroup.style.display = 'block';
            setTimeout(() => {
                guestsCountGroup.classList.add('fade-in-up');
                noteGroup.classList.add('fade-in-up');
            }, 10);
        } else if (e.target.value === 'no') {
            guestsCountGroup.style.display = 'none';
            noteGroup.style.display = 'block';
            setTimeout(() => {
                noteGroup.classList.add('fade-in-up');
            }, 10);
        } else {
            guestsCountGroup.style.display = 'none';
            noteGroup.style.display = 'none';
        }
    });
    
    // Handle guests count input
    if (guestsCountInput) {
        guestsCountInput.addEventListener('input', (e) => {
            const maxPermitido = MAX_PERMITIDO || 0;
            const value = parseInt(e.target.value) || 0;
            
            if (value > maxPermitido) {
                e.target.value = maxPermitido;
                showInputError('No puedes exceder el máximo permitido');
            } else if (value < 1) {
                e.target.value = 1;
                showInputError('Debes confirmar al menos 1 persona');
            }
        });
        
        guestsCountInput.addEventListener('change', (e) => {
            const value = parseInt(e.target.value) || 0;
            if (value < 1) {
                e.target.value = 1;
            }
        });
    }
    
    // Handle form submission
    form.addEventListener('submit', handleRSVPSubmit);
}

function disableRSVPForm(responseData) {
    console.log('Disabling RSVP form for already responded invitation');
    
    const form = document.getElementById('rsvp-form');
    const confirmationMessage = document.getElementById('confirmation-message');
    
    if (!form || !confirmationMessage) return;
    
    // Hide form and show confirmation message
    form.style.display = 'none';
    confirmationMessage.style.display = 'block';
    
    // Update confirmation message based on status
    if (responseData.estado === 'confirmed') {
        document.getElementById('confirmation-details').textContent = 
            `Has confirmado asistencia para ${responseData.personasConfirmadas} persona${responseData.personasConfirmadas !== 1 ? 's' : ''}.`;
    } else if (responseData.estado === 'declined') {
        document.getElementById('confirmation-details').textContent = 
            'Has indicado que no podrás asistir al evento.';
    }
    
    // Add animation
    setTimeout(() => {
        confirmationMessage.classList.add('confirmation-success');
        confirmationMessage.classList.add('fade-in-up');
    }, 100);
}

function enableRSVPForm() {
    console.log('Enabling RSVP form');
    
    const form = document.getElementById('rsvp-form');
    const confirmationMessage = document.getElementById('confirmation-message');
    const errorMessage = document.getElementById('error-message');
    
    if (form) form.style.display = 'block';
    if (confirmationMessage) confirmationMessage.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'none';
}

async function handleRSVPSubmit(event) {
    event.preventDefault();
    console.log('Handling RSVP form submission');
    
    const form = event.target;
    const attendanceSelect = document.getElementById('attendance');
    const guestsCountInput = document.getElementById('guests-count');
    const noteInput = document.getElementById('note');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Get form data
    const attendance = attendanceSelect.value;
    const guestsCount = attendance === 'yes' ? parseInt(guestsCountInput.value) || 1 : 0;
    const note = noteInput.value || '';
    
    // Validate form
    if (!attendance) {
        showFormError('Por favor selecciona si asistirás o no');
        return;
    }
    
    if (attendance === 'yes') {
        if (guestsCount < 1) {
            showFormError('Debes confirmar al menos 1 persona');
            return;
        }
        
        if (guestsCount > MAX_PERMITIDO) {
            showFormError(`No puedes confirmar más de ${MAX_PERMITIDO} personas`);
            return;
        }
    }
    
    // Disable form and show loading
    disableFormDuringSubmit(form, submitButton);
    
    try {
        // Prepare response data
        const responseData = {
            maxPermitido: MAX_PERMITIDO,
            personasConfirmadas: attendance === 'yes' ? guestsCount : 0,
            estado: attendance === 'yes' ? 'confirmed' : 'declined',
            nota: note,
            fechaHora: firebase.firestore.FieldValue.serverTimestamp(),
            invitationId: INVITATION_ID
        };
        
        // Save to Firebase
        const result = await window.firebaseApp.saveInvitationResponse(INVITATION_ID, responseData);
        
        if (result.success) {
            // Show success
            showRSVPSuccess(responseData);
            
            // Update guest info display
            updateGuestUI(responseData);
            
            // Log successful submission
            console.log('RSVP submitted successfully:', responseData);
        } else {
            throw new Error(result.error || 'Error al guardar la respuesta');
        }
        
    } catch (error) {
        console.error('Error submitting RSVP:', error);
        showFormError(error.message || 'Error al enviar la confirmación');
        enableFormAfterSubmit(form, submitButton);
    }
}

function disableFormDuringSubmit(form, submitButton) {
    form.classList.add('form-submitting');
    submitButton.disabled = true;
    submitButton.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        ENVIANDO...
    `;
    
    // Disable all form inputs
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        if (input !== submitButton) {
            input.disabled = true;
        }
    });
}

function enableFormAfterSubmit(form, submitButton) {
    form.classList.remove('form-submitting');
    submitButton.disabled = false;
    submitButton.innerHTML = `
        <i class="fas fa-paper-plane"></i>
        CONFIRMAR ASISTENCIA
    `;
    
    // Enable all form inputs
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        input.disabled = false;
    });
}

function showRSVPSuccess(responseData) {
    const form = document.getElementById('rsvp-form');
    const confirmationMessage = document.getElementById('confirmation-message');
    
    if (!form || !confirmationMessage) return;
    
    // Hide form and show success message
    form.style.display = 'none';
    confirmationMessage.style.display = 'block';
    
    // Update message based on response
    if (responseData.estado === 'confirmed') {
        document.getElementById('confirmation-details').textContent = 
            `¡Perfecto! Has confirmado asistencia para ${responseData.personasConfirmadas} persona${responseData.personasConfirmadas !== 1 ? 's' : ''}.`;
    } else {
        document.getElementById('confirmation-details').textContent = 
            'Entendido. Lamentamos que no puedas asistir, pero agradecemos tu respuesta.';
    }
    
    // Add celebration effect for confirmation
    if (responseData.estado === 'confirmed') {
        addConfettiEffect();
    }
    
    // Add animation
    setTimeout(() => {
        confirmationMessage.classList.add('confirmation-success');
        confirmationMessage.classList.add('fade-in-up');
    }, 100);
}

function showFormError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorDetails = document.getElementById('error-details');
    
    if (errorMessage && errorDetails) {
        errorDetails.textContent = message;
        errorMessage.style.display = 'block';
        
        // Add animation
        setTimeout(() => {
            errorMessage.classList.add('error-shake');
            errorMessage.classList.add('fade-in-up');
        }, 100);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

function showInputError(message) {
    // Create temporary toast notification
    const toast = document.createElement('div');
    toast.className = 'input-error-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(244, 67, 54, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        animation: fadeInUp 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== ANIMATIONS AND EFFECTS =====
function initScrollAnimations() {
    console.log('Initializing scroll animations...');
    
    // Add scroll event listener for entrance animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all animate-on-scroll elements
    document.querySelectorAll('.animate-on-scroll').forEach(element => {
        observer.observe(element);
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.nav-container');
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

function initNavigation() {
    console.log('Initializing navigation...');
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Add active class to clicked link
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                });
                this.classList.add('active');
                
                // Smooth scroll to target
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

function addConfettiEffect() {
    // Simple confetti effect using emojis
    const confettiContainer = document.createElement('div');
    confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
    `;
    
    const emojis = ['🎉', '🎊', '🎈', '🥳', '✨', '🌟', '💫', '🕺', '💃', '🎆'];
    
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        confetti.style.cssText = `
            position: absolute;
            top: -50px;
            left: ${Math.random() * 100}%;
            font-size: ${Math.random() * 20 + 20}px;
            opacity: ${Math.random() * 0.5 + 0.5};
            animation: confetti-fall ${Math.random() * 2 + 2}s linear forwards;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes confetti-fall {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        confettiContainer.appendChild(confetti);
        
        // Remove confetti after animation
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
    
    document.body.appendChild(confettiContainer);
    
    // Remove container after all confetti is gone
    setTimeout(() => {
        confettiContainer.remove();
        // Remove style element
        document.querySelector('style[data-confetti]')?.remove();
    }, 3000);
}

// ===== RESPONSIVE DESIGN =====
function initResponsiveDesign() {
    console.log('Initializing responsive design...');
    
    // Handle mobile menu
    createMobileMenu();
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();
}

function createMobileMenu() {
    const navbar = document.querySelector('.nav-container .nav-content');
    if (!navbar) return;
    
    // Create mobile menu button
    const menuButton = document.createElement('button');
    menuButton.className = 'mobile-menu-button';
    menuButton.innerHTML = '<i class="fas fa-bars"></i>';
    menuButton.style.cssText = `
        display: none;
        background: none;
        border: none;
        color: #d4af37;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px;
    `;
    
    // Insert before nav links
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navbar.insertBefore(menuButton, navLinks);
        
        // Toggle mobile menu
        menuButton.addEventListener('click', () => {
            navLinks.classList.toggle('mobile-open');
            menuButton.innerHTML = navLinks.classList.contains('mobile-open') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
}

function handleResize() {
    const navLinks = document.querySelector('.nav-links');
    const menuButton = document.querySelector('.mobile-menu-button');
    
    if (!navLinks || !menuButton) return;
    
    if (window.innerWidth <= 768) {
        // Mobile view
        menuButton.style.display = 'block';
        
        // Add mobile styles to nav links
        if (!navLinks.classList.contains('mobile-styled')) {
            navLinks.classList.add('mobile-styled');
            navLinks.style.cssText = `
                position: fixed;
                top: 70px;
                left: 0;
                right: 0;
                background: rgba(10, 10, 10, 0.98);
                backdrop-filter: blur(15px);
                flex-direction: column;
                padding: 20px;
                gap: 15px;
                border-bottom: 1px solid rgba(212, 175, 55, 0.3);
                transform: translateY(-100%);
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 999;
            `;
            
            // Style links for mobile
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.style.cssText = `
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    width: 100%;
                    text-align: center;
                `;
            });
        }
    } else {
        // Desktop view
        menuButton.style.display = 'none';
        navLinks.classList.remove('mobile-open');
        navLinks.classList.remove('mobile-styled');
        navLinks.style.cssText = '';
        
        // Reset link styles
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.style.cssText = '';
        });
    }
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateString) {
    if (!dateString) return 'No disponible';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Fecha inválida';
    }
}

function formatTime(timeString) {
    if (!timeString) return '';
    
    try {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const period = hour >= 12 ? 'P.M.' : 'A.M.';
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${period}`;
    } catch (error) {
        return timeString;
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== ERROR HANDLING =====
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // Don't show error alerts in production
    if (window.location.hostname !== 'localhost') {
        return;
    }
    
    // Show friendly error message in development
    const errorDisplay = document.createElement('div');
    errorDisplay.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(244, 67, 54, 0.9);
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 300px;
        font-family: monospace;
        font-size: 12px;
        display: none;
    `;
    errorDisplay.textContent = `Error: ${event.error?.message || 'Unknown error'}`;
    errorDisplay.id = 'global-error-display';
    
    if (!document.getElementById('global-error-display')) {
        document.body.appendChild(errorDisplay);
        errorDisplay.style.display = 'block';
        
        setTimeout(() => {
            errorDisplay.style.opacity = '0';
            errorDisplay.style.transition = 'opacity 0.5s ease';
            setTimeout(() => errorDisplay.remove(), 500);
        }, 5000);
    }
});

// ===== EXPORTS =====
// Make functions available globally for debugging
window.invitationSystem = {
    initInvitationSystem,
    handleRSVPSubmit,
    updateCountdown,
    formatDate,
    formatTime
};

console.log('Hollywood Nights Invitation System initialized successfully');