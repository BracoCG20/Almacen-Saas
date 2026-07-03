//backend/src/services/firmasService.js
const { pool } = require('../config/db');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const axios = require('axios');
const { uploadToCloudinary } = require('../middlewares/uploadMiddleware');

// 1. Obtener información del documento a firmar
const getDocumentoByToken = async (token) => {
  const query = `
    SELECT m.id, m.pdf_generado_url, m.tipo_movimiento, c.nombres, c.apellidos, c.dni, e.marca, e.modelo
    FROM historial_movimientos m
    JOIN colaboradores c ON m.colaborador_id = c.id
    JOIN equipos e ON m.equipo_id = e.id
    WHERE m.token_firma = $1 AND m.firma_valida = false
  `;
  const result = await pool.query(query, [token]);
  return result.rows[0];
};

// 2. Procesar la firma digital con DNI
const procesarFirmaDigital = async (token, dni_ingresado) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Validar Token y DNI
    const query = `
      SELECT m.id, m.pdf_generado_url, m.tipo_movimiento, c.nombres, c.apellidos, c.dni 
      FROM historial_movimientos m
      JOIN colaboradores c ON m.colaborador_id = c.id
      WHERE m.token_firma = $1 AND m.firma_valida = false
    `;
    const result = await client.query(query, [token]);

    if (result.rows.length === 0) {
      throw new Error('Enlace inválido o ya firmado.');
    }

    const mov = result.rows[0];

    if (mov.dni !== dni_ingresado) {
      throw new Error(
        'El DNI ingresado no coincide con el registrado en el sistema.',
      );
    }

    // 2. Obtener el PDF original
    let pdfBufferOriginal;
    try {
      if (mov.pdf_generado_url.startsWith('http')) {
        const response = await axios.get(mov.pdf_generado_url, {
          responseType: 'arraybuffer',
        });
        pdfBufferOriginal = response.data;
      } else {
        const fs = require('fs');
        const path = require('path');
        const localPath = path.join(__dirname, '../../', mov.pdf_generado_url);
        pdfBufferOriginal = fs.readFileSync(localPath);
      }
    } catch (err) {
      console.error('Error descargando el PDF original:', err);
      throw new Error('No se pudo obtener el PDF original para firmar.');
    }

    // 3. Estampar la firma en el PDF usando pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBufferOriginal);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    const fechaFirma = new Date().toLocaleString('es-PE');
    const textoFirma = `FIRMADO DIGITALMENTE POR:\nNombres: ${mov.nombres} ${mov.apellidos}\nDNI: ${mov.dni}\nFecha y Hora: ${fechaFirma}\nValidado por Sistema GTH`;

    lastPage.drawText(textoFirma, {
      x: 50,
      y: 80,
      size: 10,
      font: helveticaFont,
      color: rgb(0.1, 0.2, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    const bufferFirmado = Buffer.from(pdfBytes);

    // 4. Subir a Cloudinary con CARPETAS DINÁMICAS
    // Normalizamos el texto por si viene con mayúsculas o tildes
    const tipoMov = mov.tipo_movimiento.toLowerCase();

    let subcarpeta = 'Entregas';
    if (tipoMov.includes('devolucion') || tipoMov.includes('devolución')) {
      subcarpeta = 'Devoluciones';
    }

    const rutaCloudinary = `Actas Firmadas/${subcarpeta}`;

    const pdfFirmadoUrl = await uploadToCloudinary(
      bufferFirmado,
      rutaCloudinary,
    );

    // 5. Actualizar la base de datos con la URL segura de Cloudinary
    await client.query(
      `
      UPDATE historial_movimientos 
      SET pdf_firmado_url = $1, firma_valida = true, token_firma = NULL 
      WHERE id = $2
      `,
      [pdfFirmadoUrl, mov.id],
    );

    await client.query('COMMIT');

    return {
      id: mov.id,
      pdf_url: pdfFirmadoUrl,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getDocumentoByToken,
  procesarFirmaDigital,
};
