# 🏗️ ARQUITECTURA DEL SISTEMA - ZARLOP S.A.C.

## 📊 Visión General

Sistema web completo de 3 capas diseñado para escalabilidad y mantenibilidad.

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │  Admin Panel │  │  Mobile App  │  │
│  │  (HTML/CSS)  │  │  (Dashboard) │  │   (Futuro)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE APLICACIÓN                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │              API REST (Express.js)                │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │  │
│  │  │  Auth  │ │Contact │ │Equipmt │ │Service │    │  │
│  │  │ Routes │ │ Routes │ │ Routes │ │ Routes │    │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘    │  │
│  │                                                    │  │
│  │  Middleware: JWT, CORS, Rate Limit, Helmet       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE DATOS                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              MySQL Database                       │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │  │
│  │  │ Users  │ │Contacts│ │Equipmt │ │Services│    │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘    │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │  │
│  │  │Service │ │ Maint. │ │Clients │ │ Audit  │    │  │
│  │  │Request │ │  Logs  │ │        │ │  Log   │    │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Componentes Principales

### 1. Frontend (Capa de Presentación)

#### Página Principal (`index.html`)
- **Hero Section:** Presentación impactante con CTA
- **Servicios:** Grid de 6 servicios principales
- **Equipos:** Catálogo filtrable de equipos médicos
- **Nosotros:** Información de la empresa + estadísticas
- **Contacto:** Formulario funcional + información

#### Panel de Administración (`admin.html`)
- **Dashboard:** Estadísticas y resumen
- **Gestión de Contactos:** CRUD completo
- **Gestión de Equipos:** Catálogo administrable
- **Configuración:** Ajustes del sistema

#### Características Técnicas
```javascript
// Sistema de diseño con variables CSS
:root {
  --primary-color: #0066cc;
  --secondary-color: #00c896;
  --gradient-primary: linear-gradient(135deg, #0066cc, #00c896);
}

// JavaScript modular
- main.js: Lógica del sitio principal
- admin.js: Lógica del panel admin
```

---

### 2. Backend (Capa de Aplicación)

#### Servidor Express (`server.js`)
```javascript
const app = express();

// Middleware Stack
app.use(helmet());           // Seguridad
app.use(cors());             // CORS
app.use(bodyParser.json());  // Parser
app.use(rateLimit());        // Rate limiting

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/services', serviceRoutes);
```

#### Autenticación JWT
```javascript
// Login flow
POST /api/auth/login
  → Validar credenciales
  → Generar JWT token
  → Retornar token + user data

// Token verification
GET /api/auth/verify
  → Validar token
  → Retornar user data
```

#### Endpoints RESTful
```
Authentication:
  POST   /api/auth/login
  GET    /api/auth/verify
  POST   /api/auth/logout

Contacts:
  GET    /api/contacts
  GET    /api/contacts/:id
  POST   /api/contacts
  PATCH  /api/contacts/:id/status
  DELETE /api/contacts/:id
  GET    /api/contacts/stats/summary

Equipment:
  GET    /api/equipment
  GET    /api/equipment/:id
  POST   /api/equipment
  PUT    /api/equipment/:id
  DELETE /api/equipment/:id
  GET    /api/equipment/category/:category

Services:
  GET    /api/services
  GET    /api/services/:id
  POST   /api/services
  PUT    /api/services/:id
  DELETE /api/services/:id
```

---

### 3. Base de Datos (Capa de Datos)

#### Modelo de Datos

```sql
-- Usuarios del sistema
users (id, username, email, password_hash, role, is_active)
  ↓ (1:N)
contacts (id, name, email, service_type, status, assigned_to)
  ↓ (1:N)
service_requests (id, contact_id, equipment_id, status, priority)
  ↓ (1:N)
maintenance_logs (id, service_request_id, technician_id, description)

-- Catálogos
equipment (id, name, category, description, manufacturer)
services (id, name, slug, description, features)
clients (id, institution_name, contact_person, client_type)

-- Auditoría
audit_log (id, user_id, action, table_name, old_values, new_values)
```

#### Relaciones Clave
```
users → contacts (assigned_to)
users → service_requests (assigned_technician)
users → maintenance_logs (technician_id)
contacts → service_requests (contact_id)
equipment → service_requests (equipment_id)
services → service_requests (service_id)
```

