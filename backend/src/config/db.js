const { Pool } = require("pg");
require("dotenv").config();

// Creamos el Pool de conexiones
const pool = new Pool({
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	database: process.env.DB_NAME,
});

// Evento para confirmar conexión exitosa
pool.on("connect", () => {
	console.log("✅ Base de Datos conectada exitosamente");
});

// Manejo de errores en el pool
pool.on("error", (err) => {
	console.error("❌ Error inesperado en el cliente inactivo", err);
	process.exit(-1);
});

module.exports = {
	query: (text, params) => pool.query(text, params),
	pool, // exportamos el pool por si necesitamos transacciones complejas luego
};
