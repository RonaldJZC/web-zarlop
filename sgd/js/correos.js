document.addEventListener('DOMContentLoaded', () => {

    const tbody = document.getElementById('correosBody');
    const btnSync = document.getElementById('btnSync');

    if (!tbody) return;

    // Load data from Backend real
    async function loadCorreos() {
        try {
            const res = await fetch('/api/mail/list');
            const data = await res.json();
            
            if (data.success) {
                renderCorreos(data.list);
                // Also update local storage para el compat con el frontend de expedientes que usa json data local por ahora
                // Esto es una capa de compatibilidad hasta que refactoricemos expediente.js
                localStorage.setItem('sgd_correos_db', JSON.stringify(data.list));
            } else {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Error: ${data.error}</td></tr>`;
            }
        } catch (err) {
            console.error("Fetch correos err", err);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No se pudo conectar al servidor.</td></tr>';
        }
    }

    // Render table
    function renderCorreos(correos) {
        tbody.innerHTML = '';
        
        if (!correos || correos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay correos en la bandeja. (Usa Sincronizar)</td></tr>';
            return;
        }

        correos.sort((a,b) => new Date(b.datetime) - new Date(a.datetime)).forEach(correo => {
            const tr = document.createElement('tr');
            
            let adjuntosHTML = '';
            if (correo.adjuntos && correo.adjuntos.length > 0) {
                const pdfCount = correo.adjuntos.filter(a => a.type === 'pdf').length;
                const wordCount = correo.adjuntos.filter(a => a.type === 'word').length;
                const imgCount = correo.adjuntos.filter(a => a.type === 'image' || a.type === 'other').length;
                
                if (pdfCount > 0) adjuntosHTML += `<span style="display:flex; align-items:center; gap:4px; color:#EF4444; font-size:12px; margin-right:8px;">📄 ${pdfCount} PDF</span>`;
                if (wordCount > 0) adjuntosHTML += `<span style="display:flex; align-items:center; gap:4px; color:#3B82F6; font-size:12px; margin-right:8px;">📝 ${wordCount} DOC</span>`;
                if (imgCount > 0) adjuntosHTML += `<span style="display:flex; align-items:center; gap:4px; color:#10B981; font-size:12px;">🖼️ ${imgCount} IMG</span>`;
            } else {
                adjuntosHTML = '<span style="color:#94a3b8; font-size:12px;">Sin adjuntos</span>';
            }

            let statusBadge = '';
            if (correo.status === 'nuevo') statusBadge = '<span class="status-badge" style="background:#DBEAFE; color:#1E40AF;">Nuevo</span>';
            else if (correo.status === 'analizado') statusBadge = '<span class="status-badge" style="background:#D1FAE5; color:#065F46;">Analizado</span>';
            else if (correo.status === 'proceso') statusBadge = '<span class="status-badge" style="background:#FEF3C7; color:#B45309;">En Proceso</span>';
            else statusBadge = `<span class="status-badge" style="background:#F3F4F6; color:#4B5563;">${correo.status}</span>`;

            tr.innerHTML = `
                <td style="font-size: 13px;">${correo.datetime}</td>
                <td><strong style="display:block; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${correo.senderName}</strong><span style="color:var(--sgd-text-light); font-size:11px;">${correo.senderEmail}</span></td>
                <td><div style="max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${correo.subject}">${correo.subject}</div></td>
                <td style="display:flex; flex-wrap:wrap;">${adjuntosHTML}</td>
                <td>${statusBadge}</td>
                <td><a href="expediente.html?id=${correo.id}" class="btn-primary" style="padding: 4px 10px; font-size: 0.8rem; text-decoration: none;">Abrir Expediente</a></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Sync Btn
    if (btnSync) {
        btnSync.addEventListener('click', async () => {
            btnSync.disabled = true;
            btnSync.innerHTML = '⏳ Sincronizando...';
            try {
                const res = await fetch('/api/mail/sync', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                    alert(`Sincronización IMAP Completa.\nSe importaron ${data.result.imported} correos nuevos.`);
                    loadCorreos();
                } else {
                    alert('Error en IMAP: ' + (data.error || 'Autenticación o Puerto incorrecto. Revise Configuración.'));
                }
            } catch(e) {
                alert('Fallo de red conectando al servidor backend.');
            } finally {
                btnSync.disabled = false;
                btnSync.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle; margin-right: 5px;"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Sincronizar IMAP';
            }
        });
    }

    // Init
    loadCorreos();
});
