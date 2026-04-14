/**
 * Email Analyzer Service
 * Extracts structured commercial data from procurement emails
 * Optimized for Peruvian government solicitation (cotización) formats 
 * Now reads PDF attachments for deep extraction of TDR/EETT data
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const uploadsPath = path.join(__dirname, '..', '..', 'sgd', 'uploads');

function normalizeText(text) {
    if (!text) return '';
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Read text from a PDF file
 */
async function readPdfText(filePath) {
    try {
        if (!fs.existsSync(filePath)) return '';
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text || '';
    } catch (err) {
        console.error(`[PDF] Error reading ${filePath}:`, err.message);
        return '';
    }
}

/**
 * Analyze an email and extract structured fields
 * Reads PDF attachments for deeper extraction
 * @param {object} email - email object with subject, body, senderName, senderEmail, adjuntos
 * @returns {object} structured analysis result
 */
async function analyzeEmail(email) {
    const subject = email.subject || '';
    const body = email.body || '';

    // Read all PDF attachments
    let pdfTexts = [];
    if (email.adjuntos && email.adjuntos.length > 0) {
        for (const adj of email.adjuntos) {
            if (adj.type === 'pdf' && adj.id) {
                const pdfPath = path.join(uploadsPath, adj.id);
                console.log(`[ANALYZE] Leyendo PDF: ${adj.name}`);
                const text = await readPdfText(pdfPath);
                if (text.length > 10) {
                    pdfTexts.push({ name: adj.name, text });
                }
            }
        }
    }

    // Combine all text sources: email body + all PDF content
    const allPdfText = pdfTexts.map(p => p.text).join('\n\n');
    const combined = subject + '\n' + body + '\n' + allPdfText;
    const normalizedCombined = normalizeText(combined).toLowerCase();

    // Use PDF text preferentially for extraction (richer data)
    const primaryText = allPdfText.length > 50 ? allPdfText : body;

    const result = {
        entidad: extractEntidad(combined, email.senderName, email.senderEmail),
        objeto: extractObjeto(subject, primaryText),
        equipos: extractEquipos(subject, primaryText),
        cantidad: extractCantidad(primaryText),
        caracteristicas: extractCaracteristicas(primaryText),
        plazo: extractPlazo(primaryText),
        garantia: extractGarantia(primaryText),
        pago: extractCondicionPago(primaryText),
        lugarEntrega: extractLugarEntrega(primaryText),
        penalidad: extractPenalidad(primaryText),
        contacto: extractContacto(primaryText, email.senderName, email.senderEmail),
        tipoSolicitud: detectTipoSolicitud(normalizedCombined),
        resumen: generateResumen(subject, body),
        fuenteDatos: allPdfText.length > 50 ? `Extraído de ${pdfTexts.length} PDF(s) adjuntos` : 'Extraído del cuerpo del correo'
    };

    return result;
}

// ===========================================================================
// EXTRACTION FUNCTIONS
// ===========================================================================

function extractEntidad(text, senderName, senderEmail) {
    // Common Peruvian government entity patterns
    const patterns = [
        /(?:HOSPITAL\s+(?:DE\s+)?(?:EMERGENCIAS?\s+)?[\w\s]+(?:VILLA\s+EL\s+SALVADOR|HEVES|REBAGLIATI|ALMENARA|LOAYZA|CAYETANO|DOS DE MAYO|MARIA AUXILIADORA|ARZOBISPO LOAYZA))/i,
        /(?:INSTITUTO\s+NACIONAL\s+(?:DE\s+)?[\w\s]+(?:NEOPLASICAS|SALUD|REHABILITACION|CARDIOVASCULAR|OFTALMOLOGIA))/i,
        /(?:ESSALUD|EsSalud)/i,
        /(?:MINSA|MINISTERIO\s+DE\s+SALUD)/i,
        /(?:RED\s+(?:DE\s+SALUD|ASISTENCIAL)\s+[\w\s]+)/i,
        /(?:DIRECCION\s+(?:REGIONAL|DE\s+SALUD)\s+[\w\s]+)/i,
        /(?:CLINICA\s+[\w\s]+)/i,
        /(?:UNIDAD\s+EJECUTORA\s+[\w\s]+)/i,
    ];

    for (const regex of patterns) {
        const match = text.match(regex);
        if (match) {
            return match[0].replace(/\s+/g, ' ').trim();
        }
    }

    // Try from sender info
    if (senderEmail) {
        const domain = senderEmail.split('@')[1] || '';
        // Map known domains to institution names
        const domainMap = {
            'inen.sld.pe': 'Instituto Nacional de Enfermedades Neoplásicas (INEN)',
            'ins.gob.pe': 'Instituto Nacional de Salud (INS)',
            'minsa.gob.pe': 'Ministerio de Salud (MINSA)',
        };
        for (const [d, name] of Object.entries(domainMap)) {
            if (domain.includes(d)) return name;
        }
        if (domain.includes('gob.pe') || domain.includes('sld.pe') || domain.includes('essalud')) {
            // Try fallback pattern first
            const fallback2 = text.match(/comunicarle?s?\s+que\s+(?:el|la)\s+(.+?)\s+ha\s+iniciado/i);
            if (fallback2) return fallback2[1].replace(/\s+/g, ' ').trim();
            return domain.split('.')[0].toUpperCase();
        }
    }

    // Fallback: Check for "comunicarles que el XXXX ha iniciado"
    const fallback = text.match(/comunicarle?s?\s+que\s+(?:el|la)\s+(.+?)\s+ha\s+iniciado/i);
    if (fallback) {
        return fallback[1].replace(/\s+/g, ' ').trim();
    }

    return senderName || 'No identificada';
}

