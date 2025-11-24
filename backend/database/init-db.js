// ===================================
// DATABASE INITIALIZATION SCRIPT
// ===================================

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
    console.log('🚀 Iniciando configuración de base de datos...\n');

    let connection;

    try {
        // Connect to MySQL (without database)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log('✅ Conectado a MySQL');

        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        console.log('📝 Ejecutando schema...');
        await connection.query(schema);
        console.log('✅ Schema ejecutado correctamente');

        // Use the database
        await connection.query(`USE ${process.env.DB_NAME || 'zarlop_db'}`);

        // Hash admin password
        const adminPassword = process.env.ADMIN_PASSWORD || 'zarlop2025';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Update admin user with hashed password
        await connection.query(
            'UPDATE users SET password_hash = ? WHERE username = ?',
            [hashedPassword, 'admin']
        );

        console.log('✅ Usuario administrador configurado');
        console.log('\n📊 Resumen de la base de datos:');

        // Get table counts
        const [tables] = await connection.query('SHOW TABLES');
        console.log(`   - Tablas creadas: ${tables.length}`);

        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`   - Usuarios: ${users[0].count}`);

        const [services] = await connection.query('SELECT COUNT(*) as count FROM services');
        console.log(`   - Servicios: ${services[0].count}`);

        const [equipment] = await connection.query('SELECT COUNT(*) as count FROM equipment');
        console.log(`   - Equipos: ${equipment[0].count}`);

        console.log('\n✅ Base de datos inicializada correctamente!');
        console.log('\n🔐 Credenciales de administrador:');
        console.log(`   Usuario: admin`);
        console.log(`   Contraseña: ${adminPassword}`);
        console.log('\n🌐 Puedes iniciar el servidor con: npm start');

    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run initialization
initializeDatabase();
