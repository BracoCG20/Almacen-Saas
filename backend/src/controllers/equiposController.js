const { pool } = require('../config/db');

/**
 * 1. OBTENER TODOS LOS EQUIPOS (INVENTARIO)
 */
const getEquipos = async (req, res) => {
  try {
    const query = `
      SELECT e.*, 
             emp.razon_social as empresa_nombre,
             p.razon_social as nombre_proveedor,
             ee.nombre as estado_fisico_nombre,
             uc.email_login as creador_email
      FROM equipos e
      LEFT JOIN empresas emp ON e.empresa_id = emp.id
      LEFT JOIN proveedores p ON e.proveedor_id = p.id
      LEFT JOIN estados_equipos ee ON e.estado_fisico_id = ee.id
      LEFT JOIN usuarios uc ON e.usuario_creacion_id = uc.id
      ORDER BY e.fecha_registro DESC
    `;
    const response = await pool.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error obteniendo equipos:', error.message);
    res.status(500).json({ error: 'Error interno al obtener el inventario.' });
  }
};

/**
 * 2. CREAR EQUIPO NUEVO (INVENTARIO)
 */
const createEquipo = async (req, res) => {
  const creadorId = req.user.id;
  const {
    categoria, // <-- NUEVO CAMPO
    empresa_id,
    marca,
    modelo,
    numero_serie,
    estado_fisico_id,
    es_propio,
    proveedor_id,
    fecha_adquisicion,
    fecha_fin_alquiler,
    observaciones,
    especificaciones,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Validar unicidad del número de serie
    const check = await client.query(
      'SELECT id FROM equipos WHERE numero_serie = $1',
      [numero_serie],
    );
    if (check.rows.length > 0)
      throw new Error('El número de serie ingresado ya existe en el sistema.');

    // 2. Generar Código Patrimonial correlativo
    const prefijo = es_propio ? 'EQP-' : 'EQAL-';
    const lastCodeRes = await client.query(
      `SELECT codigo_patrimonial FROM equipos WHERE codigo_patrimonial LIKE $1 ORDER BY id DESC LIMIT 1`,
      [`${prefijo}%`],
    );

    let nuevoCorrelativo = 1;
    if (lastCodeRes.rows.length > 0) {
      const lastCode = lastCodeRes.rows[0].codigo_patrimonial;
      const lastNum = parseInt(lastCode.split('-')[1]);
      nuevoCorrelativo = lastNum + 1;
    }
    const codigoAutogenerado = `${prefijo}${String(nuevoCorrelativo).padStart(4, '0')}`;

    const esDisponible = Number(estado_fisico_id) === 1;

    // 3. Insertar el Equipo incluyendo la CATEGORÍA
    const eqQuery = `
      INSERT INTO equipos (
        categoria, empresa_id, marca, modelo, numero_serie, codigo_patrimonial, estado_fisico_id, 
        disponible, es_propio, proveedor_id, fecha_adquisicion, fecha_fin_alquiler, 
        observaciones, especificaciones, usuario_creacion_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING *
    `;
    const eqValues = [
      categoria || 'Laptop/PC', // Valor por defecto por si acaso
      empresa_id,
      marca,
      modelo,
      numero_serie,
      codigoAutogenerado,
      estado_fisico_id,
      esDisponible,
      es_propio,
      proveedor_id || null,
      fecha_adquisicion,
      fecha_fin_alquiler || null,
      observaciones || null,
      especificaciones || null,
      creadorId,
    ];

    const newEquipo = await client.query(eqQuery, eqValues);

    // 4. Registrar en la auditoría (Historial)
    await client.query(
      `INSERT INTO historial_equipos (
        equipo_id, empresa_id, estado_fisico_id, disponible, es_propio, proveedor_id, 
        observaciones_equipo, accion_realizada, descripcion_cambio, usuario_accion_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'REGISTRO INICIAL', $8, $9)`,
      [
        newEquipo.rows[0].id,
        empresa_id,
        estado_fisico_id,
        esDisponible,
        es_propio,
        proveedor_id || null,
        observaciones || null,
        `Código patrimonial asignado: ${codigoAutogenerado}`,
        creadorId,
      ],
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Ítem registrado exitosamente en el inventario.',
      equipo: newEquipo.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

/**
 * 3. ACTUALIZAR FICHA DEL EQUIPO
 */
const updateEquipo = async (req, res) => {
  const { id } = req.params;
  const modificadorId = req.user.id;
  const {
    categoria, // <-- NUEVO CAMPO
    empresa_id,
    marca,
    modelo,
    numero_serie,
    codigo_patrimonial,
    estado_fisico_id,
    es_propio,
    proveedor_id,
    fecha_adquisicion,
    fecha_fin_alquiler,
    observaciones,
    especificaciones,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const esDisponible = Number(estado_fisico_id) === 1;

    const eqQuery = `
      UPDATE equipos SET 
        categoria=$1, empresa_id=$2, marca=$3, modelo=$4, numero_serie=$5, codigo_patrimonial=$6, 
        estado_fisico_id=$7, disponible=$8, es_propio=$9, proveedor_id=$10, fecha_adquisicion=$11, 
        fecha_fin_alquiler=$12, observaciones=$13, especificaciones=$14, 
        fecha_modificacion=NOW(), usuario_modificacion_id=$15
      WHERE id=$16 RETURNING *
    `;
    const eqValues = [
      categoria || 'Laptop/PC',
      empresa_id,
      marca,
      modelo,
      numero_serie,
      codigo_patrimonial || null,
      estado_fisico_id,
      esDisponible,
      es_propio,
      proveedor_id || null,
      fecha_adquisicion,
      fecha_fin_alquiler || null,
      observaciones || null,
      especificaciones || null,
      modificadorId,
      id,
    ];

    const result = await client.query(eqQuery, eqValues);
    if (result.rowCount === 0) throw new Error('Ítem no encontrado.');

    await client.query(
      `INSERT INTO historial_equipos (
        equipo_id, empresa_id, estado_fisico_id, disponible, es_propio, proveedor_id, 
        observaciones_equipo, accion_realizada, descripcion_cambio, usuario_accion_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'EDICIÓN', 'Modificación de ficha técnica', $8)`,
      [
        id,
        empresa_id,
        estado_fisico_id,
        esDisponible,
        es_propio,
        proveedor_id || null,
        observaciones || null,
        modificadorId,
      ],
    );

    await client.query('COMMIT');
    res.json({ message: 'Ítem actualizado correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message || 'Error al actualizar.' });
  } finally {
    client.release();
  }
};

/**
 * ============================================================================
 * 4. CAMBIAR DISPONIBILIDAD (Baja o Reactivación)
 * ============================================================================
 * Si se reactiva, forzamos su estado a "Operativo".
 * Si se da de baja, solo cambiamos a "No disponible".
 */
const toggleDisponibilidad = async (req, res) => {
  const { id } = req.params;
  const { disponible } = req.body;
  const modificadorId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let updateQuery;
    let queryParams;

    if (disponible === true) {
      // Reactivación (Forzar a Operativo = ID 1)
      updateQuery = `
        UPDATE equipos 
        SET disponible = $1, estado_fisico_id = 1, fecha_modificacion=NOW(), usuario_modificacion_id=$2 
        WHERE id = $3 RETURNING *
      `;
      queryParams = [disponible, modificadorId, id];
    } else {
      // Baja Lógica
      updateQuery = `
        UPDATE equipos 
        SET disponible = $1, fecha_modificacion=NOW(), usuario_modificacion_id=$2 
        WHERE id = $3 RETURNING *
      `;
      queryParams = [disponible, modificadorId, id];
    }

    const result = await client.query(updateQuery, queryParams);
    if (result.rowCount === 0) throw new Error('Equipo no encontrado.');

    const equipo = result.rows[0];
    const accion = disponible ? 'REACTIVACIÓN' : 'BAJA LÓGICA';
    const detalleAccion = disponible
      ? 'Equipo reactivado y cambiado a estado Operativo automáticamente.'
      : 'El equipo fue dado de baja temporal o definitivamente.';

    // Registro de Auditoría
    await client.query(
      `INSERT INTO historial_equipos (
        equipo_id, empresa_id, estado_fisico_id, disponible, accion_realizada, 
        descripcion_cambio, usuario_accion_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        equipo.empresa_id,
        equipo.estado_fisico_id,
        disponible,
        accion,
        detalleAccion,
        modificadorId,
      ],
    );

    await client.query('COMMIT');
    res.json({
      message: `Equipo ${disponible ? 'reactivado a Operativo' : 'dado de baja'} correctamente.`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res
      .status(500)
      .json({ error: 'Error al cambiar la disponibilidad del equipo.' });
  } finally {
    client.release();
  }
};

/**
 * ============================================================================
 * 5. OBTENER CATÁLOGO DE MARCAS ÚNICAS
 * ============================================================================
 */
const getMarcas = async (req, res) => {
  try {
    const response = await pool.query(
      'SELECT DISTINCT marca as nombre FROM equipos WHERE marca IS NOT NULL ORDER BY marca ASC',
    );
    res.json(response.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar el catálogo de marcas.' });
  }
};

/**
 * ============================================================================
 * 6. OBTENER CATÁLOGO DE ESTADOS FÍSICOS
 * ============================================================================
 */
const getEstadosFisicos = async (req, res) => {
  try {
    const response = await pool.query(
      'SELECT * FROM estados_equipos ORDER BY id ASC',
    );
    res.json(response.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar los estados físicos.' });
  }
};

/**
 * ============================================================================
 * 7. OBTENER HISTORIAL DE AUDITORÍA DE UN EQUIPO ESPECÍFICO
 * ============================================================================
 */
const getEquipoHistorial = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT h.*, 
             ee.nombre as estado_fisico_nombre,
             uc.email_login as usuario_email,
             c.nombres as usuario_nombres,
             c.apellidos as usuario_apellidos,
             emp.razon_social as empresa_nombre,
             p.razon_social as proveedor_nombre
      FROM historial_equipos h
      LEFT JOIN estados_equipos ee ON h.estado_fisico_id = ee.id
      LEFT JOIN usuarios uc ON h.usuario_accion_id = uc.id
      LEFT JOIN colaboradores c ON uc.colaborador_id = c.id
      LEFT JOIN empresas emp ON h.empresa_id = emp.id
      LEFT JOIN proveedores p ON h.proveedor_id = p.id
      WHERE h.equipo_id = $1
      ORDER BY h.fecha_accion DESC
    `;
    const response = await pool.query(query, [id]);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error consultando historial de equipo:', error.message);
    res
      .status(500)
      .json({ error: 'Error al obtener el historial del equipo.' });
  }
};

module.exports = {
  getEquipos,
  createEquipo,
  updateEquipo,
  toggleDisponibilidad,
  getMarcas,
  getEstadosFisicos,
  getEquipoHistorial,
};
