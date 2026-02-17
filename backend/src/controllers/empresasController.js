const { pool } = require("../config/db"); // Asegurándonos de importar 'pool' correctamente

// 1. Obtener Empresas + Auditoría (Quién la creó y modificó)
const getEmpresas = async (req, res) => {
	try {
		const query = `
            SELECT e.*, 
                   uc.email_login as creador_email, 
                   uu.email_login as editor_email
            FROM empresas e
            LEFT JOIN usuarios uc ON e.usuario_creacion_id = uc.id
            LEFT JOIN usuarios uu ON e.usuario_modificacion_id = uu.id
            ORDER BY e.razon_social ASC
        `;
		const response = await pool.query(query);
		res.status(200).json(response.rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al cargar empresas" });
	}
};

// 2. Crear Empresa
const createEmpresa = async (req, res) => {
	const {
		razon_social,
		nombre_comercial, // NUEVO
		ruc,
		direccion_fiscal, // NUEVO (Antes direccion)
		departamento, // NUEVO
		provincia,
		distrito,
		telefono_contacto, // NUEVO (Antes telefono)
		email_contacto,
		sitio_web,
		nombre_representante_legal, // NUEVO
		fecha_inicio_actividades, // NUEVO
	} = req.body;

	const creadorId = req.user.id; // Viene del token JWT

	try {
		const check = await pool.query("SELECT id FROM empresas WHERE ruc = $1", [
			ruc,
		]);
		if (check.rows.length > 0) {
			return res
				.status(400)
				.json({ error: "El RUC ya está registrado en el sistema." });
		}

		const query = `
            INSERT INTO empresas (
                razon_social, nombre_comercial, ruc, direccion_fiscal, departamento, 
                provincia, distrito, telefono_contacto, email_contacto, sitio_web, 
                nombre_representante_legal, fecha_inicio_actividades, usuario_creacion_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *
        `;

		const values = [
			razon_social,
			nombre_comercial,
			ruc,
			direccion_fiscal,
			departamento,
			provincia,
			distrito,
			telefono_contacto,
			email_contacto,
			sitio_web,
			nombre_representante_legal,
			fecha_inicio_actividades || null,
			creadorId,
		];

		const newEmpresa = await pool.query(query, values);

		res.status(201).json({
			message: "Empresa registrada exitosamente",
			empresa: newEmpresa.rows[0],
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al crear empresa" });
	}
};

// 3. Actualizar Empresa
const updateEmpresa = async (req, res) => {
	const { id } = req.params;
	const {
		razon_social,
		nombre_comercial,
		ruc,
		direccion_fiscal,
		departamento,
		provincia,
		distrito,
		telefono_contacto,
		email_contacto,
		sitio_web,
		nombre_representante_legal,
		fecha_inicio_actividades,
	} = req.body;

	const modificadorId = req.user.id;

	try {
		const query = `
            UPDATE empresas SET 
                razon_social=$1, nombre_comercial=$2, ruc=$3, direccion_fiscal=$4, 
                departamento=$5, provincia=$6, distrito=$7, telefono_contacto=$8, 
                email_contacto=$9, sitio_web=$10, nombre_representante_legal=$11, 
                fecha_inicio_actividades=$12, fecha_modificacion=NOW(), usuario_modificacion_id=$13
            WHERE id=$14 RETURNING *
        `;

		const values = [
			razon_social,
			nombre_comercial,
			ruc,
			direccion_fiscal,
			departamento,
			provincia,
			distrito,
			telefono_contacto,
			email_contacto,
			sitio_web,
			nombre_representante_legal,
			fecha_inicio_actividades || null,
			modificadorId,
			id,
		];

		const result = await pool.query(query, values);

		if (result.rowCount === 0) {
			return res.status(404).json({ error: "Empresa no encontrada" });
		}

		res.json({
			message: "Empresa actualizada correctamente",
			empresa: result.rows[0],
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al actualizar empresa" });
	}
};

// 4. Eliminar Empresa (Baja Lógica - Inactivar)
const deleteEmpresa = async (req, res) => {
	const { id } = req.params;
	const modificadorId = req.user.id;

	try {
		// En nuestra BD la columna se llama 'estado' (booleano)
		const result = await pool.query(
			"UPDATE empresas SET estado = false, usuario_modificacion_id = $1, fecha_modificacion = NOW() WHERE id = $2 RETURNING *",
			[modificadorId, id],
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ error: "Empresa no encontrada" });
		}

		res.json({ message: "Empresa desactivada correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al desactivar empresa" });
	}
};

// 5. Reactivar Empresa
const activateEmpresa = async (req, res) => {
	const { id } = req.params;
	const modificadorId = req.user.id;

	try {
		const result = await pool.query(
			"UPDATE empresas SET estado = true, usuario_modificacion_id = $1, fecha_modificacion = NOW() WHERE id = $2 RETURNING *",
			[modificadorId, id],
		);

		if (result.rowCount === 0) {
			return res.status(404).json({ error: "Empresa no encontrada" });
		}

		res.json({ message: "Empresa reactivada correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al reactivar empresa" });
	}
};

module.exports = {
	getEmpresas,
	createEmpresa,
	updateEmpresa,
	deleteEmpresa,
	activateEmpresa,
};
