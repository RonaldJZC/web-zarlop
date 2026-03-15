// ===================================
// ZARLOP S.A.C. - BACKEND SERVER
// ===================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===================================
// MIDDLEWARE
// ===================================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}));

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '..')));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.'
});
app.use('/api/', limiter);

// ===================================
// ROUTES
// ===================================

// Import routes
const contactRoutes = require('./routes/contacts');
const contactRoutes = require('./routes/contacts');
const equipmentRoutes = require('./routes/equipment');
const serviceRoutes = require('./routes/services');

// Use routes
app.use('/api/contacts', contactRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/services', serviceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Zarlop API is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint - serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ===================================
// ERROR HANDLING
// ===================================

// 404 handler
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: 'Endpoint no encontrado',
            path: req.path
        });
    }

    res.status(404).sendFile(path.join(__dirname, '..', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===================================
// START SERVER
// ===================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║   ZARLOP S.A.C. - API SERVER              ║
║   Soluciones Electrónicas                 ║
╚═══════════════════════════════════════════╝

🚀 Server running on port ${PORT}
📡 Environment: ${process.env.NODE_ENV || 'development'}
🌐 API URL: http://localhost:${PORT}
📚 Docs: http://localhost:${PORT}/api/health

Press CTRL+C to stop
    `);
});

module.exports = app;
