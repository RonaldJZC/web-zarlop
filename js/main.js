// ===================================
// ZARLOP S.A.C. - MAIN JAVASCRIPT
// ===================================

// Equipment Data (simulating database)
const equipmentData = [
    {
        id: 1,
        name: 'Analizador Bioquímico',
        category: 'laboratorio',
        description: 'Equipos de análisis clínico automatizado para pruebas bioquímicas',
        image: 'assets/images/equipos/analizador.jpg',
        icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
    },
    {
        id: 2,
        name: 'Desfibrilador',
        category: 'emergencia',
        description: 'Equipos de emergencia para reanimación cardiopulmonar',
        image: null,
        icon: 'M13 10V3L4 14h7v7l9-11h-7z'
    },
    {
        id: 3,
        name: 'Monitor de Signos Vitales',
        category: 'emergencia',
        description: 'Monitoreo continuo de signos vitales en tiempo real',
        image: null,
        icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
    },
    {
        id: 4,
        name: 'Electrocardiografo',
        category: 'consultorio',
        description: 'Registro de actividad eléctrica del corazón',
        image: null,
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
        id: 5,
        name: 'Microscopio Digital',
        category: 'laboratorio',
        description: 'Microscopía avanzada con captura digital de imágenes',
        image: 'assets/images/equipos/microscopio.jpg',
        icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7'
    },
    {
        id: 6,
        name: 'Ventilador Mecánico',
        category: 'emergencia',
        description: 'Soporte respiratorio para cuidados intensivos',
        image: null,
        icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'
    },
    {
        id: 7,
        name: 'Ultrasonido Doppler',
        category: 'diagnostico',
        description: 'Diagnóstico por imágenes con tecnología Doppler',
        image: null,
        icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
    },
    {
        id: 8,
        name: 'Autoclave',
        category: 'laboratorio',
        description: 'Esterilización de instrumental médico',
        image: 'assets/images/equipos/autoclave.jpg',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    },
    {
        id: 9,
        name: 'Equipo de Rayos X',
        category: 'diagnostico',
        description: 'Radiología digital para diagnóstico por imágenes',
        image: null,
        icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    {
        id: 10,
        name: 'Bomba de Infusión',
        category: 'emergencia',
        description: 'Administración controlada de medicamentos',
        image: null,
        icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
    },
    {
        id: 11,
        name: 'Centrifuga de Laboratorio',
        category: 'laboratorio',
        description: 'Separación de componentes sanguíneos',
        image: 'assets/images/equipos/centrifuga.jpg',
        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
    },
    {
        id: 12,
        name: 'Otoscopio Digital',
        category: 'consultorio',
        description: 'Examen visual del oído con captura de imágenes',
        image: null,
        icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
    }
];

// ===================================
// NAVIGATION
// ===================================

const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Scroll effect for navbar
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Active link on scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Smooth scroll for navigation links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        if (link.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
                navMenu.classList.remove('active');
            }
        }
    });
});

// ===================================
// EQUIPMENT SECTION
// ===================================

const equipmentGrid = document.getElementById('equipmentGrid');
const categoryBtns = document.querySelectorAll('.category-btn');

// Render equipment items
function renderEquipment(category = 'all') {
    const filteredEquipment = category === 'all'
        ? equipmentData
        : equipmentData.filter(item => item.category === category);

    equipmentGrid.innerHTML = filteredEquipment.map(item => {
        const imageStyle = item.image ? `background-image: url('${item.image}'); background-size: cover; background-position: center;` : '';
        const showIcon = !item.image;

        return `
            <div class="equipment-item" data-category="${item.category}">
                <div class="equipment-image" style="${imageStyle}">
                    ${showIcon ? `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="${item.icon}"/>
                        </svg>
                    ` : ''}
                </div>
                <div class="equipment-content">
                    <h3 class="equipment-title">${item.name}</h3>
                    <span class="equipment-category">${getCategoryName(item.category)}</span>
                    <p class="equipment-description">${item.description}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Get category display name
function getCategoryName(category) {
    const names = {
        'laboratorio': 'Laboratorio',
        'emergencia': 'Emergencia',
        'consultorio': 'Consultorio',
        'diagnostico': 'Diagnóstico'
    };
    return names[category] || category;
}

// Category filter
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.getAttribute('data-category');
        renderEquipment(category);
    });
});

// Initial render
renderEquipment();

// ===================================
// STATISTICS COUNTER
// ===================================

const statNumbers = document.querySelectorAll('.stat-number');
let hasAnimated = false;

function animateStats() {
    if (hasAnimated) return;

    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                stat.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                stat.textContent = target;
            }
        };

        updateCounter();
    });

    hasAnimated = true;
}

// Trigger stats animation on scroll
const aboutSection = document.getElementById('nosotros');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
        }
    });
}, { threshold: 0.5 });

if (aboutSection) {
    observer.observe(aboutSection);
}

// ===================================
// CONTACT FORM
// ===================================

const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        message: document.getElementById('message').value,
        timestamp: new Date().toISOString()
    };

    try {
        // Save to localStorage (simulating database)
        const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
        contacts.push(formData);
        localStorage.setItem('contacts', JSON.stringify(contacts));

        // Show success message
        alert('¡Gracias por contactarnos! Nos pondremos en contacto contigo pronto.');
        contactForm.reset();

        // In production, this would send to backend API
        // await fetch('/api/contact', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // });

    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al enviar el formulario. Por favor, intenta nuevamente.');
    }
});

// ===================================
// AOS (Animate On Scroll) Simulation
// ===================================

const observeElements = document.querySelectorAll('[data-aos]');

const aosObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

observeElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    aosObserver.observe(el);
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Debounce function for performance
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

// Smooth scroll to top
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Zarlop S.A.C. - Website Loaded Successfully');
});
