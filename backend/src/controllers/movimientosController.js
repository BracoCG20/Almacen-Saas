const movimientosService = require('../services/movimientosService');
const emailService = require('../services/emailService');

const obtenerHistorial = async (req, res) => {
  try {
    const historial = await movimientosService.getHistorial();
    res.json(historial);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error interno al obtener el historial de movimientos.' });
  }
};

const registrarEntrega = async (req, res) => {
  try {
    const result = await movimientosService.registrarEntrega(
      req.body,
      req.user.id,
      null,
    );
    res.status(201).json({
      message: 'Entrega registrada correctamente.',
      movimiento_id: result.movimientoId,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const registrarEntregaConCorreo = async (req, res) => {
  try {
    const result = await movimientosService.registrarEntrega(
      req.body,
      req.user.id,
      req.file,
    );
    if (result.emailWarning) {
      res.status(201).json({
        message: 'Registro guardado, pero falló el envío de correo.',
        warning: true,
      });
    } else {
      res
        .status(201)
        .json({ message: 'Registro guardado y correo enviado exitosamente.' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message || 'Error al guardar en BD' });
  }
};

const registrarDevolucion = async (req, res) => {
  try {
    await movimientosService.registrarDevolucion(req.body, req.user.id, null);
    res.status(201).json({ message: 'Devolución registrada correctamente.' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error interno al registrar la devolución.' });
  }
};

const registrarDevolucionConCorreo = async (req, res) => {
  try {
    const result = await movimientosService.registrarDevolucion(
      req.body,
      req.user.id,
      req.file,
    );
    if (result.emailWarning) {
      res.status(201).json({
        message: 'Guardado, pero falló el envío de correo.',
        warning: true,
      });
    } else {
      res.status(201).json({
        message: 'Devolución guardada y correo enviado exitosamente.',
      });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message || 'Error al guardar la devolución en BD.',
    });
  }
};

const reenviarCorreoActa = async (req, res) => {
  try {
    const {
      tipo_movimiento,
      destinatario,
      nombreEmpleado,
      tipoEquipo,
      cargador,
      estado_final_nombre,
      motivo,
    } = req.body;
    const textoCargador =
      cargador === 'true' || cargador === true ? 'SÍ' : 'NO';

    await emailService.enviarActaCorreo(
      tipo_movimiento,
      destinatario,
      nombreEmpleado,
      tipoEquipo,
      textoCargador,
      req.file.buffer,
      estado_final_nombre,
      motivo,
    );

    await movimientosService.actualizarFirmaDocumento(
      req.body.movimiento_id,
      undefined,
      null,
    ); // Solo actualiza el estado enviado en service

    res.json({ message: 'Correo reenviado exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Fallo al reenviar el correo.' });
  }
};

const subirPdfFirmado = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    const url = `/uploads/Firmados/${req.file.filename}`;
    await movimientosService.actualizarFirmaDocumento(req.params.id, url, true);
    res.json({ message: 'Documento firmado guardado exitosamente.' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error interno al guardar el archivo firmado.' });
  }
};

const invalidarFirma = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    // 1. Ejecutar el servicio
    await movimientosService.actualizarFirmaDocumento(
      id,
      null,
      false,
      usuarioId,
    );

    // 2. Emitir el evento de Socket.io correctamente
    const io = req.app.get('io');
    if (io) {
      console.log(`Emitiendo actualización para movimiento: ${id}`);
      io.emit('documento_firmado', { id, status: 'pendente' });
    }

    res.json({ message: 'Documento invalidado y enviado nuevamente.' });
  } catch (error) {
    console.error('Error en controller invalidar:', error);
    res.status(500).json({ error: 'Fallo interno al invalidar.' });
  }
};

module.exports = {
  obtenerHistorial,
  registrarEntrega,
  registrarEntregaConCorreo,
  registrarDevolucion,
  registrarDevolucionConCorreo,
  reenviarCorreoActa,
  subirPdfFirmado,
  invalidarFirma,
};
