const { pool } = require("../config/db");

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

const crearRegistro = async (data, adminId) => {
	const query = `
        INSERT INTO directorio (
            colaborador_id, tipo_licencia, estado, usuario_creacion_id
        ) VALUES ($1, $2, $3, $4) RETURNING id
    `;
	const values = [data.colaborador_id, data.tipo_licencia, true, adminId];
	const response = await pool.query(query, values);
	return response.rows[0];
};

const actualizarRegistro = async (id, data, adminId) => {
	const query = `
        UPDATE directorio 
        SET tipo_licencia = $1, 
            estado = $2, 
            datos_transferidos = $3, 
            colaborador_destino_id = $4,
            fecha_modificacion = NOW(),
            usuario_modificacion_id = $5
        WHERE id = $6 RETURNING id
    `;
	const estadoActivo = data.estado === true || data.estado === "true";
	const transferido = estadoActivo ? false : data.datos_transferidos || false;
	const destinoId =
		estadoActivo || !transferido ? null : data.colaborador_destino_id;
	const values = [
		data.tipo_licencia,
		estadoActivo,
		transferido,
		destinoId,
		adminId,
		id,
	];

	const response = await pool.query(query, values);
	return response.rows[0];
};

const eliminarRegistro = async (id) => {
	const query = `DELETE FROM directorio WHERE id = $1 RETURNING id`;
	const response = await pool.query(query, [id]);
	return response.rows[0];
};

module.exports = {
	getEstadisticas,
	getDirectorio,
	crearRegistro,
	actualizarRegistro,
	eliminarRegistro,
};
