// ===================================
// ADMIN PANEL JAVASCRIPT
// ===================================

// Admin credentials (in production, this should be server-side)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'zarlop2025'
};

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const navItems = document.querySelectorAll('.nav-item');
const sectionTitle = document.getElementById('sectionTitle');

// Equipment data from main site
const equipmentData = [
    {
        id: 1,
        name: 'Analizador Bioquímico',
        category: 'laboratorio',
        description: 'Equipos de análisis clínico automatizado para pruebas bioquímicas'
    },
    {
        id: 2,
        name: 'Desfibrilador',
        category: 'emergencia',
        description: 'Equipos de emergencia para reanimación cardiopulmonar'
    },
    {
        id: 3,
        name: 'Monitor de Signos Vitales',
        category: 'emergencia',
        description: 'Monitoreo continuo de signos vitales en tiempo real'
    },
    {
        id: 4,
        name: 'Electrocardiografo',
        category: 'consultorio',
        description: 'Registro de actividad eléctrica del corazón'
    },
    {
        id: 5,
        name: 'Microscopio Digital',
        category: 'laboratorio',
        description: 'Microscopía avanzada con captura digital de imágenes'
    },
    {
        id: 6,
        name: 'Ventilador Mecánico',
        category: 'emergencia',
        description: 'Soporte respiratorio para cuidados intensivos'
    },
    {
        id: 7,
        name: 'Ultrasonido Doppler',
        category: 'diagnostico',
        description: 'Diagnóstico por imágenes con tecnología Doppler'
    },
    {
        id: 8,
        name: 'Autoclave',
        category: 'laboratorio',
        description: 'Esterilización de instrumental médico'
    },
    {
        id: 9,
        name: 'Equipo de Rayos X',
        category: 'diagnostico',
        description: 'Radiología digital para diagnóstico por imágenes'
    },
    {
        id: 10,
        name: 'Bomba de Infusión',
        category: 'emergencia',
        description: 'Administración controlada de medicamentos'
    },
    {
        id: 11,
        name: 'Centrifuga de Laboratorio',
        category: 'laboratorio',
        description: 'Separación de componentes sanguíneos'
    },
    {
        id: 12,
        name: 'Otoscopio Digital',
        category: 'consultorio',
        description: 'Examen visual del oído con captura de imágenes'
    }
];

// ===================================
// AUTHENTICATION
// ===================================

// Check if user is already logged in
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showAdminPanel();
    }
}

// Login form handler
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        loginError.textContent = '';
        showAdminPanel();
    } else {
        loginError.textContent = 'Usuario o contraseña incorrectos';
    }
});

// Logout handler
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    showLoginScreen();
});

function showAdminPanel() {
    loginContainer.style.display = 'none';
    adminContainer.style.display = 'flex';
    loadDashboard();
}

function showLoginScreen() {
    loginContainer.style.display = 'flex';
    adminContainer.style.display = 'none';
    loginForm.reset();
}

// ===================================
// NAVIGATION
// ===================================

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();

        // Update active state
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Show corresponding section
        const sectionName = item.getAttribute('data-section');
        showSection(sectionName);
    });
});

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(`section-${sectionName}`);
    if (section) {
        section.classList.add('active');
    }

    // Update title
    const titles = {
        'dashboard': 'Dashboard',
        'contacts': 'Gestión de Contactos',
        'equipment': 'Gestión de Equipos',
        'services': 'Gestión de Servicios',
        'settings': 'Configuración'
    };
    sectionTitle.textContent = titles[sectionName] || 'Dashboard';

    // Load section data
    switch (sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'contacts':
            loadContacts();
            break;
        case 'equipment':
            loadEquipment();
            break;
    }
}

// ===================================
// DASHBOARD
// ===================================

