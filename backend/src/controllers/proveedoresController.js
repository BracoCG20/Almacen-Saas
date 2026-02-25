const { pool } = require('../config/db');

const getProveedores = async (req, res) => {
  try {
    const query = `
      SELECT p.*, 
             u1.nombres as creador_nombre, u1.apellidos as creador_apellido,
             u2.nombres as modificador_nombre, u2.apellidos as modificador_apellido,
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

  let contratoUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const check = await client.query(
      'SELECT id FROM proveedores WHERE ruc = $1',
      [ruc],
    );
    if (check.rows.length > 0)
      throw new Error('El RUC ingresado ya está registrado en el sistema.');

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

    const newProv = await client.query(query, values);
    const provId = newProv.rows[0].id;

    const cambioContrato = !!contratoUrl;

    // HISTORIAL
    await client.query(
      `INSERT INTO historial_proveedores (proveedor_id, accion_realizada, descripcion_cambio, usuario_accion_id, cambio_contrato, archivo_contrato_url) 
       VALUES ($1, 'REGISTRO INICIAL', 'Proveedor creado en el sistema.', $2, $3, $4)`,
      [provId, usuarioId, cambioContrato, contratoUrl],
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Proveedor registrado exitosamente.',
      proveedor: newProv.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res
      .status(400)
      .json({ error: error.message || 'Error interno al registrar.' });
  } finally {
    client.release();
  }
};

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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const currentProv = await client.query(
      'SELECT contrato_url FROM proveedores WHERE id = $1',
      [id],
    );
    if (currentProv.rows.length === 0)
      throw new Error('Proveedor no encontrado.');

    let contratoUrl = currentProv.rows[0].contrato_url;
    let cambioContrato = false;
    let descripcion = 'Se modificaron los datos del proveedor.';

    if (eliminar_contrato === 'true') {
      contratoUrl = null;
      cambioContrato = true;
      descripcion =
        'Se modificaron los datos y se eliminó el contrato adjunto.';
    }
    if (req.file) {
      contratoUrl = `/uploads/${req.file.filename}`;
      cambioContrato = true;
      descripcion =
        'Se modificaron los datos y se actualizó el contrato adjunto.';
    }

    const query = `
      UPDATE proveedores SET 
        razon_social=$1, nombre_comercial=$2, ruc=$3, direccion=$4, departamento=$5, provincia=$6, distrito=$7, nombre_contacto=$8, 
        email_contacto=$9, telefono_contacto=$10, sitio_web=$11, tipo_servicio=$12, fecha_inicio_contrato=$13, fecha_fin_contrato=$14, contrato_url=$15,
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

    const result = await client.query(query, values);

    // HISTORIAL
    await client.query(
      `INSERT INTO historial_proveedores (proveedor_id, accion_realizada, descripcion_cambio, usuario_accion_id, cambio_contrato, archivo_contrato_url) 
       VALUES ($1, 'ACTUALIZACIÓN', $2, $3, $4, $5)`,
      [id, descripcion, usuarioId, cambioContrato, contratoUrl],
    );

    await client.query('COMMIT');
    res.json({
      message: 'Proveedor actualizado correctamente.',
      proveedor: result.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res
      .status(400)
      .json({ error: error.message || 'Error interno al actualizar.' });
  } finally {
    client.release();
  }
};

const toggleEstadoProveedor = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const usuarioId = req.user ? req.user.id : null;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const query = `
      UPDATE proveedores SET estado = $1, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $3 RETURNING id;
    `;
    const result = await client.query(query, [estado, usuarioId, id]);
    if (result.rowCount === 0) throw new Error('Proveedor no encontrado.');

    const accion = estado ? 'REACTIVACIÓN' : 'INACTIVACIÓN';
    const detalle = estado
      ? 'El proveedor fue reactivado.'
      : 'El proveedor fue dado de baja del sistema.';

    await client.query(
      `INSERT INTO historial_proveedores (proveedor_id, accion_realizada, descripcion_cambio, usuario_accion_id) VALUES ($1, $2, $3, $4)`,
      [id, accion, detalle, usuarioId],
    );

    await client.query('COMMIT');
    res.json({
      message: `Proveedor ${estado ? 'reactivado' : 'desactivado'} correctamente.`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res
      .status(400)
      .json({ error: error.message || 'Error al cambiar estado.' });
  } finally {
    client.release();
  }
};

const getProveedorHistorial = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT h.*, c.nombres as usuario_nombres, c.apellidos as usuario_apellidos
      FROM historial_proveedores h
      LEFT JOIN usuarios uc ON h.usuario_accion_id = uc.id
      LEFT JOIN colaboradores c ON uc.colaborador_id = c.id
      WHERE h.proveedor_id = $1
      ORDER BY h.fecha_accion DESC
    `;
    const response = await pool.query(query, [id]);
    res.status(200).json(response.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial.' });
  }
};

module.exports = {
  getProveedores,
  createProveedor,
  updateProveedor,
  toggleEstadoProveedor,
  getProveedorHistorial,
};
