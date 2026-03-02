const colaboradoresService = require('../services/colaboradoresService');

const getColaboradores = async (req, res) => {
  try {
    const colaboradores = await colaboradoresService.getAllColaboradores();
    res.status(200).json(colaboradores);
  } catch (error) {
    console.error('Error en getColaboradores:', error);
    res
      .status(500)
      .json({ error: 'Error interno al obtener los colaboradores.' });
  }
};

const createColaborador = async (req, res) => {
  try {
    const newColaborador = await colaboradoresService.createColaborador(
      req.body,
      req.user.id,
    );
    res.status(201).json(newColaborador);
  } catch (error) {
    console.error('Error en createColaborador:', error);
    res
      .status(500)
      .json({ error: 'Error interno al registrar el colaborador.' });
  }
};

const updateColaborador = async (req, res) => {
  try {
    const updatedColaborador = await colaboradoresService.updateColaborador(
      req.params.id,
      req.body,
      req.user.id,
    );
    res.json({
      message: 'Colaborador actualizado correctamente.',
      colaborador: updatedColaborador,
    });
  } catch (error) {
    console.error('Error en updateColaborador:', error);
    res
      .status(500)
      .json({ error: error.message || 'Error interno al actualizar.' });
  }
};

const deleteColaborador = async (req, res) => {
  try {
    await colaboradoresService.toggleEstadoColaborador(
      req.params.id,
      req.user.id,
      false,
    );
    res.json({ message: 'Colaborador dado de baja correctamente.' });
  } catch (error) {
    console.error('Error en deleteColaborador:', error);
    res.status(500).json({ error: error.message || 'Error al desactivar.' });
  }
};

const activateColaborador = async (req, res) => {
  try {
    await colaboradoresService.toggleEstadoColaborador(
      req.params.id,
      req.user.id,
      true,
    );
    res.json({ message: 'Colaborador reactivado correctamente.' });
  } catch (error) {
    console.error('Error en activateColaborador:', error);
    res.status(500).json({ error: error.message || 'Error al reactivar.' });
  }
};

const getColaboradorHistorial = async (req, res) => {
  try {
    const historial = await colaboradoresService.getHistorial(req.params.id);
    res.status(200).json(historial);
  } catch (error) {
    console.error('Error en getColaboradorHistorial:', error);
    res.status(500).json({ error: 'Error al obtener el historial.' });
  }
};

module.exports = {
  getColaboradores,
  createColaborador,
  updateColaborador,
  deleteColaborador,
  activateColaborador,
  getColaboradorHistorial,
};
