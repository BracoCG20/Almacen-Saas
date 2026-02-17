const { pool } = require('../config/db');

// 1. Obtener todos los equipos
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
    console.error('Error SQL:', error.message);
    res.status(500).json({ error: 'Error al obtener equipos' });
  }
};

// 2. Crear Equipo + Código Patrimonial Automático
const createEquipo = async (req, res) => {
  const creadorId = req.user.id;
  const {
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

    const check = await client.query(
      'SELECT id FROM equipos WHERE numero_serie = $1',
      [numero_serie],
    );
    if (check.rows.length > 0) throw new Error('El número de serie ya existe.');

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

    // --- LÓGICA INTELIGENTE DE DISPONIBILIDAD (CORREGIDA) ---
    // Aseguramos que el ID se evalúe como número entero correctamente.
    // Si es 1 (Operativo), disponible = true. Cualquier otro caso (Mantenimiento, Malogrado) = false.
    const esDisponible = Number(estado_fisico_id) === 1;

    const eqQuery = `
            INSERT INTO equipos 
            (empresa_id, marca, modelo, numero_serie, codigo_patrimonial, estado_fisico_id, disponible, es_propio, proveedor_id, fecha_adquisicion, fecha_fin_alquiler, observaciones, especificaciones, usuario_creacion_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
            RETURNING *
        `;
    const eqValues = [
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

    await client.query(
      `INSERT INTO historial_equipos (equipo_id, empresa_id, estado_fisico_id, disponible, es_propio, proveedor_id, observaciones_equipo, accion_realizada, descripcion_cambio, usuario_accion_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'REGISTRO INICIAL', $8, $9)`,
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
    res.status(201).json({ message: 'Registrado', equipo: newEquipo.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message });
  } finally {
    client.release();
  }
};

// 3. Actualizar Equipo
const updateEquipo = async (req, res) => {
  const { id } = req.params;
  const modificadorId = req.user.id;
  const {
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

    // --- LÓGICA INTELIGENTE DE DISPONIBILIDAD (CORREGIDA) ---
    const esDisponible = Number(estado_fisico_id) === 1;

    const eqQuery = `
            UPDATE equipos SET 
            empresa_id=$1, marca=$2, modelo=$3, numero_serie=$4, codigo_patrimonial=$5, 
            estado_fisico_id=$6, disponible=$7, es_propio=$8, proveedor_id=$9, fecha_adquisicion=$10, 
            fecha_fin_alquiler=$11, observaciones=$12, especificaciones=$13, 
            fecha_modificacion=NOW(), usuario_modificacion_id=$14
            WHERE id=$15 RETURNING *
        `;
    const eqValues = [
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
    if (result.rowCount === 0) throw new Error('Equipo no encontrado');

    await client.query(
      `INSERT INTO historial_equipos (equipo_id, empresa_id, estado_fisico_id, disponible, es_propio, proveedor_id, observaciones_equipo, accion_realizada, descripcion_cambio, usuario_accion_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'EDICIÓN', 'Modificación de ficha técnica', $8)`,
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
    res.json({ message: 'Equipo actualizado' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: error.message || 'Error al actualizar' });
  } finally {
    client.release();
  }
};

const toggleDisponibilidad = async (req, res) => {
  const { id } = req.params;
  const { disponible } = req.body; // true si se está reactivando, false si se da de baja
  const modificadorId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let updateQuery;
    let queryParams;

    // --- NUEVA LÓGICA MÁGICA ---
    // Si lo estamos reactivando (disponible = true), forzamos su estado a Operativo (1)
    if (disponible === true) {
      updateQuery = `
                UPDATE equipos 
                SET disponible = $1, estado_fisico_id = 1, fecha_modificacion=NOW(), usuario_modificacion_id=$2 
                WHERE id = $3 RETURNING *
            `;
      queryParams = [disponible, modificadorId, id];
    } else {
      // Si lo damos de baja, solo cambiamos la disponibilidad a false y dejamos su estado actual
      updateQuery = `
                UPDATE equipos 
                SET disponible = $1, fecha_modificacion=NOW(), usuario_modificacion_id=$2 
                WHERE id = $3 RETURNING *
            `;
      queryParams = [disponible, modificadorId, id];
    }

    const result = await client.query(updateQuery, queryParams);
    if (result.rowCount === 0) throw new Error('Equipo no encontrado');

    const equipo = result.rows[0];
    const accion = disponible ? 'REACTIVACIÓN' : 'BAJA LÓGICA';
    const detalleAccion = disponible
      ? 'Equipo reactivado y cambiado a estado Operativo automáticamente'
      : `Cambio de disponibilidad a ${disponible}`;

    // Guardamos el cambio en el historial para que quede registro de la auditoría
    await client.query(
      `INSERT INTO historial_equipos (equipo_id, empresa_id, estado_fisico_id, disponible, accion_realizada, descripcion_cambio, usuario_accion_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        equipo.empresa_id,
        equipo.estado_fisico_id, // Si se reactivó, esto ya será 1 automáticamente
        disponible,
        accion,
        detalleAccion,
        modificadorId,
      ],
    );

    await client.query('COMMIT');
    res.json({
      message: `Equipo ${disponible ? 'reactivado a Operativo' : 'dado de baja'} correctamente`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al cambiar disponibilidad' });
  } finally {
    client.release();
  }
};

const getMarcas = async (req, res) => {
  try {
    const response = await pool.query(
      'SELECT DISTINCT marca as nombre FROM equipos WHERE marca IS NOT NULL ORDER BY marca ASC',
    );
    res.json(response.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar marcas' });
  }
};

const getEstadosFisicos = async (req, res) => {
  try {
    const response = await pool.query(
      'SELECT * FROM estados_equipos ORDER BY id ASC',
    );
    res.json(response.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar estados' });
  }
};

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
    console.error('Error SQL Historial:', error.message);
    res.status(500).json({ error: 'Error al obtener el historial' });
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
