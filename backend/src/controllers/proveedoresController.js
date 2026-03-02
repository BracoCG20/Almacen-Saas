const proveedoresService = require('../services/proveedoresService');

const getProveedores = async (req, res) => {
  try {
    const proveedores = await proveedoresService.getAllProveedores();
    res.status(200).json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error interno al cargar los proveedores.' });
  }
};

const createProveedor = async (req, res) => {
  try {
    const nuevoProveedor = await proveedoresService.createProveedor(
      req.body,
      req.user.id,
      req.file,
    );
    res.status(201).json({
      message: 'Proveedor registrado exitosamente.',
      proveedor: nuevoProveedor,
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    if (error.message.includes('RUC'))
      return res.status(400).json({ error: error.message });
    res.status(500).json({ error: 'Error interno al registrar el proveedor.' });
  }
};

const updateProveedor = async (req, res) => {
  try {
    const proveedorActualizado = await proveedoresService.updateProveedor(
      req.params.id,
      req.body,
      req.user.id,
      req.file,
    );
    res.json({
      message: 'Proveedor actualizado correctamente.',
      proveedor: proveedorActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res
      .status(400)
      .json({ error: error.message || 'Error interno al actualizar.' });
  }
};

const toggleEstadoProveedor = async (req, res) => {
  try {
    await proveedoresService.toggleEstadoProveedor(
      req.params.id,
      req.body.estado,
      req.user.id,
    );
    res.json({
      message: `Proveedor ${req.body.estado ? 'reactivado' : 'desactivado'} correctamente.`,
    });
  } catch (error) {
    console.error('Error al cambiar estado de proveedor:', error);
    res
      .status(400)
      .json({ error: error.message || 'Error al cambiar estado.' });
  }
};

const getProveedorHistorial = async (req, res) => {
  try {
    const historial = await proveedoresService.getProveedorHistorial(
      req.params.id,
    );
    res.status(200).json(historial);
  } catch (error) {
    console.error('Error al obtener el historial de proveedor:', error);
    res.status(500).json({ error: 'Error al obtener el historial.' });
  }
};

module.exports = {
  getProveedores,
  createProveedor,
  updateProveedor,
  toggleEstadoProveedor,
  getProveedorHistorial,
};
