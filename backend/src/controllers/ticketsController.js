const ticketsService = require('../services/ticketsService');
const { uploadToCloudinary } = require('../middlewares/uploadMiddleware');

const obtenerTickets = async (req, res) => {
  try {
    const tickets = await ticketsService.getTickets();
    res.json(tickets);
  } catch (error) {
    console.error('Error en obtenerTickets:', error);
    res.status(500).json({ error: 'Error al obtener la lista de tickets' });
  }
};

const obtenerHistorialTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const historial = await ticketsService.getTicketHistorial(id);
    res.json(historial);
  } catch (error) {
    console.error('Error en obtenerHistorialTicket:', error);
    res.status(500).json({ error: 'Error al obtener el historial del ticket' });
  }
};

const crearTicket = async (req, res) => {
  try {
    await ticketsService.createTicket(req.body, req.user.id);
    const io = req.app.get('io');
    if (io) {
      io.emit('nuevo_ticket');
    }
    res.status(201).json({ message: 'Ticket generado exitosamente.' });
  } catch (error) {
    console.error('Error en crearTicket:', error);
    res
      .status(400)
      .json({ error: error.message || 'Error al generar el ticket.' });
  }
};

const actualizarTicket = async (req, res) => {
  try {
    const { id } = req.params;
    await ticketsService.updateTicket(id, req.body, req.user.id);
    const io = req.app.get('io');
    if (io) {
      io.emit('actualizacion_ticket', { ticketId: Number(id) });
    }
    res.json({ message: 'Ticket actualizado correctamente.' });
  } catch (error) {
    console.error('Error en actualizarTicket:', error);
    res.status(400).json({ error: 'Error al actualizar el ticket.' });
  }
};

const agregarComentarioTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { comentario } = req.body;

    if ((!comentario || comentario.trim() === '') && !req.file) {
      return res
        .status(400)
        .json({ error: 'Debe enviar un mensaje o un archivo adjunto.' });
    }

    let archivoUrl = null;

    if (req.file) {
      archivoUrl = await uploadToCloudinary(req.file.buffer, 'TicketsAdjuntos');
    }

    const textoComentario = comentario || '';

    await ticketsService.addComentario(
      id,
      textoComentario,
      archivoUrl,
      req.user.id,
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('actualizacion_ticket', { ticketId: Number(id) });
    }

    res.json({ message: 'Comentario agregado correctamente.', archivoUrl });
  } catch (error) {
    console.error('Error en agregarComentarioTicket:', error);
    res
      .status(500)
      .json({ error: 'Error al agregar el comentario o subir el archivo.' });
  }
};

const asignarTicket = async (req, res) => {
  try {
    const { id } = req.params;
    await ticketsService.assignTicket(id, req.user.id);
    const io = req.app.get('io');
    if (io) {
      io.emit('actualizacion_ticket', { ticketId: Number(id) });
    }
    res.json({ message: 'Ticket asignado correctamente.' });
  } catch (error) {
    console.error('Error al asignar ticket:', error);
    res.status(400).json({ error: 'Error al tomar el ticket.' });
  }
};

module.exports = {
  obtenerTickets,
  obtenerHistorialTicket,
  crearTicket,
  actualizarTicket,
  agregarComentarioTicket,
  asignarTicket,
};
