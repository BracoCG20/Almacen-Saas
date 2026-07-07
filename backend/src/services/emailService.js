//backend/src/services/emailService.js
const transporter = require('../config/mailer');
const path = require('path');

const enviarActaCorreo = async (
  tipo_movimiento,
  destinatario,
  nombreEmpleado,
  tipoEquipo,
  textoCargador,
  archivoPDFBuffer,
  estado_final_nombre,
  motivo,
  tokenFirma,
) => {
  const isEntrega = tipo_movimiento === 'entrega';
  const subject = isEntrega
    ? `Acción requerida: Firma tu Acta de Entrega`
    : `Acción requerida: Firma tu Constancia de Devolución`;
  const fileName = isEntrega ? 'Acta_Entrega.pdf' : 'Constancia_Devolucion.pdf';

  const logoPath = path.join(__dirname, '../assets/logo_gruposp.png');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const urlFirma = `${frontendUrl}/firmar/${tokenFirma}`;

  let contenidoEspecifico = '';

  if (isEntrega) {
    contenidoEspecifico = `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0; background-color: #fafafa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding-bottom: 16px;">
              <p style="margin: 0; font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Equipo Asignado</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 500; color: #0f172a;">${tipoEquipo}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Incluye Cargador / Accesorios</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 500; color: #0f172a;">${textoCargador}</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  } else {
    // Para devoluciones
    const estadoSeguro = estado_final_nombre || 'No especificado';
    const estadoBg =
      estadoSeguro.toLowerCase() === 'operativo' ? '#dcfce7' : '#fee2e2';
    const estadoColor =
      estadoSeguro.toLowerCase() === 'operativo' ? '#166534' : '#991b1b';

    contenidoEspecifico = `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0; background-color: #fafafa;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td colspan="2" style="padding-bottom: 16px;">
              <p style="margin: 0; font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Equipo Devuelto</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 500; color: #0f172a;">${tipoEquipo}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 16px; padding-bottom: 16px; border-top: 1px solid #e2e8f0; width: 50%;">
              <p style="margin: 0; font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Estado Final</p>
              <div style="margin-top: 6px;">
                <span style="background-color: ${estadoBg}; color: ${estadoColor}; font-size: 13px; font-weight: 500; padding: 4px 10px; border-radius: 16px; display: inline-block;">${estadoSeguro}</span>
              </div>
            </td>
            <td style="padding-top: 16px; padding-bottom: 16px; border-top: 1px solid #e2e8f0; width: 50%;">
              <p style="margin: 0; font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Cargador</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 500; color: #0f172a;">${textoCargador}</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Motivo</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 500; color: #0f172a;">${motivo || 'Devolución regular'}</p>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
      </style>
    </head>
    <body style="padding: 40px 20px;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        
        <div style="padding: 32px; background-color: #f8fafc; text-align: center;">
          <img src="cid:logo" alt="Grupo SP" style="height: 40px; display: block; margin: 0 auto;" />
        </div>

        <div style="padding: 32px;">
          <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 500; color: #0f172a;">
            Hola, ${nombreEmpleado}
          </h1>
          
          <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 1.6; color: #475569;">
            Se ha registrado la <strong>${isEntrega ? 'entrega' : 'devolución'}</strong> de una herramienta de trabajo a tu nombre en nuestro sistema.
          </p>
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #475569;">
            Para completar el proceso, requerimos tu firma digital en el documento generado.
          </p>
          
          ${contenidoEspecifico}

          <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="${urlFirma}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 500; text-decoration: none; display: inline-block;">
              Revisar y Firmar Documento
            </a>
          </div>
        </div>

        <div style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
            Se ha adjuntado una copia de lectura en formato PDF a este correo.
          </p>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            © ${new Date().getFullYear()} Grupo SP. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Soporte TI - Grupo SP" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: subject,
    html: htmlTemplate,
    attachments: [
      { filename: fileName, content: archivoPDFBuffer },
      { filename: 'logo_gruposp.png', path: logoPath, cid: 'logo' },
    ],
  });
};

module.exports = {
  enviarActaCorreo,
};
