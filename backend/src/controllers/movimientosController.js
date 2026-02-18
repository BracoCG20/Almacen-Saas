const { pool } = require('../config/db');
const transporter = require('../config/mailer');
const path = require('path');

/**
 * ============================================================================
 * 1. REGISTRAR ENTREGA (Sin envío de correo)
 * ============================================================================
 * Registra la asignación de un equipo a un colaborador y cambia su estado
 * a "No disponible". Genera el registro de auditoría.
 */
const registrarEntrega = async (req, res) => {
  const adminId = req.user ? req.user.id : null;
  const { equipo_id, empleado_id, fecha, cargador, observaciones } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validar disponibilidad del equipo
    const checkEquipo = await client.query(
      'SELECT disponible FROM equipos WHERE id = $1',
      [equipo_id],
    );
    if (checkEquipo.rows.length === 0) throw new Error('Equipo no encontrado.');
    if (checkEquipo.rows[0].disponible === false)
      throw new Error('El equipo ya se encuentra asignado.');

    // Obtener datos del colaborador para personalizar la auditoría
    const empleadoQuery = await client.query(
      'SELECT nombres, apellidos, genero FROM colaboradores WHERE id = $1',
      [empleado_id],
    );
    let nombreEmpleado = 'Desconocido';
    let textoColaborador = 'al colaborador';

    if (empleadoQuery.rows.length > 0) {
      const emp = empleadoQuery.rows[0];
      nombreEmpleado = `${emp.nombres} ${emp.apellidos}`;
      const rawGenero = (emp.genero || '').toLowerCase().trim();
      if (
        rawGenero === 'f' ||
        rawGenero === 'mujer' ||
        rawGenero === 'femenino'
      ) {
        textoColaborador = 'a la colaboradora';
      }
    }

    // Registrar el movimiento
    const insertMov = `
      INSERT INTO historial_movimientos (equipo_id, colaborador_id, tipo_movimiento, fecha_movimiento, cargador_incluido, observaciones, correo_enviado, usuario_creacion_id) 
      VALUES ($1, $2, 'entrega', $3, $4, $5, NULL, $6) RETURNING id
    `;
    const movResult = await client.query(insertMov, [
      equipo_id,
      empleado_id,
      fecha,
      cargador,
      observaciones,
      adminId,
    ]);

    // Actualizar estado del equipo
    await client.query('UPDATE equipos SET disponible = false WHERE id = $1', [
      equipo_id,
    ]);

    // Registrar en auditoría de equipos
    await client.query(
      `INSERT INTO historial_equipos (equipo_id, disponible, observaciones_equipo, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, false, $2, 'ENTREGA', $3, $4)`,
      [
        equipo_id,
        observaciones,
        `Asignado ${textoColaborador}: ${nombreEmpleado}`,
        adminId,
      ],
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Entrega registrada correctamente.',
      movimiento_id: movResult.rows[0].id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

/**
 * ============================================================================
 * 2. REGISTRAR ENTREGA Y ENVIAR CORREO (Con PDF adjunto)
 * ============================================================================
 */
const registrarEntregaConCorreo = async (req, res) => {
  const adminId = req.user ? req.user.id : null;
  const {
    equipo_id,
    empleado_id,
    cargador,
    destinatario,
    nombreEmpleado,
    tipoEquipo,
  } = req.body;
  const archivoPDF = req.file;
  const client = await pool.connect();
  let movimientoId = null;

  try {
    await client.query('BEGIN');

    // Validación de equipo
    const checkEquipo = await client.query(
      'SELECT disponible FROM equipos WHERE id = $1',
      [equipo_id],
    );
    if (
      checkEquipo.rows.length === 0 ||
      checkEquipo.rows[0].disponible === false
    ) {
      throw new Error('El equipo no está disponible para asignación.');
    }

    // Obtener género
    const empleadoQuery = await client.query(
      'SELECT genero FROM colaboradores WHERE id = $1',
      [empleado_id],
    );
    let textoColaborador = 'al colaborador';
    if (empleadoQuery.rows.length > 0) {
      const rawGenero = (empleadoQuery.rows[0].genero || '')
        .toLowerCase()
        .trim();
      if (
        rawGenero === 'f' ||
        rawGenero === 'mujer' ||
        rawGenero === 'femenino'
      )
        textoColaborador = 'a la colaboradora';
    }

    const cargadorBool = cargador === 'true' || cargador === true;

    // Insertar Movimiento
    const insertMov = `
      INSERT INTO historial_movimientos (equipo_id, colaborador_id, tipo_movimiento, fecha_movimiento, cargador_incluido, correo_enviado, usuario_creacion_id) 
      VALUES ($1, $2, 'entrega', NOW(), $3, false, $4) RETURNING id
    `;
    const result = await client.query(insertMov, [
      equipo_id,
      empleado_id,
      cargadorBool,
      adminId,
    ]);
    movimientoId = result.rows[0].id;

    // Actualizar equipo y auditoría
    await client.query('UPDATE equipos SET disponible = false WHERE id = $1', [
      equipo_id,
    ]);
    await client.query(
      `INSERT INTO historial_equipos (equipo_id, disponible, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, false, 'ENTREGA', $2, $3)`,
      [
        equipo_id,
        `Asignado ${textoColaborador}: ${nombreEmpleado} (Acta enviada por correo)`,
        adminId,
      ],
    );

    await client.query('COMMIT');
  } catch (dbError) {
    await client.query('ROLLBACK');
    client.release();
    return res
      .status(400)
      .json({ error: dbError.message || 'Error al guardar en BD' });
  }

  // Proceso de envío de correo
  try {
    const textoCargador =
      cargador === 'true' || cargador === true
        ? 'SÍ (Incluido)'
        : 'NO (Solo equipo)';
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head><style>body { font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6; }</style></head>
      <body style="padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(124, 58, 237, 0.15);">
          <div style="background-color: #7c3aed; padding: 40px 20px; text-align: center;">
            <img src="cid:logo" alt="Logo Grupo SP" style="max-width: 180px; display: block; background-color: #ffffff; border-radius: 20px; padding: 5px 20px; margin: 0 auto 15px auto; filter: brightness(0) invert(1);" />
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase;">Acta de Entrega</h1>
            <p style="color: #ede9fe; margin: 5px 0 0 0; font-size: 13px;">Gestión de Talento Humano</p>
          </div>
          <div style="padding: 40px 30px; color: #334155;">
            <h2 style="color: #1e293b; margin-top: 0;">Hola, ${nombreEmpleado} 👋</h2>
            <p style="font-size: 16px; color: #475569;">Se ha registrado la entrega de una herramienta de trabajo a tu nombre.</p>
            <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 25px; margin: 20px 0;">
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #7c3aed;">EQUIPO ASIGNADO</p>
                <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #1e293b;">${tipoEquipo}</p>
              </div>
              <div style="border-top: 1px solid #ddd6fe; padding-top: 15px;">
                <p style="margin: 0; font-size: 11px; font-weight: 700; color: #7c3aed;">¿INCLUYE CARGADOR?</p>
                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #4b5563;">${textoCargador}</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <div style="background-color: #ede9fe; color: #6d28d9; padding: 12px 24px; border-radius: 50px; font-size: 14px; font-weight: 700; display: inline-block; border: 1px solid #8b5cf6;">
                📎 Archivo Adjunto: Acta_Entrega.pdf
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"SISTEMA GTH" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `📢 Entrega de Equipo: ${tipoEquipo}`,
      html: htmlTemplate,
      attachments: [
        { filename: 'Acta_Entrega.pdf', content: archivoPDF.buffer },
        {
          filename: 'logo_gruposp.png',
          path: path.join(__dirname, '../assets/logo_gruposp.png'),
          cid: 'logo',
        },
      ],
    });

    await pool.query(
      'UPDATE historial_movimientos SET correo_enviado = true WHERE id = $1',
      [movimientoId],
    );
    res
      .status(201)
      .json({ message: 'Registro guardado y correo enviado exitosamente.' });
  } catch (mailError) {
    res.status(201).json({
      message: 'Registro guardado, pero falló el envío de correo.',
      warning: true,
    });
  } finally {
    if (client) client.release();
  }
};

