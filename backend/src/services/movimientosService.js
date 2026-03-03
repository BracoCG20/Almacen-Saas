const { pool } = require('../config/db');
const emailService = require('./emailService');
const { v4: uuidv4 } = require('uuid'); // <-- Para generar el token único
const fs = require('fs');
const path = require('path');

const getHistorial = async () => {
  const query = `
    SELECT 
      m.id, m.fecha_movimiento, m.tipo_movimiento as tipo, m.cargador_incluido as cargador, 
      m.observaciones, m.motivo_movimiento as motivo, m.colaborador_id as empleado_id, 
      m.equipo_id, m.pdf_firmado_url, m.firma_valida, m.correo_enviado, m.estado_equipo_id,
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

// Función auxiliar para guardar el PDF Original
const guardarPdfOriginal = (buffer, tipo) => {
  const uploadDir = path.join(__dirname, '../../uploads/Originales');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const fileName = `${tipo}-${Date.now()}.pdf`;
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return `/uploads/Originales/${fileName}`;
};

const registrarEntrega = async (data, adminId, archivoPDF) => {
  const client = await pool.connect();
  let movimientoId = null;
  let nombreEmpleado = data.nombreEmpleado || 'Desconocido';
  let textoColaborador = 'al colaborador';
  let tokenFirma = null;
  let pdfOriginalUrl = null;

  if (archivoPDF) {
    tokenFirma = uuidv4();
    pdfOriginalUrl = guardarPdfOriginal(archivoPDF.buffer, 'asignacion');
  }

  try {
    await client.query('BEGIN');

    const checkEquipo = await client.query(
      'SELECT disponible FROM equipos WHERE id = $1',
      [data.equipo_id],
    );
    if (checkEquipo.rows.length === 0 || !checkEquipo.rows[0].disponible)
      throw new Error('El equipo no está disponible.');

    const empQuery = await client.query(
      'SELECT nombres, apellidos, genero FROM colaboradores WHERE id = $1',
      [data.empleado_id],
    );
    if (empQuery.rows.length > 0) {
      const emp = empQuery.rows[0];
      nombreEmpleado = `${emp.nombres} ${emp.apellidos}`;
      const genero = (emp.genero || '').toLowerCase().trim();
      if (genero === 'f' || genero === 'mujer' || genero === 'femenino')
        textoColaborador = 'a la colaboradora';
    }

    const insertMov = `
      INSERT INTO historial_movimientos (equipo_id, colaborador_id, tipo_movimiento, fecha_movimiento, cargador_incluido, observaciones, correo_enviado, usuario_creacion_id, pdf_generado_url, token_firma) 
      VALUES ($1, $2, 'entrega', $3, $4, $5, $6, $7, $8, $9) RETURNING id
    `;
    const movResult = await client.query(insertMov, [
      data.equipo_id,
      data.empleado_id,
      data.fecha || 'NOW()',
      data.cargador,
      data.observaciones || null,
      archivoPDF ? false : null,
      adminId,
      pdfOriginalUrl,
      tokenFirma,
    ]);
    movimientoId = movResult.rows[0].id;

    await client.query('UPDATE equipos SET disponible = false WHERE id = $1', [
      data.equipo_id,
    ]);

    await client.query(
      `INSERT INTO historial_equipos (equipo_id, disponible, observaciones_equipo, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, false, $2, 'ENTREGA', $3, $4)`,
      [
        data.equipo_id,
        data.observaciones,
        `Asignado ${textoColaborador}: ${nombreEmpleado}${archivoPDF ? ' (Acta por correo)' : ''}`,
        adminId,
      ],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    throw error;
  }

  let emailWarning = false;
  if (archivoPDF && data.destinatario) {
    try {
      const textoCargador =
        data.cargador === 'true' || data.cargador === true
          ? 'SÍ (Incluido)'
          : 'NO (Solo equipo)';
      // Se le pasa el tokenFirma al servicio de correo
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
      await pool.query(
        'UPDATE historial_movimientos SET correo_enviado = true WHERE id = $1',
        [movimientoId],
      );
    } catch (error) {
      emailWarning = true;
    }
  }

  client.release();
  return { movimientoId, emailWarning };
};

const registrarDevolucion = async (data, adminId, archivoPDF) => {
  const client = await pool.connect();
  let movimientoId = null;
  let tokenFirma = null;
  let pdfOriginalUrl = null;

  if (archivoPDF) {
    tokenFirma = uuidv4();
    pdfOriginalUrl = guardarPdfOriginal(archivoPDF.buffer, 'devolucion');
  }

  try {
    await client.query('BEGIN');
    const estaDisponible = parseInt(data.estado_fisico_id) === 1;

    const insertMov = `
      INSERT INTO historial_movimientos (equipo_id, colaborador_id, tipo_movimiento, fecha_movimiento, cargador_incluido, observaciones, estado_equipo_id, correo_enviado, usuario_creacion_id, motivo_movimiento, pdf_generado_url, token_firma) 
      VALUES ($1, $2, 'devolucion', $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
    `;
    const movResult = await client.query(insertMov, [
      data.equipo_id,
      data.empleado_id,
      data.fecha || 'NOW()',
      data.cargador,
      data.observaciones || null,
      data.estado_fisico_id,
      archivoPDF ? false : null,
      adminId,
      data.motivo || 'Devolución regular',
      pdfOriginalUrl,
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
       VALUES ($1, $2, $3, $4, 'DEVOLUCIÓN', 'Recepción de equipo en estado: ' || $5 || '. Motivo: ' || $6, $7)`,
      [
        data.equipo_id,
        estaDisponible,
        data.estado_fisico_id,
        data.observaciones,
        data.estado_final_nombre,
        data.motivo || 'Devolución regular',
        adminId,
      ],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    throw error;
  }

  let emailWarning = false;
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
      await pool.query(
        'UPDATE historial_movimientos SET correo_enviado = true WHERE id = $1',
        [movimientoId],
      );
    } catch (error) {
      emailWarning = true;
    }
  }

  client.release();
  return { movimientoId, emailWarning };
};

const actualizarFirmaDocumento = async (id, filePath, firmaValida) => {
  const query = `UPDATE historial_movimientos SET pdf_firmado_url = $1, firma_valida = $2 WHERE id = $3`;
  await pool.query(query, [filePath, firmaValida, id]);
};

module.exports = {
  getHistorial,
  registrarEntrega,
  registrarDevolucion,
  actualizarFirmaDocumento,
};
