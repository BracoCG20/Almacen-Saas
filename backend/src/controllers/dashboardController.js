//backend/src/controllers/dashboardController.js
const dashboardService = require('../services/dashboardService');

const getDashboardStats = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardData();
    res.status(200).json(data);
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
