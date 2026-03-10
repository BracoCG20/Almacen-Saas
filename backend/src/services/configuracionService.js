const { pool } = require('../config/db');

const getAllLicencias = async () => {
  const query = `SELECT * FROM config_licencias`;
  const response = await pool.query(query);

  // Lo mapeamos exactamente a los nombres de tu DB
  const result = {
    starter: 0,
    standard: 0,
  };

  response.rows.forEach((row) => {
    if (row.tipo_licencia === 'BUSINESS_STARTER') {
      result.starter = row.cantidad_total;
    }
    if (row.tipo_licencia === 'BUSINESS_STANDARD') {
      result.standard = row.cantidad_total;
    }
  });

  return result;
};

const updateLicencias = async (starter, standard) => {
  // Usamos el nombre exacto de la base de datos
  const query = `
        INSERT INTO config_licencias (tipo_licencia, cantidad_total)
        VALUES ('BUSINESS_STARTER', $1), ('BUSINESS_STANDARD', $2)
        ON CONFLICT (tipo_licencia) 
        DO UPDATE SET cantidad_total = EXCLUDED.cantidad_total
        RETURNING *;
    `;

  await pool.query(query, [starter, standard]);
  return await getAllLicencias();
};

module.exports = {
  getAllLicencias,
  updateLicencias,
};
