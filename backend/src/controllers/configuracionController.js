const configuracionService = require('../services/configuracionService');

const getLicencias = async (req, res) => {
  try {
    const licencias = await configuracionService.getAllLicencias();
    res.status(200).json(licencias);
  } catch (error) {
    console.error('Error al obtener licencias:', error);
    res.status(500).json({
      error: 'Error interno al cargar la configuración de licencias.',
    });
  }
};

const updateLicencias = async (req, res) => {
  try {
    const { starter, standard } = req.body;

    if (starter === undefined || standard === undefined) {
      return res.status(400).json({
        error: 'Debes enviar la cantidad para ambos tipos de licencia.',
      });
    }

    const actualizadas = await configuracionService.updateLicencias(
      Number(starter),
      Number(standard),
    );

    res.json({
      message: 'Límites de licencias actualizados correctamente.',
      data: actualizadas,
    });
  } catch (error) {
    console.error('Error al actualizar licencias:', error);
    res
      .status(500)
      .json({ error: 'Error interno al actualizar las licencias.' });
  }
};

module.exports = {
  getLicencias,
  updateLicencias,
};
