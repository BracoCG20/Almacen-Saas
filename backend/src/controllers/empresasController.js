const { pool } = require('../config/db');

/**
 * ============================================================================
 * 1. OBTENER EMPRESAS
 * ============================================================================
 * Lista todas las empresas registradas y cruza los IDs de creación y modificación
 * para devolver el correo del usuario responsable en la auditoría.
 */
const getEmpresas = async (req, res) => {
  try {
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
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res
      .status(500)
      .json({ error: 'Error interno al cargar la lista de empresas.' });
  }
};

/**
 * ============================================================================
 * 2. CREAR EMPRESA
 * ============================================================================
 * Valida que el RUC no exista previamente e inserta un nuevo registro.
 */
const createEmpresa = async (req, res) => {
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
  } = req.body;

  const creadorId = req.user.id;

  try {
    // 1. Validación de RUC único
    const check = await pool.query('SELECT id FROM empresas WHERE ruc = $1', [
      ruc,
    ]);
    if (check.rows.length > 0) {
      return res
        .status(400)
        .json({ error: 'El RUC ingresado ya está registrado en el sistema.' });
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

    res.status(201).json({
      message: 'Empresa registrada exitosamente.',
      empresa: newEmpresa.rows[0],
    });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    res.status(500).json({ error: 'Error interno al registrar la empresa.' });
  }
};

/**
 * ============================================================================
 * 3. ACTUALIZAR EMPRESA
 * ============================================================================
 * Edita la información general de una empresa existente.
 * Actualiza el timestamp y el usuario modificador.
 */
const updateEmpresa = async (req, res) => {
  const { id } = req.params;
  const modificadorId = req.user.id;
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
  } = req.body;

  try {
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
      return res
        .status(404)
        .json({ error: 'La empresa solicitada no existe.' });
    }

    res.json({
      message: 'Empresa actualizada correctamente.',
      empresa: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    res.status(500).json({ error: 'Error interno al actualizar la empresa.' });
  }
};

/**
 * ============================================================================
 * 4. DESACTIVAR EMPRESA (Baja Lógica)
 * ============================================================================
 */
const deleteEmpresa = async (req, res) => {
  const { id } = req.params;
  const modificadorId = req.user.id;

  try {
    const query = `
            UPDATE empresas 
            SET estado = false, fecha_modificacion = NOW(), usuario_modificacion_id = $1 
            WHERE id = $2 RETURNING *;
        `;
    const result = await pool.query(query, [modificadorId, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    res.json({ message: 'Empresa desactivada correctamente.' });
  } catch (error) {
    console.error('Error al desactivar empresa:', error);
    res.status(500).json({ error: 'Error interno al desactivar la empresa.' });
  }
};

/**
 * ============================================================================
 * 5. REACTIVAR EMPRESA
 * ============================================================================
 */
const activateEmpresa = async (req, res) => {
  const { id } = req.params;
  const modificadorId = req.user.id;

  try {
    const query = `
            UPDATE empresas 
            SET estado = true, fecha_modificacion = NOW(), usuario_modificacion_id = $1 
            WHERE id = $2 RETURNING *;
        `;
    const result = await pool.query(query, [modificadorId, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada.' });
    }

    res.json({ message: 'Empresa reactivada correctamente.' });
  } catch (error) {
    console.error('Error al reactivar empresa:', error);
    res.status(500).json({ error: 'Error interno al reactivar la empresa.' });
  }
};

module.exports = {
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  activateEmpresa,
};
