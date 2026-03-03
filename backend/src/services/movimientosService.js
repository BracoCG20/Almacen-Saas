const { pool } = require('../config/db');
const emailService = require('./emailService');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const getHistorial = async () => {
  const query = `
    SELECT 
      m.id, m.fecha_movimiento, m.tipo_movimiento as tipo, m.cargador_incluido as cargador, 
      m.observaciones, m.motivo_movimiento as motivo, m.colaborador_id as empleado_id, 
      m.equipo_id, m.pdf_firmado_url, m.pdf_generado_url, m.firma_valida, m.correo_enviado, m.estado_equipo_id,
      st.nombre as estado_equipo_momento, e.marca, e.modelo, e.numero_serie as serie, 
      c.nombres as empleado_nombre, c.apellidos as empleado_apellido, c.dni, c.email_contacto as empleado_correo,
      u.nombres as admin_nombre, uc.email_login as admin_correo,
      CASE 
        WHEN m.tipo_movimiento = 'entrega' THEN 
          AGE(
            COALESCE(
              (SELECT MIN(m2.fecha_movimiento)
               FROM historial_movimientos m2 
               WHERE m2.equipo_id = m.equipo_id AND m2.colaborador_id = m.colaborador_id AND m2.tipo_movimiento = 'devolucion' AND m2.fecha_movimiento > m.fecha_movimiento),
              NOW()
            ), m.fecha_movimiento
          )
        ELSE NULL 
      END as tiempo_uso
    FROM historial_movimientos m
    JOIN equipos e ON m.equipo_id = e.id
    JOIN colaboradores c ON m.colaborador_id = c.id
    LEFT JOIN estados_equipos st ON m.estado_equipo_id = st.id
    LEFT JOIN usuarios uc ON m.usuario_creacion_id = uc.id
    LEFT JOIN colaboradores u ON uc.colaborador_id = u.id
    ORDER BY m.fecha_movimiento DESC
  `;
  const response = await pool.query(query);
  return response.rows;
};

