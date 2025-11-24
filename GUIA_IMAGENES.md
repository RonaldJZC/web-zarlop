# 📸 GUÍA DE IMÁGENES - ZARLOP S.A.C.

## 📁 Estructura de Carpetas de Imágenes

```
assets/
├── logo.png                    ← Logo de Zarlop (YA ESTÁ)
└── images/
    ├── hero/
    │   └── hero-background.jpg ← Imagen de fondo del Hero (MUESTRA)
    ├── nosotros/
    │   └── team.jpg            ← Foto del equipo (MUESTRA)
    └── equipos/
        ├── autoclave.jpg       ← Foto de autoclave (MUESTRA)
        ├── analizador.jpg      ← Foto de analizador (MUESTRA)
        ├── centrifuga.jpg      ← Foto de centrífuga (MUESTRA)
        └── microscopio.jpg     ← Foto de microscopio (MUESTRA)
```

---

## 🎯 Cómo Reemplazar las Imágenes de Muestra

### Paso 1: Prepara tus Fotos Reales

1. **Toma fotos de tus equipos** con buena iluminación
2. **Renombra tus fotos** con los nombres exactos que se muestran arriba
3. **Tamaño recomendado:**
   - Hero: 1920x1080px (horizontal)
   - Equipo: 800x600px
   - Equipos: 600x600px (cuadradas preferiblemente)

### Paso 2: Reemplaza las Imágenes

**Opción A - Arrastrar y Soltar:**
1. Abre la carpeta: `d:\antigravity\assets\images\`
2. Navega a la subcarpeta correspondiente
3. Arrastra tu foto y **reemplaza** la imagen existente
4. **IMPORTANTE:** Usa el mismo nombre de archivo

**Opción B - Copiar y Pegar:**
1. Copia tu foto
2. Pega en la carpeta correspondiente
3. Renombra con el nombre exacto
4. Confirma reemplazar si pregunta

---

## 📋 Lista de Imágenes a Reemplazar

### 🎨 Hero (Portada Principal)

**Archivo:** `assets/images/hero/hero-background.jpg`

**Qué fotografiar:**
- Laboratorio médico con equipos
- Técnicos trabajando en mantenimiento
- Vista general de instalaciones
- Equipos médicos modernos

**Especificaciones:**
- Tamaño: 1920x1080px (Full HD)
- Formato: JPG
- Orientación: Horizontal
- Calidad: Alta resolución

---

### 👥 Nosotros (Equipo)

**Archivo:** `assets/images/nosotros/team.jpg`

**Qué fotografiar:**
- Foto del equipo de Zarlop
- Ing. Ronald Zarpan, Ing. Nilton López, Ing. Alfredo Huamán
- Equipo trabajando en laboratorio
- Foto profesional del equipo técnico

**Especificaciones:**
- Tamaño: 800x600px
- Formato: JPG
- Orientación: Horizontal
- Calidad: Alta

---

### 🔬 Equipos Médicos

#### 1. Autoclave
**Archivo:** `assets/images/equipos/autoclave.jpg`

**Qué fotografiar:**
- Autoclave Systec, Waldner, BMT o similar
- Vista frontal del equipo
- Fondo limpio preferiblemente

**Especificaciones:**
- Tamaño: 600x600px
- Formato: JPG
- Orientación: Cuadrada

---

#### 2. Analizador Bioquímico
**Archivo:** `assets/images/equipos/analizador.jpg`

**Qué fotografiar:**
- Analizador bioquímico
- Equipo de análisis clínico
- Vista clara del equipo

**Especificaciones:**
- Tamaño: 600x600px
- Formato: JPG
- Orientación: Cuadrada

---

#### 3. Centrífuga
**Archivo:** `assets/images/equipos/centrifuga.jpg`

**Qué fotografiar:**
- Centrífuga de laboratorio
- Vista frontal o superior
- Equipo limpio

**Especificaciones:**
- Tamaño: 600x600px
- Formato: JPG
- Orientación: Cuadrada

---

#### 4. Microscopio
**Archivo:** `assets/images/equipos/microscopio.jpg`

**Qué fotografiar:**
- Microscopio de laboratorio
- Vista lateral o frontal
- Buena iluminación

**Especificaciones:**
- Tamaño: 600x600px
- Formato: JPG
- Orientación: Cuadrada

---

## 🎨 Consejos para Mejores Fotos

### Iluminación
- ✅ Usa luz natural o luz blanca
- ✅ Evita sombras fuertes
- ✅ Fotografía en horario de buena luz

### Composición
- ✅ Centra el equipo en la foto
- ✅ Usa fondo limpio y ordenado
- ✅ Muestra el equipo completo

### Calidad
- ✅ Usa la cámara de mejor calidad disponible
- ✅ Limpia la lente antes de fotografiar
- ✅ Mantén la cámara estable

### Edición Básica (Opcional)
- Ajusta brillo y contraste
- Recorta para centrar el equipo
- Redimensiona al tamaño recomendado

---

## 🔄 Agregar Más Equipos

Si quieres agregar más fotos de equipos:

1. **Guarda la foto en:** `assets/images/equipos/`
2. **Nombra el archivo:** `nombre-equipo.jpg` (ejemplo: `incubadora.jpg`)
3. **Edita el archivo:** `js/main.js`
4. **Busca la sección:** `const equipmentData`
5. **Agrega un nuevo objeto:**

```javascript
{
    id: 13,
    name: 'Incubadora',
    category: 'laboratorio',
    description: 'Incubadora de laboratorio',
    image: 'assets/images/equipos/incubadora.jpg'
}
```

---

## 📱 Optimización de Imágenes

### Herramientas Recomendadas (Gratis):

1. **TinyPNG** (https://tinypng.com/)
   - Comprime imágenes sin perder calidad
   - Reduce el tamaño del archivo

2. **GIMP** (https://www.gimp.org/)
   - Editor de imágenes gratuito
   - Redimensiona y edita fotos

3. **Paint.NET** (Windows)
   - Editor simple y efectivo
   - Redimensiona fácilmente

### Cómo Optimizar:

1. Abre tu foto en el editor
2. Redimensiona al tamaño recomendado
3. Guarda como JPG con calidad 80-90%
4. Comprime con TinyPNG si es muy pesada

---

## ✅ Checklist de Reemplazo

Marca cuando hayas reemplazado cada imagen:

- [ ] `hero-background.jpg` - Imagen de portada
- [ ] `team.jpg` - Foto del equipo
- [ ] `autoclave.jpg` - Foto de autoclave
- [ ] `analizador.jpg` - Foto de analizador
- [ ] `centrifuga.jpg` - Foto de centrífuga
- [ ] `microscopio.jpg` - Foto de microscopio

---

## 🆘 Solución de Problemas

### La imagen no se ve en la página

**Solución:**
1. Verifica que el nombre del archivo sea exacto
2. Asegúrate de que esté en la carpeta correcta
3. Refresca la página (Ctrl + F5)
4. Verifica que el formato sea JPG o PNG

### La imagen se ve pixelada

**Solución:**
1. Usa una foto de mayor resolución
2. No agrandes fotos pequeñas
3. Toma una nueva foto con mejor cámara

### La imagen es muy pesada

**Solución:**
1. Comprime con TinyPNG
2. Reduce la resolución si es muy grande
3. Guarda como JPG en lugar de PNG

---

## 📞 Contacto para Soporte

Si necesitas ayuda con las imágenes:
- Revisa este documento
- Verifica los nombres de archivo
- Asegúrate de usar los formatos correctos

---

**Última actualización:** 23 de Noviembre, 2025
**Versión:** 1.0.0