function extractObjeto(subject, body) {
    // Try from subject first - remove common prefixes
    let objeto = subject
        .replace(/^(RE:|FW:|Fwd:|RV:)\s*/gi, '')
        .replace(/^(COTIZAR\s+URGENTE[-–]?\s*)/i, '')
        .replace(/^\d{2}[-]\d{6}[-]\d{3}\s*\/\/?\s*/i, '') // expedition numbers like 26-000264-001 //
        .replace(/^SOLICITUD?\s+DE\s+COTIZACI[OÓ]N:?\s*/i, '')
        .replace(/^REQUERIMIENTO\s*(URGENTE)?\s*[-–]?\s*(DE)?\s*/i, '')
        .trim();

    if (objeto && objeto.length > 10) {
        return objeto;
    }

    // Try from body patterns
    const bodyPatterns = [
        /(?:estudio\s+de\s+mercado\s+para\s+(?:la\s+)?(?:contrataci[oó]n\s+del?\s+)?)(.*?)(?:[,*]|\bpor\s+esta)/is,
        /(?:ADQUISICI[OÓ]N\s+DE\s+)(.*?)(?:\n|\t|\bpor\b)/is,
        /(?:CONTRATACI[OÓ]N\s+(?:DEL?\s+)?(?:SERVICIO\s+DE\s+)?)(.*?)(?:\n|\t|\bpor\b)/is,
    ];

    for (const regex of bodyPatterns) {
        const match = body.match(regex);
        if (match && match[1]) {
            const cleaned = match[1].replace(/\s+/g, ' ').replace(/[*]/g, '').trim();
            if (cleaned.length > 5 && cleaned.length < 300) {
                return cleaned;
            }
        }
    }

    return objeto || subject;
}

function extractEquipos(subject, body) {
    const combined = subject + ' ' + body;
    
    // Medical equipment keywords
    const equipmentPatterns = [
        /termohigrometr[oa]s?/gi,
        /protector(?:es)?\s+(?:de\s+)?(?:radiaci[oó]n\s+)?(?:para\s+)?g[oó]nad(?:as|ales)\s*(?:plomad[oa]s?)?/gi,
        /fund[ao]s?\s+(?:de\s+)?polietileno\s+(?:est[eé]ril)?/gi,
        /microscopio\s*(?:digital|[oó]ptico)?/gi,
        /autoclave/gi,
        /desfibrilador(?:es)?/gi,
        /monitor(?:es)?\s+(?:de\s+)?signos?\s+vitales/gi,
        /calderas?\s+(?:y\s+)?(?:torres?\s+de\s+)?enfriamiento/gi,
        /insumos?\s+qu[ií]micos?/gi,
        /electrocard[ió]grafo/gi,
        /ecógrafo|ecografo|ultrasonido/gi,
        /ventilador(?:es)?\s+mec[aá]nic[oa]s?/gi,
        /rayos?\s+[xX]/gi,
        /tomógrafo|tomografo/gi,
        /bomba(?:s)?\s+de\s+infusi[oó]n/gi,
        /centr[ií]fug[ao]s?/gi,
    ];

    const found = new Set();
    for (const regex of equipmentPatterns) {
        const matches = combined.match(regex);
        if (matches) {
            matches.forEach(m => found.add(m.replace(/\s+/g, ' ').trim()));
        }
    }

    if (found.size > 0) {
        return Array.from(found).join(', ');
    }

    // Generic fallback: find words between ADQUISICIÓN DE ... and next paragraph
    const genericMatch = combined.match(/(?:adquisici[oó]n|contrataci[oó]n|suministro)\s+de\s+(.{10,100}?)(?:\.|,|\n)/i);
    if (genericMatch) {
        return genericMatch[1].replace(/\s+/g, ' ').trim();
    }

    return 'Ver detalle en adjuntos';
}

