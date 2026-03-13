import React, { useState } from 'react';
import { Clock, UserCheck, FileText, FileX } from 'lucide-react';
import api from '../../service/api';
import './ProveedorHistorial.scss';

const ProveedorHistorial = ({ historyData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- CORRECCIÓN A PRUEBA DE BALAS ---
  const getBackendFileUrl = (path) => {
    if (!path) return null;

    // Si el string contiene 'cloudinary' o 'http', es de la nube
    if (path.includes('cloudinary.com') || path.includes('http')) {
      // Si por error se guardó como "/https://...", le quitamos el "/" inicial
      return path.startsWith('/') ? path.substring(1) : path;
    }

    // Si es un archivo antiguo que sí está en el disco local
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:4000';

    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  };

  return (
    <div className='audit-modal-content'>
      {historyData.length === 0 ? (
        <div className='empty-audit'>
          <p>No hay registros en el historial de este proveedor.</p>
        </div>
      ) : (
        <>
          <ul className='audit-timeline'>
            {currentItems.map((log) => (
              <li
                key={log.id}
                className={
                  log.accion_realizada.includes('BAJA') ||
                  log.accion_realizada.includes('INACTIVACIÓN')
                    ? 'error-log'
                    : ''
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

                  <p
                    className='log-description'
                    style={{
                      marginBottom: log.cambio_contrato ? '8px' : '12px',
                    }}
                  >
                    {log.descripcion_cambio}
                  </p>

                  {log.cambio_contrato && (
                    <div className='contract-status-container'>
                      {log.archivo_contrato_url ? (
                        <a
                          href={getBackendFileUrl(log.archivo_contrato_url)}
                          target='_blank'
                          rel='noreferrer'
                          className='contract-badge added'
                        >
                          <FileText size={14} /> Ver Contrato Adjuntado
                        </a>
                      ) : (
                        <span className='contract-badge removed'>
                          <FileX size={14} /> Contrato Eliminado
                        </span>
                      )}
                    </div>
                  )}

                  <div className='log-footer-grid'>
                    <div className='footer-item'>
                      <UserCheck
                        size={14}
                        className='icon-primary'
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

export default ProveedorHistorial;