#### Índices para Performance
```sql
-- Búsquedas frecuentes
idx_username, idx_email, idx_role
idx_status, idx_service_type, idx_created_at
idx_category, idx_name, idx_is_active

-- Queries complejas
idx_service_requests_status_priority
idx_contacts_status_created
idx_maintenance_logs_request_created
```

---

## 🔐 Seguridad

### Autenticación y Autorización
```javascript
// JWT Token
{
  id: user.id,
  username: user.username,
  role: user.role,
  exp: timestamp + 24h
}

// Password Hashing
bcrypt.hash(password, 10) // 10 rounds
```

### Protecciones Implementadas
- ✅ **SQL Injection:** Prepared statements
- ✅ **XSS:** Input sanitization
- ✅ **CSRF:** Token validation
- ✅ **Rate Limiting:** 100 req/15min
- ✅ **Helmet:** Security headers
- ✅ **CORS:** Configured origins

---

## 📈 Escalabilidad

### Horizontal Scaling
```
Load Balancer
    ↓
┌─────────┬─────────┬─────────┐
│ Node 1  │ Node 2  │ Node 3  │
└─────────┴─────────┴─────────┘
         ↓
    MySQL Master
         ↓
    MySQL Slaves
```

### Vertical Scaling
- **Database:** Índices optimizados, queries eficientes
- **API:** Connection pooling, caching
- **Frontend:** CDN, lazy loading, minificación

### Microservicios (Futuro)
```
API Gateway
    ↓
┌──────────┬──────────┬──────────┬──────────┐
│   Auth   │ Contacts │ Equipment│ Services │
│  Service │  Service │  Service │  Service │
└──────────┴──────────┴──────────┴──────────┘
```

---

## 🔄 Flujo de Datos

### Creación de Contacto
```
1. Usuario llena formulario
   ↓
2. Frontend valida datos
   ↓
3. POST /api/contacts
   ↓
4. Backend valida + sanitiza
   ↓
5. INSERT INTO contacts
   ↓
6. Retorna confirmación
   ↓
7. Frontend muestra mensaje
```

### Login de Administrador
```
1. Admin ingresa credenciales
   ↓
2. POST /api/auth/login
   ↓
3. Backend verifica password
   ↓
4. Genera JWT token
   ↓
5. Actualiza last_login
   ↓
6. Retorna token + user data
   ↓
7. Frontend guarda en sessionStorage
   ↓
8. Redirige a dashboard
```

---

## 🚀 Deployment

### Desarrollo
```bash
# Frontend
Live Server / http-server

# Backend
npm run dev (nodemon)

# Database
MySQL local
```

### Producción
```bash
# Frontend
Netlify / Vercel / GitHub Pages

# Backend
Heroku / DigitalOcean / AWS EC2
PM2 para process management

# Database
AWS RDS / DigitalOcean Managed DB
Backups automáticos diarios
```

---

## 📊 Monitoreo y Logs

### Logs del Sistema
```javascript
// Application logs
console.log('Info message')
console.error('Error message')

// Audit logs (database)
INSERT INTO audit_log (user_id, action, table_name, ...)
```

### Métricas Clave
- Requests por segundo
- Tiempo de respuesta promedio
- Tasa de errores
- Uso de base de datos
- Usuarios activos

---

## 🔮 Roadmap Futuro

### Fase 2 (Corto Plazo)
- [ ] Sistema de notificaciones email
- [ ] Dashboard con gráficos (Chart.js)
- [ ] Exportación de reportes PDF
- [ ] Sistema de tickets con QR

### Fase 3 (Mediano Plazo)
- [ ] App móvil (React Native)
- [ ] Integración WhatsApp Business
- [ ] Sistema de inventario
- [ ] Módulo de facturación

### Fase 4 (Largo Plazo)
- [ ] Machine Learning para predicción de fallas
- [ ] IoT para monitoreo remoto
- [ ] Blockchain para trazabilidad
- [ ] API pública para integraciones

---

## 📚 Tecnologías Utilizadas

### Frontend
- HTML5, CSS3, JavaScript ES6+
- Google Fonts (Inter)
- LocalStorage API

### Backend
- Node.js v16+
- Express.js v4
- JWT, Bcrypt
- MySQL2, Validator

### Database
- MySQL 8.0
- InnoDB engine
- UTF8MB4 charset

### DevOps
- Git para control de versiones
- npm para gestión de paquetes
- Nodemon para desarrollo

---

**Arquitectura diseñada para crecer con tu negocio** 🚀
