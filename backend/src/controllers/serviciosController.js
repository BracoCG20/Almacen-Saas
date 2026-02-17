const { pool } = require("../config/db");

const getServicios = async (req, res) => {
	try {
		const query = `
            SELECT s.*,
                   ef.razon_social AS empresa_facturacion_nombre,
                   eu.razon_social AS empresa_usuaria_nombre,
                   c_resp.nombres AS responsable_nombre,
                   c_resp.apellidos AS responsable_apellido,
                   c1.nombres AS creador_nombre, 
                   c1.apellidos AS creador_apellido
            FROM servicios s
            LEFT JOIN empresas ef ON s.empresa_id_factura = ef.id
            LEFT JOIN empresas eu ON s.empresa_id_usuaria = eu.id
            LEFT JOIN usuarios u_resp ON s.usuario_id_responsable = u_resp.id
            LEFT JOIN colaboradores c_resp ON u_resp.colaborador_id = c_resp.id
            LEFT JOIN usuarios uc1 ON s.usuario_creacion_id = uc1.id
            LEFT JOIN colaboradores c1 ON uc1.colaborador_id = c1.id
            ORDER BY s.estado DESC, s.fecha_creacion DESC;
        `;
		const response = await pool.query(query);
		res.status(200).json(response.rows);
	} catch (error) {
		console.error("Error al obtener servicios:", error);
		res.status(500).json({ error: "Error al cargar los servicios" });
	}
};

const createServicio = async (req, res) => {
	const usuarioId = req.user ? req.user.id : null;
	const {
		nombre,
		descripcion,
		categoria_servicio,
		precio,
		moneda,
		frecuencia_pago,
		fecha_proximo_pago,
		metodo_pago,
		empresa_id_factura,
		numero_tarjeta_empresa_factura,
		cci_cuenta_empresa_factura,
		empresa_id_usuaria,
		numero_tarjeta_empresa_usuaria,
		cci_cuenta_empresa_usuaria,
		licencias_totales,
		licencias_usadas,
		usuario_id_responsable,
	} = req.body;

	try {
		await pool.query("BEGIN");

		const query = `
            INSERT INTO servicios (
                nombre, descripcion, categoria_servicio, precio, moneda, frecuencia_pago, fecha_proximo_pago, 
                metodo_pago, empresa_id_factura, numero_tarjeta_empresa_factura, cci_cuenta_empresa_factura, 
                empresa_id_usuaria, numero_tarjeta_empresa_usuaria, cci_cuenta_empresa_usuaria,
                licencias_totales, licencias_usadas, usuario_id_responsable, usuario_creacion_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *;
        `;
		const values = [
			nombre,
			descripcion,
			categoria_servicio,
			precio || 0,
			moneda || "USD",
			frecuencia_pago,
			fecha_proximo_pago || null,
			metodo_pago,
			empresa_id_factura || null,
			numero_tarjeta_empresa_factura || null,
			cci_cuenta_empresa_factura || null,
			empresa_id_usuaria || null,
			numero_tarjeta_empresa_usuaria || null,
			cci_cuenta_empresa_usuaria || null,
			licencias_totales || 0,
			licencias_usadas || 0,
			usuario_id_responsable || null,
			usuarioId,
		];
		const response = await pool.query(query, values);
		const nuevoServicio = response.rows[0];

		// Guardar Auditoría
		await pool.query(
			`INSERT INTO auditoria_servicios (servicio_id, accion, detalle, usuario_id) VALUES ($1, $2, $3, $4)`,
			[
				nuevoServicio.id,
				"CREACIÓN",
				"Se registró el servicio en el sistema.",
				usuarioId,
			],
		);

		await pool.query("COMMIT");
		res
			.status(201)
			.json({ message: "Servicio registrado", servicio: nuevoServicio });
	} catch (error) {
		await pool.query("ROLLBACK");
		console.error("Error al crear servicio:", error);
		res.status(500).json({ error: "Error al registrar el servicio" });
	}
};

