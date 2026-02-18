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
  ExternalLink,
  User,
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

  // --- ESTADOS DE PAGINACIÓN TABLA PRINCIPAL ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- ESTADOS DE PAGINACIÓN HISTORIAL (AUDITORÍA) ---
  const [currentAuditPage, setCurrentAuditPage] = useState(1);
  const itemsPerAuditPage = 3;

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

  const formatUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
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

  // --- LÓGICA DE PAGINACIÓN TABLA PRINCIPAL ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredServicios.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredServicios.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- LÓGICA DE PAGINACIÓN HISTORIAL (AUDITORÍA) ---
  const indexOfLastAuditItem = currentAuditPage * itemsPerAuditPage;
  const indexOfFirstAuditItem = indexOfLastAuditItem - itemsPerAuditPage;
  const currentAuditItems = auditoriaData.slice(
    indexOfFirstAuditItem,
    indexOfLastAuditItem,
  );
  const totalAuditPages = Math.ceil(auditoriaData.length / itemsPerAuditPage);
  const paginateAudit = (pageNumber) => setCurrentAuditPage(pageNumber);

  const exportarExcel = () => {
    if (servicios.length === 0) return toast.info('No hay datos para exportar');

    const dataParaExcel = filteredServicios.map((s) => ({
      'ID Registro': s.id,
      'Nombre del Servicio': s.nombre,
      Categoría: s.categoria_servicio || '-',
      'Descripción de Uso': s.descripcion || 'No detallada',
      'Enlace Web (URL)': s.link_servicio || '-',
      'Estado Actual': s.estado ? 'ACTIVO' : 'INACTIVO',

      'Costo Monetario': Number(s.precio),
      'Moneda de Cobro': s.moneda,
      'Frecuencia de Pago': s.frecuencia_pago,
      'Método de Pago Preferido': s.metodo_pago || '-',
      'Fecha Estimada Próximo Pago': s.fecha_proximo_pago
        ? new Date(s.fecha_proximo_pago).toLocaleDateString()
        : 'Sin fecha',

      'Total Licencias Compradas': s.licencias_totales,
      'Licencias en Uso Activo': s.licencias_usadas,
      'Licencias Disponibles (Libres)':
        s.licencias_totales - s.licencias_usadas,

      'Empresa que Paga/Factura': s.empresa_facturacion_nombre || 'No asignada',
      'Empresa Facturación (N° Tarjeta/Cuenta)':
        s.numero_tarjeta_empresa_factura || '-',
      'Empresa Facturación (CCI)': s.cci_cuenta_empresa_factura || '-',
      'Empresa que Utiliza el Servicio':
        s.empresa_usuaria_nombre || 'No asignada',
      'Empresa Usuaria (N° Tarjeta/Cuenta)':
        s.numero_tarjeta_empresa_usuaria || '-',
      'Empresa Usuaria (CCI)': s.cci_cuenta_empresa_usuaria || '-',

      'Colaborador Responsable de la Cuenta': s.responsable_nombre
        ? `${s.responsable_nombre} ${s.responsable_apellido}`
        : 'No asignado',
      'Registrado en el Sistema Por': s.creador_nombre
        ? `${s.creador_nombre} ${s.creador_apellido}`
        : 'Sistema',
      'Fecha de Registro en Sistema': s.fecha_creacion
        ? new Date(s.fecha_creacion).toLocaleString()
        : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoría_SaaS');
    XLSX.writeFile(wb, 'Reporte_Gerencial_Servicios_SaaS.xlsx');
    toast.success('Reporte gerencial generado exitosamente');
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
      setCurrentAuditPage(1); // REINICIAR LA PÁGINA DEL MODAL AL ABRIRLO
      setIsAuditModalOpen(true);
    } catch (error) {
      toast.error('Error cargando auditoría');
    }
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    fetchData();
  };

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
                <th className='center'>Link</th>
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
                      <span
                        className='audit-text'
                        title={item.descripcion}
                      >
                        {item.descripcion || 'Sin descripción'}
                      </span>
                    </div>
                  </td>

                  <td className='center'>
                    {item.link_servicio ? (
                      <a
                        href={formatUrl(item.link_servicio)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='website-link'
                        title={`Visitar ${item.link_servicio}`}
                      >
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>-</span>
                    )}
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
            <div
              className='controls'
              style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
            >
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  width: 'auto',
                }}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span
                style={{
                  fontSize: '0.9rem',
                  color: '#64748b',
                  fontWeight: '600',
                }}
              >
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  width: 'auto',
                }}
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

      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title={`Historial: ${servicioParaPago?.nombre}`}
      >
        <div className='audit-modal-content'>
          {auditoriaData.length === 0 ? (
            <p className='empty-audit'>No hay registros en el historial.</p>
          ) : (
            <>
              <ul className='audit-timeline'>
                {currentAuditItems.map((log) => (
                  <li
                    key={log.id}
                    className={
                      log.accion.includes('ANULADO') ? 'error-log' : ''
                    }
                  >
                    <div className='audit-card'>
                      <div className='log-header'>
                        <strong>{log.accion}</strong>
                        <span className='date-badge'>
                          <Clock size={12} />{' '}
                          {new Date(log.fecha).toLocaleString()}
                        </span>
                      </div>
                      <p>{log.detalle}</p>

                      <div className='log-footer-grid'>
                        <div className='footer-item'>
                          <UserCheck
                            size={14}
                            style={{ color: '#059669' }}
                          />
                          <span>
                            Resp:{' '}
                            <strong>
                              {log.resp_nombres
                                ? `${log.resp_nombres} ${log.resp_apellidos}`
                                : 'No asignado'}
                            </strong>
                          </span>
                        </div>
                        <div className='footer-item'>
                          <User
                            size={14}
                            style={{ color: '#4f46e5' }}
                          />
                          <span>
                            Por:{' '}
                            <strong>
                              {log.creador_nombres
                                ? `${log.creador_nombres} ${log.creador_apellidos}`
                                : 'Sistema'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* PAGINACIÓN INTERNA DEL MODAL DE AUDITORÍA */}
              {auditoriaData.length > itemsPerAuditPage && (
                <div
                  className='pagination-footer'
                  style={{
                    borderTop: 'none',
                    padding: '15px 5px 0 5px',
                    marginTop: '10px',
                    background: 'transparent',
                  }}
                >
                  <div
                    className='info'
                    style={{ fontSize: '0.8rem' }}
                  >
                    Mostrando <strong>{indexOfFirstAuditItem + 1}</strong> a{' '}
                    <strong>
                      {Math.min(indexOfLastAuditItem, auditoriaData.length)}
                    </strong>{' '}
                    de <strong>{auditoriaData.length}</strong>
                  </div>
                  <div
                    className='controls'
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <button
                      onClick={() => paginateAudit(currentAuditPage - 1)}
                      disabled={currentAuditPage === 1}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                      }}
                    >
                      <ChevronLeft size={14} /> Ant
                    </button>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: '#64748b',
                        fontWeight: '600',
                      }}
                    >
                      {currentAuditPage} / {totalAuditPages}
                    </span>
                    <button
                      onClick={() => paginateAudit(currentAuditPage + 1)}
                      disabled={currentAuditPage === totalAuditPages}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                      }}
                    >
                      Sig <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
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
