//frontend/src/pages/Tickets/Tickets.jsx
import { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import Select from 'react-select';
import { Plus, Search, HelpCircle } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import TicketForm from './TicketForm';
import TicketDetails from './TicketDetails';
import TicketsTable from './TicketsTable';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import './Tickets.scss';

const SOCKET_URL = api.defaults.baseURL
  ? api.defaults.baseURL.replace(/\/api\/?$/, '')
  : 'http://localhost:4000';

const Tickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState({
    value: 'todos',
    label: 'Todos los Tipos',
  });
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

  const opcionesTipoFiltro = [
    { value: 'todos', label: 'Todos los Tipos' },
    { value: 'Fallo de Hardware / Equipo no enciende', label: '💻 Hardware' },
    { value: 'Problemas de Red / Internet', label: '🌐 Red / Internet' },
    { value: 'Creación de Correo / Credenciales', label: '🔑 Credenciales' },
    { value: 'Instalación de Software / Licencia', label: '💿 Software' },
    { value: 'Creación de HTML Mailing', label: '✉️ Mailing' },
    { value: 'Revisión / Mantenimiento', label: '🛠️ Mantenimiento' },
    { value: 'Otros requerimientos', label: '📦 Otros' },
  ];

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'white',
      border: state.isFocused ? '1px solid #7c3aed' : '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '0px 4px',
      minHeight: '40px',
      height: '40px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
      cursor: 'pointer',
      '&:hover': { borderColor: '#7c3aed' },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '500',
      fontSize: '0.8rem',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

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

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('nuevo_ticket', () => fetchData());
    socket.on('actualizacion_ticket', () => fetchData());
    return () => socket.disconnect();
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.tipo_solicitud || !formData.asunto || !formData.descripcion) {
      return toast.warning('Completa todos los campos obligatorios');
    }
    try {
      await api.post('/tickets', formData);
      toast.success('Ticket generado exitosamente');
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al generar el ticket');
    }
  };

  const handleTomarTicket = async (ticketId) => {
    try {
      await api.put(`/tickets/${ticketId}/asignar`);
      toast.success('¡Has tomado el ticket!');
      fetchData();
    } catch (error) {
      toast.error('Error al asignar el ticket');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    // 1. Validamos si es Admin (En tu consola vimos que la variable se llama 'rol')
    // Asumiendo que el rol '1' es Admin/TI y el '2' es un Usuario normal
    const rolUsuario = user?.rol?.toString() || user?.rol_id?.toString();
    const isAdmin = rolUsuario === '1';

    // 2. Comparamos el ID del usuario logueado con el ID del usuario que creó el ticket
    const userId = user?.id?.toString();
    const ticketCreadorId = t.creador_usuario_id?.toString();

    const matchUser = isAdmin ? true : ticketCreadorId === userId;

    // Búsqueda por texto
    const matchSearch =
      t.asunto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.solicitante_nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `TKT-${t.id}`.toLowerCase().includes(searchTerm.toLowerCase());

    // Búsqueda por select
    const matchTipo =
      filtroTipo.value === 'todos' || t.tipo_solicitud === filtroTipo.value;

    return matchUser && matchSearch && matchTipo;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroTipo]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      allowClose: true,
      overlayColor: 'rgba(15, 23, 42, 0.6)',
      steps: [
        {
          element: '.filters-container',
          popover: {
            title: 'Filtros de Búsqueda',
            description:
              'Encuentra tickets escribiendo el asunto o seleccionando la categoría del problema.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '.table-container',
          popover: {
            title: 'Mesa de Ayuda',
            description:
              'Aquí verás todos los tickets. En celular, puedes deslizar hacia la derecha para ver más columnas.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '.btn-add',
          popover: {
            title: 'Crear Solicitud',
            description:
              'Haz clic aquí para enviar un nuevo requerimiento al equipo de TI.',
            side: 'left',
            align: 'start',
          },
        },
      ],
    });
    driverObj.drive();
  };

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
            className='btn-tour-page'
            onClick={startTour}
            title='Guía de uso'
          >
            <HelpCircle size={18} />
          </button>
          <button
            className='btn-add'
            onClick={() => {
              setFormData({
                colaborador_id: user?.colaborador_id || '',
                tipo_solicitud: '',
                prioridad: '',
                asunto: '',
                descripcion: '',
              });
              setModalOpen(true);
            }}
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
        <div className='select-filter'>
          <Select
            options={opcionesTipoFiltro}
            value={filtroTipo}
            onChange={setFiltroTipo}
            styles={customSelectStyles}
            isSearchable={false}
          />
        </div>
      </div>

      {/* AQUÍ LLAMAMOS A LA TABLA MODULARIZADA */}
      <TicketsTable
        filteredTickets={filteredTickets}
        currentItems={currentItems}
        user={user}
        handleTomarTicket={handleTomarTicket}
        setSelectedTicket={setSelectedTicket}
        setDetailsModalOpen={setDetailsModalOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        indexOfFirstItem={indexOfFirstItem}
        indexOfLastItem={indexOfLastItem}
        itemsPerPage={itemsPerPage}
      />

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
