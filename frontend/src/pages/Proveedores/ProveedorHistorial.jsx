import React, { useState } from 'react';
import {
  Clock,
  UserCheck,
  FileText,
  FileX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api from '../../service/api';
import './ProveedorHistorial.scss';

const ProveedorHistorial = ({ historyData }) => {
  // --- 1. ESTADOS DE PAGINACIÓN ---
  // Muestro un máximo de 3 registros por página para que el modal no se desborde visualmente.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // --- 2. LÓGICA DE CORTE (SLICE) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  /**
   * --- 3. MANEJO DE RUTAS DE ARCHIVOS ---
   * Esta función es a prueba de balas: verifica si el contrato está alojado en Cloudinary (nube)
   * o si viene de una ruta local, ajustando las barras (/) para evitar enlaces rotos.
   */
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
        // Estado vacío: No hay movimientos previos
        <div className='empty-audit'>
          <p>No hay registros en el historial de este proveedor.</p>
        </div>
      ) : (
        <>
          {/* --- LÍNEA DE TIEMPO DE AUDITORÍA --- */}
          <ul className='audit-timeline'>
            {currentItems.map((log) => (
              <li
                key={log.id}
                // Si la acción fue una desactivación o baja, pinto la línea de rojo para resaltarlo
                className={
                  log.accion_realizada.includes('BAJA') ||
                  log.accion_realizada.includes('INACTIVACIÓN')
                    ? 'error-log'
                    : ''
                }
              >
                <div className='audit-card'>
                  {/* Cabecera del log */}
                  <div className='log-header'>
                    <strong>{log.accion_realizada}</strong>
                    <span className='date-badge'>
                      <Clock size={12} />{' '}
                      {new Date(log.fecha_accion).toLocaleString('es-PE')}
                    </span>
                  </div>

                  {/* Descripción de los cambios realizados */}
                  <p
                    className='log-description'
                    style={{
                      marginBottom: log.cambio_contrato ? '8px' : '12px',
                    }}
                  >
                    {log.descripcion_cambio}
                  </p>

                  {/* Renderizado condicional: Si hubo un cambio en el archivo de contrato, muestro el estado del PDF */}
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

                  {/* Pie de tarjeta: ¿Quién ejecutó esta acción? */}
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

          {/* --- CONTROLES DE PAGINACIÓN SHADCN --- */}
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

export default ProveedorHistorial;
