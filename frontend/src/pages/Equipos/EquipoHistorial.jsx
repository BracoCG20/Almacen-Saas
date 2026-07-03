//frontend/src/pages/Equipos/EquipoHistorial.jsx
import React, { useState, useEffect } from 'react';
import {
  History,
  Building2,
  Handshake,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  UserCheck,
} from 'lucide-react';
import './EquipoHistorial.scss';

const EquipoHistorial = ({ equipo, historyData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    setCurrentPage(1);
  }, [equipo]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className='history-container'>
      {/* CABECERA DEL MODAL */}
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
        <p className='no-history'>
          No hay movimientos registrados para este equipo.
        </p>
      ) : (
        <>
          <ul className='audit-timeline'>
            {currentItems.map((hist) => {
              // Limpiamos el texto genérico del Token N/A si viene del backend
              const cleanDesc = hist.descripcion_cambio
                ? hist.descripcion_cambio.replace(/Token:\s*N\/A/gi, '').trim()
                : '';

              return (
                <li key={hist.id}>
                  <div className='audit-card'>
                    {/* CABECERA DEL LOG */}
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

                    {/* CUERPO DEL LOG: Descripción y Colaborador */}
                    <div style={{ marginBottom: '12px' }}>
                      {cleanDesc && (
                        <p
                          className='change-desc'
                          style={{ margin: 0 }}
                        >
                          {cleanDesc}
                        </p>
                      )}

                      {/* Si el backend nos envía el nombre del empleado, lo mostramos explícitamente aquí */}
                      {(hist.empleado_nombre ||
                        hist.colaborador_nombre ||
                        hist.empleado_nombres) && (
                        <p
                          style={{
                            margin: '6px 0 0 0',
                            color: '#1e293b',
                            fontSize: '0.8rem',
                          }}
                        >
                          <UserCheck
                            size={14}
                            style={{
                              display: 'inline',
                              marginBottom: '-2px',
                              marginRight: '4px',
                              color: '#059669',
                            }}
                          />
                          <strong>
                            {hist.accion_realizada === 'ENTREGA' ||
                            hist.accion_realizada === 'ASIGNACIÓN'
                              ? 'Asignado a: '
                              : hist.accion_realizada === 'DEVOLUCIÓN'
                                ? 'Devuelto por: '
                                : 'Colaborador: '}
                          </strong>
                          {hist.empleado_nombre ||
                            hist.colaborador_nombre ||
                            hist.empleado_nombres}{' '}
                          {hist.empleado_apellido ||
                            hist.colaborador_apellido ||
                            hist.empleado_apellidos ||
                            ''}
                        </p>
                      )}
                    </div>

                    {/* ETIQUETAS */}
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

                    {/* OBSERVACIONES EXTRAS */}
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

                    {/* FOOTER DEL LOG */}
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
              );
            })}
          </ul>

          {/* CONTROLES DE PAGINACIÓN */}
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
