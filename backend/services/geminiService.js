/**
 * Gemini AI Service
 * Wrapper for Google Gemini API - contextual document analysis
 * Optimized for Peruvian medical procurement (TDR/EETT) documents
 * 
 * ROLE: Gemini handles INTERPRETATION (context, meaning, summaries)
 * Regex handles EXTRACTION (quantities, dates, codes, tables)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// API Key - loaded from environment or hardcoded for development
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBC4aTzHV7JRPMzXbPKI_UL72FLwV_rFtI';

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];
let currentModelIdx = 0;
let genAI = null;
let model = null;

function initGemini() {
    if (!genAI) {
        genAI = new GoogleGenerativeAI(API_KEY);
    }
    const modelName = MODELS[currentModelIdx];
    model = genAI.getGenerativeModel({ model: modelName });
    console.log(`[GEMINI] Usando modelo: ${modelName}`);
    return model;
}

/**
 * Analyze a document text using Gemini for contextual interpretation
 * Includes automatic retry with backoff and model fallback
 */
async function analyzeDocument(text, documentType = 'unknown') {
    if (!text || text.trim().length < 30) {
        console.warn(`[GEMINI] Texto insuficiente para análisis (${(text || '').length} chars). Saltando Gemini.`);
        return {
            error: true,
            errorMessage: 'Texto insuficiente para análisis con IA',
            tipoDocumento: 'no_detectado',
            campos: {}
        };
    }

    console.log(`[GEMINI] Preparando análisis. Texto: ${text.length} chars, Tipo doc: ${documentType}`);
    const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '\n[... texto truncado ...]' : text;
    const prompt = buildPrompt(truncatedText, documentType);

    // Try each model with retry
    for (let mi = 0; mi < MODELS.length; mi++) {
        currentModelIdx = mi;
        const geminiModel = initGemini();

        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                console.log(`[GEMINI] Enviando a ${MODELS[mi]} (intento ${attempt + 1})...`);
                const result = await geminiModel.generateContent(prompt);
                const response = await result.response;
                const responseText = response.text();
                console.log(`[GEMINI] Respuesta recibida: ${responseText.length} chars`);
                const parsed = parseGeminiResponse(responseText);
                console.log(`[GEMINI] ✅ Análisis completado con ${MODELS[mi]}. Tipo: ${parsed.tipoDocumento || 'N/A'}, Campos: ${Object.keys(parsed.campos || {}).length}`);
                return parsed;
            } catch (error) {
                const isRateLimit = error.message && error.message.includes('429');
                const isNotFound = error.message && error.message.includes('404');
                
                if (isNotFound) {
                    console.warn(`[GEMINI] Modelo ${MODELS[mi]} no disponible, probando siguiente...`);
                    break; // try next model
                }
                
                if (isRateLimit && attempt === 0) {
                    // Extract retry delay from error
                    const retryMatch = error.message.match(/retry in (\d+)/i);
                    const waitSec = retryMatch ? parseInt(retryMatch[1]) + 2 : 20;
                    console.warn(`[GEMINI] Rate limit en ${MODELS[mi]}, esperando ${waitSec}s...`);
                    await new Promise(r => setTimeout(r, waitSec * 1000));
                    continue; // retry same model
                }

                console.error(`[GEMINI] Error con ${MODELS[mi]} (intento ${attempt + 1}):`, error.message);
                if (mi === MODELS.length - 1) {
                    // All models exhausted
                    return {
                        error: true,
                        errorMessage: `Todos los modelos agotados: ${error.message}`,
                        tipoDocumento: 'no_detectado',
                        campos: {}
                    };
                }
                break; // try next model
            }
        }
    }

    return { error: true, errorMessage: 'No se pudo conectar con ningún modelo', tipoDocumento: 'no_detectado', campos: {} };
}

/**
 * Build the analysis prompt for Gemini
 */
