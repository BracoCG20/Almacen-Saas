const { pool } = require('../config/db');

const getEstadisticas = async () => {
  const query = `
        SELECT 
            cl.tipo_licencia,
            cl.cantidad_total as total,
            COALESCE(COUNT(d.id), 0) as usadas
        FROM config_licencias cl
        LEFT JOIN directorio d ON cl.tipo_licencia = d.tipo_licencia AND d.estado = true
        GROUP BY cl.tipo_licencia, cl.cantidad_total
    `;
  const response = await pool.query(query);

  return response.rows.map((row) => ({
    tipo_licencia: row.tipo_licencia,
    total: parseInt(row.total),
    usadas: parseInt(row.usadas),
    disponibles: parseInt(row.total) - parseInt(row.usadas),
  }));
};

const getDirectorio = async () => {
  const query = `
        SELECT 
            d.id, d.colaborador_id, d.tipo_licencia, d.estado, 
            d.datos_transferidos, d.colaborador_destino_id, d.fecha_creacion,
            c.nombres as colaborador_nombres, c.apellidos as colaborador_apellidos, c.email_contacto as email_corporativo,
            cd.nombres as destino_nombres, cd.apellidos as destino_apellidos
        FROM directorio d
        JOIN colaboradores c ON d.colaborador_id = c.id
        LEFT JOIN colaboradores cd ON d.colaborador_destino_id = cd.id
        ORDER BY d.estado DESC, c.nombres ASC
    `;
  const response = await pool.query(query);
  return response.rows;
};

// FUNCIÓN CORREGIDA: Obtener historial completo de auditoría
const getHistorialDirectorio = async () => {
  // CORRECCIÓN: Se agrego el JOIN extra hacia 'colaboradores uc' para sacar el nombre real de quien hizo el cambio
  const query = `
        SELECT 
            hd.*,
            c.nombres as col_nombres, c.apellidos as col_apellidos,
            cd.nombres as dest_nombres, cd.apellidos as dest_apellidos,
            uc.nombres as resp_nombres, uc.apellidos as resp_apellidos
        FROM historial_directorio hd
        JOIN colaboradores c ON hd.colaborador_id = c.id
        LEFT JOIN colaboradores cd ON hd.colaborador_destino_id = cd.id
        LEFT JOIN usuarios u ON hd.usuario_registro_id = u.id
        LEFT JOIN colaboradores uc ON u.colaborador_id = uc.id
        ORDER BY hd.fecha_registro DESC
    `;
  const response = await pool.query(query);
  return response.rows;
};

// Registrar en auditoría
const registrarHistorial = async (
  client,
  directorio_id,
  colab_id,
  tipo_lic,
  estado,
  transferidos,
  dest_id,
  accion,
  usuario_id,
  detalles,
) => {
  const query = `
        INSERT INTO historial_directorio 
        (directorio_id, colaborador_id, tipo_licencia, estado, datos_transferidos, colaborador_destino_id, accion, usuario_registro_id, detalles) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
  await client.query(query, [
    directorio_id,
    colab_id,
    tipo_lic,
    estado,
    transferidos,
    dest_id,
    accion,
    usuario_id,
    detalles,
  ]);
};

const crearRegistro = async (data, adminId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Crear en directorio
    const query = `
            INSERT INTO directorio (colaborador_id, tipo_licencia, estado, usuario_creacion_id) 
            VALUES ($1, $2, $3, $4) RETURNING id
        `;
    const resDir = await client.query(query, [
      data.colaborador_id,
      data.tipo_licencia,
      true,
      adminId,
    ]);
    const nuevoId = resDir.rows[0].id;

    // 2. Registrar en historial
    await registrarHistorial(
      client,
      nuevoId,
      data.colaborador_id,
      data.tipo_licencia,
      true,
      false,
      null,
      'CREACION',
      adminId,
      'Asignación inicial de licencia',
    );

    await client.query('COMMIT');
    return nuevoId;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const actualizarRegistro = async (id, data, adminId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const estadoActivo = data.estado === true || data.estado === 'true';
    const transferido = estadoActivo ? false : data.datos_transferidos || false;
    const destinoId =
      estadoActivo || !transferido ? null : data.colaborador_destino_id;

    let accionAuditoria = 'EDICION';
    let detallesAuditoria = 'Cambio de tipo de licencia';

    // Obtener estado anterior para saber si es Baja o Reactivación
    const oldQuery = await client.query(
      'SELECT estado, colaborador_id FROM directorio WHERE id = $1',
      [id],
    );
    const oldData = oldQuery.rows[0];

    if (oldData.estado === true && !estadoActivo) {
      accionAuditoria = 'BAJA';
      detallesAuditoria = transferido
        ? 'Licencia suspendida con transferencia de datos'
        : 'Licencia suspendida sin transferencia';

      // AUTOMATIZACIÓN: Desactivar al colaborador en su tabla
      await client.query(
        'UPDATE colaboradores SET estado = false, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $1',
        [oldData.colaborador_id, adminId],
      );
    } else if (oldData.estado === false && estadoActivo) {
      accionAuditoria = 'REACTIVACION';
      detallesAuditoria = 'Reactivación de licencia previamente suspendida';

      // AUTOMATIZACIÓN: Reactivar al colaborador
      await client.query(
        'UPDATE colaboradores SET estado = true, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $1',
        [oldData.colaborador_id, adminId],
      );
    }

    const query = `
            UPDATE directorio 
            SET tipo_licencia = $1, estado = $2, datos_transferidos = $3, colaborador_destino_id = $4,
                fecha_modificacion = NOW(), usuario_modificacion_id = $5
            WHERE id = $6 RETURNING id, colaborador_id
        `;
    const resUpdate = await client.query(query, [
      data.tipo_licencia,
      estadoActivo,
      transferido,
      destinoId,
      adminId,
      id,
    ]);

    // Registrar Historial
    await registrarHistorial(
      client,
      id,
      resUpdate.rows[0].colaborador_id,
      data.tipo_licencia,
      estadoActivo,
      transferido,
      destinoId,
      accionAuditoria,
      adminId,
      detallesAuditoria,
    );

    await client.query('COMMIT');
    return resUpdate.rows[0].id;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

const eliminarRegistro = async (id) => {
  const query = `DELETE FROM directorio WHERE id = $1 RETURNING id`;
  const response = await pool.query(query, [id]);
  return response.rows[0];
};

module.exports = {
  getEstadisticas,
  getDirectorio,
  getHistorialDirectorio,
  crearRegistro,
  actualizarRegistro,
  eliminarRegistro,
};