/**
 * ============================================================================
 * 3. REGISTRAR DEVOLUCIÓN (Sin envío de correo)
 * ============================================================================
 */
const registrarDevolucion = async (req, res) => {
  const adminId = req.user ? req.user.id : null;
  const {
    equipo_id,
    empleado_id,
    fecha,
    cargador,
    observaciones,
    estado_fisico_id,
    estado_final_nombre,
    motivo,
  } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const estaDisponible = parseInt(estado_fisico_id) === 1;

    // Registrar Movimiento
    const insertMov = `
      INSERT INTO historial_movimientos (equipo_id, colaborador_id, tipo_movimiento, fecha_movimiento, cargador_incluido, observaciones, estado_equipo_id, usuario_creacion_id, motivo_movimiento) 
      VALUES ($1, $2, 'devolucion', $3, $4, $5, $6, $7, $8)
    `;
    await client.query(insertMov, [
      equipo_id,
      empleado_id,
      fecha,
      cargador,
      observaciones,
      estado_fisico_id,
      adminId,
      motivo || 'Devolución regular',
    ]);

    // Actualizar Equipo
    await client.query(
      'UPDATE equipos SET disponible = $1, estado_fisico_id = $2, observaciones = $3 WHERE id = $4',
      [estaDisponible, estado_fisico_id, observaciones, equipo_id],
    );

    // Registrar Auditoría
    await client.query(
      `INSERT INTO historial_equipos (equipo_id, disponible, estado_fisico_id, observaciones_equipo, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, $2, $3, $4, 'DEVOLUCIÓN', 'Recepción de equipo en estado: ' || $5 || '. Motivo: ' || $6, $7)`,
      [
        equipo_id,
        estaDisponible,
        estado_fisico_id,
        observaciones,
        estado_final_nombre,
        motivo || 'Devolución regular',
        adminId,
      ],
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Devolución registrada correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res
      .status(500)
      .json({ error: 'Error interno al registrar la devolución.' });
  } finally {
    client.release();
  }
};

