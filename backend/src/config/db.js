const { Pool } = require('pg');
require('dotenv').config();

const isLocalhost =
  process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1';

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

// Confirmar conexión a BD
pool.on('connect', () => {
  console.log('✅ Base de Datos conectada exitosamente');
});

// Manejo de errores
pool.on('error', (err) => {
  console.error('❌ Error inesperado en el cliente inactivo', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
