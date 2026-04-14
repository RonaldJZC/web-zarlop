function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.currentTarget.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
}

let activeCorreo = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const exId = parseInt(urlParams.get('id'));

    const correos = JSON.parse(localStorage.getItem('sgd_correos_db')) || [];
    activeCorreo = correos.find(c => c.id === exId);

    if (!activeCorreo) {
        document.querySelector('.sgd-content').innerHTML = `
            <div style="text-align:center; padding: 50px;">
                <h2>Expediente no encontrado</h2>
                <a href="correos.html" class="btn-primary">Volver a la bandeja</a>
            </div>`;
        return;
    }

    // Actualizar estado en DB (marcar como revisado si era nuevo)
    if (activeCorreo.status === 'nuevo') {
        activeCorreo.status = 'analizado';
        localStorage.setItem('sgd_correos_db', JSON.stringify(correos));
    }

    // Render Data
    document.getElementById('ex_subject').textContent = activeCorreo.subject;
    document.getElementById('ex_sender_name').textContent = activeCorreo.senderName;
    document.getElementById('ex_sender_email').textContent = activeCorreo.senderEmail;
    document.getElementById('ex_date').textContent = activeCorreo.datetime;
    document.getElementById('ex_body').textContent = activeCorreo.body;

    let statusBadge = '<span class="status-badge" style="background:#D1FAE5; color:#065F46; padding: 6px 12px;">En Análisis</span>';
    if (activeCorreo.status === 'cotizado') {
        statusBadge = '<span class="status-badge" style="background:#F3F4F6; color:#4B5563; padding: 6px 12px;">Cotizado</span>';
    }
    document.getElementById('ex_status_badge').innerHTML = statusBadge;

    // Adjuntos
    const adjContainer = document.getElementById('adjuntos_grid');
    if (activeCorreo.adjuntos && activeCorreo.adjuntos.length > 0) {
        activeCorreo.adjuntos.forEach(a => {
            const isPdf = a.type === 'pdf';
            const isExcel = a.type === 'excel';
            const icon = isPdf ? '📄' : (isExcel ? '📊' : '📝');
            const colorClass = isPdf ? 'pdf' : 'word';
            adjContainer.innerHTML += `
                <div class="file-card">
                    <div class="file-icon ${colorClass}">${icon}</div>
                    <div style="flex:1; overflow:hidden;">
                        <div style="font-size: 0.85rem; font-weight:600; text-overflow: ellipsis; white-space: nowrap; overflow:hidden;" title="${a.name}">${a.name}</div>
                        <div style="font-size: 0.7rem; color: #64748B; text-transform:uppercase;">Documento ${a.type}</div>
                    </div>
                    <a href="${a.url || '#'}" target="_blank" style="text-decoration:none;" title="Descargar">⬇️</a>
                </div>
            `;
        });
    } else {
        adjContainer.innerHTML = '<div style="grid-column: span 3; color: #64748b;">No hay adjuntos en este correo.</div>';
    }

    // Anexos
    const anxContainer = document.getElementById('anexos_list');
    if (activeCorreo.anexos && activeCorreo.anexos.length > 0) {
        document.getElementById('anexos_count').textContent = activeCorreo.anexos.length;
        activeCorreo.anexos.forEach((n, i) => {
            anxContainer.innerHTML += `
                <div class="anexo-item">
                    <div>
                        <strong style="font-size:0.9rem;">${n.name}</strong>
                        <div style="font-size:0.75rem; color:#64748b;">Estado: <span style="color:#F59E0B">Pendiente de firma/relleno</span></div>
                    </div>
                    <div>
                        <button class="btn-outline" style="padding: 4px 10px; font-size: 0.75rem;">Adjuntar completado</button>
                    </div>
                </div>
            `;
        });
    } else {
        anxContainer.innerHTML = '<div style="color: #64748b;">No se detectaron formatos editables para llenar.</div>';
    }

    // Check if already analyzed (from previous visit)
    if (activeCorreo.ai_analysis) {
        showAIResults(activeCorreo.ai_analysis);
    }

    // Generar Cotización Redirección
    document.getElementById('btnCrearCotizacion').addEventListener('click', () => {
        window.location.href = `nueva-cotizacion.html?expediente=${activeCorreo.id}`;
    });
});

// ===== REAL ANALYSIS - CALLS BACKEND API =====
async function runAnalysis() {
    if (!activeCorreo) return;

    // Show loader
    document.getElementById('ai_unprocessed').style.display = 'none';
    document.getElementById('ai_loader').style.display = 'block';

    try {
        const res = await fetch(`/api/mail/analyze/${activeCorreo.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();

        if (data.success && data.analysis) {
            // Save analysis to local correo object for future visits
            activeCorreo.ai_analysis = data.analysis;
            const correos = JSON.parse(localStorage.getItem('sgd_correos_db')) || [];
            const idx = correos.findIndex(c => c.id === activeCorreo.id);
            if (idx !== -1) {
                correos[idx].ai_analysis = data.analysis;
                correos[idx].status = 'analizado';
                localStorage.setItem('sgd_correos_db', JSON.stringify(correos));
            }

            // Small delay for visual effect
            setTimeout(() => {
                showAIResults(data.analysis);
            }, 800);
        } else {
            document.getElementById('ai_loader').style.display = 'none';
            document.getElementById('ai_unprocessed').style.display = 'block';
            alert('Error al analizar: ' + (data.error || 'No se pudo procesar'));
        }
    } catch (err) {
        console.error('Analysis error:', err);
        document.getElementById('ai_loader').style.display = 'none';
        document.getElementById('ai_unprocessed').style.display = 'block';
        alert('Error de red al conectar con el servidor.');
    }
}

function showAIResults(data) {
    if (!data) return;
    document.getElementById('ai_loader').style.display = 'none';
    document.getElementById('ai_unprocessed').style.display = 'none';
    document.getElementById('ai_results').style.display = 'block';

    document.getElementById('ai_tipo').textContent = data.tipoSolicitud || '-';
    document.getElementById('ai_entidad').textContent = data.entidad || '-';
    document.getElementById('ai_objeto').textContent = data.objeto || '-';
    document.getElementById('ai_equipos').textContent = data.equipos || '-';
    document.getElementById('ai_cantidad').textContent = data.cantidad || '-';
    document.getElementById('ai_caracteristicas').textContent = data.caracteristicas || '-';
    document.getElementById('ai_plazo').textContent = data.plazo || '-';
    document.getElementById('ai_garantia').textContent = data.garantia || '-';
    document.getElementById('ai_pago').textContent = data.pago || '-';
    document.getElementById('ai_penalidad').textContent = data.penalidad || '-';
    document.getElementById('ai_lugarEntrega').textContent = data.lugarEntrega || '-';
    document.getElementById('ai_contacto').textContent = data.contacto || '-';
    document.getElementById('ai_resumen').textContent = data.resumen || '-';
    document.getElementById('ai_fuente').textContent = data.fuenteDatos ? `📄 ${data.fuenteDatos}` : '';

    // Update badge to analyzed
    document.getElementById('ex_status_badge').innerHTML = 
        '<span class="status-badge" style="background:#D1FAE5; color:#065F46; padding: 6px 12px;">✓ Analizado</span>';
}