/**
 * ============================================================================
 * 4. REGISTRAR DEVOLUCIÓN Y ENVIAR CORREO (Con PDF adjunto)
 * ============================================================================
 */
const registrarDevolucionConCorreo = async (req, res) => {
  const adminId = req.user ? req.user.id : null;
  const {
    equipo_id,
    empleado_id,
    cargador,
    destinatario,
    nombreEmpleado,
    tipoEquipo,
    observaciones,
    estado_fisico_id,
    estado_final_nombre,
    motivo,
  } = req.body;
  const archivoPDF = req.file;
  const client = await pool.connect();
  let movimientoId = null;

  try {
    await client.query('BEGIN');
    const cargadorBool = cargador === 'true' || cargador === true;
    const estaDisponible = parseInt(estado_fisico_id) === 1;

    // Registrar Movimiento
    const insertMov = `
      INSERT INTO historial_movimientos (equipo_id, colaborador_id, tipo_movimiento, fecha_movimiento, cargador_incluido, observaciones, estado_equipo_id, correo_enviado, usuario_creacion_id, motivo_movimiento) 
      VALUES ($1, $2, 'devolucion', NOW(), $3, $4, $5, false, $6, $7) RETURNING id
    `;
    const result = await client.query(insertMov, [
      equipo_id,
      empleado_id,
      cargadorBool,
      observaciones,
      estado_fisico_id,
      adminId,
      motivo || 'Devolución regular',
    ]);
    movimientoId = result.rows[0].id;

    // Actualizar Equipo
    await client.query(
      'UPDATE equipos SET disponible = $1, estado_fisico_id = $2, observaciones = $3 WHERE id = $4',
      [estaDisponible, estado_fisico_id, observaciones, equipo_id],
    );

    // Registrar Auditoría
    await client.query(
      `INSERT INTO historial_equipos (equipo_id, disponible, estado_fisico_id, observaciones_equipo, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, $2, $3, $4, 'DEVOLUCIÓN', 'Recepción de equipo en estado: ' || $5 || '. Motivo: ' || $6, $7)`,
      [
        equipo_id,
        estaDisponible,
        estado_fisico_id,
        observaciones,
        estado_final_nombre,
        motivo || 'Devolución regular',
        adminId,
      ],
    );

    await client.query('COMMIT');
  } catch (dbError) {
    await client.query('ROLLBACK');
    client.release();
    return res.status(400).json({
      error: dbError.message || 'Error al guardar la devolución en BD.',
    });
  }

  // Proceso de envío de correo
  try {
    const cargadorBool = cargador === 'true' || cargador === true;
    const textoCargador = cargadorBool
      ? 'SÍ (Devuelto)'
      : 'NO (Falta cargador)';
    const colorEstado =
      parseInt(estado_fisico_id) === 1 ? '#16a34a' : '#dc2626';

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head><style>body { font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6; }</style></head>
      <body style="padding: 40px 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.1);">
          <div style="background-color: #dc2626; padding: 40px 20px; text-align: center;">
            <img src="cid:logo" alt="Logo" style="max-width: 180px; display: block; background-color: #ffffff; border-radius: 20px; padding: 5px 20px; margin: 0 auto 15px auto; filter: brightness(0) invert(1);" />
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase;">Constancia de Devolución</h1>
          </div>
          <div style="padding: 40px 30px; color: #334155;">
            <h2 style="color: #1e293b;">Hola, ${nombreEmpleado}</h2>
            <p>Se ha registrado la devolución de tu equipo de trabajo.</p>
            <div style="background-color: #fef2f2; border: 1px solid #ddd6fe; border-radius: 12px; padding: 25px; margin: 20px 0;">
              <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">EQUIPO DEVUELTO</p>
              <p style="margin:4px 0 15px 0; font-size:18px; font-weight:700; color:#1e293b;">${tipoEquipo}</p>
              <div style="display:flex; justify-content:space-between; border-top:1px solid #ddd6fe; padding-top:15px; margin-bottom:15px;">
                <div>
                  <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">ESTADO FINAL</p>
                  <p style="margin:4px 0 0 0; font-size:15px; font-weight:600; color:${colorEstado}; text-transform:uppercase;">${estado_final_nombre}</p>
                </div>
                <div>
                  <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">CARGADOR</p>
                  <p style="margin:4px 0 0 0; font-size:15px; font-weight:600; color:#4b5563;">${textoCargador}</p>
                </div>
              </div>
              <div style="border-top:1px solid #ddd6fe; padding-top:15px;">
                <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">MOTIVO</p>
                <p style="margin:4px 0 0 0; font-size:15px; font-weight:600; color:#4b5563;">${motivo || 'Devolución regular'}</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <div style="background-color: #ede9fe; color: #6d28d9; padding: 12px 24px; border-radius: 50px; font-size: 14px; font-weight: 700; display: inline-block;">
                📎 Archivo Adjunto: Constancia_Devolucion.pdf
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"SISTEMA GTH" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `🔄 Devolución Registrada: ${tipoEquipo}`,
      html: htmlTemplate,
      attachments: [
        { filename: 'Constancia_Devolucion.pdf', content: archivoPDF.buffer },
        {
          filename: 'logo_gruposp.png',
          path: path.join(__dirname, '../assets/logo_gruposp.png'),
          cid: 'logo',
        },
      ],
    });

    await pool.query(
      'UPDATE historial_movimientos SET correo_enviado = true WHERE id = $1',
      [movimientoId],
    );
    res
      .status(201)
      .json({ message: 'Devolución guardada y correo enviado exitosamente.' });
  } catch (mailError) {
    res.status(201).json({
      message: 'Guardado, pero falló el envío de correo.',
      warning: true,
    });
  } finally {
    if (client) client.release();
  }
};

