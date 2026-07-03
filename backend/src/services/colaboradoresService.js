//backend/src/services/colaboradoresService.js
const { pool } = require('../config/db');

const getAllColaboradores = async () => {
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
  return response.rows;
};

const createColaborador = async (data, creadorId) => {
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
  } = data;
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

    // Registro de Auditoría
    await client.query(
      `INSERT INTO historial_colaboradores (colaborador_id, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, 'REGISTRO INICIAL', 'Colaborador registrado en el sistema.', $2)`,
      [colabId, creadorId],
    );

    await client.query('COMMIT');
    return newColaborador.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateColaborador = async (id, data, modificadorId) => {
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
  } = data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const query = `
      UPDATE colaboradores 
      SET empresa_id = $1, dni = $2, nombres = $3, apellidos = $4, email_contacto = $5, 
          cargo = $6, genero = $7, telefono = $8, tipo_vinculo = $9, fecha_fin_proyecto = $10, 
          fecha_modificacion = NOW(), usuario_modificacion_id = $11
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

    // Registro de Auditoría
    await client.query(
      `INSERT INTO historial_colaboradores (colaborador_id, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, 'ACTUALIZACIÓN', 'Se modificaron los datos laborales o de contacto.', $2)`,
      [id, modificadorId],
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const toggleEstadoColaborador = async (id, modificadorId, activo) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const query = `UPDATE colaboradores SET estado = $1, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $3 RETURNING id;`;
    const result = await client.query(query, [activo, modificadorId, id]);

    if (result.rowCount === 0) throw new Error('Colaborador no encontrado.');

    const accion = activo ? 'REACTIVACIÓN' : 'INACTIVACIÓN';
    const detalle = activo
      ? 'El colaborador fue reactivado en el sistema.'
      : 'El colaborador fue dado de baja del sistema.';

    await client.query(
      `INSERT INTO historial_colaboradores (colaborador_id, accion_realizada, descripcion_cambio, usuario_accion_id) 
       VALUES ($1, $2, $3, $4)`,
      [id, accion, detalle, modificadorId],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getHistorial = async (id) => {
  const query = `
    SELECT h.*, c.nombres as usuario_nombres, c.apellidos as usuario_apellidos
    FROM historial_colaboradores h
    LEFT JOIN usuarios uc ON h.usuario_accion_id = uc.id
    LEFT JOIN colaboradores c ON uc.colaborador_id = c.id
    WHERE h.colaborador_id = $1
    ORDER BY h.fecha_accion DESC
  `;
  const response = await pool.query(query, [id]);
  return response.rows;
};

module.exports = {
  getAllColaboradores,
  createColaborador,
  updateColaborador,
  toggleEstadoColaborador,
  getHistorial,
};
