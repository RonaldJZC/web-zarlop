/**
 * Analizador Inteligente — Frontend Logic
 * Controls the 3-panel layout: email list, document viewer, structured form
 */

// ============================================================================
// STATE
// ============================================================================
let allEmails = [];
let selectedEmail = null;
let currentAnalysis = null;
let activeTab = 'pdf';

// Field definitions for the form (labels and groups)
const FIELD_SCHEMA = {
    identificacion: {
        title: '🏢 Identificación',
        fields: {
            denominacion: { label: 'Denominación del Requerimiento', type: 'text' },
            entidad: { label: 'Entidad Contratante', type: 'text' },
            tipoSolicitud: { label: 'Tipo de Solicitud', type: 'text' },
            areaUsuaria: { label: 'Área Usuaria', type: 'text' },
            contacto: { label: 'Contacto', type: 'text' },
        }
    },
    descripcion: {
        title: '📝 Descripción y Objetivo',
        fields: {
            objetoContratacion: { label: 'Objeto de la Contratación', type: 'textarea' },
            finalidadPublica: { label: 'Finalidad Pública', type: 'textarea' },
            resumenEjecutivo: { label: 'Resumen Ejecutivo', type: 'textarea' },
        }
    },
    tecnico: {
        title: '🔧 Datos Técnicos',
        fields: {
            marcaModelo: { label: 'Marca / Modelo', type: 'text' },
            seriePatrimonial: { label: 'Serie / Código Patrimonial', type: 'text' },
            cantidad: { label: 'Cantidad', type: 'text' },
            actividadesRequeridas: { label: 'Actividades Requeridas', type: 'textarea' },
            repuestosInsumos: { label: 'Repuestos / Insumos', type: 'textarea' },
            perfilTecnico: { label: 'Perfil Técnico Requerido', type: 'textarea' },
        }
    },
    condiciones: {
        title: '📋 Condiciones Contractuales',
        fields: {
            plazo: { label: 'Plazo de Entrega/Ejecución', type: 'text' },
            garantia: { label: 'Garantía', type: 'text' },
            formaPago: { label: 'Forma de Pago', type: 'text' },
            valorEstimado: { label: 'Valor Estimado', type: 'text' },
            penalidades: { label: 'Penalidades', type: 'text' },
            lugarPrestacion: { label: 'Lugar de Prestación/Entrega', type: 'text' },
        }
    },
    documentacion: {
        title: '📂 Documentación',
        fields: {
            entregables: { label: 'Entregables', type: 'textarea' },
            requisitosProveedor: { label: 'Requisitos del Proveedor', type: 'textarea' },
        }
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    loadEmails();
    setupEventListeners();
    checkUrlParams();
});

function setupEventListeners() {
    // Search
    document.getElementById('searchEmails').addEventListener('input', (e) => {
        renderEmailList(filterEmails(e.target.value));
    });

    // Viewer tabs
    document.querySelectorAll('.viewer-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.tab;
            document.querySelectorAll('.viewer-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderViewer();
        });
    });

    // Buttons
    document.getElementById('btnAnalyze').addEventListener('click', () => runAnalysis());
    document.getElementById('btnReanalyze').addEventListener('click', () => runAnalysis(true));
    document.getElementById('btnValidate').addEventListener('click', () => validateAnalysis());
    document.getElementById('btnExport').addEventListener('click', () => exportAnalysis());
}

function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
        setTimeout(() => {
            const emailId = parseInt(id);
            const email = allEmails.find(e => e.id === emailId);
            if (email) selectEmail(email);
        }, 500);
    }
}

// ============================================================================
// DATA LOADING
// ============================================================================
async function loadEmails() {
    try {
        const res = await fetch('/api/mail/list');
        const data = await res.json();
        if (data.success) {
            allEmails = (data.list || []).sort((a, b) => {
                // Prioritize emails with attachments, then by date desc
                const aHas = (a.adjuntos || []).length > 0 ? 1 : 0;
                const bHas = (b.adjuntos || []).length > 0 ? 1 : 0;
                if (bHas !== aHas) return bHas - aHas;
                return (b.id || 0) - (a.id || 0);
            });
            renderEmailList(allEmails);
        }
    } catch (err) {
        console.error('Error loading emails:', err);
    }
}

