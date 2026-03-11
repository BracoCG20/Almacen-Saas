import { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import {
  Plus,
  Search,
  MessageSquare,
  Ticket as TicketIcon,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import TicketForm from './TicketForm';
import TicketDetails from './TicketDetails';
import './Tickets.scss';

// Calculamos la URL base para el socket
const SOCKET_URL = api.defaults.baseURL
  ? api.defaults.baseURL.replace(/\/api\/?$/, '')
  : 'http://localhost:4000';

// COMPONENTE: CRONÓMETRO EN VIVO
const TimeCounter = ({ start, end, status }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!start) return;

    const calculateTime = () => {
      const startTime = new Date(start).getTime();
      // Si está resuelto o rechazado, usamos la fecha de cierre. Si no, usamos la hora actual (reloj en vivo)
      const endTime =
        (status === 'Resuelto' || status === 'Rechazado') && end
          ? new Date(end).getTime()
          : new Date().getTime();

      const diff = endTime - startTime;
      if (diff < 0) return setElapsed('0m');

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setElapsed(`${hours}h ${minutes}m`);
      } else {
        setElapsed(`${minutes}m`);
      }
    };

    calculateTime(); // Cálculo inicial

    // Si está en proceso, actualiza la pantalla cada 1 minuto automáticamente
    let interval;
    if (status === 'En Proceso') {
      interval = setInterval(calculateTime, 60000);
    }

    return () => clearInterval(interval);
  }, [start, end, status]);

  if (!start) return <span className='dash'>-</span>;

  return (
    <span
      className={`timer-badge ${status === 'En Proceso' ? 'live' : ''} ${status === 'Resuelto' ? 'stopped' : ''}`}
    >
      {status === 'En Proceso' && <span className='live-dot'></span>}
      {elapsed}
    </span>
  );
};

const Tickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [formData, setFormData] = useState({
    colaborador_id: '',
    tipo_solicitud: '',
    prioridad: '',
    asunto: '',
    descripcion: '',
  });

  const fetchData = async () => {
    try {
      const resTickets = await api.get('/tickets');
      setTickets(resTickets.data);
    } catch (error) {
      toast.error('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- EFECTO PARA ESCUCHAR SOCKETS (ACTUALIZACIÓN EN VIVO) ---
  useEffect(() => {
    const socket = io(SOCKET_URL);

    // Escucha cuando alguien crea un ticket nuevo
    socket.on('nuevo_ticket', () => {
      fetchData(); // Refresca la tabla en silencio
    });

    // Escucha si otro técnico toma un ticket o le cambia el estado
    socket.on('actualizacion_ticket', () => {
      fetchData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const openAddModal = () => {
    setFormData({
      colaborador_id: user?.colaborador_id || '',
      tipo_solicitud: '',
      prioridad: '',
      asunto: '',
      descripcion: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Solo validamos que haya llenado los campos de texto
    if (!formData.tipo_solicitud || !formData.asunto || !formData.descripcion) {
      return toast.warning('Completa todos los campos obligatorios');
    }

    try {
      await api.post('/tickets', formData);
      toast.success('Ticket generado exitosamente');
      setModalOpen(false);
      // fetchData() ya no es estrictamente necesario aquí si el socket avisa, pero lo dejamos por seguridad.
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al generar el ticket');
    }
  };

  const handleTomarTicket = async (ticketId) => {
    try {
      await api.put(`/tickets/${ticketId}/asignar`);
      toast.success('¡Has tomado el ticket!');
      // fetchData() también se ejecutará automáticamente gracias al socket, pero lo dejamos.
      fetchData();
    } catch (error) {
      toast.error('Error al asignar el ticket');
    }
  };

  const getPrioridadClass = (prioridad) => {
    switch (prioridad) {
      case 'Crítica':
        return 'critica';
      case 'Alta':
        return 'alta';
      case 'Media':
        return 'media';
      case 'Baja':
        return 'baja';
      default:
        return 'media';
    }
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'Resuelto':
        return 'resuelto';
      case 'En Proceso':
        return 'proceso';
      case 'Rechazado':
        return 'rechazado';
      default:
        return 'pendiente';
    }
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.solicitante_nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `TKT-${t.id}`.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // --- LÓGICA DE PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Muestra 8 tickets por página

  // Si busca algo, regresamos a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading)
    return <div className='loading-state'>Cargando Mesa de Ayuda...</div>;

  return (
    <div className='tickets-container'>
      <div className='page-header'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1>Mesa de Ayuda (Tickets)</h1>
        </div>
        <div className='header-actions'>
          <button
            className='btn-add'
            onClick={openAddModal}
          >
            <Plus size={18} /> Nuevo Ticket
          </button>
        </div>
      </div>

      <div className='filters-container'>
        <div className='search-bar'>
          <Search
            size={18}
            color='#94a3b8'
          />
          <input
            type='text'
            placeholder='Buscar por N°, Asunto o Solicitante...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className='table-container'>
        {filteredTickets.length === 0 ? (
          <div className='no-data'>No hay tickets registrados.</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Solicitante</th>
                  <th>Asunto</th>
                  <th className='center'>Prioridad</th>
                  <th className='center'>Estado</th>
                  <th className='center'>Técnico</th>
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
                        <span className='name'>
                          {t.solicitante_nombres} {t.solicitante_apellidos}
                        </span>
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
                      <span
                        className={`badge-pill est-${getEstadoClass(t.estado)}`}
                      >
                        {t.estado}
                      </span>
                    </td>
                    <td className='center'>
                      {t.asignado_nombres ? (
                        <span className='tecnico-badge'>
                          {t.asignado_nombres.split(' ')[0]}
                        </span>
                      ) : (
                        <span className='dash'>Sin asignar</span>
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
                            title='Tomar este Ticket'
                            onClick={() => handleTomarTicket(t.id)}
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                        <button
                          className='action-btn view'
                          title='Ver Detalles y Comentar'
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

            {/* CONTROLES DE PAGINACIÓN */}
            {filteredTickets.length > itemsPerPage && (
              <div className='pagination-footer'>
                <div className='info'>
                  Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
                  <strong>
                    {Math.min(indexOfLastItem, filteredTickets.length)}
                  </strong>{' '}
                  de <strong>{filteredTickets.length}</strong>
                </div>
                <div className='controls'>
                  <button
                    className='btn-paginate'
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <span className='page-text'>
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    className='btn-paginate'
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title='Generar Nuevo Ticket'
      >
        <TicketForm
          formData={formData}
          setFormData={setFormData}
          currentUser={user}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={
          selectedTicket
            ? `TKT-${selectedTicket.id} - ${selectedTicket.asunto}`
            : 'Detalles'
        }
        maxWidth='900px'
      >
        {selectedTicket && (
          <TicketDetails
            ticket={selectedTicket}
            onClose={() => setDetailsModalOpen(false)}
            onUpdate={fetchData}
          />
        )}
      </Modal>
    </div>
  );
};

export default Tickets;
