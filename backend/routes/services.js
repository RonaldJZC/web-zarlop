// ===================================
// SERVICES ROUTES
// ===================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all services
router.get('/', async (req, res) => {
    try {
        const { is_active = 'true' } = req.query;

        let sql = 'SELECT * FROM services WHERE 1=1';
        const params = [];

        if (is_active !== 'all') {
            sql += ' AND is_active = ?';
            params.push(is_active === 'true');
        }

        sql += ' ORDER BY display_order ASC, name ASC';

        const services = await query(sql, params);

        res.json({
            success: true,
            data: services
        });

    } catch (error) {
        console.error('Get services error:', error);
        res.status(500).json({
            error: 'Error al obtener servicios'
        });
    }
});

// Get single service
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const services = await query(
            'SELECT * FROM services WHERE id = ? OR slug = ?',
            [id, id]
        );

        if (services.length === 0) {
            return res.status(404).json({
                error: 'Servicio no encontrado'
            });
        }

        res.json({
            success: true,
            data: services[0]
        });

    } catch (error) {
        console.error('Get service error:', error);
        res.status(500).json({
            error: 'Error al obtener servicio'
        });
    }
});

// Create new service
router.post('/', async (req, res) => {
    try {
        const { name, slug, description, short_description, icon, features, display_order } = req.body;

        if (!name || !slug) {
            return res.status(400).json({
                error: 'Nombre y slug son requeridos'
            });
        }

        const result = await query(
            `INSERT INTO services (name, slug, description, short_description, icon, features, display_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, slug, description, short_description, icon, JSON.stringify(features), display_order || 0]
        );

        res.status(201).json({
            success: true,
            message: 'Servicio creado exitosamente',
            data: {
                id: result.insertId,
                name,
                slug
            }
        });

    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({
            error: 'Error al crear servicio'
        });
    }
});

// Update service
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, slug, description, short_description, icon, features, is_active, display_order } = req.body;

        await query(
            `UPDATE services 
             SET name = ?, slug = ?, description = ?, short_description = ?, 
                 icon = ?, features = ?, is_active = ?, display_order = ?
             WHERE id = ?`,
            [name, slug, description, short_description, icon,
                JSON.stringify(features), is_active, display_order, id]
        );

        res.json({
            success: true,
            message: 'Servicio actualizado exitosamente'
        });

    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({
            error: 'Error al actualizar servicio'
        });
    }
});

// Delete service
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await query('DELETE FROM services WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Servicio eliminado exitosamente'
        });

    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({
            error: 'Error al eliminar servicio'
        });
    }
});

module.exports = router;