// Función auxiliar para guardar el archivo PDF físico en la carpeta Originales
const guardarPdfEnDisco = (buffer, tipo) => {
  const uploadDir = path.join(__dirname, '../../uploads/Originales');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${tipo}-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/Originales/${fileName}`;
};

const registrarEntrega = async (data, adminId, archivoPDF) => {
  const client = await pool.connect();
  let movimientoId = null;
  let tokenFirma = null;
  let pathPdfGenerado = null;

  // Si viene el PDF desde el frontend (Asignación con correo)
  if (archivoPDF) {
    tokenFirma = uuidv4();
    pathPdfGenerado = guardarPdfEnDisco(archivoPDF.buffer, 'entrega');
  }

  try {
    await client.query('BEGIN');

    // Validar disponibilidad
    const checkEquipo = await client.query(
      'SELECT disponible FROM equipos WHERE id = $1',
      [data.equipo_id],
    );
    if (checkEquipo.rows.length === 0 || !checkEquipo.rows[0].disponible)
      throw new Error('El equipo no está disponible.');

    // Insertar Movimiento con nombres exactos de tu BD
    const insertMov = `
      INSERT INTO historial_movimientos (
        equipo_id, colaborador_id, tipo_movimiento, fecha_movimiento, 
        cargador_incluido, observaciones, correo_enviado, usuario_creacion_id, 
        pdf_generado_url, token_firma, firma_valida
      ) VALUES ($1, $2, 'entrega', $3, $4, $5, $6, $7, $8, $9, false) RETURNING id
    `;
    const movResult = await client.query(insertMov, [
      data.equipo_id,
      data.empleado_id,
      data.fecha || new Date(),
      data.cargador,
      data.observaciones || null,
      !!archivoPDF,
      adminId,
      pathPdfGenerado,
      tokenFirma,
    ]);
    movimientoId = movResult.rows[0].id;

    // Actualizar Equipo
    await client.query('UPDATE equipos SET disponible = false WHERE id = $1', [
      data.equipo_id,
    ]);

    // Auditoría de Equipo
    await client.query(
      `INSERT INTO historial_equipos (equipo_id, disponible, observaciones_equipo, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, false, $2, 'ENTREGA', $3, $4)`,
      [
        data.equipo_id,
        data.observaciones,
        `Asignación registrada. Firma pendiente vía token: ${tokenFirma || 'N/A'}`,
        adminId,
      ],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // Proceso de Envío de Correo (Fuera de la transacción para no bloquear la BD si falla el SMTP)
  if (archivoPDF && data.destinatario) {
    try {
      const textoCargador =
        data.cargador === 'true' || data.cargador === true
          ? 'SÍ (Incluido)'
          : 'NO (Solo equipo)';
      await emailService.enviarActaCorreo(
        'entrega',
        data.destinatario,
        data.nombreEmpleado,
        data.tipoEquipo,
        textoCargador,
        archivoPDF.buffer,
        null,
        null,
        tokenFirma,
      );
    } catch (error) {
      console.error('Error enviando email:', error);
    }
  }

  return { movimientoId };
};

const registrarDevolucion = async (data, adminId, archivoPDF) => {
  const client = await pool.connect();
  let movimientoId = null;
  let tokenFirma = null;
  let pathPdfGenerado = null;

  if (archivoPDF) {
    tokenFirma = uuidv4();
    pathPdfGenerado = guardarPdfEnDisco(archivoPDF.buffer, 'devolucion');
  }

  try {
    await client.query('BEGIN');
    const estaDisponible = parseInt(data.estado_fisico_id) === 1;

    const insertMov = `
      INSERT INTO historial_movimientos (
        equipo_id, colaborador_id, tipo_movimiento, fecha_movimiento, 
        cargador_incluido, observaciones, estado_equipo_id, correo_enviado, 
        usuario_creacion_id, motivo_movimiento, pdf_generado_url, token_firma, firma_valida
      ) VALUES ($1, $2, 'devolucion', $3, $4, $5, $6, $7, $8, $9, $10, $11, false) RETURNING id
    `;
    const movResult = await client.query(insertMov, [
      data.equipo_id,
      data.empleado_id,
      data.fecha || new Date(),
      data.cargador,
      data.observaciones || null,
      data.estado_fisico_id,
      !!archivoPDF,
      adminId,
      data.motivo || 'Devolución regular',
      pathPdfGenerado,
      tokenFirma,
    ]);
    movimientoId = movResult.rows[0].id;

    await client.query(
      'UPDATE equipos SET disponible = $1, estado_fisico_id = $2, observaciones = $3 WHERE id = $4',
      [
        estaDisponible,
        data.estado_fisico_id,
        data.observaciones,
        data.equipo_id,
      ],
    );

    await client.query(
      `INSERT INTO historial_equipos (equipo_id, disponible, estado_fisico_id, observaciones_equipo, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, $2, $3, $4, 'DEVOLUCIÓN', 'Recepción de equipo. Firma pendiente.', $5)`,
      [
        data.equipo_id,
        estaDisponible,
        data.estado_fisico_id,
        data.observaciones,
        adminId,
      ],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  if (archivoPDF && data.destinatario) {
    try {
      const textoCargador =
        data.cargador === 'true' || data.cargador === true
          ? 'SÍ (Devuelto)'
          : 'NO (Falta cargador)';
      await emailService.enviarActaCorreo(
        'devolucion',
        data.destinatario,
        data.nombreEmpleado,
        data.tipoEquipo,
        textoCargador,
        archivoPDF.buffer,
        data.estado_final_nombre,
        data.motivo,
        tokenFirma,
      );
    } catch (error) {
      console.error('Error enviando email:', error);
    }
  }

  return { movimientoId };
};

const actualizarFirmaDocumento = async (id, filePath, firmaValida) => {
  const query = `UPDATE historial_movimientos SET pdf_firmado_url = $1, firma_valida = $2, token_firma = NULL WHERE id = $3`;
  await pool.query(query, [filePath, firmaValida, id]);
};

module.exports = {
  getHistorial,
  registrarEntrega,
  registrarDevolucion,
  actualizarFirmaDocumento,
};
