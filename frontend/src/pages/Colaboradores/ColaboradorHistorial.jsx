import React, { useState } from 'react';
import { Clock, UserCheck } from 'lucide-react';
import '../Proveedores/ProveedorHistorial.scss';

const ColaboradorHistorial = ({ historyData }) => {
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
          No hay registros en el historial de este colaborador.
        </p>
      ) : (
        <>
          <ul className='audit-timeline'>
            {currentItems.map((log) => (
              <li key={log.id}>
                <div className='audit-card'>
                  <div className='log-header'>
                    <strong>{log.accion_realizada}</strong>
                    <span className='date-badge'>
                      <Clock size={12} />{' '}
                      {new Date(log.fecha_accion).toLocaleString('es-PE')}
                    </span>
                  </div>
                  <p>{log.descripcion_cambio}</p>

                  <div
                    className='log-footer-grid'
                    style={{ gridTemplateColumns: '1fr' }}
                  >
                    <div className='footer-item'>
                      <UserCheck
                        size={14}
                        style={{ color: '#4f46e5' }}
                      />
                      <span>
                        Realizado Por:{' '}
                        <strong>
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

          {historyData.length > itemsPerPage && (
            <div
              className='pagination-footer'
              style={{
                borderTop: 'none',
                padding: '15px 5px 0 5px',
                marginTop: '10px',
                background: 'transparent',
              }}
            >
              <div
                className='info'
                style={{ fontSize: '0.8rem' }}
              >
                Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
                <strong>{Math.min(indexOfLastItem, historyData.length)}</strong>{' '}
                de <strong>{historyData.length}</strong>
              </div>
              <div
                className='controls'
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}
                >
                  Ant
                </button>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: '#64748b',
                    fontWeight: '600',
                  }}
                >
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                  }}
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

export default ColaboradorHistorial;
