/**
 * Document Analyzer Service — HYBRID ENGINE
 * Combines Regex (exact data) + Gemini AI (contextual interpretation)
 * 
 * Regex extracts: quantities, dates, codes, series, tables, structured patterns
 * Gemini interprets: purpose, activities, requirements, summaries, context
 * 
 * Optimized for: TDR, EETT, Solicitudes de Cotización del sector salud peruano
 * Rule: NEVER invent data. If not found → null / "no detectado"
 */

const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const geminiService = require('./geminiService');

const uploadsPath = path.join(__dirname, '..', '..', 'sgd', 'uploads');

// ============================================================================
// TEXT EXTRACTION LAYER
// ============================================================================

function normalizeText(text) {
    if (!text) return '';
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

/** Read text from PDF file using pdf-parse v2 */
async function readPdfText(filePath) {
    try {
        if (!fs.existsSync(filePath)) return { text: '', pages: 0, isScanned: false };
        const buf = fs.readFileSync(filePath);
        const parser = new PDFParse({ data: buf });
        await parser.load();
        const result = await parser.getText();
        
        const text = (result.text || '').replace(/--\s*\d+\s+of\s+\d+\s*--/g, '').trim();
        const pageCount = result.total || 0;
        const isScanned = text.length < 50 && pageCount > 0;
        
        await parser.destroy();
        return { text, pages: pageCount, isScanned };
    } catch (err) {
        console.error(`[DOC-ANALYZER] Error PDF ${filePath}:`, err.message);
        return { text: '', pages: 0, isScanned: false, error: err.message };
    }
}

/** Read text from DOCX file */
async function readDocxText(filePath) {
    try {
        if (!fs.existsSync(filePath)) return { text: '' };
        const result = await mammoth.extractRawText({ path: filePath });
        return { text: (result.value || '').trim() };
    } catch (err) {
        console.error(`[DOC-ANALYZER] Error DOCX ${filePath}:`, err.message);
        return { text: '', error: err.message };
    }
}

/** Read text from any supported attachment */
async function readAttachment(attachment) {
    const filePath = path.join(uploadsPath, attachment.id);
    const type = (attachment.type || '').toLowerCase();
    const name = attachment.name || '';

    if (type === 'pdf' || name.toLowerCase().endsWith('.pdf')) {
        return await readPdfText(filePath);
    }
    if (type === 'word' || name.toLowerCase().endsWith('.docx')) {
        return await readDocxText(filePath);
    }
    // Skip excel, images, etc. for now
    return { text: '', skipped: true, reason: `Tipo no soportado: ${type}` };
}

// ============================================================================
// REGEX EXTRACTION ENGINE (exact, structured data)
// ============================================================================

const regexEngine = {
    /** Extract entity/institution name */
    entidad(text, senderName, senderEmail) {
        const patterns = [
            /(?:HOSPITAL\s+(?:DE\s+)?(?:EMERGENCIAS?\s+)?[\w\s]+(?:VILLA\s+EL\s+SALVADOR|HEVES|REBAGLIATI|ALMENARA|LOAYZA|CAYETANO|DOS DE MAYO|MARIA AUXILIADORA))/i,
            /(?:INSTITUTO\s+NACIONAL\s+(?:DE\s+)?[\w\s]+(?:NEOPLASICAS|SALUD|REHABILITACION|CARDIOVASCULAR|OFTALMOLOGIA))/i,
            /(?:DIRECCI[OÓ]N\s+(?:DE\s+)?REDES?\s+INTEGRAD[AO]S?\s+DE\s+SALUD[\w\s-]*)/i,
            /(?:DIRIS\s+[\w\s-]+)/i,
            /(?:ESSALUD|EsSalud)/i,
            /(?:MINSA|MINISTERIO\s+DE\s+SALUD)/i,
            /(?:RED\s+(?:DE\s+SALUD|ASISTENCIAL)\s+[\w\s]+)/i,
            /(?:UNIDAD\s+EJECUTORA\s+[\w\s]+)/i,
            /(?:GOBIERNO\s+REGIONAL\s+(?:DE\s+)?[\w\s]+)/i,
            /(?:MUNICIPALIDAD\s+(?:DISTRITAL|PROVINCIAL)\s+(?:DE\s+)?[\w\s]+)/i,
        ];
        for (const regex of patterns) {
            const match = text.match(regex);
            if (match) return { valor: match[0].replace(/\s+/g, ' ').trim(), confianza: 'alta', fuente: 'regex' };
        }
        // From sender domain
        if (senderEmail) {
            const domain = senderEmail.split('@')[1] || '';
            const domainMap = {
                'inen.sld.pe': 'Instituto Nacional de Enfermedades Neoplásicas (INEN)',
                'ins.gob.pe': 'Instituto Nacional de Salud (INS)',
                'minsa.gob.pe': 'Ministerio de Salud (MINSA)',
            };
            for (const [d, name] of Object.entries(domainMap)) {
                if (domain.includes(d)) return { valor: name, confianza: 'alta', fuente: 'dominio_email' };
            }
        }
        // Fallback pattern
        const fb = text.match(/comunicarle?s?\s+que\s+(?:el|la)\s+(.+?)\s+ha\s+iniciado/i);
        if (fb) return { valor: fb[1].replace(/\s+/g, ' ').trim(), confianza: 'media', fuente: 'regex' };
        return { valor: senderName || null, confianza: 'baja', fuente: 'sender' };
    },

    /** Extract quantities with units */
    cantidad(text) {
        const results = [];
        const patterns = [
            /(\d+)\s*(?:unidades?|und\.?|pzas?\.?|piezas?|juegos?|equipos?|kits?|cajas?|paquetes?|rollos?|galones?|litros?|frascos?|botellas?|cilindros?)/gi,
            /cantidad\s*[:\t]+\s*(\d+)/gi,
            /(\d+)\s*(?:servicios?)/gi,
        ];
        for (const regex of patterns) {
            let match;
            while ((match = regex.exec(text)) !== null) {
                results.push(match[0].trim());
            }
        }
        if (results.length > 0) {
            const unique = [...new Set(results)].slice(0, 8);
            return { valor: unique.join('; '), confianza: 'alta', fuente: 'regex' };
        }
        return { valor: null, confianza: 'baja', fuente: 'no_encontrado' };
    },

    /** Extract deadline/plazo */
    plazo(text) {
        const patterns = [
            /plazo\s+de\s+(?:entrega|ejecuci[oó]n)\s*[:\-–]?\s*(.+?)(?:\n|\.(?:\s|$))/i,
            /plazo\s+(?:m[aá]ximo\s+)?(?:de\s+respuesta)?\s*[:\-–]?\s*(.+?)(?:\n|$)/i,
            /hasta\s+(?:las?\s+)?(\d{1,2}\s+de\s+\w+\s+(?:del?\s+)?\d{4})/i,
            /fecha\s+l[ií]mite\s*[:\-–]?\s*(.+?)(?:\n|$)/i,
            /(\d+)\s*(?:d[ií]as?\s+(?:h[aá]biles?|calendarios?|naturales?))/i,
        ];
        for (const regex of patterns) {
            const match = text.match(regex);
            if (match) {
                return { valor: match[1].replace(/[*]/g, '').replace(/\s+/g, ' ').trim(), confianza: 'alta', fuente: 'regex' };
            }
        }
        return { valor: null, confianza: 'baja', fuente: 'no_encontrado' };
    },

    /** Extract warranty */
    garantia(text) {
        const patterns = [
            /garant[ií]a\s+(?:comercial\s+)?(?:m[ií]nima\s+)?(?:de\s+)?(\d+)\s*(meses?|a[ñn]os?|d[ií]as?)/i,
            /garant[ií]a\s*[:\-–]\s*(.+?)(?:\n|\.(?:\s|$))/i,
        ];
        for (const regex of patterns) {
            const match = text.match(regex);
            if (match) {
                const val = match[2] ? `${match[1]} ${match[2]}` : match[1].replace(/\s+/g, ' ').trim();
                return { valor: val, confianza: 'alta', fuente: 'regex' };
            }
        }
        return { valor: null, confianza: 'baja', fuente: 'no_encontrado' };
    },

    /** Extract payment conditions */
    formaPago(text) {
        const norm = normalizeText(text).toLowerCase();
        if (norm.includes('contado')) return { valor: 'Al contado', confianza: 'alta', fuente: 'regex' };
        if (norm.includes('contra entrega') || norm.includes('contraentrega')) return { valor: 'Contra entrega', confianza: 'alta', fuente: 'regex' };
        const credMatch = text.match(/cr[eé]dito\s*(?:a\s+)?(\d+)\s*d[ií]as?/i);
        if (credMatch) return { valor: `Crédito a ${credMatch[1]} días`, confianza: 'alta', fuente: 'regex' };
        if (norm.includes('30 dias') || norm.includes('30 días')) return { valor: 'Crédito a 30 días', confianza: 'media', fuente: 'regex' };
        return { valor: null, confianza: 'baja', fuente: 'no_encontrado' };
    },

    /** Extract penalties */
    penalidades(text) {
        const patterns = [
            /penalidad(?:es)?\s*[:\-–]\s*(.+?)(?:\n\n|\n\d+\.)/is,
            /(\d+(?:\.\d+)?%)\s+(?:por\s+)?(?:cada\s+)?d[ií]a\s+(?:de\s+)?(?:atraso|retraso|mora)/i,
            /penalidad\s+por\s+mora[:\s]+(.+?)(?:\n|$)/i,
        ];
        for (const regex of patterns) {
            const match = text.match(regex);
            if (match) {
                let val = (match[1] || match[0]).replace(/\s+/g, ' ').trim();
                if (val.length > 300) val = val.substring(0, 300) + '...';
                return { valor: val, confianza: 'alta', fuente: 'regex' };
            }
        }
        return { valor: null, confianza: 'baja', fuente: 'no_encontrado' };
    },

    /** Extract contact information */
    contacto(text, senderName, senderEmail) {
        const phoneMatch = text.match(/(?:tel[eé]f(?:ono)?\.?|cel(?:ular)?\.?|anex[o]?\.?)\s*[:.]?\s*(?:\(?\d{2,3}\)?\s*[-.]?\s*)?\d{3}\s*[-.]?\s*\d{3,4}/i);
        let contactStr = senderName || null;
        if (senderEmail) contactStr = (contactStr || '') + ` <${senderEmail}>`;
        if (phoneMatch) contactStr = (contactStr || '') + ` | ${phoneMatch[0].trim()}`;
        return { valor: contactStr, confianza: contactStr ? 'alta' : 'baja', fuente: 'regex' };
    },

    /** Detect request type */
    tipoSolicitud(text) {
        const norm = normalizeText(text).toLowerCase();
        if (norm.includes('mantenimiento preventivo')) return { valor: 'Mantenimiento Preventivo', confianza: 'alta', fuente: 'regex' };
        if (norm.includes('mantenimiento correctivo')) return { valor: 'Mantenimiento Correctivo', confianza: 'alta', fuente: 'regex' };
        if (norm.includes('calibracion') || norm.includes('calibración')) return { valor: 'Calibración', confianza: 'alta', fuente: 'regex' };
        if (norm.includes('alquiler')) return { valor: 'Alquiler de Equipo', confianza: 'alta', fuente: 'regex' };
        if (norm.includes('adquisicion') || norm.includes('adquisición')) return { valor: 'Adquisición de Bienes', confianza: 'alta', fuente: 'regex' };
        if (norm.includes('cotizacion') || norm.includes('cotización') || norm.includes('cotizar')) return { valor: 'Solicitud de Cotización', confianza: 'media', fuente: 'regex' };
        if (norm.includes('mantenimiento')) return { valor: 'Servicio de Mantenimiento', confianza: 'media', fuente: 'regex' };
        if (norm.includes('servicio')) return { valor: 'Contratación de Servicio', confianza: 'media', fuente: 'regex' };
        return { valor: 'Solicitud General', confianza: 'baja', fuente: 'regex' };
    },

    /** Extract marca/modelo from equipment descriptions */
    marcaModelo(text) {
        const patterns = [
            /marca\s*[:\-–]\s*(.+?)(?:\n|,\s*modelo)/i,
            /modelo\s*[:\-–]\s*(.+?)(?:\n|,\s*serie)/i,
            /marca\s+(\w[\w\s]*?)\s*[-–\/]\s*modelo\s+(\w[\w\s]*?)(?:\n|,|\s-)/i,
        ];
        let marca = null, modelo = null;
        const marcaM = text.match(/marca\s*[:\-–]\s*([^\n,]+)/i);
        const modeloM = text.match(/modelo\s*[:\-–]\s*([^\n,]+)/i);
        if (marcaM) marca = marcaM[1].trim();
        if (modeloM) modelo = modeloM[1].trim();
        if (marca || modelo) {
            const val = [marca, modelo].filter(Boolean).join(' - ');
            return { valor: val, confianza: 'alta', fuente: 'regex' };
        }
        return { valor: null, confianza: 'baja', fuente: 'no_encontrado' };
    },

    /** Extract serie/patrimonio */
    seriePatrimonial(text) {
        const serieMatch = text.match(/(?:n[uú]mero\s+de\s+)?serie\s*[:\-–]\s*([^\n,]+)/i);
        const codMatch = text.match(/c[oó]digo\s+patrimonial\s*[:\-–]\s*([^\n,]+)/i);
        let val = null;
        if (serieMatch) val = `Serie: ${serieMatch[1].trim()}`;
        if (codMatch) val = (val ? val + ' | ' : '') + `Patrimonial: ${codMatch[1].trim()}`;
        if (val) return { valor: val, confianza: 'alta', fuente: 'regex' };
        return { valor: null, confianza: 'baja', fuente: 'no_encontrado' };
    },

    /** Extract valor estimado / presupuesto */
    valorEstimado(text) {
        const patterns = [
            /valor\s+(?:estimado|referencial)\s*[:\-–]?\s*S\/\.?\s*([\d,]+(?:\.\d{2})?)/i,
            /presupuesto\s*[:\-–]?\s*S\/\.?\s*([\d,]+(?:\.\d{2})?)/i,
            /monto\s+(?:total|estimado)\s*[:\-–]?\s*S\/\.?\s*([\d,]+(?:\.\d{2})?)/i,
        ];
        for (const regex of patterns) {
            const match = text.match(regex);
            if (match) return { valor: `S/ ${match[1]}`, confianza: 'alta', fuente: 'regex' };
        }
        return { valor: null, confianza: 'baja', fuente: 'no_encontrado' };
    }
};

// ============================================================================
// MAIN ANALYSIS FUNCTION — HYBRID (Regex + Gemini)
// ============================================================================

/**
 * Deep analysis of an email and all its attachments
 * @param {object} email - Email object from mailDb.json
 * @param {object} options - { useGemini: true }
 * @returns {object} Full structured analysis
 */
async function analyzeDeep(email, options = { useGemini: true }) {
    const startTime = Date.now();
    const subject = email.subject || '';
    const body = email.body || '';
    const adjuntos = email.adjuntos || [];

    console.log(`[DOC-ANALYZER] ========================================`);
    console.log(`[DOC-ANALYZER] Iniciando análisis profundo: ${subject.substring(0, 80)}...`);

    // Step 1: Read all attachments
    const documentos = [];
    let allText = subject + '\n' + body;
    let scannedDocs = [];

    for (const adj of adjuntos) {
        console.log(`[DOC-ANALYZER] Leyendo: ${adj.name} (${adj.type})`);
        const result = await readAttachment(adj);
        
        const doc = {
            id: adj.id,
            name: adj.name,
            type: adj.type,
            textLength: (result.text || '').length,
            pages: result.pages || null,
            isScanned: result.isScanned || false,
            skipped: result.skipped || false,
            error: result.error || null
        };
        documentos.push(doc);

        if (result.text && result.text.length > 10) {
            allText += '\n\n--- DOCUMENTO: ' + adj.name + ' ---\n' + result.text;
        }
        if (result.isScanned) {
            scannedDocs.push(adj.name);
        }
    }

    console.log(`[DOC-ANALYZER] Texto total combinado: ${allText.length} caracteres`);

    // Step 2: Regex extraction (always runs)
    const regexResults = {
        entidad: regexEngine.entidad(allText, email.senderName, email.senderEmail),
        tipoSolicitud: regexEngine.tipoSolicitud(allText),
        cantidad: regexEngine.cantidad(allText),
        plazo: regexEngine.plazo(allText),
        garantia: regexEngine.garantia(allText),
        formaPago: regexEngine.formaPago(allText),
        penalidades: regexEngine.penalidades(allText),
        contacto: regexEngine.contacto(allText, email.senderName, email.senderEmail),
        marcaModelo: regexEngine.marcaModelo(allText),
        seriePatrimonial: regexEngine.seriePatrimonial(allText),
        valorEstimado: regexEngine.valorEstimado(allText),
    };

    // Step 3: Gemini AI analysis (if enabled)
    let geminiResults = null;
    let geminiError = null;

    if (options.useGemini) {
        console.log(`[DOC-ANALYZER] Enviando a Gemini AI para interpretación contextual...`);
        try {
            geminiResults = await geminiService.analyzeDocument(allText, regexResults.tipoSolicitud.valor);
        } catch (err) {
            geminiError = err.message;
            console.error(`[DOC-ANALYZER] Gemini falló, usando solo regex:`, err.message);
        }
    }

    // Step 4: Merge results (regex wins for exact data, Gemini for context)
    const merged = mergeResults(regexResults, geminiResults, subject);

    // Step 5: Calculate completeness semaphore
    const semaforo = calculateSemaphore(merged);

    const elapsed = Date.now() - startTime;
    console.log(`[DOC-ANALYZER] Análisis completado en ${elapsed}ms. Semáforo: ${semaforo.porcentaje}%`);
    console.log(`[DOC-ANALYZER] ========================================`);

    return {
        emailId: email.id,
        fechaAnalisis: new Date().toISOString(),
        tiempoMs: elapsed,
        motorUsado: options.useGemini && geminiResults && !geminiResults.error ? 'regex+gemini' : 'regex',
        geminiError: geminiError,
        documentosLeidos: documentos,
        documentosEscaneados: scannedDocs,
        ocrRequerido: scannedDocs.length > 0,
        tipoDocumento: merged.tipoDocumento || merged.tipoSolicitud?.valor || 'no_detectado',
        campos: merged,
        semaforo: semaforo,
        textoCompleto: allText.length,
    };
}

/**
 * Merge regex + gemini results. Priority:
 * - Regex wins for: cantidad, plazo, garantia, formaPago, penalidades, contacto, marcaModelo, serie, valor
 * - Gemini wins for: denominacion, objetoContratacion, finalidadPublica, actividades, resumen, perfil, entregables, requisitos
 * - Best confidence wins when both have data
 */
function mergeResults(regex, gemini, subject) {
    const campos = gemini && gemini.campos ? gemini.campos : {};

    const result = {
        // Context fields — Gemini preferred
        denominacion: campos.denominacion || { valor: cleanSubject(subject), confianza: 'media', fuente: 'subject' },
        objetoContratacion: campos.objetoContratacion || { valor: null, confianza: 'baja', fuente: 'no_detectado' },
        finalidadPublica: campos.finalidadPublica || { valor: null, confianza: 'baja', fuente: 'no_detectado' },
        areaUsuaria: campos.areaUsuaria || { valor: null, confianza: 'baja', fuente: 'no_detectado' },
        actividadesRequeridas: campos.actividadesRequeridas || { valor: null, confianza: 'baja', fuente: 'no_detectado' },
        repuestosInsumos: campos.repuestosInsumos || { valor: null, confianza: 'baja', fuente: 'no_detectado' },
        perfilTecnico: campos.perfilTecnico || { valor: null, confianza: 'baja', fuente: 'no_detectado' },
        entregables: campos.entregables || { valor: null, confianza: 'baja', fuente: 'no_detectado' },
        requisitosProveedor: campos.requisitosProveedor || { valor: null, confianza: 'baja', fuente: 'no_detectado' },
        resumenEjecutivo: campos.resumenEjecutivo || { valor: null, confianza: 'baja', fuente: 'no_detectado' },

        // Exact fields — Regex preferred (override Gemini if regex found something)
        entidad: pickBest(regex.entidad, campos.entidad, 'regex'),
        tipoSolicitud: regex.tipoSolicitud,
        tipoDocumento: gemini?.tipoDocumento || regex.tipoSolicitud?.valor || 'no_detectado',
        cantidad: pickBest(regex.cantidad, campos.cantidad, 'regex'),
        marcaModelo: pickBest(regex.marcaModelo, campos.marcaModelo, 'regex'),
        seriePatrimonial: pickBest(regex.seriePatrimonial, campos.seriePatrimonial, 'regex'),
        plazo: pickBest(regex.plazo, campos.plazoEjecucion, 'regex'),
        garantia: pickBest(regex.garantia, campos.garantia, 'regex'),
        formaPago: pickBest(regex.formaPago, campos.formaPago, 'regex'),
        penalidades: pickBest(regex.penalidades, campos.penalidades, 'regex'),
        contacto: regex.contacto,
        valorEstimado: regex.valorEstimado,
        lugarPrestacion: campos.lugarPrestacion || { valor: null, confianza: 'baja', fuente: 'no_detectado' },
    };

    return result;
}

/** Pick the best value between regex and gemini */
function pickBest(regexVal, geminiVal, prefer = 'regex') {
    const r = regexVal || { valor: null, confianza: 'baja' };
    const g = geminiVal || { valor: null, confianza: 'baja' };

    // If regex found a value, prefer it for exact data
    if (r.valor && r.valor !== null) {
        return { ...r, fuente: r.fuente || 'regex' };
    }
    // If only gemini has a value
    if (g.valor && g.valor !== null) {
        return { valor: g.valor, confianza: g.confianza || 'media', fuente: 'gemini' };
    }
    // Neither found
    return { valor: null, confianza: 'baja', fuente: 'no_detectado' };
}

function cleanSubject(subject) {
    return subject
        .replace(/^(RE:|FW:|Fwd:|RV:)\s*/gi, '')
        .replace(/^(COTIZAR\s+URGENTE[-–]?\s*)/i, '')
        .replace(/^SOLICITUD?\s+DE\s+COTIZACI[OÓ]N:?\s*/i, '')
        .replace(/^REQUERIMIENTO\s*(URGENTE)?\s*[-–]?\s*(DE)?\s*/i, '')
        .trim();
}

/**
 * Calculate completion semaphore
 */
function calculateSemaphore(campos) {
    const critical = ['denominacion', 'entidad', 'tipoSolicitud', 'cantidad', 'plazo'];
    const important = ['objetoContratacion', 'garantia', 'formaPago', 'contacto', 'marcaModelo'];
    const optional = ['finalidadPublica', 'areaUsuaria', 'actividadesRequeridas', 'repuestosInsumos',
        'perfilTecnico', 'entregables', 'requisitosProveedor', 'lugarPrestacion', 'seriePatrimonial',
        'valorEstimado', 'penalidades', 'resumenEjecutivo'];

    let detected = 0, total = 0, warnings = 0, missing = 0;
    const detalles = {};

    function evaluate(keys, weight) {
        for (const key of keys) {
            total++;
            const campo = campos[key];
            if (!campo || campo.valor === null || campo.valor === undefined) {
                missing++;
                detalles[key] = 'faltante';
            } else if (campo.confianza === 'baja') {
                warnings++;
                detalles[key] = 'dudoso';
            } else {
                detected++;
                detalles[key] = 'detectado';
            }
        }
    }

    evaluate(critical, 3);
    evaluate(important, 2);
    evaluate(optional, 1);

    const porcentaje = total > 0 ? Math.round((detected / total) * 100) : 0;
    let estado = 'incompleto';
    if (porcentaje >= 80) estado = 'listo';
    else if (porcentaje >= 50) estado = 'revisar';

    return { estado, porcentaje, detectados: detected, dudosos: warnings, faltantes: missing, total, detalles };
}

module.exports = { analyzeDeep };
