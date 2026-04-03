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
                <div style="padding: 40px; color: #333; position: relative;">
                    <!-- Cabecera -->
                    <div style="display: flex; justify-content: space-between; border-bottom: 3px solid #0F6CBD; padding-bottom: 20px; margin-bottom: 30px;">
                        <div>
                            <!-- Img must have crossorigin if generated dynamically, but relative is fine for html2canvas as long as it's same domain -->
                            <img src="../assets/logo.png" style="width: 250px; margin-bottom: 10px;">
                            <div style="font-size: 11px; color: #666; line-height: 1.5;">
                                <strong>ZARLOP S.A.C.</strong><br>
                                Soluciones Electrónicas y Biomédicas<br>
                                RUC: 20602591868<br>
                                Lima, Perú | (+51) 949 035 072
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <h1 style="color: #0F6CBD; font-size: 28px; margin: 0 0 5px 0;">COTIZACIÓN</h1>
                            <div style="background: #f4f4f4; padding: 10px; border-radius: 5px; display: inline-block;">
                                <strong style="color: #000;">N°: ${data.numero}</strong><br>
                                Fecha: ${data.fecha}
                            </div>
                        </div>
                    </div>

                    <!-- Datos Cliente -->
                    <div style="display: flex; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 30px; overflow: hidden;">
                        <div style="width: 50%; padding: 15px; border-right: 1px solid #ddd;">
                            <div style="font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Información del Cliente</div>
                            <strong style="display:block; font-size: 14px;">${data.cliente}</strong>
                            <div style="font-size: 12px; margin-top: 5px;"><strong>RUC:</strong> ${data.ruc}</div>
                            <div style="font-size: 12px; margin-top: 2px;"><strong>Atención a:</strong> ${data.contacto}</div>
                            <div style="font-size: 12px; margin-top: 2px;"><strong>Dirección:</strong> ${data.direccion}</div>
                        </div>
                        <div style="width: 50%; padding: 15px; background: #fafafa;">
                            <div style="font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 5px;">Detalles del Requerimiento</div>
                            <div style="font-size: 12px; margin-top: 2px;"><strong>Asunto:</strong> ${data.asunto}</div>
                            <div style="font-size: 12px; margin-top: 2px;"><strong>Equipo:</strong> ${data.equipo}</div>
                            <div style="font-size: 12px; margin-top: 2px;"><strong>Serie:</strong> ${data.serie}</div>
                        </div>
                    </div>

                    <!-- Tabla de Cotizacioon -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                        <thead>
                            <tr style="background: #0F6CBD; color: white;">
                                <th style="padding: 10px; text-align: center; width: 5%;">Ítem</th>
                                <th style="padding: 10px; text-align: left; width: 50%;">Descripción del Servicio / Repuesto</th>
                                <th style="padding: 10px; text-align: center; width: 10%;">Cant.</th>
                                <th style="padding: 10px; text-align: right; width: 15%;">P. Unit.</th>
                                <th style="padding: 10px; text-align: right; width: 20%;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>

                    <!-- Totales y Condiciones -->
                    <div style="display: flex; justify-content: space-between;">
                        <div style="width: 60%; font-size: 11px; color: #444;">
                            <strong style="color:#0F6CBD;">Términos y Condiciones:</strong>
                            <ul style="padding-left: 15px; margin-top: 5px;">
                                <li><strong>Tiempo de entrega:</strong> ${data.entrega}</li>
                                <li><strong>Condición de pago:</strong> ${data.pago}</li>
                                <li><strong>Garantía:</strong> ${data.garantia}</li>
                                <li><strong>Validez de la oferta:</strong> 15 días calendario</li>
                                <li>Los precios presentados están expresados en Soles (PEN).</li>
                            </ul>
                            
                            <div style="margin-top: 50px; text-align: center; width: 200px;">
                                <div style="border-top: 1px solid #000; padding-top: 5px;">
                                    <strong>Aprobación del Cliente</strong><br>
                                    <span style="font-size: 9px; color:#666;">Firma y Sello</span>
                                </div>
                            </div>
                        </div>

                        <div style="width: 35%;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 10px; text-align: right; border: 1px solid #ddd;"><strong>Subtotal:</strong></td>
                                    <td style="padding: 8px 10px; text-align: right; border: 1px solid #ddd;">${data.subtotal}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 10px; text-align: right; border: 1px solid #ddd;"><strong>I.G.V. (18%):</strong></td>
                                    <td style="padding: 8px 10px; text-align: right; border: 1px solid #ddd;">${data.igv}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 10px; text-align: right; background: #0F6CBD; color: white; font-weight: bold; font-size: 14px;"><strong>TOTAL:</strong></td>
                                    <td style="padding: 12px 10px; text-align: right; background: #0F6CBD; color: white; font-weight: bold; font-size: 14px;">${data.total}</td>
                                </tr>
                            </table>
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
