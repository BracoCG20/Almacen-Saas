import { jsPDF } from 'jspdf';
import logoImg from '../assets/logo_grupoSP.png';
import firmaImg from '../assets/firma_pierina.png';

export const generarPDFDevolucion = (
  equipos, // AHORA RECIBE UN ARREGLO
  usuario,
  motivo,
) => {
  const doc = new jsPDF();
  const margen = 25;
  const anchoPagina = 210;
  const anchoUtil = anchoPagina - margen * 2;
  let y = 20;

  const listaEquipos = Array.isArray(equipos) ? equipos : [equipos];

  // 1. Logo
  doc.addImage(logoImg, 'PNG', margen, 10, 40, 15);
  y += 30;

  // 2. Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const t1 = 'CONSTANCIA DE DEVOLUCIÓN DE DOCUMENTOS Y EQUIPOS DE TRABAJO';
  doc.text(t1, (anchoPagina - doc.getTextWidth(t1)) / 2, y);
  y += 7;
  const t2 = '(ANEXO – B)';
  doc.text(t2, (anchoPagina - doc.getTextWidth(t2)) / 2, y);
  y += 15;

  // 3. Fecha
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const fechaActual = new Date().toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  doc.text(`Fecha: ${fechaActual}`, margen, y);
  y += 7;
  doc.text('Magdalena', margen, y);
  y += 15;

  const rawGenero = (usuario.genero || '').toLowerCase().trim();
  const esMujer =
    rawGenero === 'f' || rawGenero === 'mujer' || rawGenero === 'femenino';
  const prefijo = esMujer ? 'la Srta.' : 'el Sr.';
  const etiquetaTrabajador = esMujer ? 'LA TRABAJADORA' : 'EL TRABAJADOR';

  const nombreCompleto =
    `${usuario.nombres} ${usuario.apellidos}`.toUpperCase();
  const dni = usuario.dni || '---';

  // 4. Cuerpo
  const textoCuerpo = `Se deja constancia que ${prefijo} ${nombreCompleto} identificado con DNI/Carnet de Extranjería N° ${dni} realiza la devolución de los materiales y/o equipos de trabajo que le fueron entregados por EL EMPLEADOR, de acuerdo al siguiente detalle:`;
  const lineasCuerpo = doc.splitTextToSize(textoCuerpo, anchoUtil);
  doc.text(lineasCuerpo, margen, y);
  y += lineasCuerpo.length * 5 + 5;

  // 5. Detalles de Equipos (Iterar sobre la lista)
  doc.setFont('helvetica', 'normal');
  listaEquipos.forEach((eq) => {
    const itemEquipo = `- ${eq.marca} ${eq.modelo} (S/N: ${eq.serie})`;
    doc.text(itemEquipo, margen + 10, y);
    y += 6;

    if (eq.cargador === true) {
      doc.text('  + CARGADOR / ACCESORIOS DEVUELTOS', margen + 10, y);
      y += 6;
    } else if (eq.cargador === false) {
      doc.setFont('helvetica', 'bold');
      doc.text('  - FALTAN ACCESORIOS', margen + 10, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
    }

    if (eq.observaciones) {
      const obsTxt = doc.splitTextToSize(
        `  * Obs: ${eq.observaciones}`,
        anchoUtil - 15,
      );
      doc.text(obsTxt, margen + 10, y);
      y += obsTxt.length * 5 + 2;
    }
    y += 2;
  });

  y += 5;

  // --- MOTIVO DE LA DEVOLUCIÓN ---
  doc.setFont('helvetica', 'bold');
  doc.text('Motivo de la devolución:', margen, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`- ${motivo || 'Devolución regular'}`, margen + 10, y);
  y += 10;

  // 7. Legales
  const textoLegal1 = `Por medio del presente documento, se deja constancia de que ${etiquetaTrabajador} efectúa la devolución del equipo asignado, en buenas condiciones.`;
  const lineasLegal1 = doc.splitTextToSize(textoLegal1, anchoUtil);
  doc.text(lineasLegal1, margen, y);
  y += lineasLegal1.length * 5 + 5;

  const textoLegal2 =
    'Se firma el presente documento, en señal de conformidad y de acuerdo a lo establecido en la cláusula Décimo Primera del Contrato de Trabajo';
  const lineasLegal2 = doc.splitTextToSize(textoLegal2, anchoUtil);
  doc.text(lineasLegal2, margen, y);

  // 8. Cajas de Firmas (Empujamos al fondo)
  y = Math.max(y + 20, 220);
  const alturaCaja = 40;
  const anchoCaja = anchoUtil / 2;
  const xCaja2 = margen + anchoCaja;

  doc.setLineWidth(0.3);
  doc.rect(margen, y, anchoCaja, alturaCaja);
  doc.rect(xCaja2, y, anchoCaja, alturaCaja);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ENTREGA:', margen + anchoCaja / 2, y + 8, { align: 'center' });
  doc.text('RECIBE:', xCaja2 + anchoCaja / 2, y + 8, { align: 'center' });

  const yFirmaPierina = y + 15;
  doc.setFontSize(8);
  doc.text('Pierina Alarcón', xCaja2 + anchoCaja / 2, yFirmaPierina, {
    align: 'center',
  });
  doc.addImage(
    firmaImg,
    'PNG',
    xCaja2 + anchoCaja / 2 - 15,
    yFirmaPierina + 2,
    30,
    15,
  );
  const yLineaCargo = y + alturaCaja - 8;
  doc.line(xCaja2 + 10, yLineaCargo, xCaja2 + anchoCaja - 10, yLineaCargo);
  doc.text('EL EMPLEADOR', xCaja2 + anchoCaja / 2, yLineaCargo + 5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`DNI N° ${dni}`, margen + anchoCaja / 2, yLineaCargo, {
    align: 'center',
  });
  doc.text(etiquetaTrabajador, margen + anchoCaja / 2, yLineaCargo + 5, {
    align: 'center',
  });

  return doc.output('bloburl');
};