function loadDashboard() {
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');

    // Update stats
    document.getElementById('totalContacts').textContent = contacts.length;
    document.getElementById('totalEquipment').textContent = equipmentData.length;

    // Load recent contacts
    const recentContactsDiv = document.getElementById('recentContacts');
    const recentContacts = contacts.slice(-5).reverse();

    if (recentContacts.length === 0) {
        recentContactsDiv.innerHTML = '<p style="color: #718096; text-align: center; padding: 2rem;">No hay contactos recientes</p>';
    } else {
        recentContactsDiv.innerHTML = recentContacts.map(contact => `
            <div class="recent-item">
                <div>
                    <p style="font-weight: 600; margin-bottom: 0.25rem;">${contact.name}</p>
                    <p style="font-size: 0.875rem; color: #718096;">${contact.email}</p>
                </div>
            </div>
        `).join('');
    }
}

// ===================================
// CONTACTS MANAGEMENT
// ===================================

function loadContacts() {
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const tableBody = document.getElementById('contactsTableBody');

    if (contacts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #718096;">No hay contactos registrados</td></tr>';
    } else {
        tableBody.innerHTML = contacts.map((contact, index) => `
            <tr>
                <td>${contact.name}</td>
                <td>${contact.email}</td>
                <td>${contact.phone}</td>
                <td>${getServiceName(contact.service)}</td>
                <td>${formatDate(contact.timestamp)}</td>
                <td>
                    <button class="btn-action btn-delete" onclick="deleteContact(${index})">
                        Eliminar
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function getServiceName(serviceCode) {
    const services = {
        'preventivo': 'Mantenimiento Preventivo',
        'correctivo': 'Mantenimiento Correctivo',
        'repotenciacion': 'Repotenciación',
        'laboratorio': 'Equipos de Laboratorio',
        'consultorio': 'Consultorios Externos',
        'emergencia': 'Equipos de Emergencia'
    };
    return services[serviceCode] || serviceCode;
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function deleteContact(index) {
    if (confirm('¿Estás seguro de eliminar este contacto?')) {
        const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
        contacts.splice(index, 1);
        localStorage.setItem('contacts', JSON.stringify(contacts));
        loadContacts();
        loadDashboard();
    }
}

// Export contacts
document.getElementById('exportContactsBtn').addEventListener('click', () => {
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');

    if (contacts.length === 0) {
        alert('No hay contactos para exportar');
        return;
    }

    const csv = convertToCSV(contacts);
    downloadCSV(csv, 'contactos-zarlop.csv');
});

function convertToCSV(data) {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Servicio', 'Mensaje', 'Fecha'];
    const rows = data.map(contact => [
        contact.name,
        contact.email,
        contact.phone,
        getServiceName(contact.service),
        contact.message,
        formatDate(contact.timestamp)
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Clear all contacts
document.getElementById('clearContactsBtn').addEventListener('click', () => {
    if (confirm('¿Estás seguro de eliminar TODOS los contactos? Esta acción no se puede deshacer.')) {
        localStorage.removeItem('contacts');
        loadContacts();
        loadDashboard();
        alert('Todos los contactos han sido eliminados');
    }
});

// ===================================
// EQUIPMENT MANAGEMENT
// ===================================

function loadEquipment() {
    const equipmentGrid = document.getElementById('equipmentGridAdmin');

    equipmentGrid.innerHTML = equipmentData.map(equipment => `
        <div class="equipment-card-admin">
            <h4>${equipment.name}</h4>
            <span class="equipment-badge">${getCategoryName(equipment.category)}</span>
            <p>${equipment.description}</p>
        </div>
    `).join('');
}

function getCategoryName(category) {
    const names = {
        'laboratorio': 'Laboratorio',
        'emergencia': 'Emergencia',
        'consultorio': 'Consultorio',
        'diagnostico': 'Diagnóstico'
    };
    return names[category] || category;
}

// Add equipment button (placeholder)
document.getElementById('addEquipmentBtn').addEventListener('click', () => {
    alert('Funcionalidad de agregar equipo en desarrollo. En producción, esto abriría un modal para agregar nuevos equipos.');
});

// ===================================
// SETTINGS
// ===================================

const settingsForm = document.querySelector('.settings-form');
if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Configuración guardada exitosamente');
    });
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    console.log('Admin Panel - Zarlop S.A.C. loaded successfully');
});