function filterEmails(query) {
    if (!query || !query.trim()) return allEmails;
    const q = query.toLowerCase();
    return allEmails.filter(e =>
        (e.subject || '').toLowerCase().includes(q) ||
        (e.senderName || '').toLowerCase().includes(q) ||
        (e.senderEmail || '').toLowerCase().includes(q)
    );
}

// ============================================================================
// PANEL 1: EMAIL LIST
// ============================================================================
function renderEmailList(emails) {
    const container = document.getElementById('emailList');
    if (!emails || emails.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No hay correos. Sincroniza desde la Bandeja.</p></div>';
        return;
    }

    container.innerHTML = emails.map(email => {
        const adjCount = (email.adjuntos || []).length;
        const pdfCount = (email.adjuntos || []).filter(a => a.type === 'pdf').length;
        const status = email.deep_analysis ? 'analizado' : (email.status || 'nuevo');
        const isActive = selectedEmail && selectedEmail.id === email.id;

        return `
        <div class="email-card ${isActive ? 'active' : ''}" data-id="${email.id}" onclick="selectEmailById(${email.id})">
            <div class="email-card-sender">${escapeHtml(email.senderName || email.senderEmail || 'Desconocido')}</div>
            <div class="email-card-subject">${escapeHtml((email.subject || 'Sin asunto').substring(0, 120))}</div>
            <div class="email-card-meta">
                <span class="status-badge ${status}">${statusLabel(status)}</span>
                <span class="attach-count">${pdfCount > 0 ? `📄 ${pdfCount} PDF` : ''}${adjCount > pdfCount ? ` +${adjCount - pdfCount}` : ''}</span>
            </div>
        </div>`;
    }).join('');
}

function statusLabel(s) {
    const map = { nuevo: '🔵 Nuevo', analizado: '🟢 Analizado', validado: '✅ Validado', procesado: '⚪ Procesado' };
    return map[s] || s;
}

// ============================================================================
// EMAIL SELECTION
// ============================================================================
function selectEmailById(id) {
    const email = allEmails.find(e => e.id === id);
    if (email) selectEmail(email);
}

async function selectEmail(email) {
    selectedEmail = email;
    renderEmailList(filterEmails(document.getElementById('searchEmails').value));

    // Enable buttons
    document.getElementById('btnAnalyze').disabled = false;
    document.getElementById('btnReanalyze').disabled = false;

    // Update viewer
    renderViewer();

    // Check if we have a saved analysis
    try {
        const res = await fetch(`/api/mail/analysis/${email.id}`);
        const data = await res.json();
        if (data.success && data.analysis) {
            currentAnalysis = data.analysis;
            renderForm(currentAnalysis);
        } else {
            currentAnalysis = null;
            renderFormEmpty();
        }
    } catch (err) {
        currentAnalysis = null;
        renderFormEmpty();
    }
}

