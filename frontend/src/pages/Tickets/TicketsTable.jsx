//frontend/src/pages/Tickets/TicketsTable.jsx
import {
  Ticket as TicketIcon,
  UserCheck,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import TimeCounter from './TimeCounter';
import './TicketsTable.scss';

const TicketsTable = ({
  filteredTickets,
  currentItems,
  user,
  handleTomarTicket,
  setSelectedTicket,
  setDetailsModalOpen,
  currentPage,
  setCurrentPage,
  totalPages,
  indexOfFirstItem,
  indexOfLastItem,
  itemsPerPage,
}) => {
  const getPrioridadClass = (p) =>
    p === 'Crítica'
      ? 'critica'
      : p === 'Alta'
        ? 'alta'
        : p === 'Baja'
          ? 'baja'
          : 'media';

  const getEstadoClass = (e) =>
    e === 'Resuelto'
      ? 'resuelto'
      : e === 'En Proceso'
        ? 'proceso'
        : e === 'Rechazado'
          ? 'rechazado'
          : 'pendiente';

  if (filteredTickets.length === 0) {
    return (
      <div className='no-data'>No se encontraron tickets registrados.</div>
    );
  }

  return (
    <div className='table-container'>
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Solicitante</th>
            <th>Asunto</th>
            <th className='center'>Prioridad</th>
            <th className='center'>Estado</th>
            <th className='center'>Encargado</th>
            <th className='center'>Tiempo</th>
            <th className='center'>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((t) => (
            <tr key={t.id}>
              <td>
                <span className='tkt-number'>
                  <TicketIcon size={14} /> TKT-{t.id}
                </span>
              </td>
              <td>
                <div className='info-cell'>
                  <span className='name'>{t.solicitante_nombres}</span>
                  <span className='audit-text'>
                    {new Date(t.fecha_creacion).toLocaleDateString()}
                  </span>
                </div>
              </td>
              <td style={{ maxWidth: '220px' }}>
                <div className='info-cell'>
                  <span
                    className='asunto-text'
                    title={t.asunto}
                  >
                    {t.asunto}
                  </span>
                  <span className='audit-text'>{t.tipo_solicitud}</span>
                </div>
              </td>
              <td className='center'>
                <span
                  className={`badge-pill prio-${getPrioridadClass(t.prioridad)}`}
                >
                  {t.prioridad}
                </span>
              </td>
              <td className='center'>
                <span className={`badge-pill est-${getEstadoClass(t.estado)}`}>
                  {t.estado}
                </span>
              </td>
              <td className='center'>
                {t.asignado_nombres ? (
                  <span className='tecnico-badge'>
                    {t.asignado_nombres.split(' ')[0]}
                  </span>
                ) : (
                  <span className='dash'>-</span>
                )}
              </td>
              <td className='center'>
                <TimeCounter
                  start={t.fecha_inicio_atencion}
                  end={t.fecha_cierre}
                  status={t.estado}
                />
              </td>
              <td className='center'>
                <div className='actions-cell'>
                  {Number(user?.rol_id) === 1 && !t.asignado_nombres && (
                    <button
                      className='action-btn assign'
                      title='Tomar Ticket'
                      onClick={() => handleTomarTicket(t.id)}
                    >
                      <UserCheck size={16} />
                    </button>
                  )}
                  <button
                    className='action-btn view'
                    title='Ver Detalles'
                    onClick={() => {
                      setSelectedTicket(t);
                      setDetailsModalOpen(true);
                    }}
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredTickets.length > itemsPerPage && (
        <div className='pagination-footer'>
          <div className='info'>
            Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
            <strong>{Math.min(indexOfLastItem, filteredTickets.length)}</strong>{' '}
            de <strong>{filteredTickets.length}</strong>
          </div>
          <div className='controls'>
            <button
              className='btn-paginate-text'
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            <span className='page-text'>
              Página {currentPage} de {totalPages}
            </span>

            <button
              className='btn-paginate-text'
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketsTable;
