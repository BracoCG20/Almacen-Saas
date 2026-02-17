const { pool } = require("../config/db"); // Asegúrate de usar pool

// 1. Obtener proveedores con conteo de equipos y auditoría
const getProveedores = async (req, res) => {
	try {
		const query = `
            SELECT 
                p.*, 
                u1.nombres as creador_nombre, 
                u1.apellidos as creador_apellido,
                u2.nombres as modificador_nombre,
                u2.apellidos as modificador_apellido,
                -- Subconsulta para contar equipos alquilados
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
		console.error("Error al obtener proveedores:", error);
		res.status(500).json({ error: "Error al cargar proveedores" });
	}
};

// 2. Crear un nuevo proveedor
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
	} = req.body;

	try {
		// Validar RUC duplicado
		const check = await pool.query("SELECT * FROM proveedores WHERE ruc = $1", [
			ruc,
		]);
		if (check.rows.length > 0) {
			return res.status(400).json({ error: "El RUC ya está registrado." });
		}

		const query = `
            INSERT INTO proveedores 
            (razon_social, nombre_comercial, ruc, direccion, departamento, provincia, distrito, nombre_contacto, email_contacto, telefono_contacto, sitio_web, tipo_servicio, usuario_creacion_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
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
			usuarioId,
		];

		const newProv = await pool.query(query, values);

		res
			.status(201)
			.json({ message: "Proveedor registrado", proveedor: newProv.rows[0] });
	} catch (error) {
		console.error("Error al crear proveedor:", error);
		res.status(500).json({ error: "Error interno al registrar proveedor" });
	}
};

// 3. Actualizar Proveedor
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
	} = req.body;

	try {
		const query = `
            UPDATE proveedores SET 
                razon_social=$1, nombre_comercial=$2, ruc=$3, direccion=$4, 
                departamento=$5, provincia=$6, distrito=$7, 
                nombre_contacto=$8, email_contacto=$9, telefono_contacto=$10, 
                sitio_web=$11, tipo_servicio=$12,
                fecha_modificacion=NOW(), usuario_modificacion_id=$13
            WHERE id=$14 RETURNING *
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
			usuarioId,
			id,
		];
		const result = await pool.query(query, values);

		if (result.rowCount === 0)
			return res.status(404).json({ error: "Proveedor no encontrado" });

		res.json({ message: "Proveedor actualizado", proveedor: result.rows[0] });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al actualizar" });
	}
};

// 4. Baja Lógica de Proveedor
const deleteProveedor = async (req, res) => {
	const { id } = req.params;
	const usuarioId = req.user ? req.user.id : null;
	try {
		await pool.query(
			"UPDATE proveedores SET estado = false, fecha_modificacion=NOW(), usuario_modificacion_id=$2 WHERE id = $1",
			[id, usuarioId],
		);
		res.json({ message: "Proveedor desactivado" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al eliminar" });
	}
};

// 5. Reactivar Proveedor
const activateProveedor = async (req, res) => {
	const { id } = req.params;
	const usuarioId = req.user ? req.user.id : null;
	try {
		await pool.query(
			"UPDATE proveedores SET estado = true, fecha_modificacion=NOW(), usuario_modificacion_id=$2 WHERE id = $1",
			[id, usuarioId],
		);
		res.json({ message: "Proveedor reactivado" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al activar" });
	}
};

module.exports = {
	getProveedores,
	createProveedor,
	updateProveedor,
	deleteProveedor,
	activateProveedor,
};
