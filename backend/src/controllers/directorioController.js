const directorioService = require('../services/directorioService');

const obtenerDirectorio = async (req, res) => {
  try {
    const registros = await directorioService.getDirectorio();
    res.json(registros);
  } catch (error) {
    console.error('Error en obtenerDirectorio:', error);
    res.status(500).json({ error: 'Error al obtener el directorio' });
  }
};

const obtenerEstadisticas = async (req, res) => {
  try {
    const stats = await directorioService.getEstadisticas();
    res.json(stats);
  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

const crearRegistroDirectorio = async (req, res) => {
  try {
    await directorioService.crearRegistro(req.body, req.user.id);
    res.status(201).json({ message: 'Licencia asignada correctamente.' });
  } catch (error) {
    console.error('Error en crearRegistroDirectorio:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        error:
          'Este colaborador ya tiene una licencia asignada en el directorio.',
      });
    }
    res.status(400).json({ error: 'Error al asignar licencia.' });
  }
};

const actualizarRegistroDirectorio = async (req, res) => {
  try {
    const { id } = req.params;
    await directorioService.actualizarRegistro(id, req.body, req.user.id);
    res.json({ message: 'Registro actualizado correctamente.' });
  } catch (error) {
    console.error('Error en actualizarRegistroDirectorio:', error);
    res.status(400).json({ error: 'Error al actualizar el registro.' });
  }
};

const eliminarRegistroDirectorio = async (req, res) => {
  try {
    const { id } = req.params;
    await directorioService.eliminarRegistro(id);
    res.json({ message: 'Registro eliminado del directorio.' });
  } catch (error) {
    console.error('Error en eliminarRegistroDirectorio:', error);
    res.status(500).json({ error: 'Error al eliminar el registro.' });
  }
};

const obtenerHistorialCompleto = async (req, res) => {
  try {
    const historial = await directorioService.getHistorialDirectorio();
    res.json(historial);
  } catch (error) {
    console.error('Error en obtenerHistorialCompleto:', error);
    res
      .status(500)
      .json({ error: 'Error al obtener el historial de auditoría' });
  }
};

module.exports = {
  obtenerDirectorio,
  crearRegistroDirectorio,
  actualizarRegistroDirectorio,
  eliminarRegistroDirectorio,
  obtenerEstadisticas,
  obtenerHistorialCompleto,
};
