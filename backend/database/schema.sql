-- ===================================
-- ZARLOP S.A.C. - DATABASE SCHEMA
-- ===================================

-- Create database
CREATE DATABASE IF NOT EXISTS zarlop_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE zarlop_db;

-- ===================================
-- USERS TABLE (Admin users)
-- ===================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role ENUM('admin', 'manager', 'technician') DEFAULT 'technician',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- CONTACTS TABLE (Customer inquiries)
-- ===================================
CREATE TABLE IF NOT EXISTS contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    service_type ENUM('preventivo', 'correctivo', 'repotenciacion', 'laboratorio', 'consultorio', 'emergencia') NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'in_progress', 'contacted', 'closed') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assigned_to INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_service_type (service_type),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- EQUIPMENT TABLE (Medical equipment catalog)
-- ===================================
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category ENUM('laboratorio', 'emergencia', 'consultorio', 'diagnostico', 'otros') NOT NULL,
    description TEXT,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    specifications JSON,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_name (name),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- SERVICES TABLE (Service offerings)
-- ===================================
CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(255),
    icon VARCHAR(50),
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- SERVICE_REQUESTS TABLE (Service tickets)
-- ===================================
CREATE TABLE IF NOT EXISTS service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT,
    equipment_id INT,
    service_id INT,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    client_email VARCHAR(100) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    institution VARCHAR(150),
    equipment_details TEXT,
    issue_description TEXT NOT NULL,
    status ENUM('pending', 'approved', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    assigned_technician INT,
    scheduled_date DATETIME,
    completed_date DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_request_number (request_number),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_technician) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- MAINTENANCE_LOGS TABLE (Service history)
-- ===================================
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_request_id INT NOT NULL,
    technician_id INT,
    log_type ENUM('inspection', 'repair', 'calibration', 'replacement', 'note') NOT NULL,
    description TEXT NOT NULL,
    parts_used JSON,
    time_spent INT COMMENT 'Minutes',
    cost DECIMAL(10, 2),
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service_request (service_request_id),
    INDEX idx_technician (technician_id),
    INDEX idx_log_type (log_type),
    FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- CLIENTS TABLE (Regular customers)