/**
 * ============================================================================
 * 5. OBTENER HISTORIAL COMPLETO DE MOVIMIENTOS
 * ============================================================================
 * Extrae todas las entregas y devoluciones, calculando el tiempo exacto
 * de uso de un equipo mediante la función AGE() de PostgreSQL.
 */
const obtenerHistorial = async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id, 
        m.fecha_movimiento, 
        m.tipo_movimiento as tipo, 
        m.cargador_incluido as cargador, 
        m.observaciones, 
        m.motivo_movimiento as motivo,
        m.colaborador_id as empleado_id, 
        m.equipo_id, 
        m.pdf_firmado_url, 
        m.firma_valida, 
        m.correo_enviado,
        m.estado_equipo_id,
        st.nombre as estado_equipo_momento, 
        e.marca, 
        e.modelo, 
        e.numero_serie as serie, 
        c.nombres as empleado_nombre, 
        c.apellidos as empleado_apellido, 
        c.dni,    
        c.email_contacto as empleado_correo,
        u.nombres as admin_nombre, 
        uc.email_login as admin_correo,
        
        CASE 
          WHEN m.tipo_movimiento = 'entrega' THEN 
            AGE(
              COALESCE(
                (SELECT MIN(m2.fecha_movimiento)
                 FROM historial_movimientos m2 
                 WHERE m2.equipo_id = m.equipo_id 
                   AND m2.colaborador_id = m.colaborador_id 
                   AND m2.tipo_movimiento = 'devolucion' 
                   AND m2.fecha_movimiento > m.fecha_movimiento),
                NOW()
              ),
              m.fecha_movimiento
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
    res.json(response.rows);
  } catch (error) {
    console.error('Error al obtener historial:', error.message);
    res
      .status(500)
      .json({ error: 'Error interno al obtener el historial de movimientos.' });
  }
};

