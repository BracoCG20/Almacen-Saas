//frontend/src/pages/Colaboradores/ColaboradorHistorial.jsx
import React, { useState } from 'react';
import { Clock, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import './ColaboradorHistorial.scss';

const ColaboradorHistorial = ({ historyData }) => {
  // --- 1. ESTADOS DE PAGINACIÓN ---
  // Controlo en qué página estoy y cuántos registros muestro por vista.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // --- 2. LÓGICA DE CORTE (SLICE) ---
  // Calculo los índices matemáticos para saber qué parte del arreglo (historyData) pintar en pantalla.
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  // Manejador del click para cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className='audit-modal-content'>
      {historyData.length === 0 ? (
        // Estado vacío: Si el colaborador es nuevo y no tiene cambios registrados
        <div className='empty-audit'>
          <p>No hay registros en el historial de este colaborador.</p>
        </div>
      ) : (
        <>
          {/* LÍNEA DE TIEMPO DE AUDITORÍA */}
          <ul className='audit-timeline'>
            {currentItems.map((log) => (
              <li
                key={log.id}
                // Si la acción fue darle de baja, pinto la tarjeta con estilo de alerta/error
                className={
                  log.accion_realizada.includes('BAJA') ? 'error-log' : ''
                }
              >
                <div className='audit-card'>
                  <div className='log-header'>
                    <strong>{log.accion_realizada}</strong>
                    <span className='date-badge'>
                      <Clock size={12} />{' '}
                      {new Date(log.fecha_accion).toLocaleString('es-PE')}
                    </span>
                  </div>

                  <p className='log-description'>{log.descripcion_cambio}</p>

                  <div className='log-footer-grid'>
                    <div className='footer-item'>
                      <UserCheck
                        size={14}
                        className='icon-primary'
                      />
                      <span>
                        Por:{' '}
                        <strong>
                          {/* Muestro quién hizo el cambio, si es nulo asumo que fue acción automática del sistema */}
                          {log.usuario_nombres
                            ? `${log.usuario_nombres} ${log.usuario_apellidos}`
                            : 'Sistema'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* CONTROLES DE PAGINACIÓN */}
          {/* Solo los muestro si hay más elementos de los que caben en una página */}
          {historyData.length > itemsPerPage && (
            <div className='pagination-footer'>
              <div className='info'>
                Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
                <strong>{Math.min(indexOfLastItem, historyData.length)}</strong>{' '}
                de <strong>{historyData.length}</strong>
              </div>
              <div className='controls'>
                <button
                  className='btn-paginate'
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  title='Anterior'
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  {currentPage} / {totalPages}
                </span>
                <button
                  className='btn-paginate'
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  title='Siguiente'
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ColaboradorHistorial;
