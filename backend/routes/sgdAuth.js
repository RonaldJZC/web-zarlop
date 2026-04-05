const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Credenciales Hardcodeadas (MVP)
// TODO: En Fase 2 conectar a base de datos.
const ADMIN_USER = process.env.SGD_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.SGD_ADMIN_PASS || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'ZARLOP_SGD_S3CR3T_KEY_2026_COMPLEX';

// Route: POST /api/sgd/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        // Generar Token
        const token = jwt.sign(
            { id: 1, role: 'admin', username: ADMIN_USER },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            success: true,
            token,
            user: { username: ADMIN_USER, role: 'admin' }
        });
    }

    // Falla la autenticación
    return res.status(401).json({ error: 'Credenciales incorrectas' });
});

// Route: GET /api/sgd/verify
// Verifica si el token actual es válido (usado en el frontend para proteger vistas)
router.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ success: true, user: decoded });
    } catch (err) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
});

module.exports = router;
