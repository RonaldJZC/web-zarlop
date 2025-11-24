// ===================================
// CONTACTS ROUTES
// ===================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const validator = require('validator');

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

// Create new contact
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, service_type, message } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !service_type || !message) {
            return res.status(400).json({
                error: 'Todos los campos son requeridos'
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

        const result = await query(
            `INSERT INTO contacts (name, email, phone, service_type, message, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email, phone, service_type, message, ip_address, user_agent]
        );

        res.status(201).json({
            success: true,
            message: 'Contacto creado exitosamente',
            data: {
                id: result.insertId,
                name,
                email,
                phone,
                service_type,
                message
            }
        });

    } catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({
            error: 'Error al crear contacto'
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
