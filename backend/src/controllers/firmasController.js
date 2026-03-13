const firmasService = require('../services/firmasService');

const getInfoFirma = async (req, res) => {
  const { token } = req.params;
  try {
    const docInfo = await firmasService.getDocumentoByToken(token);

    if (!docInfo) {
      return res.status(404).json({
        error:
          'El enlace es inválido, ya expiró o el documento ya fue firmado.',
      });
    }

    res.json(docInfo);
  } catch (error) {
    console.error('Error en getInfoFirma:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
};

const procesarFirma = async (req, res) => {
  const { token } = req.params;
  const { dni_ingresado } = req.body;

  try {
    // Llamamos al servicio para que haga toda la magia
    const result = await firmasService.procesarFirmaDigital(
      token,
      dni_ingresado,
    );

    // Emitir evento por Socket.io para recargar la tabla del admin en vivo
    const io = req.app.get('io');
    if (io) {
      io.emit('documento_firmado', {
        id: result.id,
        mensaje: 'Un documento acaba de ser firmado',
      });
    }

    res.json({
      message: 'Documento firmado exitosamente.',
      pdf_url: result.pdf_url,
    });
  } catch (error) {
    console.error('Error en procesarFirma:', error);

    // Devolvemos 400 si es un error de validación (DNI o enlace), 500 si es del servidor
    const isClientError =
      error.message.includes('inválido') || error.message.includes('DNI');
    res
      .status(isClientError ? 400 : 500)
      .json({ error: error.message || 'Error al procesar la firma.' });
  }
};

module.exports = {
  getInfoFirma,
  procesarFirma,
};