// ============================================================================
// PANEL 2: DOCUMENT VIEWER
// ============================================================================
function renderViewer() {
    const body = document.getElementById('viewerBody');
    const docName = document.getElementById('viewerDocName');

    if (!selectedEmail) {
        body.innerHTML = `<div class="viewer-placeholder">
            <svg viewBox="0 0 24 24" width="64" height="64" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <h3>Selecciona un correo</h3>
            <p>Elige un correo del panel izquierdo para visualizar sus documentos.</p>
        </div>`;
        docName.textContent = '';
        return;
    }

    if (activeTab === 'pdf') {
        // Find first PDF attachment
        const pdfs = (selectedEmail.adjuntos || []).filter(a => a.type === 'pdf');
        if (pdfs.length > 0) {
            const pdf = pdfs[0];
            body.innerHTML = `<iframe class="viewer-iframe" src="${pdf.url}" title="PDF Viewer"></iframe>`;
            docName.textContent = pdf.name;
        } else {
            body.innerHTML = `<div class="viewer-placeholder">
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <h3>Sin PDFs adjuntos</h3>
                <p>Este correo no tiene archivos PDF. Usa la pestaña "Correo" para ver el contenido.</p>
            </div>`;
            docName.textContent = '';
        }
    } else if (activeTab === 'text') {
        // Show extracted text from analysis
        if (currentAnalysis && currentAnalysis.documentosLeidos) {
            const docs = currentAnalysis.documentosLeidos.filter(d => d.textLength > 0);
            const info = docs.map(d => `📄 ${d.name}: ${d.textLength} caracteres (${d.pages || '?'} páginas)`).join('\n');
            body.innerHTML = `<div class="viewer-text-content" id="textViewer">${info || 'Ejecuta el análisis primero para extraer texto.'}\n\n${'—'.repeat(40)}\nPresiona "Analizar" para ver el texto extraído de los documentos.</div>`;
        } else {
            body.innerHTML = `<div class="viewer-text-content">Presiona "Analizar" para extraer y visualizar el texto de los documentos adjuntos.</div>`;
        }
        docName.textContent = 'Texto extraído';
    } else if (activeTab === 'email') {
        // Show email body
        const emailBody = (selectedEmail.body || 'Sin contenido').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        body.innerHTML = `<div class="viewer-text-content">${emailBody}</div>`;
        docName.textContent = 'Cuerpo del correo';
    }
}

