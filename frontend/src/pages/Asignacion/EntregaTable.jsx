import React, { useState } from 'react';
import {
  History,
  Check,
  FileText,
  Upload,
  Ban,
  Eye,
  Mail,
  AlertTriangle,
  CalendarDays,
  Clock,
  Barcode,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './EntregaTable.scss';

const EntregaTable = ({
  historial,
  onVerPdfOriginal,
  onVerFirmado,
  onSubirClick,
  onInvalidar,
}) => {
  // Controlo la paginación local de la tabla
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Formateo la fecha para mostrar el día, mes y año usando mi zona horaria local
  const formatDateOnly = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(
      isoString.endsWith('Z') ? isoString : `${isoString}Z`,
    );
    return date.toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Formateo la hora extraída de la cadena ISO a formato 12H (AM/PM)
  const formatTimeOnly = (isoString) => {
    if (!isoString) return '';
    const date = new Date(
      isoString.endsWith('Z') ? isoString : `${isoString}Z`,
    );
    return date.toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  /**
   * AGRUPACIÓN DE HISTORIAL
   * Recibo una lista plana de asignaciones desde la BD. Aquí las agrupo si se
   * hicieron en el mismo minuto y para el mismo usuario. Así, una asignación
   * múltiple de 3 equipos se dibuja como una sola fila en la UI.
   */
  const historialAgrupado = Object.values(
    historial.reduce((acc, h) => {
      const key = `${h.empleado_id}-${h.fecha_movimiento.substring(0, 16)}`;
      if (!acc[key]) {
        acc[key] = { ...h, equipos_agrupados: [h] };
      } else {
        acc[key].equipos_agrupados.push(h);
      }
      return acc;
    }, {}),
  ).sort((a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento));

  // Lógica matemática para cortar el arreglo agrupado y mostrar solo los ítems de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historialAgrupado.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(historialAgrupado.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className='table-container'>
      <div className='table-header-title'>
        <h3>
          <History size={18} /> Últimas Entregas
        </h3>
      </div>
      <div className='table-responsive-wrapper'>
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Equipo(s) Entregado(s)</th>
              <th>Usuario</th>
              <th className='center'>Carg.</th>
              <th className='center'>Correo</th>
              <th className='center'>Acta</th>
              <th className='center'>Firma</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td
                  colSpan='7'
                  className='no-data'
                >
                  No hay entregas registradas aún.
                </td>
              </tr>
            ) : (
              currentItems.map((h) => {
                // VERIFICACIÓN DE FIRMA DEL PAQUETE:
                // Reviso si ALGUNO de los equipos dentro de este grupo ya tiene una firma válida confirmada en BD.
                const estaFirmado = h.equipos_agrupados.some(
                  (eq) => eq.firma_valida === true,
                );

                // Si está firmado, capturo esa URL de Cloudinary para abrir el modal
                const urlFirma = h.equipos_agrupados.find(
                  (eq) => eq.pdf_firmado_url,
                )?.pdf_firmado_url;

                // Para subir actas nuevas o invalidar, usaré el ID del primer equipo del grupo
                const mainId = h.id;

                return (
                  <tr key={mainId}>
                    <td>
                      <div className='date-time-cell'>
                        <span className='date-part'>
                          <CalendarDays size={13} />{' '}
                          {formatDateOnly(h.fecha_movimiento)}
                        </span>
                        <span className='time-part'>
                          <Clock size={12} />{' '}
                          {formatTimeOnly(h.fecha_movimiento)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className='info-cell'>
                        {/* Lógica de Renderizado Condicional: Si es paquete muestro el Tooltip, si es uno, el nombre directo */}
                        {h.equipos_agrupados.length > 1 ? (
                          <div className='shadcn-tooltip-container'>
                            <span className='multiple-badge'>
                              <Layers size={14} /> Varios (
                              {h.equipos_agrupados.length})
                            </span>
                            <div className='shadcn-tooltip-content'>
                              {h.equipos_agrupados.map((eq, i) => (
                                <div
                                  key={i}
                                  className='tooltip-item'
                                >
                                  <strong>{eq.modelo}</strong>
                                  <span>SN: {eq.serie}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className='name'>{h.modelo}</span>
                            <span className='audit-text'>
                              <Barcode size={12} /> {h.serie}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className='info-cell'>
                        <span className='name'>
                          {h.empleado_nombre} {h.empleado_apellido}
                        </span>
                      </div>
                    </td>
                    <td className='center'>
                      {h.equipos_agrupados.length > 1 ? (
                        <span className='dash'>Varios</span>
                      ) : h.cargador === true ? (
                        <Check
                          size={16}
                          className='check-icon'
                        />
                      ) : h.cargador === false ? (
                        <span
                          className='dash'
                          style={{ fontWeight: 'bold' }}
                        >
                          NO
                        </span>
                      ) : (
                        <span className='dash'>N/A</span>
                      )}
                    </td>
                    <td className='center'>
                      {h.correo_enviado === true && (
                        <Mail
                          size={16}
                          className='mail-success'
                          title='Enviado'
                        />
                      )}
                      {h.correo_enviado === false && (
                        <AlertTriangle
                          size={16}
                          className='mail-error'
                          title='Error'
                        />
                      )}
                      {h.correo_enviado === null && (
                        <span className='dash'>-</span>
                      )}
                    </td>
                    <td className='center'>
                      <div className='actions-cell'>
                        <button
                          onClick={() => onVerPdfOriginal(h)}
                          className='action-btn view'
                          title='Ver Original'
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    </td>
                    <td className='center'>
                      <div className='actions-cell'>
                        {/* ACCIONES DE FIRMA: Si está firmado muestro 'Ver', sino, permito la subida manual */}
                        {estaFirmado ? (
                          <>
                            <button
                              onClick={() => onVerFirmado(urlFirma)}
                              className='action-btn success'
                              title='Ver Acta Firmada'
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => onInvalidar(mainId)}
                              className='action-btn delete'
                              title='Invalidar Firma'
                            >
                              <Ban size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => onSubirClick(mainId)}
                            className='btn-upload'
                          >
                            <Upload size={14} /> Subir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {historialAgrupado.length > itemsPerPage && (
        <div className='pagination-footer'>
          <div className='info'>
            Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
            <strong>
              {Math.min(indexOfLastItem, historialAgrupado.length)}
            </strong>{' '}
            de <strong>{historialAgrupado.length}</strong>
          </div>
          <div className='controls'>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className='btn-paginate'
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='btn-paginate'
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntregaTable;