/**
 * ============================================================================
 * 6. REENVIAR CORREO (Acta de Entrega / Devolución)
 * ============================================================================
 */
const reenviarCorreoActa = async (req, res) => {
  const {
    movimiento_id,
    destinatario,
    nombreEmpleado,
    tipoEquipo,
    tipo_movimiento,
  } = req.body;
  const archivoPDF = req.file;

  try {
    const isEntrega = tipo_movimiento === 'entrega';
    const subject = isEntrega
      ? `📢 Entrega de Equipo: ${tipoEquipo}`
      : `🔄 Devolución Registrada: ${tipoEquipo}`;
    const fileName = isEntrega
      ? 'Acta_Entrega.pdf'
      : 'Constancia_Devolucion.pdf';

    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px; max-width: 500px;">
        <h2>Hola, ${nombreEmpleado}</h2>
        <p>Adjuntamos el documento correspondiente a la ${isEntrega ? 'entrega' : 'devolución'} de tu equipo de trabajo: <strong>${tipoEquipo}</strong>.</p>
        <p style="color: #6b7280; font-size: 14px;">Por favor, revisa el PDF adjunto.</p>
      </div>`;

    await transporter.sendMail({
      from: `"SISTEMA GTH" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: subject,
      html: htmlTemplate,
      attachments: [{ filename: fileName, content: archivoPDF.buffer }],
    });

    await pool.query(
      'UPDATE historial_movimientos SET correo_enviado = true WHERE id = $1',
      [movimiento_id],
    );
    res.json({ message: 'Correo reenviado exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Fallo al reenviar el correo.' });
  }
};

/**
 * ============================================================================
 * 7. SUBIR DOCUMENTO FIRMADO (ACTUALIZAR MOVIMIENTO)
 * ============================================================================
 */
const subirPdfFirmado = async (req, res) => {
  const { id } = req.params;
  const archivo = req.file;

  if (!archivo)
    return res.status(400).json({ error: 'No se recibió ningún archivo.' });

  try {
    const url = `/uploads/${archivo.filename}`;
    await pool.query(
      'UPDATE historial_movimientos SET pdf_firmado_url = $1, firma_valida = true WHERE id = $2',
      [url, id],
    );
    res.json({ message: 'Documento firmado guardado exitosamente.' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error interno al guardar el archivo firmado.' });
  }
};

/**
 * ============================================================================
 * 8. INVALIDAR FIRMA DE UN DOCUMENTO
 * ============================================================================
 */
const invalidarFirma = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE historial_movimientos SET firma_valida = false WHERE id = $1',
      [id],
    );
    res.json({ message: 'Documento invalidado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno al invalidar el documento.' });
  }
};

module.exports = {
  registrarEntrega,
  registrarEntregaConCorreo,
  registrarDevolucion,
  registrarDevolucionConCorreo,
  obtenerHistorial,
  reenviarCorreoActa,
  subirPdfFirmado,
  invalidarFirma,
};
