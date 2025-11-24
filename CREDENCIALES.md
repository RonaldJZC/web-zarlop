# 🔑 CREDENCIALES Y ACCESOS - ZARLOP S.A.C.

## 🌐 URLs del Sistema

### Frontend
- **Página Principal:** `file:///d:/antigravity/index.html`
- **Panel Admin:** `file:///d:/antigravity/admin.html`

### Backend (cuando esté corriendo)
- **API Base:** `http://localhost:3000`
- **Health Check:** `http://localhost:3000/api/health`
- **API Docs:** `http://localhost:3000`

---

## 👤 Credenciales de Administrador

### Panel Web Admin
```
URL: admin.html
Usuario: admin
Contraseña: zarlop2025
```

### Base de Datos MySQL
```
Host: localhost
Puerto: 3306
Base de datos: zarlop_db
Usuario: zarlop_admin (o root)
Contraseña: [la que configuraste en .env]
```

### JWT Secret
```
Secret: zarlop_jwt_secret_key_2025_change_in_production
Expiración: 24 horas
```

---

## 🔐 Niveles de Acceso

### Roles del Sistema

1. **Admin** (Administrador)
   - Acceso completo al sistema
   - Gestión de usuarios
   - Configuración del sistema
   - Acceso a todos los módulos

2. **Manager** (Gerente)
   - Gestión de contactos
   - Gestión de servicios
   - Reportes y estadísticas
   - Asignación de técnicos

3. **Technician** (Técnico)
   - Ver solicitudes asignadas
   - Actualizar logs de mantenimiento
   - Ver equipos
   - Acceso limitado

---

## 📊 Acceso a Datos

### LocalStorage (Frontend sin Backend)
```javascript
// Contactos guardados localmente
localStorage.getItem('contacts')

// Limpiar datos
localStorage.clear()
```

### Base de Datos (Con Backend)
```sql
-- Ver todos los contactos
SELECT * FROM contacts;

-- Ver usuarios
SELECT * FROM users;

-- Ver equipos
SELECT * FROM equipment;

-- Ver servicios
SELECT * FROM services;
```

---

## 🔧 Configuración de Seguridad

### Variables de Entorno (.env)
```env
# IMPORTANTE: Cambiar en producción
JWT_SECRET=zarlop_jwt_secret_key_2025_change_in_production
ADMIN_PASSWORD=zarlop2025

# Base de datos
DB_HOST=localhost
DB_USER=zarlop_admin
DB_PASSWORD=zarlop_secure_2025
DB_NAME=zarlop_db
```

### Recomendaciones de Seguridad

1. **Cambiar contraseñas por defecto**
   ```bash
   # En producción, usar contraseñas fuertes
   ADMIN_PASSWORD=Tu_Contraseña_Segura_123!@#
   JWT_SECRET=Un_Secret_Muy_Largo_Y_Aleatorio_456$%^
   ```

2. **Configurar HTTPS**
   ```javascript
   // En producción, forzar HTTPS
   app.use((req, res, next) => {
     if (req.header('x-forwarded-proto') !== 'https') {
       res.redirect(`https://${req.header('host')}${req.url}`);
     } else {
       next();
     }
   });
   ```

3. **Limitar orígenes CORS**
   ```javascript
   // Solo permitir tu dominio
   cors({
     origin: 'https://tudominio.com',
     credentials: true
   })
   ```

---

## 🚀 Acceso Rápido a Funcionalidades

### Frontend

#### Probar Formulario de Contacto
1. Ir a `index.html`
2. Scroll hasta sección "Contacto"
3. Llenar formulario
4. Click "Enviar Solicitud"
5. Verificar en localStorage o base de datos

#### Filtrar Equipos
1. Ir a sección "Equipos"
2. Click en categorías: Todos, Laboratorio, Emergencia, etc.
3. Ver equipos filtrados

#### Acceder al Admin
1. Abrir `admin.html`
2. Login con credenciales
3. Explorar dashboard

### Backend API

#### Test con cURL
```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"zarlop2025"}'

# Crear contacto
curl -X POST http://localhost:3000/api/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+51999999999",
    "service_type": "preventivo",
    "message": "Necesito mantenimiento"
  }'

# Listar equipos
curl http://localhost:3000/api/equipment
```

#### Test con Postman
1. Importar colección (crear archivo JSON con endpoints)
2. Configurar variables de entorno
3. Ejecutar requests

---

## 📱 Acceso Móvil (Futuro)

### App Móvil (Planificado)
```
iOS: App Store
Android: Google Play
Usuario: mismo que web
Contraseña: mismo que web
```

---

## 🔄 Recuperación de Acceso

### Olvidé mi contraseña (Admin)

**Opción 1: Resetear en base de datos**
```sql
-- Generar nuevo hash de contraseña
-- Usar bcrypt online: https://bcrypt-generator.com/
-- Contraseña: nueva_contraseña

UPDATE users 
SET password_hash = '$2a$10$...' 
WHERE username = 'admin';
```

**Opción 2: Recrear usuario**
```sql
-- Eliminar usuario existente
DELETE FROM users WHERE username = 'admin';

-- Ejecutar script de inicialización
npm run init-db
```

### Problemas de Conexión

**Base de datos no conecta:**
```bash
# Verificar que MySQL esté corriendo
# Windows:
services.msc → buscar MySQL

# Verificar puerto
netstat -an | findstr 3306
```

**API no responde:**
```bash
# Verificar que el servidor esté corriendo
# Ver logs en la terminal donde ejecutaste npm start

# Verificar puerto
netstat -an | findstr 3000
```

---

## 📋 Checklist de Seguridad

Antes de ir a producción:

- [ ] Cambiar contraseña de admin
- [ ] Cambiar JWT_SECRET
- [ ] Cambiar contraseña de base de datos
- [ ] Configurar HTTPS
- [ ] Limitar CORS a dominio específico
- [ ] Configurar rate limiting más estricto
- [ ] Habilitar logs de auditoría
- [ ] Configurar backups automáticos
- [ ] Configurar monitoreo de errores
- [ ] Revisar permisos de archivos

---

## 🆘 Soporte de Emergencia

### Contactos Técnicos
```
Desarrollador: [Tu nombre]
Email: [Tu email]
Teléfono: [Tu teléfono]
```

### Recursos de Ayuda
- Documentación: `README.md`
- Guía rápida: `INICIO_RAPIDO.md`
- Arquitectura: `ARQUITECTURA.md`
- Este archivo: `CREDENCIALES.md`

---

## ⚠️ IMPORTANTE

**NUNCA subir este archivo a repositorios públicos**

Este archivo contiene información sensible. Mantenerlo:
- ✅ En tu máquina local
- ✅ En documentación interna
- ✅ En gestores de contraseñas
- ❌ NO en GitHub público
- ❌ NO en emails sin cifrar
- ❌ NO compartir públicamente

---

**Última actualización:** 2025-11-23
**Versión del sistema:** 1.0.0
