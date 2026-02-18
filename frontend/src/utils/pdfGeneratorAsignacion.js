import { jsPDF } from 'jspdf';
import logoImg from '../assets/logo_gruposp.png';
import firmaImg from '../assets/firma_pierina.png';

export const generarPDFBlob = (
  equipo,
  usuario,
  fechaOverride = null,
  cargadorOverride = null,
) => {
  const doc = new jsPDF();
  const margenIzq = 25;
  const margenDer = 25;
  const anchoPagina = 210;
  const anchoUtil = anchoPagina - margenIzq - margenDer;
  let y = 20;

  // 1. Logo
  doc.addImage(logoImg, 'PNG', margenIzq, 10, 40, 15);
  y += 25;

  // 2. Título
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const titulo = 'ACTA DE ENTREGA DE EQUIPOS';
  const xTitulo = (anchoPagina - doc.getTextWidth(titulo)) / 2;
  doc.text(titulo, xTitulo, y);
  doc.line(xTitulo, y + 1, xTitulo + doc.getTextWidth(titulo), y + 1);
  y += 15;

  // 3. Fecha
  doc.setFontSize(10);
  doc.text('Fecha de entrega:', margenIzq, y);
  doc.setFont('helvetica', 'normal');

  const fechaObj = fechaOverride
    ? new Date(
        fechaOverride.endsWith('Z') ? fechaOverride : fechaOverride + 'Z',
      )
    : new Date();

  const fechaTexto = fechaObj.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  doc.text(fechaTexto, margenIzq + 32, y);
  y += 12;

  // --- CORRECCIÓN DE GÉNERO ---
  // Normalizamos lo que viene de la BD (quitamos espacios y pasamos a minúscula)
  const rawGenero = (usuario.genero || '').toLowerCase().trim();
  // Validamos si es F, Femenino o Mujer
  const esMujer =
    rawGenero === 'f' || rawGenero === 'mujer' || rawGenero === 'femenino';

  const prefijo = esMujer ? 'a la Srta.' : 'al Sr.';
  const nombre = `${usuario.nombres} ${usuario.apellidos}`.toUpperCase();
  const dni = usuario.dni || '---';

  // 4. Intro
  const intro = `En Magdalena, se hace entrega ${prefijo} ${nombre} identificado (a) con DNI/PTP/C.E N° ${dni} de los siguientes elementos de trabajo:`;
  const splitIntro = doc.splitTextToSize(intro, anchoUtil);
  doc.text(splitIntro, margenIzq, y);
  y += splitIntro.length * 5 + 5;

  // 5. Tabla
  const altoFila = 10;
  const col1 = margenIzq;
  const col2 = margenIzq + 50;
  const col3 = margenIzq + 120;
  const anchoCol3 = anchoUtil - 120;

  doc.setLineWidth(0.1);
  doc.setFont('helvetica', 'bold');

  // Cabecera
  doc.rect(col1, y, 50, altoFila);
  doc.rect(col2, y, 70, altoFila);
  doc.rect(col3, y, anchoCol3, altoFila);
  doc.text('ITEMS', col1 + 2, y + 6);
  doc.text('DESCRIPCIÓN', col2 + 2, y + 6);
  doc.text('CANTIDAD', col3 + 2, y + 6);
  y += altoFila;

  // Datos
  doc.setFont('helvetica', 'normal');
  doc.rect(col1, y, 50, altoFila);
  doc.rect(col2, y, 70, altoFila);
  doc.rect(col3, y, anchoCol3, altoFila);

  const tieneCargador =
    cargadorOverride !== null && cargadorOverride !== undefined
      ? cargadorOverride
      : true;

  const itemTexto = tieneCargador
    ? 'Laptop y cargador'
    : 'Laptop (sólo equipo)';

  doc.text(itemTexto, col1 + 2, y + 6);
  doc.text(`código de equipo: ${equipo.serie}`, col2 + 2, y + 6);
  doc.text('1', col3 + anchoCol3 / 2, y + 6, { align: 'center' });
  y += altoFila + 10;

  // 6. Legal
  doc.setFontSize(9);
  const parrafo1 =
    'Por falta de equipos personales para trabajar se hace entrega de esta acta la cual se mantendrá hasta diciembre. Finalizado el plazo el Trabajador deberá devolver el equipo. En cualquier escenario se obliga a devolver estos equipos a solo el requerimiento del empleador o al término del periodo de trabajo.';
  const splitP1 = doc.splitTextToSize(parrafo1, anchoUtil);
  doc.text(splitP1, margenIzq, y);
  y += splitP1.length * 4 + 4;

  doc.setFont('helvetica', 'bold');
  doc.text(
    'Al recibir estos elementos de trabajo, me comprometo a:',
    margenIzq,
    y,
  );
  doc.setFont('helvetica', 'normal');
  y += 5;

  const bullets = [
    'Utilizar el equipo para los fines correspondientes a su labor; como también de cuidarla y mantenerla en buenas condiciones.',
    'Por lo mismo, me hago responsable en caso de pérdida o robo o cualquier otro daño que pueda sufrir el equipo durante mi periodo de trabajo.',
    'Comunicar inmediatamente a mi empleador si hubiera algún inconveniente con el equipo o si hubiera sufrido algún daño.',
    'Debo recoger y devolver el equipo al iniciar y terminar mi relación laboral; bajo previa coordinación con mi empleador.',
    'Toda devolución del equipo debe ser en oficina por cuenta propia del usuario y bajo coordinación del encargado de TI.',
  ];
  bullets.forEach((txt) => {
    doc.text('•', margenIzq + 3, y);
    const lines = doc.splitTextToSize(txt, anchoUtil - 8);
    doc.text(lines, margenIzq + 8, y);
    y += lines.length * 4 + 2;
  });

  y += 2;
  const cierre = doc.splitTextToSize(
    'El Empleador realizará la entrega del equipo mostrando el estado correcto de la misma y de acuerdo a esto se firma esta acta de entrega.',
    anchoUtil,
  );
  doc.text(cierre, margenIzq, y);

  // 7. Firmas
  const yFirma = 240;
  doc.line(margenIzq, yFirma, margenIzq + 60, yFirma);
  doc.setFont('helvetica', 'bold');
  doc.text(`DNI/PTP/C.E N° ${dni}`, margenIzq, yFirma + 5);

  doc.text(
    esMujer ? 'LA TRABAJADORA' : 'EL TRABAJADOR',
    margenIzq,
    yFirma + 10,
  );

  const xFirmaDer = 120;
  doc.addImage(firmaImg, 'PNG', xFirmaDer + 5, yFirma - 25, 45, 23);
  doc.line(xFirmaDer, yFirma, xFirmaDer + 60, yFirma);
  doc.text('PIERINA ALARCON DILLERVA', xFirmaDer + 2, yFirma + 5);
  doc.text('GTH', xFirmaDer + 25, yFirma + 10, { align: 'center' });

  return doc;
};
