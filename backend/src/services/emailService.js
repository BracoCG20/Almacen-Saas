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
    ? `📢 Entrega de Equipo: ${tipoEquipo}`
    : `🔄 Devolución Registrada: ${tipoEquipo}`;
  const fileName = isEntrega ? 'Acta_Entrega.pdf' : 'Constancia_Devolucion.pdf';

  const logoPath = path.join(__dirname, '../assets/logo_gruposp.png');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const urlFirma = `${frontendUrl}/firmar/${tokenFirma}`;

  let contenidoEspecifico = '';

  if (isEntrega) {
    contenidoEspecifico = `
      <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 25px; margin: 20px 0;">
        <div style="margin-bottom: 15px;">
          <p style="margin: 0; font-size: 11px; font-weight: 700; color: #7c3aed;">EQUIPO ASIGNADO</p>
          <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #1e293b;">${tipoEquipo}</p>
        </div>
        <div style="border-top: 1px solid #ddd6fe; padding-top: 15px;">
          <p style="margin: 0; font-size: 11px; font-weight: 700; color: #7c3aed;">¿INCLUYE CARGADOR?</p>
          <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #4b5563;">${textoCargador}</p>
        </div>
      </div>
    `;
  } else {
    // --- VALIDACIÓN DE SEGURIDAD ---
    const estadoSeguro = estado_final_nombre || 'No especificado';
    const colorEstado =
      estadoSeguro.toLowerCase() === 'operativo' ? '#16a34a' : '#dc2626';

    contenidoEspecifico = `
      <div style="background-color: #fef2f2; border: 1px solid #ddd6fe; border-radius: 12px; padding: 25px; margin: 20px 0;">
        <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">EQUIPO DEVUELTO</p>
        <p style="margin:4px 0 15px 0; font-size:18px; font-weight:700; color:#1e293b;">${tipoEquipo}</p>
        <div style="display:flex; justify-content:space-between; border-top:1px solid #ddd6fe; padding-top:15px; margin-bottom:15px;">
          <div>
            <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">ESTADO FINAL</p>
            <p style="margin:4px 0 0 0; font-size:15px; font-weight:600; color:${colorEstado}; text-transform:uppercase;">${estadoSeguro}</p>
          </div>
          <div>
            <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">CARGADOR</p>
            <p style="margin:4px 0 0 0; font-size:15px; font-weight:600; color:#4b5563;">${textoCargador}</p>
          </div>
        </div>
        <div style="border-top:1px solid #ddd6fe; padding-top:15px;">
          <p style="margin:0; font-size:11px; font-weight:700; color:#dc2626;">MOTIVO</p>
          <p style="margin:4px 0 0 0; font-size:15px; font-weight:600; color:#4b5563;">${motivo || 'Devolución regular'}</p>
        </div>
      </div>
    `;
  }

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head><style>body { font-family: 'Segoe UI', sans-serif; background-color: #f3f4f6; }</style></head>
    <body style="padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0, 0.1);">
        <div style="background-color: ${isEntrega ? '#7c3aed' : '#dc2626'}; padding: 40px 20px; text-align: center;">
          <img src="cid:logo" alt="Logo" style="max-width: 180px; display: block; background-color: #ffffff; border-radius: 20px; padding: 5px 20px; margin: 0 auto 15px auto; filter: brightness(0) invert(1);" />
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase;">${isEntrega ? 'Acta de Asignación' : 'Constancia de Devolución'}</h1>
        </div>
        <div style="padding: 40px 30px; color: #334155;">
          <h2 style="color: #1e293b; margin-top: 0;">Hola, ${nombreEmpleado} 👋</h2>
          <p style="font-size: 16px; color: #475569;">Se ha registrado la ${isEntrega ? 'entrega' : 'devolución'} de una herramienta de trabajo a tu nombre.</p>
          
          ${contenidoEspecifico}

          <div style="text-align: center; margin-top: 30px; margin-bottom: 20px;">
            <a href="${urlFirma}" style="background-color: #10b981; color: white; padding: 16px 30px; border-radius: 8px; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
              ✍️ Hacer clic aquí para Revisar y Firmar
            </a>
          </div>

          <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 20px;">
            Se adjunta una copia de lectura del documento en PDF.</br> Para validarlo, utilice el botón verde de arriba.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"SISTEMA GTH" <${process.env.EMAIL_USER}>`,
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
