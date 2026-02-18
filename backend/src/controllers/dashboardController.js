const { pool } = require('../config/db');

/**
 * ============================================================================
 * 1. OBTENER ESTADÍSTICAS DEL DASHBOARD
 * ============================================================================
 * Extrae y consolida la información general para alimentar los gráficos y KPIs.
 * Optimizado con Promise.all para ejecutar las 3 consultas en paralelo y
 * reducir drásticamente el tiempo de carga de la pantalla principal.
 */
const getDashboardStats = async (req, res) => {
  try {
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

    // Retornamos el objeto consolidado al frontend
    res.status(200).json({
      equipos: equiposRes.rows,
      movimientos: movRes.rows,
      servicios: serviciosRes.rows,
    });
  } catch (error) {
    console.error('Error al cargar las estadísticas del dashboard:', error);
    res
      .status(500)
      .json({ error: 'Error interno al cargar los datos del dashboard.' });
  }
};

module.exports = {
  getDashboardStats,
};
