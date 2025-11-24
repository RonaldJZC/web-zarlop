# 🚀 GUÍA DE INICIO RÁPIDO - ZARLOP S.A.C.

## Opción 1: Solo Frontend (Sin Base de Datos)

Si solo quieres ver la página web sin backend:

1. **Abrir el proyecto:**
   - Navega a la carpeta `d:\antigravity`
   - Abre `index.html` con tu navegador
   - O usa Live Server en VS Code

2. **Probar el sitio:**
   - Página principal: `index.html`
   - Panel admin: `admin.html` (usuario: admin, contraseña: zarlop2025)
   - Los contactos se guardan en localStorage del navegador

✅ **Listo!** El sitio funciona sin necesidad de instalar nada más.

---

## Opción 2: Proyecto Completo (Frontend + Backend + Base de Datos)

### Paso 1: Instalar Requisitos

1. **Node.js** (si no lo tienes):
   - Descargar: https://nodejs.org/
   - Versión recomendada: LTS (Long Term Support)
   - Verificar instalación: `node --version`

2. **MySQL** (si no lo tienes):
   - Descargar: https://dev.mysql.com/downloads/mysql/
   - Durante instalación, recuerda tu contraseña de root
   - Verificar instalación: `mysql --version`

### Paso 2: Configurar Base de Datos

1. **Abrir terminal en la carpeta backend:**
   ```bash
   cd d:\antigravity\backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   ```bash
   copy .env.example .env
   ```

4. **Editar el archivo `.env`:**
   - Abre `backend\.env` con un editor de texto
   - Cambia estos valores según tu instalación de MySQL:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_contraseña_mysql
   ```

5. **Inicializar la base de datos:**
   ```bash
   npm run init-db
   ```

   Esto creará automáticamente:
   - La base de datos `zarlop_db`
   - Todas las tablas necesarias
   - Usuario administrador
   - Datos de ejemplo

### Paso 3: Iniciar el Servidor

```bash
npm start
```

Verás un mensaje como:
```
╔═══════════════════════════════════════════╗
║   ZARLOP S.A.C. - API SERVER              ║
║   Soluciones Electrónicas                 ║
╚═══════════════════════════════════════════╝

🚀 Server running on port 3000
```

### Paso 4: Abrir el Frontend

1. **Opción A - Live Server (VS Code):**
   - Instala la extensión "Live Server"
   - Click derecho en `index.html`
   - Selecciona "Open with Live Server"

2. **Opción B - Python:**
   ```bash
   cd d:\antigravity
   python -m http.server 8000
   ```
   Luego abre: http://localhost:8000

3. **Opción C - Node.js:**
   ```bash
   cd d:\antigravity
   npx http-server
   ```

### Paso 5: Probar el Sistema

1. **Página principal:** http://localhost:8000
2. **Panel admin:** http://localhost:8000/admin.html
3. **API:** http://localhost:3000/api/health

**Credenciales de administrador:**
- Usuario: `admin`
- Contraseña: `zarlop2025`

---

## 🎯 Verificación Rápida

### ✅ Checklist de Funcionamiento

- [ ] La página principal carga correctamente
- [ ] El formulario de contacto funciona
- [ ] Los filtros de equipos funcionan
- [ ] El panel admin permite login
- [ ] El backend responde en http://localhost:3000/api/health
- [ ] Los contactos se guardan en la base de datos

---

## 🔧 Solución de Problemas Comunes

### Error: "npm no se reconoce"
**Solución:** Instala Node.js desde https://nodejs.org/

### Error: "mysql no se reconoce"
**Solución:** Instala MySQL desde https://dev.mysql.com/downloads/mysql/

### Error: "Access denied for user"
**Solución:** Verifica que la contraseña en `.env` sea correcta

### Error: "Cannot connect to MySQL"
**Solución:** 
1. Verifica que MySQL esté corriendo
2. Verifica el puerto (por defecto 3306)
3. Verifica el host (por defecto localhost)

### El formulario no envía datos al backend
**Solución:** 
1. Verifica que el backend esté corriendo
2. Abre la consola del navegador (F12) para ver errores
3. Verifica que CORS esté configurado correctamente

---

## 📚 Próximos Pasos

Una vez que todo funcione:

1. **Personalizar contenido:**
   - Edita textos en `index.html`
   - Cambia colores en `css/styles.css`
   - Agrega tus propios equipos en el admin

2. **Configurar email:**
   - Edita las variables SMTP en `.env`
   - Implementa envío de emails en el backend

3. **Desplegar en producción:**
   - Frontend: Netlify, Vercel, GitHub Pages
   - Backend: Heroku, DigitalOcean, AWS
   - Base de datos: AWS RDS, DigitalOcean Managed Database

---

## 💡 Consejos

- **Desarrollo:** Usa `npm run dev` para auto-reiniciar el servidor
- **Seguridad:** Cambia las contraseñas por defecto en producción
- **Backup:** Haz respaldo regular de la base de datos
- **Logs:** Revisa los logs para debugging

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa el archivo `README.md` completo
2. Verifica los logs del servidor
3. Revisa la consola del navegador (F12)

---

**¡Éxito con tu proyecto Zarlop! 🎉**
