// ===================================
// EQUIPMENT ROUTES
// ===================================

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all equipment
router.get('/', async (req, res) => {
    try {
        const { category, is_active = 'true' } = req.query;

        let sql = 'SELECT * FROM equipment WHERE 1=1';
        const params = [];

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        if (is_active !== 'all') {
            sql += ' AND is_active = ?';
            params.push(is_active === 'true');
        }

        sql += ' ORDER BY name ASC';

        const equipment = await query(sql, params);

        res.json({
            success: true,
            data: equipment
        });

    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({
            error: 'Error al obtener equipos'
        });
    }
});

// Get single equipment
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const equipment = await query(
            'SELECT * FROM equipment WHERE id = ?',
            [id]
        );

        if (equipment.length === 0) {
            return res.status(404).json({
                error: 'Equipo no encontrado'
            });
        }

        res.json({
            success: true,
            data: equipment[0]
        });

    } catch (error) {
        console.error('Get equipment error:', error);
        res.status(500).json({
            error: 'Error al obtener equipo'
        });
    }
});

// Create new equipment
router.post('/', async (req, res) => {
    try {
        const { name, category, description, manufacturer, model, specifications, image_url } = req.body;

        if (!name || !category) {
            return res.status(400).json({
                error: 'Nombre y categoría son requeridos'
            });
        }

        const result = await query(
            `INSERT INTO equipment (name, category, description, manufacturer, model, specifications, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, category, description, manufacturer, model, JSON.stringify(specifications), image_url]
        );

        res.status(201).json({
            success: true,
            message: 'Equipo creado exitosamente',
            data: {
                id: result.insertId,
                name,
                category
            }
        });

    } catch (error) {
        console.error('Create equipment error:', error);
        res.status(500).json({
            error: 'Error al crear equipo'
        });
    }
});

// Update equipment
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, manufacturer, model, specifications, image_url, is_active } = req.body;

        await query(
            `UPDATE equipment 
             SET name = ?, category = ?, description = ?, manufacturer = ?, 
                 model = ?, specifications = ?, image_url = ?, is_active = ?
             WHERE id = ?`,
            [name, category, description, manufacturer, model,
                JSON.stringify(specifications), image_url, is_active, id]
        );

        res.json({
            success: true,
            message: 'Equipo actualizado exitosamente'
        });

    } catch (error) {
        console.error('Update equipment error:', error);
        res.status(500).json({
            error: 'Error al actualizar equipo'
        });
    }
});

// Delete equipment
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await query('DELETE FROM equipment WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Equipo eliminado exitosamente'
        });

    } catch (error) {
        console.error('Delete equipment error:', error);
        res.status(500).json({
            error: 'Error al eliminar equipo'
        });
    }
});

// Get equipment by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;

        const equipment = await query(
            'SELECT * FROM equipment WHERE category = ? AND is_active = TRUE ORDER BY name ASC',
            [category]
        );

        res.json({
            success: true,
            data: equipment
        });

    } catch (error) {
        console.error('Get equipment by category error:', error);
        res.status(500).json({
            error: 'Error al obtener equipos por categoría'
        });
    }
});

module.exports = router;