function buildPrompt(text, documentType) {
    return `Eres un analista experto en documentos de contrataciones del Estado Peruano, especializado en el sector salud (hospitales, ESSALUD, MINSA, institutos nacionales).

INSTRUCCIONES ESTRICTAS:
1. Analiza SOLO el texto proporcionado. NO inventes datos.
2. Si un campo no se puede determinar del texto, usa null.
3. Responde ÚNICAMENTE con un JSON válido, sin markdown ni texto adicional.
4. Cada campo debe incluir: "valor" (string o null), "confianza" ("alta", "media", "baja")
5. La confianza debe reflejar qué tan seguro estás de la extracción:
   - "alta": dato explícito y claro en el texto
   - "media": dato inferido o parcialmente visible
   - "baja": dato dudoso o muy ambiguo

DOCUMENTO A ANALIZAR:
"""
${text}
"""

Responde con este JSON exacto:
{
  "tipoDocumento": "adquisicion | mantenimiento_preventivo | mantenimiento_correctivo | calibracion | alquiler | mixto",
  "campos": {
    "denominacion": { "valor": "nombre completo del bien o servicio requerido", "confianza": "alta|media|baja" },
    "entidad": { "valor": "nombre de la entidad contratante", "confianza": "alta|media|baja" },
    "objetoContratacion": { "valor": "descripción del objeto de la contratación (qué se necesita y para qué)", "confianza": "alta|media|baja" },
    "finalidadPublica": { "valor": "para qué sirve este requerimiento (impacto en salud pública)", "confianza": "alta|media|baja" },
    "areaUsuaria": { "valor": "departamento o área que solicita", "confianza": "alta|media|baja" },
    "marcaModelo": { "valor": "marca y modelo del equipo (si aplica)", "confianza": "alta|media|baja" },
    "seriePatrimonial": { "valor": "número de serie o código patrimonial (si aplica)", "confianza": "alta|media|baja" },
    "actividadesRequeridas": { "valor": "lista de actividades o tareas solicitadas", "confianza": "alta|media|baja" },
    "repuestosInsumos": { "valor": "repuestos o insumos mencionados", "confianza": "alta|media|baja" },
    "perfilTecnico": { "valor": "requisitos del personal técnico (títulos, experiencia)", "confianza": "alta|media|baja" },
    "lugarPrestacion": { "valor": "dirección o lugar de entrega/servicio", "confianza": "alta|media|baja" },
    "plazoEjecucion": { "valor": "plazo de entrega o ejecución del servicio", "confianza": "alta|media|baja" },
    "garantia": { "valor": "período de garantía exigido", "confianza": "alta|media|baja" },
    "formaPago": { "valor": "condiciones de pago", "confianza": "alta|media|baja" },
    "penalidades": { "valor": "penalidades por incumplimiento", "confianza": "alta|media|baja" },
    "entregables": { "valor": "documentos o productos a entregar (informes, actas, certificados)", "confianza": "alta|media|baja" },
    "requisitosProveedor": { "valor": "certificaciones o documentos exigidos al proveedor", "confianza": "alta|media|baja" },
    "resumenEjecutivo": { "valor": "resumen en 2-3 oraciones de todo el requerimiento", "confianza": "alta" }
  }
}`;
}

/**
 * Parse Gemini response - extract JSON safely
 */
function parseGeminiResponse(responseText) {
    try {
        // Try to extract JSON from the response
        let jsonStr = responseText.trim();

        // Remove markdown code blocks if present
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        const parsed = JSON.parse(jsonStr);

        // Validate structure
        if (!parsed.campos) {
            parsed.campos = {};
        }
        if (!parsed.tipoDocumento) {
            parsed.tipoDocumento = 'no_detectado';
        }

        return parsed;

    } catch (parseError) {
        console.error('[GEMINI] Error parseando respuesta JSON:', parseError.message);
        console.error('[GEMINI] Respuesta cruda:', responseText.substring(0, 500));
        
        return {
            error: true,
            errorMessage: 'No se pudo parsear la respuesta de Gemini',
            tipoDocumento: 'no_detectado',
            campos: {},
            rawResponse: responseText.substring(0, 1000)
        };
    }
}

/**
 * Quick classification only (faster, less tokens)
 */
async function classifyDocument(text) {
    try {
        const geminiModel = initGemini();
        const shortText = text.substring(0, 3000);

        const prompt = `Clasifica este documento peruano de contrataciones públicas del sector salud.
Responde SOLO con un JSON: {"tipo": "adquisicion|mantenimiento_preventivo|mantenimiento_correctivo|calibracion|alquiler|mixto|desconocido", "confianza": "alta|media|baja", "equipoPrincipal": "nombre del equipo o bien principal"}

Texto:
"""
${shortText}
"""`;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        return parseGeminiResponse(response.text());
    } catch (error) {
        console.error('[GEMINI] Error en clasificación rápida:', error.message);
        return { tipo: 'desconocido', confianza: 'baja', equipoPrincipal: null };
    }
}

module.exports = {
    analyzeDocument,
    classifyDocument,
    initGemini
};
