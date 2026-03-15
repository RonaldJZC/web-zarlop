// ===================================
// ZARLOP S.A.C. - MAIN JAVASCRIPT
// ===================================

// Equipment Data (simulating database)
const equipmentData = [
    {
        id: 1,
        name: 'Analizador Bioquímico',
        category: 'laboratorio',
        description: 'Experiencia en diagnóstico electrónico, reparación de módulos, calibración y mantenimiento de sistemas automatizados de análisis clínico.',
        image: 'assets/images/equipos/analizador.png'
    },
    {
        id: 2,
        name: 'Desfibrilador',
        category: 'emergencia',
        description: 'Soporte técnico especializado en revisión de circuitos de descarga, reemplazo de baterías y calibración de energía de desfibrilación.',
        image: 'assets/images/equipos/desfibrilador.png'
    },
    {
        id: 3,
        name: 'Monitor de Signos Vitales',
        category: 'emergencia',
        description: 'Diagnóstico de fallas en sensores, reparación de tarjetas de procesamiento y mantenimiento preventivo de monitores multiparámetros.',
        image: 'assets/images/equipos/monitor_signos.png'
    },
    {
        id: 4,
        name: 'Electrocardiógrafo',
        category: 'consultorio',
        description: 'Reparación de sistemas de adquisición de señal, calibración de impresión térmica y limpieza técnica de cabezales y sensores.',
        image: 'assets/images/equipos/electrocardiografo.png'
    },
    {
        id: 5,
        name: 'Microscopio Digital',
        category: 'laboratorio',
        description: 'Mantenimiento óptico de precisión, alineación de sistemas de iluminación LED y reparación de sensores de captura digital.',
        image: 'assets/images/equipos/microscopio.png'
    },
    {
        id: 6,
        name: 'Ventilador Mecánico',
        category: 'emergencia',
        description: 'Servicio técnico de alta complejidad en sistemas neumáticos, calibración de mezcladores de aire/O2 y pruebas de fugas.',
        image: 'assets/images/equipos/ventilador.png'
    },
    {
        id: 7,
        name: 'Ultrasonido Doppler',
        category: 'diagnóstico',
        description: 'Diagnóstico electrónico de consolas, reparación de transductores y optimización de software de procesamiento de imagen Doppler.',
        image: 'assets/images/equipos/ultrasonido.png'
    },
    {
        id: 8,
        name: 'Autoclave',
        category: 'laboratorio',
        description: 'Mantenimiento integral de sistemas de presión, cambio de empaques, limpieza de válvulas y calibración de ciclos de esterilización.',
        image: 'assets/images/equipos/autoclave.png'
    },
    {
        id: 9,
        name: 'Equipo de Rayos X',
        category: 'diagnóstico',
        description: 'Reparación de generadores de alta tensión, calibración de colimadores y mantenimiento de sistemas de radiología digital.',
        image: 'assets/images/equipos/rayos_x.png'
    },
    {
        id: 10,
        name: 'Bomba de Infusión',
        category: 'emergencia',
        description: 'Calibración de precisión de flujo, reparación de sensores de oclusión y aire en línea, y mantenimiento de mecanismos de bombeo.',
        image: 'assets/images/equipos/bomba_infusion.png'
    },
    {
        id: 11,
        name: 'Centrífuga de Laboratorio',
        category: 'laboratorio',
        description: 'Mantenimiento de motores, balanceo técnico de rotores, reparación de sistemas de control de velocidad y tiempo.',
        image: 'assets/images/equipos/centrifuga.png'
    },
    {
        id: 12,
        name: 'Otoscopio Digital',
        category: 'consultorio',
        description: 'Reparación de sistemas de iluminación de fibra óptica y mantenimiento de la interfaz de captura de imagen digital.',
        image: 'assets/images/equipos/otoscopio.png'
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

// Active link based on current page URL
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
navLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentPath) {
        link.classList.add('active');
    } else {
        link.classList.remove('active');
    }
});

// Remove scroll-based active link detection as we are now multi-page
// (Keeping smooth scroll logic ONLY if a link contains a hash for intra-page jumps)


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
    if (!equipmentGrid) return; // Guard for pages without equipment catalog
    
    const filteredEquipment = category === 'all'
        ? equipmentData
        : equipmentData.filter(item => item.category === category);

    equipmentGrid.innerHTML = filteredEquipment.map(item => {
        const imageStyle = `background-image: url('${item.image}'); background-size: contain; background-repeat: no-repeat; background-position: center;`;

        return `
            <div class="equipment-item" data-category="${item.category}">
                <div class="equipment-image" style="${imageStyle}">
                </div>
                <div class="equipment-content">
                    <h3 class="equipment-title">${item.name}</h3>
                    <span class="equipment-category">${getCategoryName(item.category)}</span>
                    <p class="equipment-description">${item.description}</p>
                    <a href="contacto.html?service=tecnico&equipment=${encodeURIComponent(item.name)}" class="btn-tech-service">
                        <span>Solicitar servicio técnico</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </a>
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
        'diagnóstico': 'Diagnóstico'
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
if (equipmentGrid) {
    renderEquipment();
}

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

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando Solicitud...';

        // Use FormData for file upload support
        const formData = new FormData(contactForm);

        // Timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 second timeout

        try {
            console.log('Iniciando envío de formulario a /api/contacts...');
            const response = await fetch('/api/contacts', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            let result;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await response.json();
            } else {
                const text = await response.text();
                console.error('Respuesta no-JSON recibida:', text);
                throw new Error('El servidor no respondió correctamente (no-JSON).');
            }

            if (response.ok) {
                // Show professional success message as requested
                alert('Su solicitud ha sido enviada correctamente. Nos comunicaremos con usted a la brevedad.');
                contactForm.reset();
            } else {
                throw new Error(result.error || 'Error al enviar la solicitud');
            }

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error detallado:', error);
            
            let errorMsg = error.message;
            if (error.name === 'AbortError') {
                errorMsg = 'La solicitud tardó demasiado tiempo (Tiempo de espera agotado). Por favor, verifique su conexión o intente nuevamente.';
            }
            
            alert('Hubo un error al procesar la solicitud: ' + errorMsg);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

// ===================================
// Premium Reveal Animations (Apple-style)
// ===================================

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Option: unobserve after reveal if you only want it once
            // revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-up').forEach(el => {
    revealObserver.observe(el);
});

// Original AOS-like Observer (legacy fallback/logic)
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
