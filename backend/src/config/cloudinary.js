const cloudinary = require('cloudinary').v2;
const { pool } = require('./db');

/**
 * INICIALIZADOR DE CLOUDINARY
 * Esta función viaja a la BD, extrae las credenciales activas y configura la instancia global.
 */
const initCloudinary = async () => {
  try {
    const result = await pool.query(
      'SELECT cloud_name, api_key, api_secret FROM cloudinary_key WHERE activo = true LIMIT 1',
    );

    if (result.rows.length > 0) {
      const creds = result.rows[0];

      // Configuramos la instancia global de Cloudinary
      cloudinary.config({
        cloud_name: creds.cloud_name,
        api_key: creds.api_key,
        api_secret: creds.api_secret,
      });

      console.log('✅ Cloudinary configurado correctamente desde la BD');
    } else {
      console.warn('⚠️ No se encontraron credenciales de Cloudinary en la BD');
    }
  } catch (error) {
    console.error(
      '❌ Error al cargar credenciales de Cloudinary:',
      error.message,
    );
  }
};

module.exports = { cloudinary, initCloudinary };
