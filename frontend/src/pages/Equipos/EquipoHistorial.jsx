import { useState, useEffect } from 'react';
import {
  History,
  Building2,
  Handshake,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react';
import './EquipoHistorial.scss';

const EquipoHistorial = ({ equipo, historyData }) => {
  // --- 1. ESTADOS DE PAGINACIÓN ---
  // Muestro un máximo de 3 movimientos por vista para evitar que el modal se haga infinito verticalmente.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Si cambia el equipo consultado, reseteo la paginación a la primera página por defecto.
  useEffect(() => {
    setCurrentPage(1);
  }, [equipo]);

  // --- 2. LÓGICA DE CORTE (SLICE) ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className='history-container'>
      {/* CABECERA DEL MODAL: Información del Equipo */}
      <div className='history-header'>
        <div className='big-icon'>
          <History size={22} />
        </div>
        <div className='title-info-wrapper'>
          <h3>
            {equipo?.marca} {equipo?.modelo}
          </h3>
          <span className='serial-info'>
            S/N: {equipo?.numero_serie} | Cód:{' '}
            {equipo?.codigo_patrimonial || 'N/A'}
          </span>
        </div>
      </div>

      {historyData.length === 0 ? (
        // Estado vacío
        <p className='no-history'>
          No hay movimientos registrados para este equipo.
        </p>
      ) : (
        <>
          {/* LÍNEA DE TIEMPO DE AUDITORÍA */}
          <ul className='audit-timeline'>
            {currentItems.map((hist) => (
              <li key={hist.id}>
                <div className='audit-card'>
                  {/* CABECERA DEL LOG: Título de Acción y Fecha exacta */}
                  <div className='log-header'>
                    <strong>{hist.accion_realizada}</strong>
                    <span className='date-badge'>
                      <Clock size={12} />{' '}
                      {new Date(hist.fecha_accion).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>

                  {/* CUERPO DEL LOG: Descripción detallada */}
                  {hist.descripcion_cambio && (
                    <p className='change-desc'>{hist.descripcion_cambio}</p>
                  )}

                  {/* ETIQUETAS: Destaco visualmente el estado del equipo en ese momento del tiempo */}
                  <div className='hist-details-grid'>
                    <span
                      className={`hist-tag ${hist.es_propio ? 'owned' : 'rented'}`}
                    >
                      {hist.es_propio ? (
                        <Building2 size={12} />
                      ) : (
                        <Handshake size={12} />
                      )}
                      {hist.es_propio ? 'PROPIO' : 'ALQUILADO'}
                    </span>

                    {hist.estado_fisico_nombre && (
                      <span
                        className={`status-badge ${
                          hist.estado_fisico_nombre?.toLowerCase() ===
                          'operativo'
                            ? 'operativo'
                            : 'mantenimiento'
                        }`}
                      >
                        {hist.estado_fisico_nombre}
                      </span>
                    )}

                    <span
                      className={`status-badge ${hist.disponible ? 'operativo' : 'malogrado'}`}
                    >
                      {hist.disponible ? 'DISPONIBLE' : 'INACTIVO'}
                    </span>
                  </div>

                  {/* OBSERVACIONES EXTRAS: Solo se muestran si alguien anotó un daño o detalle */}
                  {hist.observaciones_equipo && (
                    <div className='hist-observations'>
                      <AlertTriangle
                        size={14}
                        style={{ flexShrink: 0, marginTop: '2px' }}
                      />
                      <span>
                        <strong>Obs:</strong> {hist.observaciones_equipo}
                      </span>
                    </div>
                  )}

                  {/* FOOTER DEL LOG: Muestro de quién era la empresa y qué usuario registró este cambio */}
                  <div className='log-footer-grid'>
                    <div className='footer-item'>
                      <Building2
                        size={14}
                        style={{ color: '#059669' }}
                      />
                      <span>
                        Empresa:{' '}
                        <strong>
                          {hist.es_propio
                            ? hist.empresa_nombre
                            : hist.proveedor_nombre}
                        </strong>
                      </span>
                    </div>
                    <div className='footer-item'>
                      <User
                        size={14}
                        style={{ color: '#7c3aed' }}
                      />
                      <span>
                        Por:{' '}
                        <strong>
                          {hist.usuario_nombres
                            ? `${hist.usuario_nombres} ${hist.usuario_apellidos}`
                            : 'Sistema'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* CONTROLES DE PAGINACIÓN SHADCN */}
          {/* Oculto la barra de paginación si el historial es de 3 movimientos o menos */}
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

export default EquipoHistorial;
