const { pool } = require('../config/db');

const getDashboardData = async () => {
  // Consulta 1: Inventario de Equipos
  const equiposQuery = `
    SELECT 
        e.id, 
        e.disponible, 
        e.es_propio,
        e.fecha_adquisicion,
        st.nombre AS estado_fisico,
        emp.razon_social AS empresa_nombre,
        prov.razon_social AS proveedor_nombre
    FROM equipos e
    LEFT JOIN estados_equipos st ON e.estado_fisico_id = st.id
    LEFT JOIN empresas emp ON e.empresa_id = emp.id
    LEFT JOIN proveedores prov ON e.proveedor_id = prov.id;
  `;

  // Consulta 2: Historial y Auditoría de Firmas
  const movQuery = `
    SELECT id, tipo_movimiento, fecha_movimiento, pdf_firmado_url, firma_valida 
    FROM historial_movimientos;
  `;

  // Consulta 3: Servicios Activos y Finanzas
  const serviciosQuery = `
    SELECT nombre, categoria_servicio, precio, moneda, frecuencia_pago, estado 
    FROM servicios
    WHERE estado = true;
  `;

  // Ejecutamos las 3 consultas de forma simultánea (Concurrencia)
  const [equiposRes, movRes, serviciosRes] = await Promise.all([
    pool.query(equiposQuery),
    pool.query(movQuery),
    pool.query(serviciosQuery),
  ]);

  return {
    equipos: equiposRes.rows,
    movimientos: movRes.rows,
    servicios: serviciosRes.rows,
  };
};

module.exports = {
  getDashboardData,
};