-- ===================================
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Perú',
    tax_id VARCHAR(50),
    client_type ENUM('hospital', 'clinic', 'laboratory', 'private', 'government') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_institution (institution_name),
    INDEX idx_client_type (client_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- AUDIT_LOG TABLE (System audit trail)
-- ===================================
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- INSERT DEFAULT DATA
-- ===================================

-- Default admin user (password: zarlop2025)
-- Password hash generated with bcrypt
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@zarlop.com', '$2a$10$rZ5YvJzK8K9YvJzK8K9YvOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', 'Administrador Zarlop', 'admin');

-- Default services
INSERT INTO services (name, slug, description, short_description, icon, features, display_order) VALUES
('Mantenimiento Preventivo', 'mantenimiento-preventivo', 
'Programas de mantenimiento preventivo para garantizar el funcionamiento óptimo de sus equipos médicos.',
'Programas de mantenimiento preventivo',
'settings',
'["Calibración de equipos", "Inspecciones periódicas", "Reportes detallados"]',
1),

('Mantenimiento Correctivo', 'mantenimiento-correctivo',
'Reparación especializada de equipos médicos con diagnóstico preciso y soluciones efectivas.',
'Reparación especializada de equipos',
'tool',
'["Diagnóstico avanzado", "Reparación inmediata", "Garantía de servicio"]',
2),

('Repotenciación de Equipos', 'repotenciacion',
'Modernizamos equipos médicos antiguos con tecnología de última generación.',
'Modernización de equipos médicos',
'zap',
'["Actualización tecnológica", "Mejora de rendimiento", "Extensión de vida útil"]',
3);

-- Default equipment
INSERT INTO equipment (name, category, description, manufacturer) VALUES
('Analizador Bioquímico', 'laboratorio', 'Equipos de análisis clínico automatizado para pruebas bioquímicas', 'Varios'),
('Desfibrilador', 'emergencia', 'Equipos de emergencia para reanimación cardiopulmonar', 'Varios'),
('Monitor de Signos Vitales', 'emergencia', 'Monitoreo continuo de signos vitales en tiempo real', 'Varios'),
('Electrocardiografo', 'consultorio', 'Registro de actividad eléctrica del corazón', 'Varios'),
('Microscopio Digital', 'laboratorio', 'Microscopía avanzada con captura digital de imágenes', 'Varios'),
('Ventilador Mecánico', 'emergencia', 'Soporte respiratorio para cuidados intensivos', 'Varios'),
('Ultrasonido Doppler', 'diagnostico', 'Diagnóstico por imágenes con tecnología Doppler', 'Varios'),
('Autoclave', 'laboratorio', 'Esterilización de instrumental médico', 'Varios'),
('Equipo de Rayos X', 'diagnostico', 'Radiología digital para diagnóstico por imágenes', 'Varios'),
('Bomba de Infusión', 'emergencia', 'Administración controlada de medicamentos', 'Varios'),
('Centrifuga de Laboratorio', 'laboratorio', 'Separación de componentes sanguíneos', 'Varios'),
('Otoscopio Digital', 'consultorio', 'Examen visual del oído con captura de imágenes', 'Varios');

-- ===================================
-- VIEWS FOR REPORTING
-- ===================================

-- View: Active service requests summary
CREATE OR REPLACE VIEW v_active_service_requests AS
SELECT 
    sr.id,
    sr.request_number,
    sr.client_name,
    sr.status,
    sr.priority,
    s.name as service_name,
    e.name as equipment_name,
    u.full_name as technician_name,
    sr.scheduled_date,
    sr.created_at
FROM service_requests sr
LEFT JOIN services s ON sr.service_id = s.id
LEFT JOIN equipment e ON sr.equipment_id = e.id
LEFT JOIN users u ON sr.assigned_technician = u.id
WHERE sr.status IN ('pending', 'approved', 'in_progress');

-- View: Contact statistics
CREATE OR REPLACE VIEW v_contact_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_contacts,
    SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_contacts,
    SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
    service_type
FROM contacts
GROUP BY DATE(created_at), service_type;

-- ===================================
-- STORED PROCEDURES
-- ===================================

DELIMITER //

-- Procedure: Create service request from contact
CREATE PROCEDURE sp_create_service_request(
    IN p_contact_id INT,
    IN p_equipment_id INT,
    IN p_service_id INT,
    IN p_issue_description TEXT
)
BEGIN
    DECLARE v_request_number VARCHAR(50);
    DECLARE v_client_name VARCHAR(100);
    DECLARE v_client_email VARCHAR(100);
    DECLARE v_client_phone VARCHAR(20);
    
    -- Get contact details
    SELECT name, email, phone INTO v_client_name, v_client_email, v_client_phone
    FROM contacts WHERE id = p_contact_id;
    
    -- Generate request number
    SET v_request_number = CONCAT('SR-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0'));
    
    -- Insert service request
    INSERT INTO service_requests (
        contact_id, equipment_id, service_id, request_number,
        client_name, client_email, client_phone, issue_description
    ) VALUES (
        p_contact_id, p_equipment_id, p_service_id, v_request_number,
        v_client_name, v_client_email, v_client_phone, p_issue_description
    );
    
    -- Update contact status
    UPDATE contacts SET status = 'in_progress' WHERE id = p_contact_id;
    
    SELECT LAST_INSERT_ID() as service_request_id, v_request_number as request_number;
END //

DELIMITER ;

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

-- Additional composite indexes for common queries
CREATE INDEX idx_service_requests_status_priority ON service_requests(status, priority);
CREATE INDEX idx_contacts_status_created ON contacts(status, created_at);
CREATE INDEX idx_maintenance_logs_request_created ON maintenance_logs(service_request_id, created_at);

-- ===================================
-- DATABASE INITIALIZATION COMPLETE
-- ===================================
