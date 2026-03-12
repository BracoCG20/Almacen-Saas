const { pool } = require('../config/db');

const getDashboardData = async () => {
  // Consulta 1: Inventario de Equipos
  const equiposQuery = `
    SELECT 
        e.id, e.disponible, e.es_propio, e.fecha_adquisicion,
        st.nombre AS estado_fisico, emp.razon_social AS empresa_nombre, prov.razon_social AS proveedor_nombre
    FROM equipos e
    LEFT JOIN estados_equipos st ON e.estado_fisico_id = st.id
    LEFT JOIN empresas emp ON e.empresa_id = emp.id
    LEFT JOIN proveedores prov ON e.proveedor_id = prov.id;
  `;

  // Consulta 2: Historial de Firmas
  const movQuery = `
    SELECT id, tipo_movimiento, fecha_movimiento, pdf_firmado_url, firma_valida 
    FROM historial_movimientos;
  `;

  // Consulta 3: Servicios Activos
  const serviciosQuery = `
    SELECT nombre, categoria_servicio, precio, moneda, frecuencia_pago, estado 
    FROM servicios WHERE estado = true;
  `;

  // Consulta 4: Tickets de Soporte
  const ticketsQuery = `
    SELECT id, estado, tipo_solicitud, prioridad, fecha_creacion, fecha_inicio_atencion, fecha_cierre 
    FROM tickets;
  `;

  // Ejecutar las 4 consultas en paralelo
  const [equiposRes, movRes, serviciosRes, ticketsRes] = await Promise.all([
    pool.query(equiposQuery),
    pool.query(movQuery),
    pool.query(serviciosQuery),
    pool.query(ticketsQuery),
  ]);

  return {
    equipos: equiposRes.rows,
    movimientos: movRes.rows,
    servicios: serviciosRes.rows,
    tickets: ticketsRes.rows, // <-- Devolvemos los tickets
  };
};

module.exports = { getDashboardData };
