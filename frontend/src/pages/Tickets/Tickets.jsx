import { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import {
  Plus,
  Search,
  Eye,
  MessageSquare,
  Ticket as TicketIcon,
} from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import TicketForm from './TicketForm';
import './Tickets.scss';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    colaborador_id: '',
    tipo_solicitud: 'Otros',
    prioridad: 'Media',
    asunto: '',
    descripcion: '',
  });

  const fetchData = async () => {
    try {
      const [resTickets, resCol] = await Promise.all([
        api.get('/tickets'),
        api.get('/colaboradores'),
      ]);
      setTickets(resTickets.data);
      // Filtramos solo los colaboradores activos para crear tickets
      setColaboradores(resCol.data.filter((c) => c.estado === true));
    } catch (error) {
      toast.error('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setFormData({
      colaborador_id: '',
      tipo_solicitud: 'Otros',
      prioridad: 'Media',
      asunto: '',
      descripcion: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.colaborador_id || !formData.asunto || !formData.descripcion) {
      return toast.warning('Completa todos los campos obligatorios');
    }
    try {
      await api.post('/tickets', formData);
      toast.success('Ticket generado exitosamente');
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Error al generar el ticket');
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
        return 'pendiente'; // Pendiente
    }
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.asunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.solicitante_nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `TKT-${t.id}`.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Solicitante</th>
                <th>Asunto</th>
                <th className='center'>Tipo</th>
                <th className='center'>Prioridad</th>
                <th className='center'>Estado</th>
                <th className='center'>Técnico</th>
                <th className='center'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
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
                  <td style={{ maxWidth: '200px' }}>
                    <span
                      className='asunto-text'
                      title={t.asunto}
                    >
                      {t.asunto}
                    </span>
                  </td>
                  <td className='center'>
                    <span className='tipo-badge'>{t.tipo_solicitud}</span>
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
                    <div className='actions-cell'>
                      <button
                        className='action-btn view'
                        title='Ver Detalles y Comentar'
                      >
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          colaboradores={colaboradores}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Tickets;
