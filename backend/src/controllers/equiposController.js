//backend/src/controllers/equiposController.js
const equiposService = require('../services/equiposService');
const { uploadToCloudinary } = require('../middlewares/uploadMiddleware'); // <-- IMPORTAMOS LA FUNCIÓN A LA NUBE

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

// --- NUEVO CONTROLADOR: SUBIDA DE IMAGEN ---
const uploadImagenEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res
        .status(400)
        .json({ error: 'No se ha proporcionado ninguna imagen.' });
    }

    // 1. Subir la imagen a Cloudinary en una carpeta específica
    const imageUrl = await uploadToCloudinary(req.file.buffer, 'Equipos');

    // 2. Guardar la URL en la base de datos
    const equipoActualizado = await equiposService.updateImagenEquipo(
      id,
      imageUrl,
      req.user.id,
    );

    res.json({
      message: 'Fotografía actualizada correctamente',
      imagen_url: equipoActualizado.imagen_url,
    });
  } catch (error) {
    console.error('Error subiendo imagen del equipo:', error);
    res.status(500).json({ error: 'Error al procesar y guardar la imagen.' });
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
  uploadImagenEquipo,
};
