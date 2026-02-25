const { pool } = require('../config/db');

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
    res
      .status(500)
      .json({ error: 'Error interno al obtener los colaboradores.' });
  }
};

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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const query = `
      INSERT INTO colaboradores (
        empresa_id, dni, nombres, apellidos, email_contacto, 
        cargo, genero, telefono, tipo_vinculo, fecha_fin_proyecto, 
        usuario_creacion_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;
    `;
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

    const newColaborador = await client.query(query, values);
    const colabId = newColaborador.rows[0].id;

    // REGISTRO DE AUDITORÍA
    await client.query(
      `INSERT INTO historial_colaboradores (colaborador_id, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, 'REGISTRO INICIAL', 'Colaborador registrado en el sistema.', $2)`,
      [colabId, creadorId],
    );

    await client.query('COMMIT');
    res.status(201).json(newColaborador.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res
      .status(500)
      .json({ error: 'Error interno al registrar el colaborador.' });
  } finally {
    client.release();
  }
};

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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const query = `
      UPDATE colaboradores 
      SET empresa_id = $1, dni = $2, nombres = $3, apellidos = $4, email_contacto = $5, cargo = $6, genero = $7, telefono = $8, tipo_vinculo = $9, fecha_fin_proyecto = $10, fecha_modificacion = NOW(), usuario_modificacion_id = $11
      WHERE id = $12 RETURNING *;
    `;
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

    const result = await client.query(query, values);
    if (result.rowCount === 0) throw new Error('Colaborador no encontrado.');

    // REGISTRO DE AUDITORÍA
    await client.query(
      `INSERT INTO historial_colaboradores (colaborador_id, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, 'ACTUALIZACIÓN', 'Se modificaron los datos laborales o de contacto.', $2)`,
      [id, modificadorId],
    );

    await client.query('COMMIT');
    res.json({
      message: 'Colaborador actualizado correctamente.',
      colaborador: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res
      .status(500)
      .json({ error: error.message || 'Error interno al actualizar.' });
  } finally {
    client.release();
  }
};

const deleteColaborador = async (req, res) => {
  const { id } = req.params;
  const modificadorId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const query = `UPDATE colaboradores SET estado = false, fecha_modificacion = NOW(), usuario_modificacion_id = $1 WHERE id = $2 RETURNING id;`;
    const result = await client.query(query, [modificadorId, id]);
    if (result.rowCount === 0) throw new Error('Colaborador no encontrado.');

    await client.query(
      `INSERT INTO historial_colaboradores (colaborador_id, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, 'INACTIVACIÓN', 'El colaborador fue dado de baja del sistema.', $2)`,
      [id, modificadorId],
    );

    await client.query('COMMIT');
    res.json({ message: 'Colaborador dado de baja correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message || 'Error al desactivar.' });
  } finally {
    client.release();
  }
};

const activateColaborador = async (req, res) => {
  const { id } = req.params;
  const modificadorId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const query = `UPDATE colaboradores SET estado = true, fecha_modificacion = NOW(), usuario_modificacion_id = $1 WHERE id = $2 RETURNING id;`;
    const result = await client.query(query, [modificadorId, id]);
    if (result.rowCount === 0) throw new Error('Colaborador no encontrado.');

    await client.query(
      `INSERT INTO historial_colaboradores (colaborador_id, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, 'REACTIVACIÓN', 'El colaborador fue reactivado en el sistema.', $2)`,
      [id, modificadorId],
    );

    await client.query('COMMIT');
    res.json({ message: 'Colaborador reactivado correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message || 'Error al reactivar.' });
  } finally {
    client.release();
  }
};

/**
 * 6. OBTENER HISTORIAL DE UN COLABORADOR
 */
const getColaboradorHistorial = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT h.*, c.nombres as usuario_nombres, c.apellidos as usuario_apellidos
      FROM historial_colaboradores h
      LEFT JOIN usuarios uc ON h.usuario_accion_id = uc.id
      LEFT JOIN colaboradores c ON uc.colaborador_id = c.id
      WHERE h.colaborador_id = $1
      ORDER BY h.fecha_accion DESC
    `;
    const response = await pool.query(query, [id]);
    res.status(200).json(response.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial.' });
  }
};

module.exports = {
  getColaboradores,
  createColaborador,
  updateColaborador,
  deleteColaborador,
  activateColaborador,
  getColaboradorHistorial,
};
