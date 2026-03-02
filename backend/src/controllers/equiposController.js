const equiposService = require('../services/equiposService');

const getEquipos = async (req, res) => {
  try {
    const equipos = await equiposService.getAllEquipos();
    res.status(200).json(equipos);
  } catch (error) {
    console.error('Error obteniendo equipos:', error.message);
    res.status(500).json({ error: 'Error interno al obtener el inventario.' });
  }
};

const createEquipo = async (req, res) => {
  try {
    const newEquipo = await equiposService.createEquipo(req.body, req.user.id);
    res.status(201).json({
      message: 'Ítem registrado exitosamente en el inventario.',
      equipo: newEquipo,
    });
  } catch (error) {
    console.error('Error creando equipo:', error.message);
    const status = error.message.includes('numero_serie') ? 400 : 500;
    res
      .status(status)
      .json({ error: error.message || 'Error interno al registrar equipo.' });
  }
};

const updateEquipo = async (req, res) => {
  try {
    await equiposService.updateEquipo(req.params.id, req.body, req.user.id);
    res.json({ message: 'Ítem actualizado correctamente.' });
  } catch (error) {
    console.error('Error actualizando equipo:', error.message);
    res.status(400).json({ error: error.message || 'Error al actualizar.' });
  }
};

const toggleDisponibilidad = async (req, res) => {
  try {
    await equiposService.toggleDisponibilidad(
      req.params.id,
      req.user.id,
      req.body.disponible,
    );
    res.json({
      message: `Equipo ${req.body.disponible ? 'reactivado a Operativo' : 'dado de baja'} correctamente.`,
    });
  } catch (error) {
    console.error('Error cambiando disponibilidad:', error.message);
    res
      .status(500)
      .json({ error: 'Error al cambiar la disponibilidad del equipo.' });
  }
};

const getMarcas = async (req, res) => {
  try {
    const marcas = await equiposService.getMarcas();
    res.json(marcas);
  } catch (error) {
    console.error('Error obteniendo marcas:', error.message);
    res.status(500).json({ error: 'Error al cargar el catálogo de marcas.' });
  }
};

const getEstadosFisicos = async (req, res) => {
  try {
    const estados = await equiposService.getEstadosFisicos();
    res.json(estados);
  } catch (error) {
    console.error('Error obteniendo estados:', error.message);
    res.status(500).json({ error: 'Error al cargar los estados físicos.' });
  }
};

const getEquipoHistorial = async (req, res) => {
  try {
    const historial = await equiposService.getEquipoHistorial(req.params.id);
    res.status(200).json(historial);
  } catch (error) {
    console.error('Error consultando historial de equipo:', error.message);
    res
      .status(500)
      .json({ error: 'Error al obtener el historial del equipo.' });
  }
};

module.exports = {
  getEquipos,
  createEquipo,
  updateEquipo,
  toggleDisponibilidad,
  getMarcas,
  getEstadosFisicos,
  getEquipoHistorial,
};