const updateServicio = async (req, res) => {
	const { id } = req.params;
	const usuarioId = req.user ? req.user.id : null;
	const {
		nombre,
		descripcion,
		categoria_servicio,
		precio,
		moneda,
		frecuencia_pago,
		fecha_proximo_pago,
		metodo_pago,
		empresa_id_factura,
		numero_tarjeta_empresa_factura,
		cci_cuenta_empresa_factura,
		empresa_id_usuaria,
		numero_tarjeta_empresa_usuaria,
		cci_cuenta_empresa_usuaria,
		licencias_totales,
		licencias_usadas,
		usuario_id_responsable,
	} = req.body;

	try {
		await pool.query("BEGIN");

		const query = `
            UPDATE servicios SET 
                nombre = $1, descripcion = $2, categoria_servicio = $3, precio = $4, moneda = $5, 
                frecuencia_pago = $6, fecha_proximo_pago = $7, metodo_pago = $8, 
                empresa_id_factura = $9, numero_tarjeta_empresa_factura = $10, cci_cuenta_empresa_factura = $11, 
                empresa_id_usuaria = $12, numero_tarjeta_empresa_usuaria = $13, cci_cuenta_empresa_usuaria = $14, 
                licencias_totales = $15, licencias_usadas = $16, usuario_id_responsable = $17,
                fecha_modificacion = NOW(), usuario_modificacion_id = $18
            WHERE id = $19 RETURNING *;
        `;
		const values = [
			nombre,
			descripcion,
			categoria_servicio,
			precio,
			moneda,
			frecuencia_pago,
			fecha_proximo_pago || null,
			metodo_pago,
			empresa_id_factura || null,
			numero_tarjeta_empresa_factura || null,
			cci_cuenta_empresa_factura || null,
			empresa_id_usuaria || null,
			numero_tarjeta_empresa_usuaria || null,
			cci_cuenta_empresa_usuaria || null,
			licencias_totales || 0,
			licencias_usadas || 0,
			usuario_id_responsable || null,
			usuarioId,
			id,
		];
		const response = await pool.query(query, values);

		if (response.rowCount === 0) throw new Error("Servicio no encontrado");

		// Guardar Auditoría
		await pool.query(
			`INSERT INTO auditoria_servicios (servicio_id, accion, detalle, usuario_id) VALUES ($1, $2, $3, $4)`,
			[id, "EDICIÓN", "Se actualizaron los datos del servicio.", usuarioId],
		);

		await pool.query("COMMIT");
		res.status(200).json({ message: "Servicio actualizado" });
	} catch (error) {
		await pool.query("ROLLBACK");
		res.status(500).json({ error: "Error al actualizar" });
	}
};

const cambiarEstadoServicio = async (req, res) => {
	const { id } = req.params;
	const { estado } = req.body;
	const usuarioId = req.user ? req.user.id : null;

	try {
		await pool.query("BEGIN");
		await pool.query(
			"UPDATE servicios SET estado = $1, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $3",
			[estado, usuarioId, id],
		);

		await pool.query(
			`INSERT INTO auditoria_servicios (servicio_id, accion, detalle, usuario_id) VALUES ($1, $2, $3, $4)`,
			[
				id,
				estado ? "ACTIVACIÓN" : "CANCELACIÓN",
				`El servicio pasó a estado ${estado ? "Activo" : "Inactivo"}`,
				usuarioId,
			],
		);

		await pool.query("COMMIT");
		res.status(200).json({
			message: `El servicio ahora está ${estado ? "Activo" : "Inactivo"}`,
		});
	} catch (error) {
		await pool.query("ROLLBACK");
		res.status(500).json({ error: "Error al cambiar el estado" });
	}
};

// --- PAGOS ---
const getPagosPorServicio = async (req, res) => {
	const { id } = req.params;
	try {
		const query = `
            SELECT hp.*, c.nombres AS creador_nombre
            FROM historial_pagos hp
            LEFT JOIN usuarios uc ON hp.usuario_creacion_id = uc.id
            LEFT JOIN colaboradores c ON uc.colaborador_id = c.id
            WHERE hp.servicio_id = $1 AND hp.estado_pago != 'Anulado'
            ORDER BY hp.fecha_pago DESC;
        `;
		const response = await pool.query(query, [id]);
		res.status(200).json(response.rows);
	} catch (error) {
		res.status(500).json({ error: "Error al cargar pagos" });
	}
};

