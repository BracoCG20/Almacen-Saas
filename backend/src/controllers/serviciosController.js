const { pool } = require('../config/db');

/**
 * ============================================================================
 * 1. OBTENER SERVICIOS
 * ============================================================================
 * Extrae todos los servicios junto con el detalle de las empresas vinculadas
 * y el usuario responsable asignado al servicio.
 */
const getServicios = async (req, res) => {
  try {
    const query = `
      SELECT s.*,
             ef.razon_social AS empresa_facturacion_nombre,
             eu.razon_social AS empresa_usuaria_nombre,
             c_resp.nombres AS responsable_nombre,
             c_resp.apellidos AS responsable_apellido,
             c1.nombres AS creador_nombre, 
             c1.apellidos AS creador_apellido
      FROM servicios s
      LEFT JOIN empresas ef ON s.empresa_id_factura = ef.id
      LEFT JOIN empresas eu ON s.empresa_id_usuaria = eu.id
      LEFT JOIN usuarios u_resp ON s.usuario_id_responsable = u_resp.id
      LEFT JOIN colaboradores c_resp ON u_resp.colaborador_id = c_resp.id
      LEFT JOIN usuarios uc1 ON s.usuario_creacion_id = uc1.id
      LEFT JOIN colaboradores c1 ON uc1.colaborador_id = c1.id
      ORDER BY s.estado DESC, s.fecha_creacion DESC;
    `;
    const response = await pool.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error interno al cargar los servicios.' });
  }
};

/**
 * ============================================================================
 * 2. CREAR NUEVO SERVICIO
 * ============================================================================
 * Inserta un servicio SaaS en la BD y registra la primera línea de auditoría.
 */
