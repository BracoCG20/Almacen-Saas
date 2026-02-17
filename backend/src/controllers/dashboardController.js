const { pool } = require("../config/db");

const getDashboardStats = async (req, res) => {
	try {
		// 1. OBTENER ESTADÍSTICAS BÁSICAS DE EQUIPOS
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
		const equiposRes = await pool.query(equiposQuery);
		const equipos = equiposRes.rows;

		// 2. OBTENER MOVIMIENTOS Y FIRMAS
		const movQuery = `
            SELECT id, tipo_movimiento, fecha_movimiento, pdf_firmado_url, firma_valida 
            FROM historial_movimientos;
        `;
		const movRes = await pool.query(movQuery);
		const movimientos = movRes.rows;

		// 3. OBTENER SERVICIOS Y PAGOS (SE AGREGÓ NOMBRE Y CATEGORÍA)
		const serviciosQuery = `
            SELECT nombre, categoria_servicio, precio, moneda, frecuencia_pago, estado 
            FROM servicios
            WHERE estado = true;
        `;
		const serviciosRes = await pool.query(serviciosQuery);
		const servicios = serviciosRes.rows;

		// --- ENVIAMOS TODO AL FRONTEND ---
		res.json({
			equipos,
			movimientos,
			servicios,
		});
	} catch (error) {
		console.error("Error al cargar dashboard stats:", error);
		res.status(500).json({ error: "Error al cargar datos del dashboard" });
	}
};

module.exports = {
	getDashboardStats,
};