const registrarPago = async (req, res) => {
	const { id } = req.params;
	const usuarioId = req.user ? req.user.id : null;
	const {
		fecha_pago,
		monto_pagado,
		moneda,
		periodo_mes,
		periodo_anio,
		nueva_fecha_proximo_pago,
	} = req.body;
	const url_factura = req.file ? `/uploads/${req.file.filename}` : null;

	try {
		await pool.query("BEGIN");
		const queryPago = `INSERT INTO historial_pagos (servicio_id, fecha_pago, monto_pagado, moneda, periodo_mes, periodo_anio, url_factura, usuario_creacion_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`;
		await pool.query(queryPago, [
			id,
			fecha_pago,
			monto_pagado,
			moneda,
			periodo_mes,
			periodo_anio,
			url_factura,
			usuarioId,
		]);

		if (nueva_fecha_proximo_pago) {
			await pool.query(
				"UPDATE servicios SET fecha_proximo_pago = $1 WHERE id = $2",
				[nueva_fecha_proximo_pago, id],
			);
		}

		await pool.query(
			`INSERT INTO auditoria_servicios (servicio_id, accion, detalle, usuario_id) VALUES ($1, $2, $3, $4)`,
			[
				id,
				"PAGO REGISTRADO",
				`Se registró un pago de ${moneda} ${monto_pagado} para el periodo ${periodo_mes}/${periodo_anio}`,
				usuarioId,
			],
		);

		await pool.query("COMMIT");
		res.status(201).json({ message: "Pago registrado exitosamente" });
	} catch (error) {
		await pool.query("ROLLBACK");
		res.status(500).json({ error: "Error al registrar el pago" });
	}
};

const anularPago = async (req, res) => {
	const { pagoId } = req.params;
	const usuarioId = req.user ? req.user.id : null;

	try {
		await pool.query("BEGIN");
		const pagoInfo = await pool.query(
			"SELECT * FROM historial_pagos WHERE id = $1",
			[pagoId],
		);
		if (pagoInfo.rows.length === 0) throw new Error("Pago no encontrado");

		const p = pagoInfo.rows[0];

		await pool.query(
			"UPDATE historial_pagos SET estado_pago = $1, fecha_modificacion = NOW(), usuario_modificacion_id = $2 WHERE id = $3",
			["Anulado", usuarioId, pagoId],
		);

		await pool.query(
			`INSERT INTO auditoria_servicios (servicio_id, accion, detalle, usuario_id) VALUES ($1, $2, $3, $4)`,
			[
				p.servicio_id,
				"PAGO ANULADO",
				`Se anuló el pago de ${p.moneda} ${p.monto_pagado} del periodo ${p.periodo_mes}/${p.periodo_anio}`,
				usuarioId,
			],
		);

		await pool.query("COMMIT");
		res.status(200).json({ message: "Pago anulado correctamente" });
	} catch (error) {
		await pool.query("ROLLBACK");
		res.status(500).json({ error: "Error al anular pago" });
	}
};

// --- AUDITORÍA HISTORIAL ---
const getAuditoriaServicio = async (req, res) => {
	const { id } = req.params;
	try {
		const query = `
            SELECT a.*, c.nombres, c.apellidos
            FROM auditoria_servicios a
            LEFT JOIN usuarios u ON a.usuario_id = u.id
            LEFT JOIN colaboradores c ON u.colaborador_id = c.id
            WHERE a.servicio_id = $1
            ORDER BY a.fecha DESC;
        `;
		const response = await pool.query(query, [id]);
		res.json(response.rows);
	} catch (error) {
		res.status(500).json({ error: "Error al cargar auditoría" });
	}
};

// --- NUEVO: Obtener lista de responsables (Usuarios activos) ---
const getResponsables = async (req, res) => {
	try {
		const query = `
            SELECT u.id, c.nombres, c.apellidos, u.nickname
            FROM usuarios u
            LEFT JOIN colaboradores c ON u.colaborador_id = c.id
            WHERE u.estado = true;
        `;
		const response = await pool.query(query);
		res.status(200).json(response.rows);
	} catch (error) {
		console.error("Error al obtener responsables:", error);
		res.status(500).json({ error: "Error al cargar responsables" });
	}
};

module.exports = {
	getServicios,
	createServicio,
	updateServicio,
	cambiarEstadoServicio,
	getPagosPorServicio,
	registrarPago,
	anularPago,
	getAuditoriaServicio,
	getResponsables,
};
