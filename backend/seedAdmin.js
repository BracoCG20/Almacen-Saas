require("dotenv").config();
const { pool } = require("./src/config/db");
const bcrypt = require("bcryptjs");

async function createSuperAdmin() {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		console.log("⏳ Creando base para el SuperAdmin...");

		// 1. Crear Rol SuperAdmin (Le ponemos ID 1 forzado para asegurar orden)
		await client.query(`
            INSERT INTO roles (id, nombre, descripcion) 
            VALUES (1, 'SuperAdmin', 'Control total del sistema') 
            ON CONFLICT (id) DO NOTHING;
        `);

		// 2. Crear Empresa Base (Grupo SP)
		await client.query(`
            INSERT INTO empresas (id, razon_social, ruc) 
            VALUES (1, 'Grupo SP', '20000000001') 
            ON CONFLICT (ruc) DO NOTHING;
        `);

		// 3. Crear el Colaborador asociado a ti
		await client.query(`
            INSERT INTO colaboradores (id, empresa_id, dni, nombres, apellidos, email_contacto, cargo, tipo_vinculo)
            VALUES (1, 1, '00000000', 'Admin', 'Grupo SP', 'cbraco@gruposp.pe', 'Gerente TI', 'Planilla')
            ON CONFLICT (dni) DO NOTHING;
        `);

		// 4. Hashear tu contraseña y crear tu Usuario
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash("NOSQLMy.", salt); // Hasheando tu clave

		await client.query(
			`
            INSERT INTO usuarios (colaborador_id, rol_id, nickname, email_login, password_hash, estado, requiere_cambio_password)
            VALUES (1, 1, 'admin_sp', 'cbraco@gruposp.pe', $1, true, false)
            ON CONFLICT (email_login) DO NOTHING;
        `,
			[hash],
		);

		await client.query("COMMIT");
		console.log("✅ ¡SuperAdmin creado con éxito! Ya puedes iniciar sesión.");
		console.log("👉 Correo: cbraco@gruposp.pe");
		console.log("👉 Clave: NOSQLMy.");
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("❌ Error creando SuperAdmin:", error);
	} finally {
		client.release();
		process.exit(); // Cerramos el script
	}
}

createSuperAdmin();
