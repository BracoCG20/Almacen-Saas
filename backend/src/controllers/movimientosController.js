const movimientosService = require('../services/movimientosService');
const emailService = require('../services/emailService');
const { uploadToCloudinary } = require('../middlewares/uploadMiddleware');

const obtenerHistorial = async (req, res) => {
  try {
    const historial = await movimientosService.getHistorial();
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: 'Error interno al obtener el historial.' });
  }
};

const registrarEntrega = async (req, res) => {
  try {
    // Registro simple sin archivo
    const result = await movimientosService.registrarEntrega(
      req.body, // Ya viene con formato { empleado_id, equipos: [...] }
      req.user.id,
      null,
      null,
    );
    res.status(201).json({
      message: 'Entrega múltiple registrada correctamente.',
      movimientos_ids: result.movimientoIds,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const registrarEntregaConCorreo = async (req, res) => {
  try {
    let cloudinaryUrl = null;
    let pdfBuffer = null;

    if (req.file) {
      cloudinaryUrl = await uploadToCloudinary(req.file.buffer, 'Originales');
      pdfBuffer = req.file.buffer;
    }

    // EXTRAEMOS Y PARSEAMOS EL PAYLOAD
    const data = JSON.parse(req.body.payload);
    // Añadimos destinatario y nombre que vienen fuera del JSON
    data.destinatario = req.body.destinatario;
    data.nombreEmpleado = req.body.nombreEmpleado;

    const result = await movimientosService.registrarEntrega(
      data,
      req.user.id,
      cloudinaryUrl,
      pdfBuffer,
    );

    res
      .status(201)
      .json({ message: 'Registro guardado y correo enviado exitosamente.' });
  } catch (error) {
    console.error('Error en registrarEntregaConCorreo:', error);
    res.status(400).json({
      error: error.message || 'Error al procesar la entrega múltiple',
    });
  }
};

const registrarDevolucion = async (req, res) => {
  try {
    await movimientosService.registrarDevolucion(
      req.body,
      req.user.id,
      null,
      null,
    );
    res.status(201).json({ message: 'Devolución registrada correctamente.' });
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error interno al registrar la devolución.' });
  }
};

const registrarDevolucionConCorreo = async (req, res) => {
  try {
    let cloudinaryUrl = null;
    let pdfBuffer = null;

    if (req.file) {
      // 1. Subir el acta a Cloudinary
      cloudinaryUrl = await uploadToCloudinary(req.file.buffer, 'Originales');
      pdfBuffer = req.file.buffer;
    }

    // 2. Registrar en BD
    await movimientosService.registrarDevolucion(
      req.body,
      req.user.id,
      cloudinaryUrl,
      pdfBuffer,
    );

    res
      .status(201)
      .json({ message: 'Devolución guardada y correo enviado exitosamente.' });
  } catch (error) {
    res
      .status(400)
      .json({ error: error.message || 'Error al guardar la devolución.' });
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
      tokenFirma,
    } = req.body;

    const textoCargador =
      cargador === 'true' || cargador === true ? 'SÍ' : 'NO';

    // Se asume que el archivo viene en el body para reenviar
    await emailService.enviarActaCorreo(
      tipo_movimiento,
      destinatario,
      nombreEmpleado,
      tipoEquipo,
      textoCargador,
      req.file.buffer,
      estado_final_nombre,
      motivo,
      tokenFirma,
    );

    res.json({ message: 'Correo reenviado exitosamente.' });
  } catch (error) {
    res.status(500).json({ error: 'Fallo al reenviar el correo.' });
  }
};

const subirPdfFirmado = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo.' });
    }

    // 1. Subir a Cloudinary en la carpeta 'Firmados'
    const cloudinaryUrl = await uploadToCloudinary(req.file.buffer, 'Firmados');

    // 2. Actualizar el registro con la URL de Cloudinary
    await movimientosService.actualizarFirmaDocumento(
      req.params.id,
      cloudinaryUrl,
      true,
    );

    res.json({
      message: 'Documento firmado guardado en la nube exitosamente.',
      url: cloudinaryUrl,
    });
  } catch (error) {
    console.error('Error Cloudinary:', error);
    res.status(500).json({ error: 'Error al subir el archivo a la nube.' });
  }
};

const invalidarFirma = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    await movimientosService.actualizarFirmaDocumento(
      id,
      null,
      false,
      usuarioId,
    );

    const io = req.app.get('io');
    if (io) {
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
