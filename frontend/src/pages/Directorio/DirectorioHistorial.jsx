import React, { useState } from 'react';
import { Clock, UserCheck, ArrowRightLeft } from 'lucide-react';
import './DirectorioHistorial.scss';

const DirectorioHistorial = ({ historyData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getActionColor = (accion) => {
    if (accion === 'CREACION') return 'success';
    if (accion === 'BAJA') return 'danger';
    if (accion === 'REACTIVACION') return 'primary';
    return 'warning'; // EDICION
  };

  return (
    <div className='audit-modal-content'>
      {historyData.length === 0 ? (
        <div className='empty-audit'>
          <p>No hay registros de auditoría en el directorio.</p>
        </div>
      ) : (
        <>
          <ul className='audit-timeline'>
            {currentItems.map((log) => (
              <li
                key={log.id}
                className={`${getActionColor(log.accion)}-log`}
              >
                <div className='audit-card'>
                  <div className='log-header'>
                    <strong>
                      {log.accion} - {log.tipo_licencia?.replace('_', ' ')}
                    </strong>
                    <span className='date-badge'>
                      <Clock size={12} />{' '}
                      {new Date(log.fecha_registro).toLocaleString('es-PE')}
                    </span>
                  </div>

                  <p className='log-description'>
                    <strong>
                      {log.col_nombres} {log.col_apellidos}
                    </strong>
                    <br />
                    {log.detalles}
                    {log.datos_transferidos && log.dest_nombres && (
                      <span className='transfer-note'>
                        <br />
                        <ArrowRightLeft size={12} /> Datos transferidos a:{' '}
                        {log.dest_nombres} {log.dest_apellidos}
                      </span>
                    )}
                  </p>

                  <div className='log-footer-grid'>
                    <div className='footer-item'>
                      <UserCheck
                        size={14}
                        className='icon-primary'
                      />
                      <span>
                        Realizado por:{' '}
                        <strong>
                          {log.resp_nombres
                            ? `${log.resp_nombres} ${log.resp_apellidos}`
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

export default DirectorioHistorial;
