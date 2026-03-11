const { pool } = require('../config/db');

// Obtener todos los tickets con los nombres del solicitante y del asignado
const getTickets = async () => {
  const query = `
        SELECT 
            t.*,
            c.nombres as solicitante_nombres, c.apellidos as solicitante_apellidos,
            uc.nombres as asignado_nombres, uc.apellidos as asignado_apellidos,
            e.modelo as equipo_nombre,
            s.nombre as servicio_nombre
        FROM tickets t
        JOIN colaboradores c ON t.colaborador_id = c.id
        LEFT JOIN usuarios u ON t.usuario_asignado_id = u.id
        LEFT JOIN colaboradores uc ON u.colaborador_id = uc.id
        LEFT JOIN equipos e ON t.equipo_id = e.id
        LEFT JOIN servicios s ON t.servicio_id = s.id
        ORDER BY t.fecha_creacion DESC
    `;
  const response = await pool.query(query);
  return response.rows;
};

// Obtener el historial y comentarios de un ticket específico
const getTicketHistorial = async (ticketId) => {
  const query = `
        SELECT 
            ht.*,
            uc.nombres as usuario_nombres, uc.apellidos as usuario_apellidos
        FROM historial_tickets ht
        LEFT JOIN usuarios u ON ht.usuario_registro_id = u.id
        LEFT JOIN colaboradores uc ON u.colaborador_id = uc.id
        WHERE ht.ticket_id = $1
        ORDER BY ht.fecha_registro DESC
    `;
  const response = await pool.query(query, [ticketId]);
  return response.rows;
};

// Crear un nuevo ticket
const createTicket = async (data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar el Ticket
    const queryTicket = `
            INSERT INTO tickets (colaborador_id, asunto, descripcion, tipo_solicitud, prioridad, equipo_id, servicio_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
        `;
    const valuesTicket = [
      data.colaborador_id,
      data.asunto,
      data.descripcion,
      data.tipo_solicitud,
      data.prioridad || 'Media',
      data.equipo_id || null,
      data.servicio_id || null,
    ];
    const resTicket = await client.query(queryTicket, valuesTicket);
    const nuevoId = resTicket.rows[0].id;

    // 2. Registrar el evento de creación en el Historial
    const queryHistorial = `
            INSERT INTO historial_tickets (ticket_id, accion, estado_nuevo, detalles, usuario_registro_id) 
            VALUES ($1, 'CREADO', 'Pendiente', 'El ticket ha sido creado y está a la espera de atención.', $2)
        `;
    await client.query(queryHistorial, [nuevoId, userId]);

    await client.query('COMMIT');
    return nuevoId;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

// Actualizar estado, prioridad o asignación del ticket
const updateTicket = async (id, data, userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener datos antiguos para comparar
    const resOld = await client.query(
      'SELECT estado, usuario_asignado_id FROM tickets WHERE id = $1',
      [id],
    );
    const oldData = resOld.rows[0];

    // Actualizar Ticket
    const query = `
            UPDATE tickets 
            SET estado = $1, prioridad = $2, usuario_asignado_id = $3, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = $4 RETURNING *
        `;
    const values = [
      data.estado,
      data.prioridad,
      data.usuario_asignado_id || null,
      id,
    ];
    await client.query(query, values);

    // Si cambió el estado, registrarlo en el historial
    if (oldData.estado !== data.estado) {
      let accion =
        data.estado === 'Resuelto' || data.estado === 'Rechazado'
          ? 'CERRADO'
          : 'CAMBIO_ESTADO';

      // Si se cierra, actualizamos la fecha de cierre en la tabla principal
      if (accion === 'CERRADO') {
        await client.query(
          'UPDATE tickets SET fecha_cierre = CURRENT_TIMESTAMP WHERE id = $1',
          [id],
        );
      }

      const queryHistorial = `
                INSERT INTO historial_tickets (ticket_id, accion, estado_anterior, estado_nuevo, detalles, usuario_registro_id) 
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
      await client.query(queryHistorial, [
        id,
        accion,
        oldData.estado,
        data.estado,
        `El estado cambió a ${data.estado}`,
        userId,
      ]);
    }

    // Si se asignó a una persona nueva, registrarlo
    if (
      oldData.usuario_asignado_id !== data.usuario_asignado_id &&
      data.usuario_asignado_id !== null
    ) {
      await client.query(
        `
                INSERT INTO historial_tickets (ticket_id, accion, detalles, usuario_registro_id) 
                VALUES ($1, 'ASIGNADO', 'El ticket ha sido asignado a un técnico para su revisión.', $2)
            `,
        [id, userId],
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

// Añadir un comentario (respuesta) al ticket
const addComentario = async (ticketId, detalles, userId) => {
  const queryHistorial = `
        INSERT INTO historial_tickets (ticket_id, accion, detalles, usuario_registro_id) 
        VALUES ($1, 'COMENTARIO', $2, $3) RETURNING *
    `;
  const res = await pool.query(queryHistorial, [ticketId, detalles, userId]);

  // Actualizar la fecha de modificación del ticket para que suba en la lista
  await pool.query(
    'UPDATE tickets SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $1',
    [ticketId],
  );

  return res.rows[0];
};

module.exports = {
  getTickets,
  getTicketHistorial,
  createTicket,
  updateTicket,
  addComentario,
};
