const serviciosService = require('../services/serviciosService');
// IMPORTACIÓN FALTANTE:
const { uploadToCloudinary } = require('../middlewares/uploadMiddleware');

const getServicios = async (req, res) => {
  try {
    const servicios = await serviciosService.getAllServicios();
    res.status(200).json(servicios);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error interno al cargar los servicios.' });
  }
};

const createServicio = async (req, res) => {
  try {
    const nuevoServicio = await serviciosService.createServicio(
      req.body,
      req.user.id,
    );
    res.status(201).json({
      message: 'Servicio registrado correctamente.',
      servicio: nuevoServicio,
    });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error interno al registrar el servicio.' });
  }
};

const updateServicio = async (req, res) => {
  try {
    await serviciosService.updateServicio(req.params.id, req.body, req.user.id);
    res.status(200).json({ message: 'Servicio actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ error: 'Error interno al actualizar el servicio.' });
  }
};

const cambiarEstadoServicio = async (req, res) => {
  try {
    await serviciosService.toggleEstadoServicio(
      req.params.id,
      req.body.estado,
      req.user.id,
    );
    res.status(200).json({
      message: `El servicio ahora está ${req.body.estado ? 'Activo' : 'Inactivo'}.`,
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res
      .status(500)
      .json({ error: 'Error interno al cambiar el estado del servicio.' });
  }
};

const getPagosPorServicio = async (req, res) => {
  try {
    const pagos = await serviciosService.getPagosPorServicio(req.params.id);
    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar los pagos del servicio.' });
  }
};

const registrarPago = async (req, res) => {
  try {
    let urlFactura = null;
    if (req.file) {
      urlFactura = await uploadToCloudinary(req.file.buffer, 'Facturas');
    }
    await serviciosService.registrarPago(
      req.params.id,
      req.body,
      urlFactura,
      req.user.id,
    );
    res.status(201).json({ message: 'Pago registrado exitosamente.' });
  } catch (error) {
    console.error('Error al subir pago a Cloudinary:', error);
    res.status(500).json({ error: 'Error al registrar pago.' });
  }
};

const anularPago = async (req, res) => {
  try {
    await serviciosService.anularPago(req.params.pagoId, req.user.id);
    res.status(200).json({ message: 'Pago anulado correctamente.' });
  } catch (error) {
    console.error('Error al anular pago:', error);
    res.status(500).json({ error: 'Error interno al anular el pago.' });
  }
};

const getAuditoriaServicio = async (req, res) => {
  try {
    const auditoria = await serviciosService.getAuditoriaServicio(
      req.params.id,
    );
    res.json(auditoria);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error al cargar el historial de auditoría.' });
  }
};

const getResponsables = async (req, res) => {
  try {
    const responsables = await serviciosService.getResponsables();
    res.status(200).json(responsables);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error al cargar la lista de responsables.' });
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
