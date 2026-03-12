import { useEffect, useState } from 'react';
import api from '../../service/api';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import Select from 'react-select';
import {
  Plus,
  Edit,
  Cloud,
  CalendarDays,
  FileSpreadsheet,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Ban,
  Undo2,
  X,
  Check,
  Server,
  Banknote,
  UserCheck,
  History,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import Modal from '../../components/Modal/Modal';
import AddServicioForm from './AddServicioForm';
import PagoServicioModal from './PagoServicioModal';
import ServicioHistorial from './ServicioHistorial';
import './Servicios.scss';

const Servicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState({
    value: 'todos',
    label: 'Todas las Categorías',
  });
  const [userRole, setUserRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  const [auditoriaData, setAuditoriaData] = useState([]);
  const [servicioParaPago, setServicioParaPago] = useState(null);
  const [servicioToEdit, setServicioToEdit] = useState(null);
  const [servicioToChangeStatus, setServicioToChangeStatus] = useState(null);
  const [newStatus, setNewStatus] = useState(true);

  const categoriasOptions = [
    { value: 'todos', label: 'Todas las Categorías' },
    { value: 'Inteligencia Artificial', label: 'Inteligencia Artificial' },
    { value: 'Diseño y Multimedia', label: 'Diseño y Multimedia' },
    { value: 'Hosting y Dominios', label: 'Hosting y Dominios' },
    { value: 'Comunicaciones e IT', label: 'Comunicaciones e IT' },
    { value: 'Marketing y Analítica', label: 'Marketing y Analítica' },
    { value: 'Productividad y Gestión', label: 'Productividad y Gestión' },
    { value: 'Otros', label: 'Otros' },
  ];

  const startServiciosTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      allowClose: true,
      overlayColor: 'rgba(15, 23, 42, 0.6)',
      steps: [
        {
          element: '#tour-servicios-filtros',
          popover: {
            title: 'Busca un Servicio',
            description:
              'Escribe el nombre del software o filtra rápidamente por la categoría del producto.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-servicios-tabla',
          popover: {
            title: 'Panel de Suscripciones',
            description:
              'Controla las renovaciones. El color naranja o rojo te avisa si el pago está por vencer o vencido.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '.actions-cell',
          popover: {
            title: 'Acciones Múltiples',
            description:
              'Puedes Registrar un Pago 💵, Ver el Historial 🕒, Editar ✏️ o Dar de Baja 🚫 el servicio.',
            side: 'left',
            align: 'start',
          },
        },
      ],
    });
    driverObj.drive();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const resPerfil = await api.get('/auth/perfil');
      setUserRole(Number(resPerfil.data.rol_id));
      const currentUserId = resPerfil.data.id;

      const resServicios = await api.get('/servicios');
      const sorted = resServicios.data.sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === true ? -1 : 1;
        const aEsMio = a.usuario_id_responsable === currentUserId;
        const bEsMio = b.usuario_id_responsable === currentUserId;
        if (aEsMio && !bEsMio) return -1;
        if (!aEsMio && bEsMio) return 1;
        const fechaA = a.fecha_proximo_pago
          ? new Date(a.fecha_proximo_pago).getTime()
          : Infinity;
        const fechaB = b.fecha_proximo_pago
          ? new Date(b.fecha_proximo_pago).getTime()
          : Infinity;
        if (fechaA !== fechaB) return fechaA - fechaB;
        return b.id - a.id;
      });
      setServicios(sorted);
    } catch (error) {
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroCategoria]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(
      dateString.includes('T') ? dateString : `${dateString}T12:00:00Z`,
    );
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatMoney = (amount, currency) => {
    let symbol = currency === 'PEN' ? 'S/' : currency === 'EUR' ? '€' : '$';
    return `${symbol} ${Number(amount).toFixed(2)}`;
  };

  const formatUrl = (url) =>
    url ? (url.startsWith('http') ? url : `https://${url}`) : '#';

  const getPaymentStatusStyle = (dateString) => {
    const baseStyle = {
      padding: '4px 10px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '0.8rem',
    };
    if (!dateString)
      return {
        ...baseStyle,
        color: '#64748b',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
      };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const paymentDate = new Date(
      dateString.includes('T') ? dateString : `${dateString}T12:00:00Z`,
    );
    paymentDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        ...baseStyle,
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        border: '1px solid #fee2e2',
      };
    if (diffDays >= 0 && diffDays <= 5)
      return {
        ...baseStyle,
        backgroundColor: '#fff7ed',
        color: '#ea580c',
        border: '1px solid #ffedd5',
      };
    return {
      ...baseStyle,
      color: '#475569',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
    };
  };

  const filteredServicios = servicios.filter((item) => {
    const term = searchTerm.toLowerCase();
    const coincideTexto =
      item.nombre.toLowerCase().includes(term) ||
      (item.empresa_usuaria_nombre &&
        item.empresa_usuaria_nombre.toLowerCase().includes(term));
    const coincideCategoria =
      filtroCategoria.value === 'todos' ||
      item.categoria_servicio === filtroCategoria.value;
    return coincideTexto && coincideCategoria;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredServicios.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredServicios.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const exportarExcel = () => {
    if (servicios.length === 0) return toast.info('No hay datos para exportar');
    const dataParaExcel = filteredServicios.map((s) => ({
      Nombre: s.nombre,
      Categoría: s.categoria_servicio || '-',
      Precio: Number(s.precio),
      Estado: s.estado ? 'ACTIVO' : 'INACTIVO',
      'Próximo Pago': s.fecha_proximo_pago
        ? new Date(s.fecha_proximo_pago).toLocaleDateString()
        : '-',
    }));
    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Servicios');
    XLSX.writeFile(wb, 'Reporte_Servicios.xlsx');
  };

  const handleAdd = () => {
    setServicioToEdit(null);
    setIsFormModalOpen(true);
  };
  const handleEdit = (servicio) => {
    setServicioToEdit(servicio);
    setIsFormModalOpen(true);
  };
  const handleOpenPagos = (servicio) => {
    setServicioParaPago(servicio);
    setIsPagoModalOpen(true);
  };

  const confirmChangeStatus = (servicio, status) => {
    setServicioToChangeStatus(servicio);
    setNewStatus(status);
    setIsStatusModalOpen(true);
  };

  const executeChangeStatus = async () => {
    try {
      await api.put(`/servicios/${servicioToChangeStatus.id}/estado`, {
        estado: newStatus,
      });
      toast.success(`Servicio ${newStatus ? 'activado' : 'cancelado'}`);
      fetchData();
      setIsStatusModalOpen(false);
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const openAuditoria = async (servicio) => {
    try {
      const res = await api.get(`/servicios/${servicio.id}/auditoria`);
      setAuditoriaData(res.data);
      setServicioParaPago(servicio);
      setIsAuditModalOpen(true);
    } catch (error) {
      toast.error('Error cargando auditoría');
    }
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
      height: '40px',
      minHeight: '40px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 12px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      padding: '0px',
      height: '40px',
      color: 'transparent',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    indicatorsContainer: (provided) => ({ ...provided, height: '40px' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '500',
      fontSize: '0.85rem',
      margin: '0px',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.85rem',
      margin: '0px',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f5f3ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      fontSize: '0.85rem',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
  };

  if (loading)
    return <div className='loading-state'>Cargando servicios...</div>;

  return (
    <div className='servicios-container'>
      <div className='page-header'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1>Gestión de Servicios y Licencias</h1>
        </div>
        <div className='header-actions'>
          <button
            className='btn-tour'
            onClick={startServiciosTour}
            title='Guía Rápida'
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={exportarExcel}
            className='btn-action-header btn-excel'
          >
            <FileSpreadsheet size={16} /> Exportar
          </button>
          <button
            onClick={handleAdd}
            className='btn-action-header btn-add'
          >
            <Plus size={16} /> Nuevo Servicio
          </button>
        </div>
      </div>

      <div
        className='filters-container'
        id='tour-servicios-filtros'
      >
        <div className='search-bar'>
          <Search
            size={18}
            color='#94a3b8'
          />
          <input
            type='text'
            placeholder='Buscar por Nombre...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className='select-filter'>
          <Select
            options={categoriasOptions}
            value={filtroCategoria}
            onChange={setFiltroCategoria}
            styles={customSelectStyles}
            isSearchable={false}
          />
        </div>
      </div>

      <div
        className='table-container'
        id='tour-servicios-tabla'
      >
        {currentItems.length === 0 ? (
          <div className='no-data'>No se encontraron servicios.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className='center'>Tipo</th>
                <th>Servicio</th>
                <th className='center'>Link</th>
                <th>Facturación</th>
                <th>Próximo Pago</th>
                <th>Responsable</th>
                <th className='center'>Estado</th>
                <th className='center'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={!item.estado ? 'inactive-row' : ''}
                >
                  <td className='center'>
                    <div className='device-icon-box'>
                      {item.categoria_servicio === 'Hosting y Dominios' ? (
                        <Server size={18} />
                      ) : (
                        <Cloud size={18} />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span className='name'>{item.nombre}</span>
                      <span className='audit-text'>
                        {item.descripcion || 'Sin descripción'}
                      </span>
                    </div>
                  </td>
                  <td className='center'>
                    {item.link_servicio ? (
                      <a
                        href={formatUrl(item.link_servicio)}
                        target='_blank'
                        rel='noreferrer'
                        className='website-link'
                      >
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className='dash'>-</span>
                    )}
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span className='cost-text'>
                        {formatMoney(item.precio, item.moneda)}
                      </span>
                      <span className='audit-text'>{item.frecuencia_pago}</span>
                    </div>
                  </td>
                  <td>
                    <div
                      className='payment-pill'
                      style={getPaymentStatusStyle(item.fecha_proximo_pago)}
                    >
                      <CalendarDays size={14} />{' '}
                      {formatDate(item.fecha_proximo_pago)}
                    </div>
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span className='responsable-text'>
                        <UserCheck
                          size={14}
                          className='icon-muted'
                        />
                        {item.responsable_nombre
                          ? `${item.responsable_nombre} ${item.responsable_apellido}`
                          : 'No asignado'}
                      </span>
                      <span className='audit-text'>
                        {item.empresa_usuaria_nombre || '-'}
                      </span>
                    </div>
                  </td>
                  <td className='center'>
                    <span
                      className={`status-badge ${item.estado ? 'operativo' : 'malogrado'}`}
                    >
                      {item.estado ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className='center'>
                    <div className='actions-cell'>
                      <button
                        className='action-btn pay'
                        onClick={() => handleOpenPagos(item)}
                        title='Registrar Pago'
                      >
                        <Banknote size={16} />
                      </button>
                      <button
                        className='action-btn history'
                        onClick={() => openAuditoria(item)}
                        title='Ver Historial'
                      >
                        <History size={16} />
                      </button>
                      <button
                        className='action-btn edit'
                        onClick={() => handleEdit(item)}
                        title='Editar'
                      >
                        <Edit size={16} />
                      </button>
                      {userRole === 1 && (
                        <button
                          className={`action-btn ${item.estado ? 'delete' : 'activate'}`}
                          onClick={() =>
                            confirmChangeStatus(item, !item.estado)
                          }
                          title={item.estado ? 'Dar de baja' : 'Reactivar'}
                        >
                          {item.estado ? (
                            <Ban size={16} />
                          ) : (
                            <Undo2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filteredServicios.length > itemsPerPage && (
          <div className='pagination-footer'>
            <div className='info'>
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
              <strong>
                {Math.min(indexOfLastItem, filteredServicios.length)}
              </strong>{' '}
              de <strong>{filteredServicios.length}</strong>
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
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={servicioToEdit ? 'Editar Servicio' : 'Nuevo Servicio'}
      >
        <AddServicioForm
          onSuccess={() => {
            setIsFormModalOpen(false);
            fetchData();
          }}
          servicioToEdit={servicioToEdit}
        />
      </Modal>

      <Modal
        isOpen={isPagoModalOpen}
        onClose={() => {
          setIsPagoModalOpen(false);
          fetchData();
        }}
        title={`Control de Pagos: ${servicioParaPago?.nombre}`}
      >
        <PagoServicioModal
          servicio={servicioParaPago}
          onClose={() => setIsPagoModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title={`Historial: ${servicioParaPago?.nombre}`}
      >
        <ServicioHistorial historyData={auditoriaData} />
      </Modal>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title='Confirmar Acción'
        maxWidth='400px'
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon'>
            <AlertTriangle size={32} />
          </div>
          <h3>¿Estás seguro?</h3>
          <p>
            El servicio <strong>{servicioToChangeStatus?.nombre}</strong> pasará
            a estar <strong>{newStatus ? 'ACTIVO' : 'INACTIVO'}</strong>.
          </p>
          <div className='modal-actions'>
            <button
              className='btn-cancel'
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              className={`btn-confirm ${newStatus ? 'green' : ''}`}
              onClick={executeChangeStatus}
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Servicios;
