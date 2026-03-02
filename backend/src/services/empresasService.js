const { pool } = require('../config/db');

const getAllEmpresas = async () => {
  const query = `
    SELECT e.*, 
           uc.email_login as creador_email, 
           uu.email_login as editor_email
    FROM empresas e
    LEFT JOIN usuarios uc ON e.usuario_creacion_id = uc.id
    LEFT JOIN usuarios uu ON e.usuario_modificacion_id = uu.id
    ORDER BY e.estado DESC, e.razon_social ASC
  `;
  const response = await pool.query(query);
  return response.rows;
};

const createEmpresa = async (data, creadorId) => {
  const {
    razon_social,
    nombre_comercial,
    ruc,
    direccion_fiscal,
    departamento,
    provincia,
    distrito,
    telefono_contacto,
    email_contacto,
    sitio_web,
    nombre_representante_legal,
    fecha_inicio_actividades,
  } = data;

  // 1. Validación de RUC único
  const check = await pool.query('SELECT id FROM empresas WHERE ruc = $1', [
    ruc,
  ]);
  if (check.rows.length > 0) {
    throw new Error('El RUC ingresado ya está registrado en el sistema.');
  }

  // 2. Inserción de datos
  const query = `
    INSERT INTO empresas (
      razon_social, nombre_comercial, ruc, direccion_fiscal, departamento, 
      provincia, distrito, telefono_contacto, email_contacto, sitio_web, 
      nombre_representante_legal, fecha_inicio_actividades, usuario_creacion_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
    RETURNING *;
  `;

  const values = [
    razon_social,
    nombre_comercial,
    ruc,
    direccion_fiscal,
    departamento,
    provincia,
    distrito,
    telefono_contacto,
    email_contacto,
    sitio_web,
    nombre_representante_legal,
    fecha_inicio_actividades || null,
    creadorId,
  ];

  const newEmpresa = await pool.query(query, values);
  return newEmpresa.rows[0];
};

const updateEmpresa = async (id, data, modificadorId) => {
  const {
    razon_social,
    nombre_comercial,
    ruc,
    direccion_fiscal,
    departamento,
    provincia,
    distrito,
    telefono_contacto,
    email_contacto,
    sitio_web,
    nombre_representante_legal,
    fecha_inicio_actividades,
  } = data;

  const query = `
    UPDATE empresas SET 
      razon_social=$1, nombre_comercial=$2, ruc=$3, direccion_fiscal=$4, 
      departamento=$5, provincia=$6, distrito=$7, telefono_contacto=$8, 
      email_contacto=$9, sitio_web=$10, nombre_representante_legal=$11, 
      fecha_inicio_actividades=$12, fecha_modificacion=NOW(), usuario_modificacion_id=$13
    WHERE id=$14 RETURNING *;
  `;

  const values = [
    razon_social,
    nombre_comercial,
    ruc,
    direccion_fiscal,
    departamento,
    provincia,
    distrito,
    telefono_contacto,
    email_contacto,
    sitio_web,
    nombre_representante_legal,
    fecha_inicio_actividades || null,
    modificadorId,
    id,
  ];

  const result = await pool.query(query, values);

  if (result.rowCount === 0) {
    throw new Error('La empresa solicitada no existe.');
  }

  return result.rows[0];
};

const toggleEstadoEmpresa = async (id, modificadorId, estado) => {
  const query = `
    UPDATE empresas 
    SET estado = $1, fecha_modificacion = NOW(), usuario_modificacion_id = $2 
    WHERE id = $3 RETURNING *;
  `;
  const result = await pool.query(query, [estado, modificadorId, id]);

  if (result.rowCount === 0) {
    throw new Error('Empresa no encontrada.');
  }

  return result.rows[0];
};

module.exports = {
  getAllEmpresas,
  createEmpresa,
  updateEmpresa,
  toggleEstadoEmpresa,
};
