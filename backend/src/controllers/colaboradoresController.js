const { pool } = require("../config/db");

// 1. Obtener todos los colaboradores + Empresa + Quién los registró
const getColaboradores = async (req, res) => {
	try {
		const query = `
            SELECT c.*, 
                   e.razon_social as empresa_nombre,
                   cc.nombres as creador_nombre,
                   uc.email_login as creador_email
            FROM colaboradores c
            LEFT JOIN empresas e ON c.empresa_id = e.id
            LEFT JOIN usuarios uc ON c.usuario_creacion_id = uc.id
            LEFT JOIN colaboradores cc ON uc.colaborador_id = cc.id
            ORDER BY c.nombres ASC
        `;
		const response = await pool.query(query);
		res.status(200).json(response.rows);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al obtener colaboradores" });
	}
};

// 2. Crear colaborador
const createColaborador = async (req, res) => {
	const creadorId = req.user.id;
	// NUEVO: Agregamos tipo_vinculo y fecha_fin_proyecto
	const {
		empresa_id,
		dni,
		nombres,
		apellidos,
		email_contacto,
		cargo,
		genero,
		telefono,
		tipo_vinculo,
		fecha_fin_proyecto,
	} = req.body;

	try {
		const query = `
            INSERT INTO colaboradores 
            (empresa_id, dni, nombres, apellidos, email_contacto, cargo, genero, telefono, tipo_vinculo, fecha_fin_proyecto, usuario_creacion_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *
        `;
		// Si la fecha viene vacía, la guardamos como null
		const fechaFin = fecha_fin_proyecto ? fecha_fin_proyecto : null;

		const values = [
			empresa_id,
			dni,
			nombres,
			apellidos,
			email_contacto,
			cargo,
			genero,
			telefono,
			tipo_vinculo,
			fechaFin,
			creadorId,
		];

		const newColaborador = await pool.query(query, values);
		res.json(newColaborador.rows[0]);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al crear colaborador" });
	}
};

// 3. Actualizar colaborador
const updateColaborador = async (req, res) => {
	const { id } = req.params;
	const modificadorId = req.user.id;
	// NUEVO: Agregamos tipo_vinculo y fecha_fin_proyecto
	const {
		empresa_id,
		dni,
		nombres,
		apellidos,
		email_contacto,
		cargo,
		genero,
		telefono,
		tipo_vinculo,
		fecha_fin_proyecto,
	} = req.body;

	try {
		const query = `
            UPDATE colaboradores 
            SET empresa_id=$1, dni=$2, nombres=$3, apellidos=$4, email_contacto=$5, 
                cargo=$6, genero=$7, telefono=$8, tipo_vinculo=$9, fecha_fin_proyecto=$10, 
                fecha_modificacion=NOW(), usuario_modificacion_id=$11
            WHERE id=$12 
            RETURNING *
        `;
		const fechaFin = fecha_fin_proyecto ? fecha_fin_proyecto : null;
		const values = [
			empresa_id,
			dni,
			nombres,
			apellidos,
			email_contacto,
			cargo,
			genero,
			telefono,
			tipo_vinculo,
			fechaFin,
			modificadorId,
			id,
		];

		const result = await pool.query(query, values);

		if (result.rowCount === 0)
			return res.status(404).json({ error: "Colaborador no encontrado" });
		res.json({
			message: "Colaborador actualizado",
			colaborador: result.rows[0],
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al actualizar colaborador" });
	}
};

// 4. Inactivar (Dar de Baja)
const deleteColaborador = async (req, res) => {
	const { id } = req.params;
	const modificadorId = req.user.id;
	try {
		const result = await pool.query(
			"UPDATE colaboradores SET estado = false, fecha_modificacion=NOW(), usuario_modificacion_id=$1 WHERE id = $2 RETURNING *",
			[modificadorId, id],
		);
		if (result.rowCount === 0)
			return res.status(404).json({ error: "Colaborador no encontrado" });
		res.json({ message: "Colaborador dado de baja correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al desactivar colaborador" });
	}
};

// 5. Activar (Reactivar)
const activateColaborador = async (req, res) => {
	const { id } = req.params;
	const modificadorId = req.user.id;
	try {
		const result = await pool.query(
			"UPDATE colaboradores SET estado = true, fecha_modificacion=NOW(), usuario_modificacion_id=$1 WHERE id = $2 RETURNING *",
			[modificadorId, id],
		);
		if (result.rowCount === 0)
			return res.status(404).json({ error: "Colaborador no encontrado" });
		res.json({ message: "Colaborador reactivado correctamente" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Error al reactivar colaborador" });
	}
};

module.exports = {
	getColaboradores,
	createColaborador,
	updateColaborador,
	deleteColaborador,
	activateColaborador,
};
