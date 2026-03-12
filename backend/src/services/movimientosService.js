const { pool } = require('../config/db');
const emailService = require('./emailService');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); // Necesitarás instalar axios: npm install axios

const getHistorial = async () => {
  // Mismo query de antes, no cambia
  const query = `
    SELECT 
      m.id, m.fecha_movimiento, m.tipo_movimiento as tipo, m.cargador_incluido as cargador, 
      m.observaciones, m.motivo_movimiento as motivo, m.colaborador_id as empleado_id, 
      m.equipo_id, m.pdf_firmado_url, m.pdf_generado_url, m.firma_valida, m.correo_enviado, m.estado_equipo_id,
      st.nombre as estado_equipo_momento, e.marca, e.modelo, e.numero_serie as serie, 
      c.nombres as empleado_nombre, c.apellidos as empleado_apellido, c.dni, c.email_contacto as empleado_correo,
      u.nombres as admin_nombre, uc.email_login as admin_correo
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

const registrarEntrega = async (data, adminId, cloudinaryUrl, pdfBuffer) => {
  const client = await pool.connect();
  let movimientoId = null;
  let tokenFirma = cloudinaryUrl ? uuidv4() : null;

  try {
    await client.query('BEGIN');
    const checkEquipo = await client.query(
      'SELECT disponible FROM equipos WHERE id = $1',
      [data.equipo_id],
    );
    if (checkEquipo.rows.length === 0 || !checkEquipo.rows[0].disponible)
      throw new Error('El equipo no está disponible.');

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
      !!pdfBuffer,
      adminId,
      cloudinaryUrl,
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
        `Asignación Cloudinary. Token: ${tokenFirma || 'N/A'}`,
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

  if (pdfBuffer && data.destinatario) {
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
        pdfBuffer,
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

const registrarDevolucion = async (data, adminId, cloudinaryUrl, pdfBuffer) => {
  const client = await pool.connect();
  let movimientoId = null;
  let tokenFirma = cloudinaryUrl ? uuidv4() : null;

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
      !!pdfBuffer,
      adminId,
      data.motivo || 'Devolución regular',
      cloudinaryUrl,
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
       VALUES ($1, $2, $3, $4, 'DEVOLUCIÓN', 'Recepción Cloudinary.', $5)`,
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

  if (pdfBuffer && data.destinatario) {
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
        pdfBuffer,
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

const actualizarFirmaDocumento = async (
  id,
  cloudinaryUrl,
  firmaValida,
  usuarioModificadorId,
) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (firmaValida === false) {
      const nuevoToken = uuidv4();
      const infoRes = await client.query(
        `
          SELECT m.tipo_movimiento, m.cargador_incluido, m.pdf_generado_url, m.motivo_movimiento,
                 c.email_contacto, c.nombres, c.apellidos, e.marca, e.modelo, st.nombre as estado_final_nombre
          FROM historial_movimientos m
          JOIN colaboradores c ON m.colaborador_id = c.id
          JOIN equipos e ON m.equipo_id = e.id
          LEFT JOIN estados_equipos st ON m.estado_equipo_id = st.id
          WHERE m.id = $1`,
        [id],
      );
      const mov = infoRes.rows[0];

      if (!mov) throw new Error('No se encontró el registro.');

      await client.query(
        `
          UPDATE historial_movimientos 
          SET pdf_firmado_url = NULL, firma_valida = false, token_firma = $1, fecha_modificacion = NOW(), usuario_modificacion_id = $2
          WHERE id = $3`,
        [nuevoToken, usuarioModificadorId, id],
      );

      // NUEVO: Descargar PDF de Cloudinary para reenviarlo
      if (mov.email_contacto && mov.pdf_generado_url) {
        const response = await axios.get(mov.pdf_generado_url, {
          responseType: 'arraybuffer',
        });
        const pdfBuffer = Buffer.from(response.data, 'binary');

        await emailService.enviarActaCorreo(
          mov.tipo_movimiento,
          mov.email_contacto,
          `${mov.nombres} ${mov.apellidos}`,
          `${mov.marca} ${mov.modelo}`,
          mov.cargador_incluido ? 'SÍ' : 'NO',
          pdfBuffer,
          mov.estado_final_nombre,
          mov.motivo_movimiento,
          nuevoToken,
        );
      }
    } else {
      await client.query(
        `
          UPDATE historial_movimientos 
          SET pdf_firmado_url = $1, firma_valida = true, token_firma = NULL 
          WHERE id = $2`,
        [cloudinaryUrl, id],
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getHistorial,
  registrarEntrega,
  registrarDevolucion,
  actualizarFirmaDocumento,
};
