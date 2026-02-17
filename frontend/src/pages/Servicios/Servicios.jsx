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
  Clock,
} from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import AddServicioForm from './AddServicioForm';
import PagoServicioModal from './PagoServicioModal';
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const resPerfil = await api.get('/auth/perfil');
      setUserRole(Number(resPerfil.data.rol_id));

      const resServicios = await api.get('/servicios');
      const sorted = resServicios.data.sort((a, b) => {
        if (a.estado === b.estado) return b.id - a.id;
        return a.estado === true ? -1 : 1;
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
    if (!dateString) return <span className='no-date'>-</span>;
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
    let symbol = '$';
    if (currency === 'PEN') symbol = 'S/';
    if (currency === 'EUR') symbol = '€';
    return `${symbol} ${Number(amount).toFixed(2)}`;
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
    const dataParaExcel = filteredServicios.map((s) => ({
      ID: s.id,
      Servicio: s.nombre,
      Categoría: s.categoria_servicio || '-',
      Descripción: s.descripcion || '-',
      Estado: s.estado ? 'ACTIVO' : 'INACTIVO',
      Precio: Number(s.precio),
      Moneda: s.moneda,
      Frecuencia: s.frecuencia_pago,
      'Próximo Pago': s.fecha_proximo_pago
        ? new Date(s.fecha_proximo_pago).toLocaleDateString()
        : '-',
      'Empresa Facturación': s.empresa_facturacion_nombre || '-',
      'Empresa Usuaria': s.empresa_usuaria_nombre || '-',
      'Licencias Totales': s.licencias_totales,
      'Licencias Usadas': s.licencias_usadas,
      'Licencias Libres': s.licencias_libres,
    }));
    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Servicios_SaaS');
    XLSX.writeFile(wb, 'Reporte_Servicios_SaaS.xlsx');
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
    if (!servicioToChangeStatus) return;
    try {
      await api.put(`/servicios/${servicioToChangeStatus.id}/estado`, {
        estado: newStatus,
      });
      toast.success(
        `Servicio ${newStatus ? 'activado' : 'cancelado'} exitosamente`,
      );
      fetchData();
      setIsStatusModalOpen(false);
      setServicioToChangeStatus(null);
    } catch (error) {
      toast.error('Error al cambiar el estado');
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

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    fetchData();
  };

  // --- ESTILOS CORREGIDOS DEL SELECT PARA QUE USE EL COLOR MORADO ---
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '12px',
      borderColor: state.isFocused ? '#7c3aed' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(124, 58, 237, 0.1)' : 'none',
      minHeight: '50px',
      height: '50px',
      cursor: 'pointer',
    }),
    valueContainer: (provided) => ({ ...provided, padding: '0 14px' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '500',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f3f0ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
      padding: '10px 15px',
    }),
  };

  if (loading)
    return <div className='loading-state'>Cargando servicios...</div>;

  return (
    <div className='servicios-container'>
      <div className='page-header'>
        <h1>Gestión de Servicios y Licencias</h1>
        <div className='header-actions'>
          <button
            onClick={exportarExcel}
            className='btn-action-header btn-excel'
          >
            <FileSpreadsheet size={18} /> Exportar
          </button>
          <button
            className='btn-action-header btn-add'
            onClick={handleAdd}
          >
            <Plus size={18} /> Nuevo Servicio
          </button>
        </div>
      </div>

      <div className='filters-container'>
        <div className='search-bar'>
          <Search
            size={20}
            color='#94a3b8'
          />
          <input
            type='text'
            placeholder='Buscar por Nombre o Empresa...'
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

      <div className='table-container'>
        {currentItems.length === 0 ? (
          <div className='no-data'>
            No se encontraron servicios registrados.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className='center'>Tipo</th>
                <th>Servicio</th>
                <th>Facturación</th>
                <th className='center'>Licencias</th>
                <th>Próximo Pago</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th className='center'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr
                  key={item.id}
                  className={!item.estado ? 'inactive-row' : ''}
                >
                  <td className='center'>
                    <div className='device-icon-box'>
                      {item.licencias_totales > 0 ? (
                        <Cloud size={20} />
                      ) : (
                        <Server size={20} />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span className='name'>{item.nombre}</span>
                      {/* --- AQUI CAMBIAMOS LA CATEGORIA POR LA DESCRIPCIÓN --- */}
                      <span
                        className='audit-text'
                        title={item.descripcion}
                      >
                        {item.descripcion || 'Sin descripción'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span
                        className='name'
                        style={{
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {formatMoney(item.precio, item.moneda)}
                      </span>
                      <span className='audit-text'>{item.frecuencia_pago}</span>
                    </div>
                  </td>

                  <td className='center'>
                    {item.licencias_totales > 0 ? (
                      <div className='license-badge'>
                        <strong>{item.licencias_usadas}</strong> /{' '}
                        {item.licencias_totales}
                      </div>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>-</span>
                    )}
                  </td>

                  <td>
                    <div className='email-cell'>
                      <CalendarDays size={14} />{' '}
                      {formatDate(item.fecha_proximo_pago)}
                    </div>
                  </td>

                  <td>
                    <div className='info-cell'>
                      <span
                        className='name'
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <UserCheck
                          size={14}
                          style={{ color: '#4f46e5' }}
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

                  <td>
                    <span
                      className={`status-badge ${item.estado ? 'activo' : 'cancelado'}`}
                    >
                      {item.estado ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td>
                    <div className='actions-cell'>
                      <button
                        className='action-btn'
                        style={{ color: '#3b82f6' }}
                        onClick={() => handleOpenPagos(item)}
                        title='Ver Pagos'
                      >
                        <Banknote size={18} />
                      </button>
                      <button
                        className='action-btn'
                        style={{ color: '#8b5cf6' }}
                        onClick={() => openAuditoria(item)}
                        title='Auditoría de Cambios'
                      >
                        <History size={18} />
                      </button>
                      <button
                        className='action-btn edit'
                        onClick={() => handleEdit(item)}
                        title='Editar'
                      >
                        <Edit size={18} />
                      </button>
                      {userRole === 1 &&
                        (item.estado ? (
                          <button
                            className='action-btn delete'
                            onClick={() => confirmChangeStatus(item, false)}
                            title='Cancelar'
                          >
                            <Ban size={18} />
                          </button>
                        ) : (
                          <button
                            className='action-btn activate'
                            onClick={() => confirmChangeStatus(item, true)}
                            title='Reactivar'
                          >
                            <Undo2 size={18} />
                          </button>
                        ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filteredServicios.length > 0 && (
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
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={currentPage === i + 1 ? 'active' : ''}
                  disabled={currentPage === i + 1}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={servicioToEdit ? 'Editar Servicio' : 'Registrar Nuevo Servicio'}
      >
        <AddServicioForm
          onSuccess={handleFormSuccess}
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

      {/* MODAL DE AUDITORÍA */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title={`Historial: ${servicioParaPago?.nombre}`}
      >
        <div style={{ padding: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
          {auditoriaData.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>
              No hay registros en el historial.
            </p>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
              }}
            >
              {auditoriaData.map((log) => (
                <li
                  key={log.id}
                  style={{
                    background: '#f8fafc',
                    padding: '15px',
                    borderRadius: '10px',
                    borderLeft: `4px solid ${log.accion.includes('ANULADO') ? '#ef4444' : '#4f46e5'}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '5px',
                    }}
                  >
                    <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                      {log.accion}
                    </strong>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={12} /> {new Date(log.fecha).toLocaleString()}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: '#475569',
                      margin: '5px 0',
                    }}
                  >
                    {log.detalle}
                  </p>
                  <small style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Por:{' '}
                    {log.nombres
                      ? `${log.nombres} ${log.apellidos}`
                      : 'Sistema'}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Confirmar Acción`}
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon'>
            <AlertTriangle size={40} />
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
              <X size={18} /> Cancelar
            </button>
            <button
              className={newStatus ? 'btn-confirm green' : 'btn-confirm'}
              onClick={executeChangeStatus}
            >
              <Check size={18} /> Confirmar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Servicios;
