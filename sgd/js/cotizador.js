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

});
