// Logic for Cotizador SGD Zarlop
document.addEventListener('DOMContentLoaded', () => {
    
    const tbody = document.getElementById('itemsBody');
    const btnAdd = document.getElementById('btnAddItem');
    const btnGeneratePDF = document.getElementById('btnGeneratePDF');

    // Totals Elements
    const elSumRep = document.getElementById('sumRepuestos');
    const elSumMano = document.getElementById('sumManoObra');
    const elSumBase = document.getElementById('sumCostoBase');
    const elSumGanancia = document.getElementById('sumGanancia');
    const elSumSub = document.getElementById('sumSubtotal');
    const elSumIgv = document.getElementById('sumIgv');
    const elSumTotal = document.getElementById('sumTotal');

    function createRow() {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="desc" placeholder="Detalle técnico..." required></td>
            <td><input type="number" class="qty" value="1" min="1" step="1"></td>
            <td><input type="number" class="cost_rep" value="0.00" min="0" step="0.01"></td>
            <td><input type="number" class="cost_mo" value="0.00" min="0" step="0.01"></td>
            <td><input type="number" class="margin" value="30" min="0" step="1" title="Margen pretendido %"></td>
            <td><input type="number" class="price_sale" value="0.00" readonly style="background:#f1f5f9; font-weight:bold; color:var(--sgd-primary);"></td>
            <td><button type="button" class="btn-del" style="color:red; border:none; background:none; cursor:pointer;" title="Eliminar">&times;</button></td>
        `;
        
        // Add events for calculation
        const inputs = tr.querySelectorAll('input:not(.price_sale)');
        inputs.forEach(input => input.addEventListener('input', calculateTotals));
        
        tr.querySelector('.btn-del').addEventListener('click', () => {
            tr.remove();
            calculateTotals();
        });

        tbody.appendChild(tr);
    }

    function calculateTotals() {
        let totalRepuestos = 0;
        let totalManoObra = 0;
        let totalSubtotalVenta = 0;

        const rows = tbody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.qty').value) || 0;
            const costRep = parseFloat(row.querySelector('.cost_rep').value) || 0;
            const costMo = parseFloat(row.querySelector('.cost_mo').value) || 0;
            const margin = parseFloat(row.querySelector('.margin').value) || 0;
            
            // Cálculos internos (Costo Base Zarlop unitario)
            const costoBaseUnitario = costRep + costMo;
            
            // Fórmula de precio de venta basado en margen ( Mark-up o Margen sobre Venta )
            // Precio Venta = Costo Base / (1 - (Margen/100))  <- Esta es la forma profesional de asegurar utilidad.
            let precioVentaUnitario = 0;
            if (margin < 100) { // Safety check
                precioVentaUnitario = costoBaseUnitario / (1 - (margin / 100));
            } else {
                // Fallback a markup simple si ponen 100% o más
                precioVentaUnitario = costoBaseUnitario + (costoBaseUnitario * (margin/100));
            }

            // Actualizar la vista de precio de venta unitario
            row.querySelector('.price_sale').value = precioVentaUnitario.toFixed(2);

            // Sumar a totales
            totalRepuestos += (costRep * qty);
            totalManoObra += (costMo * qty);
            totalSubtotalVenta += (precioVentaUnitario * qty);
        });

        const costoBaseTotal = totalRepuestos + totalManoObra;
        const gananciaTotal = totalSubtotalVenta - costoBaseTotal;
        const igvTotal = totalSubtotalVenta * 0.18;
        const granTotal = totalSubtotalVenta + igvTotal;

        // Render UI Total
        elSumRep.textContent = `S/ ${totalRepuestos.toFixed(2)}`;
        elSumMano.textContent = `S/ ${totalManoObra.toFixed(2)}`;
        elSumBase.textContent = `S/ ${costoBaseTotal.toFixed(2)}`;
        elSumGanancia.textContent = `S/ ${gananciaTotal.toFixed(2)}`;
        elSumSub.textContent = `S/ ${totalSubtotalVenta.toFixed(2)}`;
        elSumIgv.textContent = `S/ ${igvTotal.toFixed(2)}`;
        elSumTotal.textContent = `S/ ${granTotal.toFixed(2)}`;
    }

    // Inicializar con 1 fila
    createRow();
    
    btnAdd.addEventListener('click', createRow);

    // ==========================================
    // MOCK CLIENT DATABASE & AUTOCOMPLETE LOGIC
    // ==========================================
    
    // Inicializar DB en localStorage si no existe
    if (!localStorage.getItem('sgd_clients_db')) {
        const initialClients = [
            { id: 1, ruc: '20100100100', name: 'Clínica San Pablo', address: 'Av. El Polo 789, Surco', contact: 'Dr. Roberto Mendoza', phone: '999888777', email: 'logistica@sanpablo.com.pe' },
            { id: 2, ruc: '20505050501', name: 'Hospital de Emergencias Casimiro Ulloa', address: 'Av. Roosevelt 6355, Miraflores', contact: 'Ing. Carlos Ruiz', phone: '01 2040900', email: 'compras@hecu.gob.pe' },
            { id: 3, ruc: '20202020202', name: 'Laboratorio Clínico Roe', address: 'Av. Juan de Aliaga 300, Magdalena', contact: 'Lic. Ana Paredes', phone: '987654321', email: 'aparedes@labroe.com' },
            { id: 4, ruc: '20404040404', name: 'Centro Radiológico Mediscan', address: 'Calle Los Pinos 145, San Isidro', contact: 'Tech. Luis Silva', phone: '912345678', email: 'lsilva@mediscan.pe' },
            { id: 5, ruc: '20601234567', name: 'Policlínico Vida y Salud', address: 'Jr. de la Unión 334, Cercado de Lima', contact: 'Dra. María Fernández', phone: '984555123', email: 'admi@vidaysalud.pe' }
        ];
        localStorage.setItem('sgd_clients_db', JSON.stringify(initialClients));
    }

    function getClients() {
        return JSON.parse(localStorage.getItem('sgd_clients_db')) || [];
    }

    function saveClient(client) {
        const clients = getClients();
        client.id = Date.now();
        clients.push(client);
        localStorage.setItem('sgd_clients_db', JSON.stringify(clients));
        return client;
    }

    // Campos del DOM Formulario Principal
    const inputCliente = document.getElementById('c_cliente');
    const inputRuc = document.getElementById('c_ruc');
    const inputContacto = document.getElementById('c_contacto');
    const inputDireccion = document.getElementById('c_direccion');
    const inputCorreo = document.getElementById('c_correo');
    const inputTelefono = document.getElementById('c_telefono');
    const clientDropdown = document.getElementById('clientDropdown');

    // Autocomplete Logic
    if (inputCliente && clientDropdown) {
        inputCliente.addEventListener('input', function() {
            const query = this.value.toLowerCase().trim();
            clientDropdown.innerHTML = '';
            
            if (query.length < 2) {
                clientDropdown.style.display = 'none';
                return;
            }

            const clients = getClients();
            const matches = clients.filter(c => 
                c.name.toLowerCase().includes(query) || 
                c.ruc.includes(query)
            );

            if (matches.length > 0) {
                matches.forEach(client => {
                    const div = document.createElement('div');
                    div.className = 'autocomplete-item';
                    div.innerHTML = `
                        <div class="autocomplete-title">${client.name}</div>
                        <div class="autocomplete-sub">RUC: ${client.ruc} | ${client.address}</div>
                    `;
                    div.addEventListener('click', () => {
                        selectClient(client);
                    });
                    clientDropdown.appendChild(div);
                });
                clientDropdown.style.display = 'block';
            } else {
                clientDropdown.innerHTML = `
                    <div class="autocomplete-empty">Ups, no encontramos clientes con "${query}".</div>
                    <div class="autocomplete-action" id="dropdownCreateBtn">+ Registrar nuevo cliente</div>
                `;
                clientDropdown.style.display = 'block';
                document.getElementById('dropdownCreateBtn').addEventListener('click', () => {
                    clientDropdown.style.display = 'none';
                    openModalCreate(query);
                });
            }
        });
    }

    // Cerrar dropdown si se hace click fuera
    document.addEventListener('click', (e) => {
        if (clientDropdown && !e.target.closest('.sgd-search-container')) {
            clientDropdown.style.display = 'none';
        }
    });

    function selectClient(client) {
        if (inputCliente) inputCliente.value = client.name;
        if (inputRuc) inputRuc.value = client.ruc;
        if (inputContacto) inputContacto.value = client.contact || '';
        if (inputDireccion) inputDireccion.value = client.address || '';
        if (inputCorreo) inputCorreo.value = client.email || '';
        if (inputTelefono) inputTelefono.value = client.phone || '';
        if (clientDropdown) clientDropdown.style.display = 'none';
        const clientModal = document.getElementById('clientModal');
        if (clientModal) clientModal.classList.remove('active');
    }

    // Modal Logic
    const btnOpenClientModal = document.getElementById('btnOpenClientModal');
    const btnCloseClientModal = document.getElementById('btnCloseClientModal');
    const clientModal = document.getElementById('clientModal');
    
    // Elements in Modal Search State
    const modalSearchState = document.getElementById('modalSearchState');
    const modalSearchInput = document.getElementById('modalSearchInput');
    const modalClientsList = document.getElementById('modalClientsList');
    const btnShowCreateClient = document.getElementById('btnShowCreateClient');

    // Elements in Modal Create State
    const modalCreateState = document.getElementById('modalCreateState');
    const btnCancelCreateClient = document.getElementById('btnCancelCreateClient');
    const newClientForm = document.getElementById('newClientForm');

    function renderModalList(filter = '') {
        if (!modalClientsList) return;
        modalClientsList.innerHTML = '';
        const clients = getClients();
        const matches = clients.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.ruc.includes(filter));
        
        if (matches.length === 0) {
            modalClientsList.innerHTML = '<div style="padding:15px; text-align:center; color:#64748b;">No hay resultados.</div>';
            return;
        }

        matches.forEach(client => {
            const div = document.createElement('div');
            div.className = 'modal-list-item';
            div.innerHTML = `
                <strong style="color:var(--sgd-text-main);">${client.name}</strong><br>
                <span style="font-size:0.8rem; color:#64748b;">RUC: ${client.ruc}</span>
            `;
            div.addEventListener('click', () => selectClient(client));
            modalClientsList.appendChild(div);
        });
    }

    if (btnOpenClientModal) {
        btnOpenClientModal.addEventListener('click', () => {
            modalSearchState.style.display = 'block';
            modalCreateState.style.display = 'none';
            modalSearchInput.value = '';
            renderModalList();
            clientModal.classList.add('active');
            setTimeout(() => modalSearchInput.focus(), 100);
        });
    }

    if (btnCloseClientModal) {
        btnCloseClientModal.addEventListener('click', () => {
            clientModal.classList.remove('active');
        });
    }

    if (modalSearchInput) {
        modalSearchInput.addEventListener('input', (e) => {
            renderModalList(e.target.value);
        });
    }

    if (btnShowCreateClient) btnShowCreateClient.addEventListener('click', () => openModalCreate());

    function openModalCreate(searchVal = '') {
        if (clientModal) clientModal.classList.add('active');
        if (modalSearchState) modalSearchState.style.display = 'none';
        if (modalCreateState) modalCreateState.style.display = 'block';
        if (newClientForm) newClientForm.reset();
        
        const successMsg = document.getElementById('createSuccessMsg');
        if (successMsg) successMsg.style.display = 'none';

        const submitBtn = document.getElementById('btnGuardarDir');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Guardar cliente en directorio';
        }
        
        // Si viene del campo de búsqueda y parece un RUC
        if (searchVal.match(/^[0-9]+$/)) {
            const rucField = document.getElementById('new_c_ruc');
            if (rucField) rucField.value = searchVal;
        } else {
            const nameField = document.getElementById('new_c_name');
            if (nameField) nameField.value = searchVal;
        }
    }

    if (btnCancelCreateClient) {
        btnCancelCreateClient.addEventListener('click', () => {
            modalCreateState.style.display = 'none';
            modalSearchState.style.display = 'block';
        });
    }

    if (newClientForm) {
        newClientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('btnGuardarDir');
            const successMsg = document.getElementById('createSuccessMsg');
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Guardando...';
            }
            
            const newClient = {
                ruc: document.getElementById('new_c_ruc').value,
                name: document.getElementById('new_c_name').value,
                address: document.getElementById('new_c_address').value,
                contact: document.getElementById('new_c_contact').value,
                phone: document.getElementById('new_c_phone').value,
                email: document.getElementById('new_c_email').value
            };
            
            const saved = saveClient(newClient);
            
            // Show success message briefly before closing
            if (successMsg) {
                successMsg.style.display = 'block';
                setTimeout(() => {
                    selectClient(saved);
                }, 1200);
            } else {
                selectClient(saved);
            }
        });
    }

    // ==========================================
    // GENERACIÓN DE PDF CORPORATIVO (html2canvas + jsPDF)
    // ==========================================
    btnGeneratePDF.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // 1. Gather Data
        const data = {
            cliente: document.getElementById('c_cliente').value || 'Cliente No Especificado',
            ruc: document.getElementById('c_ruc').value || '---',
            contacto: document.getElementById('c_contacto').value || '---',
            direccion: document.getElementById('c_direccion').value || '---',
            asunto: document.getElementById('c_asunto').value || 'Cotización',
            equipo: document.getElementById('c_equipo').value || '---',
            serie: document.getElementById('c_serie').value || '---',
            entrega: document.getElementById('c_entrega').value,
            garantia: document.getElementById('c_garantia').value,
            pago: document.getElementById('c_pago').value,
            fecha: new Date().toLocaleDateString('es-PE'),
            numero: 'COT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
            items: [],
            subtotal: elSumSub.textContent,
            igv: elSumIgv.textContent,
            total: elSumTotal.textContent
        };

        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            data.items.push({
                desc: row.querySelector('.desc').value,
                qty: row.querySelector('.qty').value,
                price: row.querySelector('.price_sale').value,
                total: (parseFloat(row.querySelector('.qty').value) * parseFloat(row.querySelector('.price_sale').value)).toFixed(2)
            });
        });

        if (data.items.length === 0 || !data.items[0].desc) {
            alert("Añade al menos un ítem válido antes de generar la cotización.");
            return;
        }

        const originalBtnText = btnGeneratePDF.textContent;
        btnGeneratePDF.textContent = "Generando PDF...";
        btnGeneratePDF.disabled = true;

        try {
            // Generar HTML interno invisible y profesional para la factura
            const container = document.getElementById('pdfContainer');
            
            // Construir filas de tabla HTML para factura
            let itemsHTML = '';
            data.items.forEach((it, index) => {
                itemsHTML += `
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${index + 1}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${it.desc}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${it.qty}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${it.price}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">S/ ${it.total}</td>
                    </tr>
                `;
            });

            container.innerHTML = `
                <div style="padding: 50px; color: #1E293B; position: relative; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; min-height: 1000px;">
                    
                    <!-- Faint Watermark -->
                    <div style="position: absolute; top: 40%; left: 10%; opacity: 0.03; transform: rotate(-25deg); font-size: 180px; font-weight: 900; color: #0F6CBD; pointer-events: none; z-index: 0;">ZARLOP</div>
                    
                    <div style="position: relative; z-index: 1;">
                        <!-- Cabecera -->
                        <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #E2E8F0; padding-bottom: 30px; margin-bottom: 40px;">
                            <div>
                                <img src="../assets/logo.png" style="width: 250px; margin-bottom: 15px;">
                                <div style="font-size: 12px; color: #64748B; line-height: 1.6;">
                                    <strong>ZARLOP S.A.C.</strong><br>
                                    Servicios de Ingeniería Clínica y Soporte Técnico<br>
                                    RUC: 20602591868<br>
                                    Lima, Perú | (+51) 949 035 072 | info@zarlop.pe
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 10px; font-weight: 700; color: #0F6CBD; letter-spacing: 0.1em; text-transform: uppercase;">Propuesta Comercial</div>
                                <h1 style="color: #0F6CBD; font-size: 32px; font-weight: 800; margin: 5px 0 15px 0; letter-spacing: -0.02em;">COTIZACIÓN</h1>
                                <div style="background: #F4F7FA; padding: 12px 16px; border-radius: 8px; display: inline-block; text-align: right; border: 1px solid #E2E8F0;">
                                    <strong style="color: #1E293B; font-size: 14px;">N°: ${data.numero}</strong><br>
                                    <span style="color: #64748B; font-size: 12px;">Fecha de emisión: ${data.fecha}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Datos Cliente -->
                        <div style="display: flex; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 40px; overflow: hidden; background: #FFFFFF;">
                            <div style="width: 50%; padding: 20px; border-right: 1px solid #E2E8F0;">
                                <div style="font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Información del Cliente</div>
                                <strong style="display:block; font-size: 16px; color: #0F6CBD; margin-bottom: 10px;">${data.cliente}</strong>
                                <div style="font-size: 13px; margin-top: 4px; color: #475569;"><strong>RUC:</strong> ${data.ruc}</div>
                                <div style="font-size: 13px; margin-top: 4px; color: #475569;"><strong>Atención a:</strong> ${data.contacto}</div>
                                <div style="font-size: 13px; margin-top: 4px; color: #475569;"><strong>Dirección:</strong> ${data.direccion}</div>
                            </div>
                            <div style="width: 50%; padding: 20px; background: #F8FAFC;">
                                <div style="font-size: 10px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Detalles del Requerimiento</div>
                                <div style="font-size: 13px; margin-top: 4px; color: #475569;"><strong>Asunto:</strong> <span style="font-weight: 500; color: #1E293B;">${data.asunto}</span></div>
                                <div style="font-size: 13px; margin-top: 4px; color: #475569;"><strong>Equipo:</strong> ${data.equipo}</div>
                                <div style="font-size: 13px; margin-top: 4px; color: #475569;"><strong>N° Serie:</strong> ${data.serie}</div>
                            </div>
                        </div>

                        <!-- Tabla de Cotizacioon -->
                        <table style="width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                            <thead>
                                <tr style="background: #0F6CBD; color: white;">
                                    <th style="padding: 14px 10px; text-align: center; width: 5%; font-size: 12px; font-weight: 600;">Ítem</th>
                                    <th style="padding: 14px 10px; text-align: left; width: 50%; font-size: 12px; font-weight: 600;">Descripción del Servicio / Repuesto</th>
                                    <th style="padding: 14px 10px; text-align: center; width: 10%; font-size: 12px; font-weight: 600;">Cant.</th>
                                    <th style="padding: 14px 10px; text-align: right; width: 15%; font-size: 12px; font-weight: 600;">P. Unit.</th>
                                    <th style="padding: 14px 10px; text-align: right; width: 20%; font-size: 12px; font-weight: 600;">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHTML}
                            </tbody>
                        </table>

                        <!-- Totales y Condiciones -->
                        <div style="display: flex; justify-content: space-between;">
                            <div style="width: 55%; font-size: 12px; color: #475569; line-height: 1.6;">
                                <strong style="color:#0F6CBD; font-size: 13px;">Términos y Condiciones Comerciales:</strong>
                                <ul style="padding-left: 20px; margin-top: 8px;">
                                    <li><strong>Tiempo de entrega:</strong> ${data.entrega}</li>
                                    <li><strong>Condición de pago:</strong> ${data.pago}</li>
                                    <li><strong>Garantía:</strong> ${data.garantia}</li>
                                    <li><strong>Validez de la oferta:</strong> 15 días calendario</li>
                                    <li>Los precios presentados están expresados en Soles (PEN).</li>
                                </ul>
                                
                                <div style="margin-top: 60px; text-align: center; width: 240px;">
                                    <div style="border-top: 2px solid #CBD5E1; padding-top: 10px;">
                                        <strong style="color: #1E293B;">Aprobación del Cliente</strong><br>
                                        <span style="font-size: 10px; color:#94A3B8;">Firma y Sello (Conformidad)</span>
                                    </div>
                                </div>
                            </div>

                            <div style="width: 40%;">
                                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px;">
                                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                                        <tr>
                                            <td style="padding: 8px 0; color: #64748B;">Subtotal:</td>
                                            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1E293B;">${data.subtotal}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 8px 0; border-bottom: 2px solid #E2E8F0; color: #64748B;">I.G.V. (18%):</td>
                                            <td style="padding: 8px 0; border-bottom: 2px solid #E2E8F0; text-align: right; font-weight: 600; color: #1E293B;">${data.igv}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 16px 0 0 0; color: #0F6CBD; font-weight: 800; font-size: 18px;">TOTAL FINAL:</td>
                                            <td style="padding: 16px 0 0 0; text-align: right; color: #0F6CBD; font-weight: 800; font-size: 18px;">${data.total}</td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Pie de página -->
                        <div style="position: absolute; bottom: 40px; left: 50px; right: 50px; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 15px; font-size: 10px; color: #94A3B8;">
                            Este documento es una cotización formal emitida por ZARLOP S.A.C. La aceptación de este documento implica la conformidad con los términos técnicos y económicos descritos.<br>
                            Generado electrónicamente por el Sistema SGD - www.zarlop.pe
                        </div>
                    </div>
                </div>
            `;

            // Wait a bit to ensure image loads before rendering canvas
            await new Promise(r => setTimeout(r, 500)); 

            // Convert to Canvas
            const canvas = await html2canvas(container, {
                scale: 2, 
                useCORS: true, 
                backgroundColor: '#ffffff'
            });

            // Convert Canvas to PDF
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            // A4 is 210 x 297 mm
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Cotizacion_ZARLOP_${data.numero}.pdf`);

        } catch (error) {
            console.error(error);
            alert("Hubo un error al generar el PDF. Por favor, intente nuevamente.");
        } finally {
            btnGeneratePDF.textContent = originalBtnText;
            btnGeneratePDF.disabled = false;
        }

    });

    // ==========================================
    // AUTOCOMPLETADO DESDE EXPEDIENTE (INTEGRACIÓN ERP)
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const expId = urlParams.get('expediente');
    if (expId) {
        const correos = JSON.parse(localStorage.getItem('sgd_correos_db')) || [];
        const correoInfo = correos.find(c => c.id == expId);
        if (correoInfo) {
            // Intento de machar entidad con DB cliente para traer RUC y direccion
            const clients = getClients();
            const ai = correoInfo.ai_analysis || {};
            
            const targetName = ai.entidad || correoInfo.senderName;
            let matchedClient = clients.find(c => c.name.toLowerCase().includes(targetName.toLowerCase()));
            
            if (matchedClient) {
                selectClient(matchedClient);
            } else {
                if (inputCliente) inputCliente.value = targetName;
                if (inputCorreo) inputCorreo.value = correoInfo.senderEmail;
                if (inputContacto) inputContacto.value = correoInfo.senderName;
            }

            // Fill technical fields
            const inputAsunto = document.getElementById('c_asunto');
            const inputEquipo = document.getElementById('c_equipo');
            const inputEntrega = document.getElementById('c_entrega');
            const inputGarantia = document.getElementById('c_garantia');
            const inputPago = document.getElementById('c_pago');

            if (inputAsunto && ai.objeto) inputAsunto.value = ai.objeto;
            if (inputEquipo && ai.equipos) inputEquipo.value = ai.equipos;
            if (inputEntrega && ai.plazo) inputEntrega.value = ai.plazo;
            if (inputGarantia && ai.garantia) inputGarantia.value = ai.garantia;
            if (inputPago && ai.pago) inputPago.value = ai.pago;

            // Fill first row items if available
            if (ai.objeto && tbody) {
                const firstRow = tbody.querySelector('tr');
                if (firstRow) {
                    firstRow.querySelector('.desc').value = `Servicio: ${ai.objeto} - Equipos: ${ai.equipos}`;
                }
            }
        }
    }

});
