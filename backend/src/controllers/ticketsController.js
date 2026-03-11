const ticketsService = require('../services/ticketsService');

const obtenerTickets = async (req, res) => {
  try {
    const tickets = await ticketsService.getTickets();
    res.json(tickets);
  } catch (error) {
    console.error('🔥 Error en obtenerTickets:', error);
    res.status(500).json({ error: 'Error al obtener la lista de tickets' });
  }
};

const obtenerHistorialTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const historial = await ticketsService.getTicketHistorial(id);
    res.json(historial);
  } catch (error) {
    console.error('🔥 Error en obtenerHistorialTicket:', error);
    res.status(500).json({ error: 'Error al obtener el historial del ticket' });
  }
};

const crearTicket = async (req, res) => {
  try {
    await ticketsService.createTicket(req.body, req.user.id);
    res.status(201).json({ message: 'Ticket generado exitosamente.' });
  } catch (error) {
    console.error('🔥 Error en crearTicket:', error);
    res.status(400).json({ error: 'Error al generar el ticket.' });
  }
};

const actualizarTicket = async (req, res) => {
  try {
    const { id } = req.params;
    await ticketsService.updateTicket(id, req.body, req.user.id);
    res.json({ message: 'Ticket actualizado correctamente.' });
  } catch (error) {
    console.error('🔥 Error en actualizarTicket:', error);
    res.status(400).json({ error: 'Error al actualizar el ticket.' });
  }
};

const agregarComentarioTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;

    if (!comentario || comentario.trim() === '') {
      return res
        .status(400)
        .json({ error: 'El comentario no puede estar vacío.' });
    }

    await ticketsService.addComentario(id, comentario, req.user.id);
    res.json({ message: 'Comentario agregado correctamente.' });
  } catch (error) {
    console.error('🔥 Error en agregarComentarioTicket:', error);
    res.status(400).json({ error: 'Error al agregar el comentario.' });
  }
};

module.exports = {
  obtenerTickets,
  obtenerHistorialTicket,
  crearTicket,
  actualizarTicket,
  agregarComentarioTicket,
};
