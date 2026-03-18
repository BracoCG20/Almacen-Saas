import React, { useState } from 'react';
import {
  History,
  Check,
  X as IconX,
  FileText,
  Upload,
  Eye,
  Ban,
  Mail,
  AlertTriangle,
  CalendarDays,
  Circle,
  Clock,
  Barcode,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './DevolucionTable.scss';

const DevolucionTable = ({
  historial,
  onVerPdf,
  onVerFirmado,
  onSubirClick,
  onInvalidar,
  onReenviarCorreo,
}) => {
  // --- 1. ESTADOS PARA PAGINACIÓN ---
  // Controlo cuántas filas muestro por página para no saturar la vista.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- 2. FORMATO DE FECHAS Y HORAS ---
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

  // --- 3. ESTILO DE ESTADOS FÍSICOS ---
  // Devuelvo la clase CSS y el ícono correspondiente según cómo nos entregaron el equipo.
  const getStatusBadge = (estado) => {
    const estLower = (estado || '').toLowerCase().trim();
    if (estLower === 'operativo')
      return { className: 'operativo', text: 'Operativo', Icon: Check };
    if (['inoperativo', 'malogrado', 'mantenimiento'].includes(estLower))
      return { className: 'mantenimiento', text: estado, Icon: IconX };
    if (['robado', 'perdido'].includes(estLower))
      return { className: 'malogrado', text: estado, Icon: IconX };
    return { className: 'desconocido', text: estado || 'Desc.', Icon: Circle };
  };

  /**
   * 4. AGRUPACIÓN DE HISTORIAL
   * Agrupo las devoluciones que ocurrieron en el mismo minuto por el mismo usuario
   * para tratarlas visualmente como un solo "paquete" o transacción.
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

  // --- 5. LÓGICA MATEMÁTICA DE PAGINACIÓN ---
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
          <History size={18} /> Últimas Devoluciones
        </h3>
      </div>

      <div className='table-responsive-wrapper'>
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Equipo(s) Devuelto(s)</th>
              <th>Usuario</th>
              <th>Motivo</th>
              <th className='center'>Estado</th>
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
                  colSpan='9'
                  className='no-data'
                >
                  No hay devoluciones registradas aún.
                </td>
              </tr>
            ) : (
              currentItems.map((h) => {
                const status = getStatusBadge(h.estado_equipo_momento);
                const StatusIcon = status.Icon;

                // VERIFICACIÓN GLOBAL DE FIRMA (Evita errores si se agrupan equipos)
                const estaFirmado = h.equipos_agrupados.some(
                  (eq) => eq.firma_valida === true,
                );
                const urlFirma = h.equipos_agrupados.find(
                  (eq) => eq.pdf_firmado_url,
                )?.pdf_firmado_url;
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
                    <td>
                      <span className='motivo-text'>
                        {h.motivo || 'No especificado'}
                      </span>
                    </td>
                    <td className='center'>
                      {h.equipos_agrupados.length > 1 ? (
                        <span className='dash'>Varios</span>
                      ) : (
                        <div className={`status-badge ${status.className}`}>
                          <StatusIcon
                            size={12}
                            style={{ marginRight: '4px' }}
                          />{' '}
                          {status.text}
                        </div>
                      )}
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
                        <button
                          onClick={() => onReenviarCorreo(h)}
                          className='btn-icon-transparent'
                          title='Reenviar Correo'
                        >
                          <AlertTriangle
                            size={16}
                            className='mail-error'
                          />
                        </button>
                      )}
                      {h.correo_enviado === null && (
                        <span className='dash'>-</span>
                      )}
                    </td>
                    <td className='center'>
                      <div className='actions-cell'>
                        <button
                          onClick={() => onVerPdf(h)}
                          className='action-btn view'
                          title='Ver Constancia'
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    </td>
                    <td className='center'>
                      <div className='actions-cell'>
                        {/* LÓGICA DE FIRMA: Siempre muestro "Subir" si no está firmado */}
                        {estaFirmado ? (
                          <>
                            <button
                              onClick={() => onVerFirmado(urlFirma)}
                              className='action-btn success'
                              title='Ver Firmado'
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => onInvalidar(mainId)}
                              className='action-btn delete'
                              title='Invalidar'
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

      {/* --- CONTROLES DE PAGINACIÓN --- */}
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

export default DevolucionTable;
