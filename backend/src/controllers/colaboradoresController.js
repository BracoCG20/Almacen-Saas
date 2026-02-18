const { pool } = require('../config/db');

/**
 * ============================================================================
 * 1. OBTENER COLABORADORES
 * ============================================================================
 * Obtiene la lista de todos los colaboradores, incluyendo la empresa a la
 * que pertenecen y el usuario que los registró en el sistema.
 */
const getColaboradores = async (req, res) => {
  try {
    const query = `
            SELECT c.*, 
				   c.fecha_registro as fecha_creacion,
                   e.razon_social as empresa_nombre,
                   cc.nombres as creador_nombre,
                   uc.email_login as creador_email
            FROM colaboradores c
            LEFT JOIN empresas e ON c.empresa_id = e.id
            LEFT JOIN usuarios uc ON c.usuario_creacion_id = uc.id
            LEFT JOIN colaboradores cc ON uc.colaborador_id = cc.id
            ORDER BY c.estado DESC, c.nombres ASC
        `;
    const response = await pool.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error al obtener colaboradores:', error);
    res
      .status(500)
      .json({ error: 'Error interno al obtener los colaboradores.' });
  }
};

/**
 * ============================================================================
 * 2. CREAR COLABORADOR
 * ============================================================================
 * Registra un nuevo colaborador en la base de datos.
 */
const createColaborador = async (req, res) => {
  const creadorId = req.user.id;
  const {
    empresa_id,
    dni,
    nombres,
    apellidos,
    email_contacto,
    cargo,
    genero,
    telefono,
    tipo_vinculo,
    fecha_fin_proyecto,
  } = req.body;

  try {
    const query = `
            INSERT INTO colaboradores (
                empresa_id, dni, nombres, apellidos, email_contacto, 
                cargo, genero, telefono, tipo_vinculo, fecha_fin_proyecto, 
                usuario_creacion_id
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *;
        `;

    // Validación backend: Si es Planilla, forzamos a que la fecha sea NULL
    const fechaFin =
      tipo_vinculo === 'Planilla' || !fecha_fin_proyecto
        ? null
        : fecha_fin_proyecto;

    const values = [
      empresa_id,
      dni,
      nombres,
      apellidos,
      email_contacto,
      cargo,
      genero,
      telefono,
      tipo_vinculo,
      fechaFin,
      creadorId,
    ];

    const newColaborador = await pool.query(query, values);
    res.status(201).json(newColaborador.rows[0]);
  } catch (error) {
    console.error('Error al crear colaborador:', error);
    res
      .status(500)
      .json({ error: 'Error interno al registrar el colaborador.' });
  }
};

/**
 * ============================================================================
 * 3. ACTUALIZAR COLABORADOR
 * ============================================================================
 * Edita los datos de un colaborador existente.
 */
const updateColaborador = async (req, res) => {
  const { id } = req.params;
  const modificadorId = req.user.id;
  const {
    empresa_id,
    dni,
    nombres,
    apellidos,
    email_contacto,
    cargo,
    genero,
    telefono,
    tipo_vinculo,
    fecha_fin_proyecto,
  } = req.body;

  try {
    const query = `
            UPDATE colaboradores 
            SET empresa_id = $1, dni = $2, nombres = $3, apellidos = $4, 
                email_contacto = $5, cargo = $6, genero = $7, telefono = $8, 
                tipo_vinculo = $9, fecha_fin_proyecto = $10, 
                fecha_modificacion = NOW(), usuario_modificacion_id = $11
            WHERE id = $12 
            RETURNING *;
        `;

    // Validación backend: Si es Planilla, forzamos a que la fecha sea NULL
    const fechaFin =
      tipo_vinculo === 'Planilla' || !fecha_fin_proyecto
        ? null
        : fecha_fin_proyecto;

    const values = [
      empresa_id,
      dni,
      nombres,
      apellidos,
      email_contacto,
      cargo,
      genero,
      telefono,
      tipo_vinculo,
      fechaFin,
      modificadorId,
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Colaborador no encontrado.' });
    }

    res.json({
      message: 'Colaborador actualizado correctamente.',
      colaborador: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar colaborador:', error);
    res
      .status(500)
      .json({ error: 'Error interno al actualizar el colaborador.' });
  }
};

/**
 * ============================================================================
 * 4. DESACTIVAR COLABORADOR (Baja Lógica)
 * ============================================================================
 */
const deleteColaborador = async (req, res) => {
  const { id } = req.params;
  const modificadorId = req.user.id;

  try {
    const query = `
            UPDATE colaboradores 
            SET estado = false, fecha_modificacion = NOW(), usuario_modificacion_id = $1 
            WHERE id = $2 RETURNING *;
        `;
    const result = await pool.query(query, [modificadorId, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Colaborador no encontrado.' });
    }

    res.json({ message: 'Colaborador dado de baja correctamente.' });
  } catch (error) {
    console.error('Error al desactivar colaborador:', error);
    res
      .status(500)
      .json({ error: 'Error interno al desactivar el colaborador.' });
  }
};

/**
 * ============================================================================
 * 5. REACTIVAR COLABORADOR
 * ============================================================================
 */
const activateColaborador = async (req, res) => {
  const { id } = req.params;
  const modificadorId = req.user.id;

  try {
    const query = `
            UPDATE colaboradores 
            SET estado = true, fecha_modificacion = NOW(), usuario_modificacion_id = $1 
            WHERE id = $2 RETURNING *;
        `;
    const result = await pool.query(query, [modificadorId, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Colaborador no encontrado.' });
    }

    res.json({ message: 'Colaborador reactivado correctamente.' });
  } catch (error) {
    console.error('Error al reactivar colaborador:', error);
    res
      .status(500)
      .json({ error: 'Error interno al reactivar el colaborador.' });
  }
};

module.exports = {
  getColaboradores,
  createColaborador,
  updateColaborador,
  deleteColaborador,
  activateColaborador,
};