const createServicio = async (req, res) => {
  const usuarioId = req.user ? req.user.id : null;
  const {
    nombre,
    descripcion,
    categoria_servicio,
    link_servicio,
    precio,
    moneda,
    frecuencia_pago,
    fecha_proximo_pago,
    metodo_pago,
    empresa_id_factura,
    numero_tarjeta_empresa_factura,
    cci_cuenta_empresa_factura,
    empresa_id_usuaria,
    numero_tarjeta_empresa_usuaria,
    cci_cuenta_empresa_usuaria,
    licencias_totales,
    licencias_usadas,
    usuario_id_responsable,
  } = req.body;

  try {
    await pool.query('BEGIN');

    const query = `
      INSERT INTO servicios (
        nombre, descripcion, categoria_servicio, link_servicio, precio, moneda, frecuencia_pago, fecha_proximo_pago, 
        metodo_pago, empresa_id_factura, numero_tarjeta_empresa_factura, cci_cuenta_empresa_factura, 
        empresa_id_usuaria, numero_tarjeta_empresa_usuaria, cci_cuenta_empresa_usuaria,
        licencias_totales, licencias_usadas, usuario_id_responsable, usuario_creacion_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *;
    `;
    const values = [
      nombre,
      descripcion || null,
      categoria_servicio,
      link_servicio || null,
      precio || 0,
      moneda || 'USD',
      frecuencia_pago,
      fecha_proximo_pago || null,
      metodo_pago || null,
      empresa_id_factura || null,
      numero_tarjeta_empresa_factura || null,
      cci_cuenta_empresa_factura || null,
      empresa_id_usuaria || null,
      numero_tarjeta_empresa_usuaria || null,
      cci_cuenta_empresa_usuaria || null,
      licencias_totales || 0,
      licencias_usadas || 0,
      usuario_id_responsable || null,
      usuarioId,
    ];

    const response = await pool.query(query, values);
    const nuevoServicio = response.rows[0];

    // Registro en auditoría
    await pool.query(
      `INSERT INTO auditoria_servicios (servicio_id, accion, detalle, usuario_id) VALUES ($1, $2, $3, $4)`,
      [
        nuevoServicio.id,
        'CREACIÓN',
        'Se registró el servicio en el sistema.',
        usuarioId,
      ],
    );

    await pool.query('COMMIT');
    res.status(201).json({
      message: 'Servicio registrado correctamente.',
      servicio: nuevoServicio,
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error interno al registrar el servicio.' });
  }
};

/**
 * ============================================================================
 * 3. ACTUALIZAR SERVICIO (Con detección de cambio de responsable)
 * ============================================================================
 */
const updateServicio = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null;
  const {
    nombre,
    descripcion,
    categoria_servicio,
    link_servicio,
    precio,
    moneda,
    frecuencia_pago,
    fecha_proximo_pago,
    metodo_pago,
    empresa_id_factura,
    numero_tarjeta_empresa_factura,
    cci_cuenta_empresa_factura,
    empresa_id_usuaria,
    numero_tarjeta_empresa_usuaria,
    cci_cuenta_empresa_usuaria,
    licencias_totales,
    licencias_usadas,
    usuario_id_responsable,
  } = req.body;

  try {
    await pool.query('BEGIN');

    // -- Lógica para detectar el cambio de responsable para la auditoría --
    let detalleAuditoria = 'Se actualizaron los datos del servicio.';

    const currentServicio = await pool.query(
      `
      SELECT s.usuario_id_responsable, c.nombres, c.apellidos 
      FROM servicios s 
      LEFT JOIN usuarios u ON s.usuario_id_responsable = u.id 
      LEFT JOIN colaboradores c ON u.colaborador_id = c.id 
      WHERE s.id = $1
    `,
      [id],
    );

    if (currentServicio.rows.length > 0) {
      const oldRespId = currentServicio.rows[0].usuario_id_responsable || null;
      const newRespId = usuario_id_responsable
        ? parseInt(usuario_id_responsable)
        : null;

      if (oldRespId !== newRespId) {
        const oldRespName = currentServicio.rows[0].nombres
          ? `${currentServicio.rows[0].nombres} ${currentServicio.rows[0].apellidos}`
          : 'No asignado';

        let newRespName = 'No asignado';

        if (newRespId) {
          const newResp = await pool.query(
            `
            SELECT c.nombres, c.apellidos FROM usuarios u 
            JOIN colaboradores c ON u.colaborador_id = c.id 
            WHERE u.id = $1
          `,
            [newRespId],
          );

          if (newResp.rows.length > 0) {
            newRespName = `${newResp.rows[0].nombres} ${newResp.rows[0].apellidos}`;
          }
        }
        detalleAuditoria = `Se cambió el responsable de "${oldRespName}" a "${newRespName}".`;
      }
    }

    // -- Actualizar el registro del servicio --
    const query = `
      UPDATE servicios SET 
        nombre = $1, descripcion = $2, categoria_servicio = $3, link_servicio = $4,
        precio = $5, moneda = $6, frecuencia_pago = $7, fecha_proximo_pago = $8, metodo_pago = $9, 
        empresa_id_factura = $10, numero_tarjeta_empresa_factura = $11, cci_cuenta_empresa_factura = $12, 
        empresa_id_usuaria = $13, numero_tarjeta_empresa_usuaria = $14, cci_cuenta_empresa_usuaria = $15, 
        licencias_totales = $16, licencias_usadas = $17, usuario_id_responsable = $18,
        fecha_modificacion = NOW(), usuario_modificacion_id = $19
      WHERE id = $20 RETURNING *;
    `;
    const values = [
      nombre,
      descripcion || null,
      categoria_servicio,
      link_servicio || null,
      precio,
      moneda,
      frecuencia_pago,
      fecha_proximo_pago || null,
      metodo_pago || null,
      empresa_id_factura || null,
      numero_tarjeta_empresa_factura || null,
      cci_cuenta_empresa_factura || null,
      empresa_id_usuaria || null,
      numero_tarjeta_empresa_usuaria || null,
      cci_cuenta_empresa_usuaria || null,
      licencias_totales || 0,
      licencias_usadas || 0,
      usuario_id_responsable || null,
      usuarioId,
      id,
    ];

    const response = await pool.query(query, values);
    if (response.rowCount === 0) throw new Error('Servicio no encontrado.');

    // -- Insertar el log de auditoría --
    await pool.query(
      `INSERT INTO auditoria_servicios (servicio_id, accion, detalle, usuario_id) VALUES ($1, $2, $3, $4)`,
      [id, 'EDICIÓN', detalleAuditoria, usuarioId],
    );

    await pool.query('COMMIT');
    res.status(200).json({ message: 'Servicio actualizado correctamente.' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Error interno al actualizar el servicio.' });
  }
};

/**
 * ============================================================================
 * 4. CAMBIAR ESTADO (Baja / Reactivación)
 * ============================================================================
 */
const cambiarEstadoServicio = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const usuarioId = req.user ? req.user.id : null;

  try {
    await pool.query('BEGIN');

    await pool.query(
      'UPDATE servicios SET estado = $1, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $3',
      [estado, usuarioId, id],
    );

    await pool.query(
      `INSERT INTO auditoria_servicios (servicio_id, accion, detalle, usuario_id) VALUES ($1, $2, $3, $4)`,
      [
        id,
        estado ? 'ACTIVACIÓN' : 'CANCELACIÓN',
        `El servicio pasó a estado ${estado ? 'Activo' : 'Inactivo'}`,
        usuarioId,
      ],
    );

    await pool.query('COMMIT');
    res.status(200).json({
      message: `El servicio ahora está ${estado ? 'Activo' : 'Inactivo'}.`,
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    res
      .status(500)
      .json({ error: 'Error interno al cambiar el estado del servicio.' });
  }
};

/**
 * ============================================================================
 * 5. MÓDULO DE PAGOS
 * ============================================================================
 */
const getPagosPorServicio = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT hp.*, c.nombres AS creador_nombre
      FROM historial_pagos hp
      LEFT JOIN usuarios uc ON hp.usuario_creacion_id = uc.id
      LEFT JOIN colaboradores c ON uc.colaborador_id = c.id
      WHERE hp.servicio_id = $1 AND hp.estado_pago != 'Anulado'
      ORDER BY hp.fecha_pago DESC;
    `;
    const response = await pool.query(query, [id]);
    res.status(200).json(response.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar los pagos del servicio.' });
  }
};

const registrarPago = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null;
  const {
    fecha_pago,
    monto_pagado,
    moneda,
    periodo_mes,
    periodo_anio,
    nueva_fecha_proximo_pago,
  } = req.body;
  const url_factura = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await pool.query('BEGIN');

    const queryPago = `
      INSERT INTO historial_pagos (servicio_id, fecha_pago, monto_pagado, moneda, periodo_mes, periodo_anio, url_factura, usuario_creacion_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
    `;
    await pool.query(queryPago, [
      id,
      fecha_pago,
      monto_pagado,
      moneda,
      periodo_mes,
      periodo_anio,
      url_factura,
      usuarioId,
    ]);

    // Si el usuario configuró actualizar la fecha general del servicio
    if (nueva_fecha_proximo_pago) {
      await pool.query(
        'UPDATE servicios SET fecha_proximo_pago = $1 WHERE id = $2',
        [nueva_fecha_proximo_pago, id],
      );
    }

    await pool.query(
      `INSERT INTO auditoria_servicios (servicio_id, accion, detalle, usuario_id) VALUES ($1, $2, $3, $4)`,
      [
        id,
        'PAGO REGISTRADO',
        `Se registró un pago de ${moneda} ${monto_pagado} para el periodo ${periodo_mes}/${periodo_anio}`,
        usuarioId,
      ],
    );

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Pago registrado exitosamente.' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Error interno al registrar el pago.' });
  }
};

const anularPago = async (req, res) => {
  const { pagoId } = req.params;
  const usuarioId = req.user ? req.user.id : null;

  try {
    await pool.query('BEGIN');

    const pagoInfo = await pool.query(
      'SELECT * FROM historial_pagos WHERE id = $1',
      [pagoId],
    );
    if (pagoInfo.rows.length === 0) throw new Error('Pago no encontrado.');
    const p = pagoInfo.rows[0];

    await pool.query(
      'UPDATE historial_pagos SET estado_pago = $1, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $3',
      ['Anulado', usuarioId, pagoId],
    );

    await pool.query(
      `INSERT INTO auditoria_servicios (servicio_id, accion, detalle, usuario_id) VALUES ($1, $2, $3, $4)`,
      [
        p.servicio_id,
        'PAGO ANULADO',
        `Se anuló el pago de ${p.moneda} ${p.monto_pagado} del periodo ${p.periodo_mes}/${p.periodo_anio}`,
        usuarioId,
      ],
    );

    await pool.query('COMMIT');
    res.status(200).json({ message: 'Pago anulado correctamente.' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: 'Error interno al anular el pago.' });
  }
};

/**
 * ============================================================================
 * 6. AUDITORÍA Y LISTADOS COMPLEMENTARIOS
 * ============================================================================
 */
const getAuditoriaServicio = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT a.*, 
             c.nombres AS creador_nombres, c.apellidos AS creador_apellidos,
             cr.nombres AS resp_nombres, cr.apellidos AS resp_apellidos
      FROM auditoria_servicios a
      LEFT JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN colaboradores c ON u.colaborador_id = c.id
      LEFT JOIN servicios s ON a.servicio_id = s.id
      LEFT JOIN usuarios ur ON s.usuario_id_responsable = ur.id
      LEFT JOIN colaboradores cr ON ur.colaborador_id = cr.id
      WHERE a.servicio_id = $1
      ORDER BY a.fecha DESC;
    `;
    const response = await pool.query(query, [id]);
    res.json(response.rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error al cargar el historial de auditoría.' });
  }
};

const getResponsables = async (req, res) => {
  try {
    const query = `
      SELECT u.id, c.nombres, c.apellidos, u.nickname
      FROM usuarios u
      LEFT JOIN colaboradores c ON u.colaborador_id = c.id
      WHERE u.estado = true;
    `;
    const response = await pool.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error al cargar la lista de responsables.' });
  }
};

module.exports = {
  getServicios,
  createServicio,
  updateServicio,
  cambiarEstadoServicio,
  getPagosPorServicio,
  registrarPago,
  anularPago,
  getAuditoriaServicio,
  getResponsables,
};
