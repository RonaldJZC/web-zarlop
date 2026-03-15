// ===================================
// CONTACTS ROUTES
// ===================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const validator = require('validator');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

// Get all contacts
router.get('/', async (req, res) => {
    try {
        const { status, service_type, limit = 100, offset = 0 } = req.query;

        let sql = 'SELECT * FROM contacts WHERE 1=1';
        const params = [];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        if (service_type) {
            sql += ' AND service_type = ?';
            params.push(service_type);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const contacts = await query(sql, params);

        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM contacts WHERE 1=1';
        const countParams = [];

        if (status) {
            countSql += ' AND status = ?';
            countParams.push(status);
        }

        if (service_type) {
            countSql += ' AND service_type = ?';
            countParams.push(service_type);
        }

        const [{ total }] = await query(countSql, countParams);

        res.json({
            success: true,
            data: contacts,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });

    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            error: 'Error al obtener contactos'
        });
    }
});

// Get single contact
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const contacts = await query(
            'SELECT * FROM contacts WHERE id = ?',
            [id]
        );

        if (contacts.length === 0) {
            return res.status(404).json({
                error: 'Contacto no encontrado'
            });
        }

        res.json({
            success: true,
            data: contacts[0]
        });

    } catch (error) {
        console.error('Get contact error:', error);
        res.status(500).json({
            error: 'Error al obtener contacto'
        });
    }
});

// Create new diagnostic request (Pre-Diagnóstico Técnico)
router.post('/', upload.single('equipo_image'), async (req, res) => {
    try {
        const { 
            name, 
            institucion, 
            email, 
            phone, 
            service_type, // This will be the legacy service_type field in DB
            tipo_equipo,
            tipo_falla,
            marca,
            modelo,
            message 
        } = req.body;

        const file = req.file;

        // Validate required fields
        if (!name || !email || !phone || !tipo_equipo || !tipo_falla || !message) {
            return res.status(400).json({
                error: 'Los campos marcados como obligatorios son requeridos.'
            });
        }

        // Validate email
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                error: 'Email inválido'
            });
        }

        // Get client IP and user agent
        const ip_address = req.ip || req.connection.remoteAddress;
        const user_agent = req.headers['user-agent'];

        // Save to database (Mapping new fields to existing schema where possible, or we could extend it)
        // For simplicity, we'll store extra info in the message or a JSON field if we have it.
        // Given we don't want to run migrations right now, let's store comprehensive info in 'message' if needed.
        const fullMessage = `
--- DETALLES PRE-DIAGNÓSTICO ---
Institución: ${institucion || 'No especificada'}
Tipo Equipo: ${tipo_equipo}
Tipo Falla: ${tipo_falla}
Marca: ${marca || 'N/A'}
Modelo: ${modelo || 'N/A'}
Imagen: ${file ? file.filename : 'Sin imagen'}
-----------------------------
MENSAJE:
${message}
        `;

        const result = await query(
            `INSERT INTO contacts (name, email, phone, service_type, message, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email, phone, tipo_equipo, fullMessage, ip_address, user_agent]
        );

        // Send institutional email
        // You will receive and review this data in the email inbox: zronald.zarlop@gmail.com
        const mailOptions = {
            from: `"Web ZARLOP" <${process.env.SMTP_USER}>`,
            to: 'zronald.zarlop@gmail.com',
            subject: 'Solicitud enviada desde la web ZARLOP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="background: #0F6CBD; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 20px;">Solicitud de Pre-Diagnóstico Técnico</h1>
                    </div>
                    
                    <div style="padding: 20px; color: #333;">
                        <h2 style="color: #0F6CBD; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px;">Datos del Solicitante</h2>
                        <p><strong>Nombre Completo:</strong> ${name}</p>
                        <p><strong>Institución/Clínica:</strong> ${institucion || 'N/A'}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Teléfono:</strong> ${phone}</p>
                        
                        <h2 style="color: #0F6CBD; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px;">Información del Equipo</h2>
                        <p><strong>Tipo de Equipo:</strong> ${tipo_equipo}</p>
                        <p><strong>Tipo de Falla:</strong> ${tipo_falla}</p>
                        <p><strong>Marca:</strong> ${marca || 'N/A'}</p>
                        <p><strong>Modelo:</strong> ${modelo || 'N/A'}</p>
                        
                        <h2 style="color: #0F6CBD; font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 25px;">Descripción de la Falla</h2>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #0F6CBD;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
                        Este mensaje fue enviado desde el formulario de Pre-Diagnóstico de la web Zarlop S.A.C.
                        ${file ? '<br><strong>Se ha adjuntado una imagen del equipo.</strong>' : ''}
                    </div>
                </div>
            `,
            attachments: file ? [
                {
                    filename: file.originalname,
                    path: file.path
                }
            ] : []
        };

        // Send email
        transporter.sendMail(mailOptions).catch(err => {
            console.error('Email sending error:', err);
        });

        res.status(201).json({
            success: true,
            message: 'Solicitud recibida correctamente.'
        });

    } catch (error) {
        console.error('Diagnostic request error:', error);
        res.status(500).json({
            error: 'Error al procesar la solicitud. Por favor intente más tarde.'
        });
    }
});

// Update contact status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assigned_to, priority } = req.body;

        const updates = [];
        const params = [];

        if (status) {
            updates.push('status = ?');
            params.push(status);
        }

        if (assigned_to !== undefined) {
            updates.push('assigned_to = ?');
            params.push(assigned_to);
        }

        if (priority) {
            updates.push('priority = ?');
            params.push(priority);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: 'No hay campos para actualizar'
            });
        }

        params.push(id);

        await query(
            `UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'Contacto actualizado exitosamente'
        });

    } catch (error) {
        console.error('Update contact error:', error);
        res.status(500).json({
            error: 'Error al actualizar contacto'
        });
    }
});

// Delete contact
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await query('DELETE FROM contacts WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Contacto eliminado exitosamente'
        });

    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({
            error: 'Error al eliminar contacto'
        });
    }
});

// Get contact statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_contacts,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
                SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
            FROM contacts
        `);

        const byService = await query(`
            SELECT service_type, COUNT(*) as count
            FROM contacts
            GROUP BY service_type
        `);

        res.json({
            success: true,
            data: {
                summary: stats[0],
                by_service: byService
            }
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas'
        });
    }
});

module.exports = router;

