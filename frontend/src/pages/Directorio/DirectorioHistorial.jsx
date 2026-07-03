//frontend/src/pages/Directorio/DirectorioHistorial.jsx
import { useState } from 'react';
import {
  Clock,
  UserCheck,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './DirectorioHistorial.scss';

const DirectorioHistorial = ({ historyData }) => {
  // --- 1. ESTADOS DE PAGINACIÓN ---
  // Controlo en qué página estoy y limito a 4 registros por vista para no saturar el modal.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // --- 2. LÓGICA DE CORTE (SLICE) ---
  // Calculo los índices matemáticos para extraer solo la porción del historial que toca pintar ahora mismo.
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  // Manejador para saltar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- 3. ESTILOS DINÁMICOS ---
  // Asigno un color representativo a la viñeta de la línea de tiempo dependiendo de la acción realizada.
  const getActionColor = (accion) => {
    if (accion === 'CREACION') return 'success';
    if (accion === 'BAJA') return 'danger';
    if (accion === 'REACTIVACION') return 'primary';
    return 'warning';
  };

  return (
    <div className='audit-modal-content'>
      {historyData.length === 0 ? (
        // Estado vacío: Si no hay historial para esta cuenta en particular
        <div className='empty-audit'>
          <p>No hay registros de auditoría en el directorio.</p>
        </div>
      ) : (
        <>
          {/* LÍNEA DE TIEMPO DE AUDITORÍA */}
          <ul className='audit-timeline'>
            {currentItems.map((log) => (
              <li
                key={log.id}
                className={`${getActionColor(log.accion)}-log`}
              >
                <div className='audit-card'>
                  {/* Cabecera del Log: Qué se hizo y cuándo */}
                  <div className='log-header'>
                    <strong>
                      {log.accion} - {log.tipo_licencia?.replace('_', ' ')}
                    </strong>
                    <span className='date-badge'>
                      <Clock size={12} />{' '}
                      {new Date(log.fecha_registro).toLocaleString('es-PE')}
                    </span>
                  </div>

                  {/* Cuerpo del Log: A quién afectó y los detalles */}
                  <p className='log-description'>
                    <strong>
                      {log.col_nombres} {log.col_apellidos}
                    </strong>
                    <br />
                    {log.detalles}

                    {/* Renderizado condicional: Si hubo una transferencia de Drive/Correos al dar de baja, lo indico aquí */}
                    {log.datos_transferidos && log.dest_nombres && (
                      <span className='transfer-note'>
                        <br />
                        <ArrowRightLeft size={12} /> Datos transferidos a:{' '}
                        {log.dest_nombres} {log.dest_apellidos}
                      </span>
                    )}
                  </p>

                  {/* Pie del Log: Quién apretó el botón */}
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

          {/* CONTROLES DE PAGINACIÓN */}
          {/* Solo aparecen si hay más de una página de registros */}
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

export default DirectorioHistorial;
