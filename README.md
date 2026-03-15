# ZARLOP S.A.C. - Soluciones Electrónicas en Equipos Médicos

![Zarlop Logo](assets/logo.png)

## 📋 Descripción del Proyecto

Sistema web completo para **Zarlop S.A.C.**, empresa especializada en mantenimiento correctivo y preventivo de equipos médicos, repotenciación y modernización de tecnología médica.

## 🚀 Características Principales

### Frontend
- ✅ Diseño moderno y responsive inspirado en Philips Healthcare
- ✅ Interfaz premium con gradientes y animaciones
- ✅ Sistema de navegación fluido
- ✅ Formulario de contacto funcional
- ✅ Catálogo de equipos médicos con filtros
- ✅ Página de servicios dinámica con imágenes premium
- ✅ Libro de Reclamaciones virtual
- ✅ Optimizado para SEO

### Backend (API REST)
- ✅ Node.js + Express
- ✅ Base de datos MySQL
- ✅ Registro de solicitudes de contacto
- ✅ Gestión de catálogo de equipos
- ✅ Seguridad con Helmet
- ✅ CORS configurado

### Base de Datos
- ✅ Schema MySQL completo
- ✅ 8 tablas principales
- ✅ Relaciones bien definidas
- ✅ Índices para rendimiento
- ✅ Vistas para reportes
- ✅ Procedimientos almacenados
- ✅ Sistema de auditoría

## 📁 Estructura del Proyecto

```
d:/antigravity/
├── index.html              # Página principal
├── servicios.html          # Ingeniería Biomédica Detallada
├── equipos.html            # Catálogo de Equipos
├── nosotros.html           # Sobre la empresa
├── contacto.html           # Formulario de contacto
├── libro-reclamaciones.html # Libro de Reclamaciones
├── css/
│   └── styles.css          # Estilos globales y premium
├── js/
│   └── main.js             # Lógica interactiva
├── assets/
│   ├── logo.png            # Logo de Zarlop
│   └── images/             # Imágenes premium del sitio
├── backend/
│   ├── server.js           # Servidor Express
│   ├── package.json        # Dependencias
│   ├── .env.example        # Variables de entorno
│   ├── config/
│   │   └── database.js     # Configuración DB
│   ├── routes/
│   │   ├── contacts.js     # Rutas de contactos
│   │   ├── equipment.js    # Rutas de equipos
│   │   └── services.js     # Rutas de servicios
│   └── database/
│       └── schema.sql      # Schema de la base de datos
└── README.md               # Este archivo
```

## 🔧 Instalación y Configuración

### Requisitos Previos
- Node.js (v16 o superior)
- MySQL (v8.0 o superior)
- Navegador web moderno

### Paso 1: Configurar la Base de Datos

1. Instalar MySQL si no lo tienes:
   - Descargar de: https://dev.mysql.com/downloads/mysql/

2. Crear la base de datos:
```bash
mysql -u root -p < backend/database/schema.sql
```

3. Verificar que se creó correctamente:
```sql
USE zarlop_db;
SHOW TABLES;
```

### Paso 2: Configurar el Backend

1. Navegar a la carpeta backend:
```bash
cd backend
```

2. Instalar dependencias:
```bash
npm install
```

3. Crear archivo `.env` basado en `.env.example`:
```bash
copy .env.example .env
```

4. Editar `.env` con tus credenciales de MySQL:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=zarlop_db
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_mysql
```

5. Iniciar el servidor:
```bash
npm start
```

El servidor estará corriendo en: `http://localhost:3000`

### Paso 3: Configurar el Frontend

1. Abrir `index.html` con un servidor local:
   - Opción 1: Usar Live Server en VS Code
   - Opción 2: Usar Python: `python -m http.server 8000`
   - Opción 3: Usar Node.js: `npx http-server`

2. Acceder a la aplicación:
   - Frontend: `http://localhost:8000` (o el puerto que uses)
   - Backend API: `http://localhost:3000`

## 📡 API Endpoints

### Contactos
- `POST /api/contacts` - Crear una nueva solicitud de mantenimiento
- `GET /api/contacts` - Listar contactos (requiere config de seguridad)

### Equipos
- `GET /api/equipment` - Obtener catálogo de equipos
- `GET /api/equipment/category/:category` - Filtrar por categoría

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

1. **users** - Usuarios administradores
2. **contacts** - Solicitudes de contacto
3. **equipment** - Catálogo de equipos médicos
4. **services** - Servicios ofrecidos
5. **service_requests** - Solicitudes de servicio
6. **maintenance_logs** - Historial de mantenimiento
7. **clients** - Clientes regulares
8. **audit_log** - Registro de auditoría

## 🎨 Características de Diseño

- **Estética Premium**: Uso de gradientes profundos, sombras suaves y tipografía moderna (Inter).
- **Interactividad**: Animaciones de entrada (fade-up) y efectos hover en tarjetas.
- **Responsivo**: Adaptación completa a dispositivos móviles y tablets.

## 🔐 Seguridad

- ✅ Autenticación JWT
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Rate limiting en API
- ✅ Helmet.js para headers de seguridad
- ✅ Validación de inputs
- ✅ CORS configurado
- ✅ SQL injection protection
- ✅ XSS protection

## 📈 Escalabilidad

### Arquitectura Preparada Para:
- ✅ Múltiples usuarios administradores
- ✅ Sistema de roles (admin, manager, technician)
- ✅ Gestión de clientes corporativos
- ✅ Tracking de solicitudes de servicio
- ✅ Historial de mantenimiento
- ✅ Sistema de auditoría completo
- ✅ Reportes y estadísticas
- ✅ Integración con sistemas externos

### Mejoras Futuras Sugeridas:
- [ ] Sistema de notificaciones por email
- [ ] Dashboard con gráficos en tiempo real
- [ ] Módulo de inventario de repuestos
- [ ] Sistema de facturación
- [ ] App móvil (React Native)
- [ ] Integración con WhatsApp Business
- [ ] Sistema de tickets con QR
- [ ] Reportes PDF automatizados

## 🛠️ Tecnologías Utilizadas

### Frontend
- HTML5
- CSS3 (Variables CSS, Flexbox, Grid)
- JavaScript (ES6+)
- Google Fonts (Inter)

### Backend
- Node.js
- Express.js
- MySQL2
- JWT (jsonwebtoken)
- Bcrypt.js
- Helmet
- CORS
- Express Rate Limit
- Validator

## 📞 Soporte

Para soporte técnico o consultas:
- Email: info@zarlop.com
- Teléfono: +51 999 999 999
- Ubicación: Lima, Perú

## 📄 Licencia

© 2025 Zarlop S.A.C. - Todos los derechos reservados.

---

**Desarrollado con ❤️ para Zarlop S.A.C.**
