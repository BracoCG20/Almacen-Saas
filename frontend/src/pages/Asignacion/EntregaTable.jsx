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
  // --- ESTADOS PARA PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // AGRUPACIÓN: Agrupa registros del mismo usuario realizados en la misma transacción (minuto exacto)
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

  // --- LÓGICA DE PAGINACIÓN ---
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
              currentItems.map((h) => (
                <tr key={h.id}>
                  <td>
                    <div className='date-time-cell'>
                      <span className='date-part'>
                        <CalendarDays size={13} />{' '}
                        {formatDateOnly(h.fecha_movimiento)}
                      </span>
                      <span className='time-part'>
                        <Clock size={12} /> {formatTimeOnly(h.fecha_movimiento)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className='info-cell'>
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
                      {h.firma_valida === true ? (
                        <>
                          <button
                            onClick={() => onVerFirmado(h.pdf_firmado_url)}
                            className='action-btn success'
                            title='Ver Acta Firmada'
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => onInvalidar(h.id)}
                            className='action-btn delete'
                            title='Invalidar Firma'
                          >
                            <Ban size={16} />
                          </button>
                        </>
                      ) : h.token_firma ? (
                        <div
                          className='status-pending-signature'
                          title='Esperando firma...'
                        >
                          <Clock
                            size={14}
                            color='#d97706'
                            className='animate-pulse'
                          />
                          <span>PENDIENTE</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onSubirClick(h.id)}
                          className='btn-upload'
                        >
                          <Upload size={14} /> Subir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- RENDERIZADO DEL FOOTER DE PAGINACIÓN --- */}
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
