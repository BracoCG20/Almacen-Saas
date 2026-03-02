const empresasService = require('../services/empresasService');

const getEmpresas = async (req, res) => {
  try {
    const empresas = await empresasService.getAllEmpresas();
    res.status(200).json(empresas);
  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res
      .status(500)
      .json({ error: 'Error interno al cargar la lista de empresas.' });
  }
};

const createEmpresa = async (req, res) => {
  try {
    const nuevaEmpresa = await empresasService.createEmpresa(
      req.body,
      req.user.id,
    );
    res.status(201).json({
      message: 'Empresa registrada exitosamente.',
      empresa: nuevaEmpresa,
    });
  } catch (error) {
    console.error('Error al crear empresa:', error);
    if (error.message.includes('RUC')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno al registrar la empresa.' });
  }
};

const updateEmpresa = async (req, res) => {
  try {
    const empresaActualizada = await empresasService.updateEmpresa(
      req.params.id,
      req.body,
      req.user.id,
    );
    res.json({
      message: 'Empresa actualizada correctamente.',
      empresa: empresaActualizada,
    });
  } catch (error) {
    console.error('Error al actualizar empresa:', error);
    if (error.message.includes('no existe')) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error interno al actualizar la empresa.' });
  }
};

const deleteEmpresa = async (req, res) => {
  try {
    await empresasService.toggleEstadoEmpresa(
      req.params.id,
      req.user.id,
      false,
    );
    res.json({ message: 'Empresa desactivada correctamente.' });
  } catch (error) {
    console.error('Error al desactivar empresa:', error);
    if (error.message.includes('no encontrada'))
      return res.status(404).json({ error: error.message });
    res.status(500).json({ error: 'Error interno al desactivar la empresa.' });
  }
};

const activateEmpresa = async (req, res) => {
  try {
    await empresasService.toggleEstadoEmpresa(req.params.id, req.user.id, true);
    res.json({ message: 'Empresa reactivada correctamente.' });
  } catch (error) {
    console.error('Error al reactivar empresa:', error);
    if (error.message.includes('no encontrada'))
      return res.status(404).json({ error: error.message });
    res.status(500).json({ error: 'Error interno al reactivar la empresa.' });
  }
};

module.exports = {
  getEmpresas,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa,
  activateEmpresa,
};
