const { pool } = require('../config/db');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// 1. Obtener información del documento a firmar (Público)
const getInfoFirma = async (req, res) => {
  const { token } = req.params;
  try {
    const query = `
      SELECT m.id, m.pdf_generado_url, m.tipo_movimiento, c.nombres, c.apellidos, c.dni, e.marca, e.modelo
      FROM historial_movimientos m
      JOIN colaboradores c ON m.colaborador_id = c.id
      JOIN equipos e ON m.equipo_id = e.id
      WHERE m.token_firma = $1 AND m.firma_valida = false
    `;
    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error:
          'El enlace es inválido, ya expiró o el documento ya fue firmado.',
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

// 2. Procesar la firma digital con DNI
const procesarFirma = async (req, res) => {
  const { token } = req.params;
  const { dni_ingresado } = req.body;
  const client = await pool.connect();

  try {
    // 1. Validar Token y DNI
    const query = `
      SELECT m.id, m.pdf_generado_url, c.nombres, c.apellidos, c.dni 
      FROM historial_movimientos m
      JOIN colaboradores c ON m.colaborador_id = c.id
      WHERE m.token_firma = $1 AND m.firma_valida = false
    `;
    const result = await client.query(query, [token]);

    if (result.rows.length === 0)
      throw new Error('Enlace inválido o ya firmado.');

    const mov = result.rows[0];

    if (mov.dni !== dni_ingresado) {
      return res.status(400).json({
        error: 'El DNI ingresado no coincide con el registrado en el sistema.',
      });
    }

    // 2. Estampar la firma en el PDF
    const originalPdfPath = path.join(
      __dirname,
      '../../',
      mov.pdf_generado_url,
    );
    if (!fs.existsSync(originalPdfPath))
      throw new Error('El PDF original no se encuentra en el servidor.');

    const existingPdfBytes = fs.readFileSync(originalPdfPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // Incrustar fuente
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Obtener la última página
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];

    // Dibujar el sello de firma
    const fechaFirma = new Date().toLocaleString('es-PE');
    const textoFirma = `FIRMADO DIGITALMENTE POR:\nNombres: ${mov.nombres} ${mov.apellidos}\nDNI: ${mov.dni}\nFecha y Hora: ${fechaFirma}\nValidado por Sistema GTH`;

    lastPage.drawText(textoFirma, {
      x: 50,
      y: 80,
      size: 10,
      font: helveticaFont,
      color: rgb(0.1, 0.2, 0.5), // Azul oscuro
    });

    const pdfBytes = await pdfDoc.save();

    // Guardar el nuevo PDF firmado
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const firmadoFileName = `firmado-${uniqueSuffix}.pdf`;
    const firmadoRelativePath = `/uploads/Firmados/${firmadoFileName}`;
    const firmadoAbsolutePath = path.join(
      __dirname,
      '../../uploads/Firmados',
      firmadoFileName,
    );

    fs.writeFileSync(firmadoAbsolutePath, pdfBytes);

    // 3. Actualizar la base de datos
    await client.query(
      `
      UPDATE historial_movimientos 
      SET pdf_firmado_url = $1, firma_valida = true, token_firma = NULL 
      WHERE id = $2
    `,
      [firmadoRelativePath, mov.id],
    );

    // 4. Emitir evento por Socket.io para recargar la tabla del admin en vivo
    const io = req.app.get('io');
    io.emit('documento_firmado', {
      id: mov.id,
      mensaje: 'Un documento acaba de ser firmado',
    });

    res.json({
      message: 'Documento firmado exitosamente.',
      pdf_url: firmadoRelativePath,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: error.message || 'Error al procesar la firma.' });
  } finally {
    client.release();
  }
};

module.exports = { getInfoFirma, procesarFirma };
