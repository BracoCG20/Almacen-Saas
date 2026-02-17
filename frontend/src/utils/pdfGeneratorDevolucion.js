import { jsPDF } from 'jspdf';
import logoImg from '../assets/logo_gruposp.png';
import firmaImg from '../assets/firma_pierina.png';

export const generarPDFDevolucion = (
  equipo,
  usuario,
  cargadorDevuelto,
  observaciones,
  estadoFinal,
) => {
  const doc = new jsPDF();
  const margen = 25;
  const anchoPagina = 210;
  const anchoUtil = anchoPagina - margen * 2;
  let y = 20;

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
  y += 20;

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
  y += 20;

  // --- CORRECCIÓN DE LÓGICA DE GÉNERO ---
  const rawGenero = (usuario.genero || '').toLowerCase().trim();
  const esMujer =
    rawGenero === 'f' || rawGenero === 'mujer' || rawGenero === 'femenino';

  const prefijo = esMujer ? 'la Srta.' : 'el Sr.';
  const etiquetaTrabajador = esMujer ? 'LA TRABAJADORA' : 'EL TRABAJADOR';

  const nombreCompleto =
    `${usuario.nombres} ${usuario.apellidos}`.toUpperCase();
  const dni = usuario.dni || '---';

  // 4. Cuerpo
  const textoCuerpo = `Se deja constancia que ${prefijo} ${nombreCompleto} identificado con DNI/Carnet de Extranjería N° ${dni} realiza la devolución de los materiales y/o documentos de trabajo que le fue entregada por EL EMPLEADOR, de acuerdo al siguiente detalle:`;
  const lineasCuerpo = doc.splitTextToSize(textoCuerpo, anchoUtil);
  doc.text(lineasCuerpo, margen, y);
  y += lineasCuerpo.length * 5 + 5;

  // 5. Detalles
  doc.setFont('helvetica', 'normal');
  const itemEquipo = `- ${equipo.marca} ${equipo.modelo} con Número de serie: ${equipo.serie}`;
  doc.text(itemEquipo, margen + 10, y);
  y += 7;

  if (cargadorDevuelto) {
    doc.text('- CARGADOR', margen + 10, y);
    y += 7;
  }
  y += 10;

  // 6. Observaciones
  if (
    (estadoFinal === 'malogrado' || estadoFinal === 'robado') &&
    observaciones
  ) {
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones sobre el estado del equipo:', margen, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    const splitObservaciones = doc.splitTextToSize(observaciones, anchoUtil);
    doc.text(splitObservaciones, margen, y);
    y += splitObservaciones.length * 5 + 10;
  }

  // 7. Legales
  const textoLegal1 =
    'Por lo mismo, dejo constancia que EL EMPLEADOR revisará el estado de conservación del equipo debiendo encontrarse en buen estado.';
  const lineasLegal1 = doc.splitTextToSize(textoLegal1, anchoUtil);
  doc.text(lineasLegal1, margen, y);
  y += lineasLegal1.length * 5 + 5;

  const textoLegal2 =
    'Se firma el presente documento, en señal de conformidad y de conformidad a lo establecido en la cláusula sexta del Convenio de Extinción Laboral y Pago de Beneficios sociales.';
  const lineasLegal2 = doc.splitTextToSize(textoLegal2, anchoUtil);
  doc.text(lineasLegal2, margen, y);
  y += 25;

  // 8. Cajas de Firmas
  const alturaCaja = 50;
  const anchoCaja = anchoUtil / 2;
  const xCaja2 = margen + anchoCaja;

  doc.setLineWidth(0.3);
  doc.rect(margen, y, anchoCaja, alturaCaja);
  doc.rect(xCaja2, y, anchoCaja, alturaCaja);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ENTREGA:', margen + anchoCaja / 2, y + 8, { align: 'center' });
  doc.text('RECIBE:', xCaja2 + anchoCaja / 2, y + 8, { align: 'center' });

  // EMPLEADOR (Derecha)
  const yFirmaPierina = y + 15;
  doc.setFontSize(8);
  doc.text('Pierina Alarcón', xCaja2 + anchoCaja / 2, yFirmaPierina, {
    align: 'center',
  });
  doc.addImage(
    firmaImg,
    'PNG',
    xCaja2 + anchoCaja / 2 - 15,
    yFirmaPierina + 5,
    30,
    15,
  );
  const yLineaCargo = y + alturaCaja - 10;
  doc.line(xCaja2 + 10, yLineaCargo, xCaja2 + anchoCaja - 10, yLineaCargo);
  doc.text('EL EMPLEADOR', xCaja2 + anchoCaja / 2, yLineaCargo + 5, {
    align: 'center',
  });

  // TRABAJADOR (Izquierda)

  // DNI (Centrado en la parte inferior de la caja)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`DNI N° ${dni}`, margen + anchoCaja / 2, yLineaCargo, {
    align: 'center',
  });

  // Etiqueta de género (EL TRABAJADOR / LA TRABAJADORA)
  doc.text(etiquetaTrabajador, margen + anchoCaja / 2, yLineaCargo + 5, {
    align: 'center',
  });

  return doc.output('bloburl');
};
