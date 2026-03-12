require('dotenv').config();
const { pool } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('⏳ Creando base para el SuperAdmin...');

    // 1. Crea Rol SuperAdmin (Se da el ID 1 forzado para asegurar orden)
    await client.query(`
            INSERT INTO roles (id, nombre, descripcion) 
            VALUES (1, 'SuperAdmin', 'Control total del sistema') 
            ON CONFLICT (id) DO NOTHING;
        `);

    // 2. Crea Empresa Base (Grupo SP)
    await client.query(`
            INSERT INTO empresas (id, razon_social, ruc) 
            VALUES (1, 'Grupo SP', '20000000001') 
            ON CONFLICT (ruc) DO NOTHING;
        `);

    // 3. Crea el Colaborador asociado al SuperAdmin (Le ponemos ID 1 forzado para asegurar orden)
    await client.query(`
            INSERT INTO colaboradores (id, empresa_id, dni, nombres, apellidos, email_contacto, cargo, tipo_vinculo)
            VALUES (1, 1, '00000000', 'Cristian', 'Braco', 'cbraco@gruposp.pe', 'Practicante TI', 'Planilla')
            ON CONFLICT (dni) DO NOTHING;
        `);

    // 4. Hashear contraseña y crear Usuario
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('NOSQLMy.', salt);

    await client.query(
      `
            INSERT INTO usuarios (colaborador_id, rol_id, nickname, email_login, password_hash, estado, requiere_cambio_password)
            VALUES (1, 1, 'Cristian', 'cbraco@gruposp.pe', $1, true, false)
            ON CONFLICT (email_login) DO NOTHING;
        `,
      [hash],
    );

    await client.query('COMMIT');
    console.log('¡SuperAdmin creado con éxito!.');
    console.log('Correo: cbraco@gruposp.pe');
    console.log('Clave: NOSQLMy.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando SuperAdmin:', error);
  } finally {
    client.release();
    process.exit();
  }
}

createSuperAdmin();