// ============================================================================
// ANALYSIS EXECUTION
// ============================================================================
async function runAnalysis(force = false) {
    if (!selectedEmail) return;

    // Show loading
    const formBody = document.getElementById('formBody');
    formBody.innerHTML = `<div class="analyzer-loading">
        <div class="spinner"></div>
        <p>Analizando documentos...</p>
        <div class="sub">Regex + Gemini AI procesando TDR/EETT</div>
    </div>`;

    document.getElementById('semaforo').className = 'semaforo pending';
    document.getElementById('semaforo').innerHTML = '<span>⏳</span> Analizando...';

    try {
        const res = await fetch(`/api/mail/analyze-deep/${selectedEmail.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ useGemini: true })
        });

        const data = await res.json();
        if (data.success && data.analysis) {
            currentAnalysis = data.analysis;
            renderForm(currentAnalysis);
            // Update email status in the list
            selectedEmail.status = 'analizado';
            selectedEmail.deep_analysis = true;
            renderEmailList(filterEmails(document.getElementById('searchEmails').value));
            renderViewer(); // Refresh text tab
        } else {
            formBody.innerHTML = `<div class="empty-state"><h4>Error</h4><p>${data.error || 'Error desconocido'}</p></div>`;
        }
    } catch (err) {
        formBody.innerHTML = `<div class="empty-state"><h4>Error de conexión</h4><p>${err.message}</p></div>`;
    }
}

// ============================================================================
// PANEL 3: STRUCTURED FORM
// ============================================================================
function renderFormEmpty() {
    document.getElementById('formBody').innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
        <h4>Sin datos</h4>
        <p>Presiona "🔍 Analizar" para extraer datos automáticamente de los documentos adjuntos.</p>
    </div>`;
    document.getElementById('semaforo').className = 'semaforo pending';
    document.getElementById('semaforo').innerHTML = '<span>⏳</span> Sin analizar';
    document.getElementById('btnValidate').disabled = true;
    document.getElementById('btnExport').disabled = true;
    document.getElementById('analysisStats').style.display = 'none';
}

function renderForm(analysis) {
    const campos = analysis.campos || {};
    const semaforo = analysis.semaforo || {};

    // Update semaphore
    const semEl = document.getElementById('semaforo');
    semEl.className = `semaforo ${semaforo.estado || 'pending'}`;
    const icons = { listo: '🟢', revisar: '🟡', incompleto: '🔴' };
    semEl.innerHTML = `<span>${icons[semaforo.estado] || '⏳'}</span> ${semaforo.porcentaje || 0}% — ${semaforo.detectados || 0} detectados, ${semaforo.dudosos || 0} dudosos, ${semaforo.faltantes || 0} faltantes`;

    // Build form
    let html = '';
    for (const [groupKey, group] of Object.entries(FIELD_SCHEMA)) {
        html += `<div class="field-group"><div class="field-group-title">${group.title}</div>`;
        for (const [fieldKey, fieldDef] of Object.entries(group.fields)) {
            const campo = campos[fieldKey] || { valor: null, confianza: 'baja', fuente: 'no_detectado' };
            const val = campo.valor !== null && campo.valor !== undefined ? campo.valor : '';
            const conf = campo.confianza || 'baja';
            const fuente = campo.fuente || 'no_detectado';
            const isNull = !val;

            const sourceTag = fuente && fuente !== 'no_detectado'
                ? `<span class="motor-tag ${fuente === 'gemini' ? 'gemini' : fuente === 'usuario' ? 'usuario' : 'regex'}">${fuente}</span>`
                : '';

            if (fieldDef.type === 'textarea') {
                html += `
                <div class="field-item">
                    <div class="field-label">
                        <span class="conf-dot ${conf}"></span>
                        ${fieldDef.label}
                        <span class="field-source">${sourceTag}</span>
                    </div>
                    <textarea class="field-input ${isNull ? 'null-value' : ''}" data-field="${fieldKey}" rows="2">${isNull ? 'No detectado' : escapeHtml(val)}</textarea>
                </div>`;
            } else {
                html += `
                <div class="field-item">
                    <div class="field-label">
                        <span class="conf-dot ${conf}"></span>
                        ${fieldDef.label}
                        <span class="field-source">${sourceTag}</span>
                    </div>
                    <input type="text" class="field-input ${isNull ? 'null-value' : ''}" data-field="${fieldKey}" value="${isNull ? 'No detectado' : escapeHtml(val)}">
                </div>`;
            }
        }
        html += '</div>';
    }

    document.getElementById('formBody').innerHTML = html;

    // Enable buttons
    document.getElementById('btnValidate').disabled = false;
    document.getElementById('btnExport').disabled = false;

    // Show stats
    const stats = document.getElementById('analysisStats');
    stats.style.display = 'flex';
    document.getElementById('statTime').textContent = `${analysis.tiempoMs || 0}ms`;
    document.getElementById('statMotor').textContent = analysis.motorUsado || 'regex';
    document.getElementById('statDocs').textContent = `${(analysis.documentosLeidos || []).length} docs`;

    // Clear null-value styling on focus
    document.querySelectorAll('.field-input').forEach(input => {
        input.addEventListener('focus', () => {
            if (input.classList.contains('null-value')) {
                input.value = '';
                input.classList.remove('null-value');
            }
        });
    });
}

// ============================================================================
// VALIDATION & EXPORT
// ============================================================================
async function validateAnalysis() {
    if (!selectedEmail || !currentAnalysis) return;

    // Collect all edited field values
    const campos = {};
    document.querySelectorAll('.field-input').forEach(input => {
        const field = input.dataset.field;
        const val = input.value.trim();
        if (val && val !== 'No detectado') {
            campos[field] = val;
        }
    });

    try {
        const res = await fetch(`/api/mail/analysis/${selectedEmail.id}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campos })
        });

        const data = await res.json();
        if (data.success) {
            // Visual feedback
            const sem = document.getElementById('semaforo');
            sem.className = 'semaforo listo';
            sem.innerHTML = '✅ Validado por usuario';

            selectedEmail.status = 'validado';
            renderEmailList(filterEmails(document.getElementById('searchEmails').value));
        }
    } catch (err) {
        console.error('Error validating:', err);
    }
}

function exportAnalysis() {
    if (!selectedEmail) return;
    window.open(`/api/mail/analysis/${selectedEmail.id}/export`, '_blank');
}

// ============================================================================
// UTILITIES
// ============================================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