function extractCantidad(body) {
    // Try to find a quantity + unit pattern
    const patterns = [
        /(\d+)\s*(?:unidades?|und\.?|pzas?\.?|piezas?|juegos?|equipos?|kits?|cajas?|paq(?:uetes?)?|rollos?|galones?|litros?|frascos?|botellas?)/gi,
        /cantidad\s*[\t:]+\s*(\d+)/gi,
        // Tabular format: number \t Unit/Unidad  
        /(\d+)\s+\t\s*\d+\.\d+/gi,
    ];

    const results = [];
    for (const regex of patterns) {
        let match;
        while ((match = regex.exec(body)) !== null) {
            results.push(match[0].trim());
        }
    }

    // Also try: look for "Unidad \t CANTIDAD" table rows
    const tableMatch = body.match(/(?:Unidad|und|pza)\s+\t\s*(\d+)/i);
    if (tableMatch) {
        results.push(`${tableMatch[1]} unidades`);
    }

    if (results.length > 0) {
        return [...new Set(results)].slice(0, 5).join('; ');
    }

    return 'Ver especificaciones técnicas adjuntas';
}

function extractPlazo(body) {
    // Look for deadline patterns
    const patterns = [
        /plazo\s+de\s+respuesta:?\s*(.+?)(?:\n|$)/i,
        /plazo\s+m[aá]ximo\s*[-–:]?\s*(.+?)(?:\n|\)|$)/i,
        /(?:hasta\s+(?:las?\s+)?)?(\d{1,2}\s+de\s+\w+\s+(?:del?\s+)?\d{4})\s*(?:\(.*?hrs?\b.*?\))?/i,
        /fecha\s+l[ií]mite:?\s*(.+?)(?:\n|$)/i,
        /culminado\s+el\s+(?:mencionado\s+)?plazo.+?(\d{1,2}\s+de\s+\w+\s+\d{4})/i,
    ];

    for (const regex of patterns) {
        const match = body.match(regex);
        if (match) {
            return match[1].replace(/[*]/g, '').replace(/\s+/g, ' ').trim();
        }
    }

    return 'No especificado';
}

function extractGarantia(body) {
    const patterns = [
        /garant[ií]a\s+(?:comercial\s+)?(?:m[ií]nima\s+)?(?:de\s+)?(\d+)\s*(meses?|a[ñn]os?|d[ií]as?)/i,
        /garant[ií]a\s*[:]\s*(.+?)(?:\n|$)/i,
    ];

    for (const regex of patterns) {
        const match = body.match(regex);
        if (match) {
            if (match[2]) return `${match[1]} ${match[2]}`;
            return match[1].replace(/\s+/g, ' ').trim();
        }
    }

    return 'No especificada';
}

function extractCondicionPago(body) {
    const normalized = normalizeText(body).toLowerCase();
    
    if (normalized.includes('contado')) return 'Al contado';
    if (normalized.includes('contra entrega')) return 'Contra entrega';
    if (normalized.includes('credito') || normalized.includes('crédito')) {
        const match = body.match(/cr[eé]dito\s*(?:a\s+)?(\d+)\s*d[ií]as?/i);
        if (match) return `Crédito a ${match[1]} días`;
        return 'Crédito (ver TdR)';
    }
    if (normalized.includes('30 dias') || normalized.includes('30 días')) return 'Crédito a 30 días';
    
    return 'Según condiciones del TdR';
}

function extractCaracteristicas(body) {
    // Look for technical specifications section
    const patterns = [
        /caracter[ií]sticas?\s+t[eé]cnicas?\s*(?:del?\s+bien\s*(?:a\s+adquirir)?)?\s*[:.\n]\s*([\s\S]{20,500}?)(?=\n\s*\d+\.\s|\bgarant[ií]a\b|\bplazo\b|\bforma\s+de\s+pago\b|\blugar\s+de\s+entrega\b|\bpenalidad\b|$)/i,
        /especificaciones?\s+t[eé]cnicas?\s*[:.\n]\s*([\s\S]{20,500}?)(?=\n\s*\d+\.\s|\bgarant[ií]a\b|\bplazo\b|$)/i,
        /descripci[oó]n\s+(?:del?\s+)?(?:bien|servicio|producto)\s*[:.\n]\s*([\s\S]{20,300}?)(?=\n\s*\d+\.\s|\bcaract|\bgarant|$)/i,
        /ficha\s+t[eé]cnica\s*[:.\n]\s*([\s\S]{20,500}?)(?=\n\s*\d+\.\s|\bgarant[ií]a\b|$)/i,
    ];

    for (const regex of patterns) {
        const match = body.match(regex);
        if (match && match[1]) {
            let text = match[1].replace(/\s+/g, ' ').trim();
            if (text.length > 400) text = text.substring(0, 400) + '...';
            return text;
        }
    }

    return 'Ver documento adjunto (TDR/EETT)';
}

