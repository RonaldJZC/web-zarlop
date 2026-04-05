document.addEventListener('DOMContentLoaded', () => {

    // 1. Inicializar DB Mock de Correos en LocalStorage si no existe
    if (!localStorage.getItem('sgd_correos_db')) {
        const mockCorreos = [
            {
                id: 101,
                senderName: 'Hospital de Emergencias Casimiro Ulloa',
                senderEmail: 'logistica@hecu.gob.pe',
                subject: 'Cotización Mantenimiento Preventivo y Repuestos para Desfibriladores',
                datetime: '2026-04-03 10:30',
                reqType: 'Servicio y Repuestos',
                status: 'nuevo',
                body: `Estimados Señores ZARLOP S.A.C.,\n\nPor la presente solicitamos a ustedes remitir su propuesta técnico-económica para la contratación del "Servicio de mantenimiento preventivo y suministro de repuestos para 03 desfibriladores marca ZOLL modelo R Series".\n\nAdjuntamos los Términos de Referencia (TDR) y los anexos de Declaración Jurada que deben ser devueltos debidamente firmados. El plazo máximo de presentación es el día 10 del presente.\n\nAtentamente,\nÁrea de Logística - HECU`,
                adjuntos: [
                    { id: 'a1', name: 'TDR_Desfibriladores_HECU.pdf', type: 'pdf' },
                    { id: 'a2', name: 'Anexos_1_al_5_Formatos.docx', type: 'word' }
                ],
                anexos: [
                    { id: 'nx1', name: 'Anexo 1 - Declaración Jurada', status: 'pendiente' },
                    { id: 'nx2', name: 'Anexo 2 - Plazo de Entrega', status: 'pendiente' },
                    { id: 'nx3', name: 'Anexo 3 - Especificaciones', status: 'pendiente' }
                ],
                ai_analysis: {
                    entidad: 'Hospital de Emergencias José Casimiro Ulloa',
                    objeto: 'Mantenimiento preventivo y suministro de repuestos',
                    equipos: '03 desfibriladores marca ZOLL modelo R Series',
                    plazo: '10 días calendario (estimado)',
                    garantia: '12 meses',
                    pago: 'Transferencia luego de la conformidad',
                    penalidad: 'Aplica 1/1000 por día de retraso'
                }
            },
            {
                id: 102,
                senderName: 'Clínica San Pablo - Sede Surco',
                senderEmail: 'compras.equipos@sanpablo.com.pe',
                subject: 'Requerimiento de Centrífuga de Laboratorio Urgente',
                datetime: '2026-04-02 16:15',
                reqType: 'Equipamiento',
                status: 'analizado',
                body: `Hola Zarlop,\n\nNecesitamos con urgencia nos envíen una cotización para una Centrífuga de mesa clínica para nuestro nuevo laboratorio de muestras. Por favor incluir garantía y tiempos de entrega (necesitamos stock inmediato).\n\nAdjunto foto de referencia del equipo actual que queremos reemplazar.\n\nSaludos,\nIng. Biomédico - CSP`,
                adjuntos: [
                    { id: 'b1', name: 'Ref_foto_centrifuga.pdf', type: 'pdf' }
                ],
                anexos: [],
                ai_analysis: {
                    entidad: 'Clínica San Pablo (Surco)',
                    objeto: 'Adquisición de Centrífuga de mesa de laboratorio',
                    equipos: '01 Centrífuga de mesa clínica',
                    plazo: 'Inmediato (Stock)',
                    garantia: '1 año mínimo solicitado',
                    pago: 'Crédito a 30 días (estándar CSP)',
                    penalidad: 'N/A'
                }
            },
            {
                id: 103,
                senderName: 'Laboratorio Clínico Roe',
                senderEmail: 'aparedes@labroe.com',
                subject: 'Consulta sobre contrato de mantenimiento de Autoclaves',
                datetime: '2026-04-01 09:00',
                reqType: 'Consulta',
                status: 'proceso',
                body: `Estimado equipo,\nEscribo para consultar los detalles de una posible renovación de contrato de mantenimiento preventivo para nuestras autoclaves (2x Tuttnauer).\n¿Podrían enviarnos un presupuesto tentativo para todo el 2026?`,
                adjuntos: [],
                anexos: [],
                ai_analysis: null
            }
        ];
        localStorage.setItem('sgd_correos_db', JSON.stringify(mockCorreos));
    }

    // 2. Cargar datos
    const correos = JSON.parse(localStorage.getItem('sgd_correos_db')) || [];
    const tbody = document.getElementById('correosBody');

    if (!tbody) return;

    // 3. Renderizar tabla
    function renderCorreos() {
        tbody.innerHTML = '';
        
        if (correos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay correos en la bandeja.</td></tr>';
            return;
        }

        correos.sort((a,b) => new Date(b.datetime) - new Date(a.datetime)).forEach(correo => {
            const tr = document.createElement('tr');
            
            // Iconos de adjuntos
            let adjuntosHTML = '';
            if (correo.adjuntos && correo.adjuntos.length > 0) {
                const pdfCount = correo.adjuntos.filter(a => a.type === 'pdf').length;
                const wordCount = correo.adjuntos.filter(a => a.type === 'word').length;
                
                if (pdfCount > 0) adjuntosHTML += `<span style="display:flex; align-items:center; gap:4px; color:#EF4444; font-size:12px; margin-right:8px;"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> ${pdfCount} PDF</span>`;
                if (wordCount > 0) adjuntosHTML += `<span style="display:flex; align-items:center; gap:4px; color:#3B82F6; font-size:12px;"><svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> ${wordCount} DOCX</span>`;
            } else {
                adjuntosHTML = '<span style="color:#94a3b8; font-size:12px;">Sin adjuntos</span>';
            }

            // Status badge
            let statusBadge = '';
            if (correo.status === 'nuevo') statusBadge = '<span class="status-badge" style="background:#DBEAFE; color:#1E40AF;">Nuevo</span>';
            if (correo.status === 'analizado') statusBadge = '<span class="status-badge" style="background:#D1FAE5; color:#065F46;">Analizado</span>';
            if (correo.status === 'proceso') statusBadge = '<span class="status-badge" style="background:#FEF3C7; color:#B45309;">En Proceso</span>';
            if (correo.status === 'cotizado') statusBadge = '<span class="status-badge" style="background:#F3F4F6; color:#4B5563;">Cotizado</span>';

            tr.innerHTML = `
                <td style="font-size: 13px;">${correo.datetime}</td>
                <td><strong>${correo.senderName}</strong><br><span style="color:var(--sgd-text-light); font-size:12px;">${correo.senderEmail}</span></td>
                <td>${correo.subject}</td>
                <td style="display:flex;">${adjuntosHTML}</td>
                <td>${statusBadge}</td>
                <td><a href="expediente.html?id=${correo.id}" class="btn-primary" style="padding: 4px 10px; font-size: 0.8rem; text-decoration: none;">Abrir Expediente</a></td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderCorreos();
});
