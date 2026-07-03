//frontend/src/pages/Servicios/ServicioHistorial.jsx
import { useState } from 'react';
import { Clock, UserCheck, User } from 'lucide-react';
import './ServicioHistorial.scss';

const ServicioHistorial = ({ historyData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className='audit-modal-content'>
      {historyData.length === 0 ? (
        <p className='empty-audit'>
          No hay registros en el historial de este servicio.
        </p>
      ) : (
        <>
          <ul className='audit-timeline'>
            {currentItems.map((log) => (
              <li
                key={log.id}
                className={log.accion.includes('ANULADO') ? 'error-log' : ''}
              >
                <div className='audit-card'>
                  <div className='log-header'>
                    <strong>{log.accion}</strong>
                    <span className='date-badge'>
                      <Clock size={12} />{' '}
                      {new Date(log.fecha).toLocaleString('es-PE')}
                    </span>
                  </div>

                  <p className='log-description'>{log.detalle}</p>

                  <div className='log-footer-grid'>
                    <div className='footer-item'>
                      <UserCheck
                        size={14}
                        className='icon-success'
                      />
                      <span>
                        Resp:{' '}
                        <strong>
                          {log.resp_nombres
                            ? `${log.resp_nombres} ${log.resp_apellidos}`
                            : 'No asignado'}
                        </strong>
                      </span>
                    </div>
                    <div className='footer-item'>
                      <User
                        size={14}
                        className='icon-primary'
                      />
                      <span>
                        Por:{' '}
                        <strong>
                          {log.creador_nombres
                            ? `${log.creador_nombres} ${log.creador_apellidos}`
                            : 'Sistema'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {historyData.length > itemsPerPage && (
            <div className='pagination-footer'>
              <div className='info'>
                Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
                <strong>{Math.min(indexOfLastItem, historyData.length)}</strong>{' '}
                de <strong>{historyData.length}</strong>
              </div>
              <div className='controls'>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Ant
                </button>
                <span>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sig
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ServicioHistorial;
