const { pool } = require('../config/db');

/**
 * ============================================================================
 * 1. OBTENER PROVEEDORES
 * ============================================================================
 * Lista todos los proveedores, cruzando datos de auditoría (quién creó/editó)
 * y contando cuántos equipos tiene asignados actualmente cada proveedor.
 */
const getProveedores = async (req, res) => {
  try {
    const query = `
            SELECT 
                p.*, 
                u1.nombres as creador_nombre, 
                u1.apellidos as creador_apellido,
                u2.nombres as modificador_nombre,
                u2.apellidos as modificador_apellido,
                (SELECT COUNT(*) FROM equipos e WHERE e.proveedor_id = p.id) as total_equipos
            FROM proveedores p
            LEFT JOIN usuarios uc1 ON p.usuario_creacion_id = uc1.id
            LEFT JOIN colaboradores u1 ON uc1.colaborador_id = u1.id
            LEFT JOIN usuarios uc2 ON p.usuario_modificacion_id = uc2.id
            LEFT JOIN colaboradores u2 ON uc2.colaborador_id = u2.id
            ORDER BY p.estado DESC, p.razon_social ASC
        `;
    const response = await pool.query(query);
    res.status(200).json(response.rows);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error interno al cargar los proveedores.' });
  }
};

/**
 * ============================================================================
 * 2. CREAR PROVEEDOR
 * ============================================================================
 * Registra un nuevo proveedor en la base de datos, verificando que el RUC
 * no esté duplicado, y almacena el archivo de contrato si es proporcionado.
 */
const createProveedor = async (req, res) => {
  const usuarioId = req.user ? req.user.id : null;
  const {
    razon_social,
    nombre_comercial,
    ruc,
    direccion,
    departamento,
    provincia,
    distrito,
    nombre_contacto,
    email_contacto,
    telefono_contacto,
    sitio_web,
    tipo_servicio,
    fecha_inicio_contrato,
    fecha_fin_contrato,
  } = req.body;

  let contratoUrl = null;
  if (req.file) {
    contratoUrl = `/uploads/${req.file.filename}`;
  }

  try {
    const check = await pool.query(
      'SELECT id FROM proveedores WHERE ruc = $1',
      [ruc],
    );
    if (check.rows.length > 0) {
      return res
        .status(400)
        .json({ error: 'El RUC ingresado ya está registrado en el sistema.' });
    }

    const query = `
            INSERT INTO proveedores (
                razon_social, nombre_comercial, ruc, direccion, departamento, provincia, distrito, 
                nombre_contacto, email_contacto, telefono_contacto, sitio_web, tipo_servicio, 
                fecha_inicio_contrato, fecha_fin_contrato, contrato_url, usuario_creacion_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *;
        `;

    const values = [
      razon_social,
      nombre_comercial || null,
      ruc,
      direccion || null,
      departamento || null,
      provincia || null,
      distrito || null,
      nombre_contacto || null,
      email_contacto || null,
      telefono_contacto || null,
      sitio_web || null,
      tipo_servicio || null,
      fecha_inicio_contrato || null,
      fecha_fin_contrato || null,
      contratoUrl,
      usuarioId,
    ];

    const newProv = await pool.query(query, values);
    res.status(201).json({
      message: 'Proveedor registrado exitosamente.',
      proveedor: newProv.rows[0],
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error interno al registrar el proveedor.' });
  }
};

/**
 * ============================================================================
 * 3. ACTUALIZAR PROVEEDOR
 * ============================================================================
 * Edita la información del proveedor. Si se envía un nuevo PDF, sobrescribe el actual.
 * Si se envía 'eliminar_contrato' = true, se borra el PDF actual.
 */
const updateProveedor = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null;
  const {
    razon_social,
    nombre_comercial,
    ruc,
    direccion,
    departamento,
    provincia,
    distrito,
    nombre_contacto,
    email_contacto,
    telefono_contacto,
    sitio_web,
    tipo_servicio,
    fecha_inicio_contrato,
    fecha_fin_contrato,
    eliminar_contrato,
  } = req.body;

  try {
    const currentProv = await pool.query(
      'SELECT contrato_url FROM proveedores WHERE id = $1',
      [id],
    );
    if (currentProv.rows.length === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado.' });
    }

    let contratoUrl = currentProv.rows[0].contrato_url;

    // Lógica de archivo adjunto
    if (eliminar_contrato === 'true') {
      contratoUrl = null;
    }
    if (req.file) {
      contratoUrl = `/uploads/${req.file.filename}`;
    }

    const query = `
            UPDATE proveedores SET 
                razon_social=$1, nombre_comercial=$2, ruc=$3, direccion=$4, 
                departamento=$5, provincia=$6, distrito=$7, nombre_contacto=$8, 
                email_contacto=$9, telefono_contacto=$10, sitio_web=$11, tipo_servicio=$12,
                fecha_inicio_contrato=$13, fecha_fin_contrato=$14, contrato_url=$15,
                fecha_modificacion=NOW(), usuario_modificacion_id=$16
            WHERE id=$17 RETURNING *;
        `;
    const values = [
      razon_social,
      nombre_comercial || null,
      ruc,
      direccion || null,
      departamento || null,
      provincia || null,
      distrito || null,
      nombre_contacto || null,
      email_contacto || null,
      telefono_contacto || null,
      sitio_web || null,
      tipo_servicio || null,
      fecha_inicio_contrato || null,
      fecha_fin_contrato || null,
      contratoUrl,
      usuarioId,
      id,
    ];

    const result = await pool.query(query, values);
    res.json({
      message: 'Proveedor actualizado correctamente.',
      proveedor: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res
      .status(500)
      .json({ error: 'Error interno al actualizar el proveedor.' });
  }
};

/**
 * ============================================================================
 * 4. DESACTIVAR PROVEEDOR (Baja Lógica)
 * ============================================================================
 */
const deleteProveedor = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null;
  try {
    const query = `
            UPDATE proveedores 
            SET estado = false, fecha_modificacion = NOW(), usuario_modificacion_id = $2 
            WHERE id = $1 RETURNING id;
        `;
    const result = await pool.query(query, [id, usuarioId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado.' });
    }

    res.json({ message: 'Proveedor desactivado correctamente.' });
  } catch (error) {
    console.error('Error al desactivar proveedor:', error);
    res
      .status(500)
      .json({ error: 'Error interno al desactivar el proveedor.' });
  }
};

/**
 * ============================================================================
 * 5. REACTIVAR PROVEEDOR
 * ============================================================================
 */
const activateProveedor = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user ? req.user.id : null;
  try {
    const query = `
            UPDATE proveedores 
            SET estado = true, fecha_modificacion = NOW(), usuario_modificacion_id = $2 
            WHERE id = $1 RETURNING id;
        `;
    const result = await pool.query(query, [id, usuarioId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Proveedor no encontrado.' });
    }

    res.json({ message: 'Proveedor reactivado correctamente.' });
  } catch (error) {
    console.error('Error al reactivar proveedor:', error);
    res.status(500).json({ error: 'Error interno al reactivar el proveedor.' });
  }
};

module.exports = {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  activateProveedor,
};