function extractLugarEntrega(body) {
    const patterns = [
        /lugar\s+de\s+entrega\s*[:.\n]\s*(.+?)(?:\n\s*\d+\.|\n\n|$)/i,
        /punto\s+de\s+entrega\s*[:.\n]\s*(.+?)(?:\n|$)/i,
        /entregar?\s+en\s*[:.]?\s*(.+?)(?:\n|$)/i,
        /direcci[oó]n\s+de\s+entrega\s*[:.\n]\s*(.+?)(?:\n|$)/i,
    ];

    for (const regex of patterns) {
        const match = body.match(regex);
        if (match && match[1]) {
            let text = match[1].replace(/\s+/g, ' ').trim();
            if (text.length > 200) text = text.substring(0, 200) + '...';
            return text;
        }
    }

    // Try to find hospital/institution address
    const addressMatch = body.match(/(?:almac[eé]n|hospital|instituto|sede)\s+(?:de\s+|del\s+)?(.{10,100}?)(?:\.|,|\n)/i);
    if (addressMatch) {
        return addressMatch[0].replace(/\s+/g, ' ').trim();
    }

    return 'Ver TDR adjunto';
}

function extractPenalidad(body) {
    const patterns = [
        /penalidad(?:es)?\s*[:]\s*(.+?)(?:\n|$)/i,
        /penalid\w+\s+(?:por\s+)?(?:mora|atraso|retraso)\s+(.+?)(?:\n|$)/i,
        /(\d+(?:\.\d+)?%)\s+(?:por\s+)?(?:cada\s+)?d[ií]a\s+(?:de\s+)?(?:atraso|retraso|mora)/i,
    ];

    for (const regex of patterns) {
        const match = body.match(regex);
        if (match) {
            return match[1] ? match[1].replace(/\s+/g, ' ').trim() : match[0].trim();
        }
    }

    return 'No especificada en el correo';
}

function extractContacto(body, senderName, senderEmail) {
    // Try phone
    const phoneMatch = body.match(/(?:tel[eé]f(?:ono)?\.?|cel(?:ular)?\.?|anex[o]?\.?|t\.?)\s*[:.]?\s*(?:\(?\d{2,3}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}(?:\s+(?:anex[o]?\.?\s*[:\s]?\d{1,5}))?/i);
    
    let contactStr = senderName || 'No identificado';
    if (senderEmail) contactStr += ` <${senderEmail}>`;
    if (phoneMatch) contactStr += ` | Tel: ${phoneMatch[0].trim()}`;
    
    return contactStr;
}

function detectTipoSolicitud(normalizedText) {
    if (normalizedText.includes('cotizacion') || normalizedText.includes('cotizar')) return 'Solicitud de Cotización';
    if (normalizedText.includes('mantenimiento preventivo')) return 'Mantenimiento Preventivo';
    if (normalizedText.includes('mantenimiento correctivo')) return 'Mantenimiento Correctivo';
    if (normalizedText.includes('mantenimiento')) return 'Servicio de Mantenimiento';
    if (normalizedText.includes('adquisicion')) return 'Adquisición de Bienes';
    if (normalizedText.includes('suministro')) return 'Suministro';
    if (normalizedText.includes('servicio')) return 'Contratación de Servicio';
    if (normalizedText.includes('requerimiento')) return 'Requerimiento General';
    if (normalizedText.includes('licitacion')) return 'Licitación Pública';
    return 'Solicitud General';
}

function generateResumen(subject, body) {
    const cleanSubject = subject
        .replace(/^(RE:|FW:|Fwd:|RV:)\s*/gi, '')
        .replace(/^(COTIZAR\s+URGENTE[-–]?\s*)/i, '')
        .trim();
    
    // First meaningful sentence from body
    const sentences = body.split(/\n|\.\s/).filter(s => s.trim().length > 20);
    let firstSentence = '';
    if (sentences.length > 0) {
        firstSentence = sentences[0].replace(/\s+/g, ' ').trim();
        if (firstSentence.length > 200) firstSentence = firstSentence.substring(0, 200) + '...';
    }

    return `${cleanSubject}. ${firstSentence}`;
}

module.exports = {
    analyzeEmail
};
