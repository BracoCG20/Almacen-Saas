import { useState, useEffect } from 'react';
import api from '../../service/api';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import {
  Plus,
  Search,
  Edit,
  Building2,
  Phone,
  Truck,
  Undo2,
  Mail,
  MapPin,
  AlertTriangle,
  X,
  Check,
  FileSpreadsheet,
  Ban,
  Laptop,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileDown,
} from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import AddProveedorForm from './AddProveedorForm';
import './Proveedores.scss';

const Proveedores = () => {
  // --- ESTADOS PRINCIPALES ---
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- ESTADOS DE PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- ESTADOS DE MODALES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState(null);
  const [providerToAction, setProviderToAction] = useState(null);

  // --- FETCH DE DATOS ---
  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const res = await api.get('/proveedores');
      const sorted = res.data.sort((a, b) => {
        if (a.estado === b.estado)
          return a.razon_social.localeCompare(b.razon_social);
        return a.estado ? -1 : 1;
      });
      setProveedores(sorted);
    } catch (error) {
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  // Reiniciar paginación al buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  const filtered = proveedores.filter(
    (p) =>
      p.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ruc.includes(searchTerm),
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- RUTAS DE ENLACES ---
  const formatUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const getBackendFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000';
    return `${baseUrl}${path}`;
  };

  const formatLocalDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(
      isoString.includes('T') ? isoString : `${isoString}T12:00:00Z`,
    );
    return date.toLocaleDateString('es-PE');
  };

  // --- EXPORTAR EXCEL DETALLADO GERENCIAL ---
  const exportarExcel = () => {
    if (proveedores.length === 0)
      return toast.info('No hay datos para exportar');

    const dataParaExcel = filtered.map((p) => ({
      'Estado Actual': p.estado ? 'ACTIVO' : 'INACTIVO',
      'Razón Social': p.razon_social,
      'Nombre Comercial': p.nombre_comercial || '-',
      RUC: p.ruc,
      'Tipo de Servicio': p.tipo_servicio || '-',

      // Cantidades
      'Equipos Alquilados (Activos)': p.total_equipos || 0,

      // Datos del Contrato
      'Inicio de Contrato': formatLocalDate(p.fecha_inicio_contrato),
      'Fin de Contrato': formatLocalDate(p.fecha_fin_contrato),
      'Estado del Contrato': p.contrato_url ? 'DOCUMENTO SUBIDO' : 'PENDIENTE',
      'Enlace al Contrato (PDF)': p.contrato_url
        ? getBackendFileUrl(p.contrato_url)
        : '-',

      // Contacto y Web
      'Nombre de Contacto': p.nombre_contacto || '-',
      'Teléfono de Contacto': p.telefono_contacto || '-',
      'Correo Electrónico': p.email_contacto || '-',
      'Sitio Web': p.sitio_web || '-',

      // Ubicación
      'Dirección Exacta': p.direccion || '-',
      Distrito: p.distrito || '-',
      Provincia: p.provincia || '-',
      Departamento: p.departamento || '-',

      // Auditoría
      'Registrado Por': p.creador_nombre
        ? `${p.creador_nombre} ${p.creador_apellido}`
        : 'Sistema',
      'Fecha de Registro': p.fecha_creacion
        ? new Date(p.fecha_creacion).toLocaleString('es-PE')
        : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Proveedores');
    XLSX.writeFile(wb, 'Reporte_Gerencial_Proveedores.xlsx');
    toast.success('Reporte gerencial generado exitosamente');
  };

  // --- ACCIONES ---
  const handleAdd = () => {
    setProviderToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (prov) => {
    setProviderToEdit(prov);
    setIsModalOpen(true);
  };

  const confirmDeactivate = (prov) => {
    setProviderToAction(prov);
    setIsDeleteModalOpen(true);
  };

  const handleDeactivate = async () => {
    try {
      await api.delete(`/proveedores/${providerToAction.id}`);
      toast.success('Proveedor desactivado');
      setIsDeleteModalOpen(false);
      fetchProveedores();
    } catch (error) {
      toast.error('Error al desactivar');
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.put(`/proveedores/${id}/activate`);
      toast.success('Proveedor reactivado ✅');
      fetchProveedores();
    } catch (error) {
      toast.error('Error al activar');
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchProveedores();
  };

  if (loading) return <div className='loading-state'>Cargando...</div>;

  return (
    <div className='proveedores-container'>
      <div className='page-header'>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Truck size={28} /> Gestión de Proveedores
        </h1>
        <div className='header-actions'>
          <button
            className='btn-action-header btn-excel'
            onClick={exportarExcel}
          >
            <FileSpreadsheet size={18} /> Exportar Excel
          </button>
          <button
            className='btn-action-header btn-add'
            onClick={handleAdd}
          >
            <Plus size={18} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className='search-bar'>
        <Search
          size={20}
          color='#94a3b8'
        />
        <input
          placeholder='Buscar por Razón Social o RUC...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className='table-container'>
        {currentItems.length === 0 ? (
          <div className='no-data'>No se encontraron proveedores.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className='center'>Estado</th>
                <th>Empresa / Razón Social</th>
                <th>RUC</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th className='center'>Web</th>
                <th className='center'>Contrato</th>
                <th className='center'>Equipos</th>
                <th className='center'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((prov) => (
                <tr
                  key={prov.id}
                  className={!prov.estado ? 'inactive-row' : ''}
                >
                  <td className='center'>
                    <span
                      className={`status-badge ${prov.estado ? 'operativo' : 'malogrado'}`}
                    >
                      {prov.estado ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td>
                    <div className='user-avatar-cell'>
                      <div
                        className={`avatar-circle ${prov.estado ? 'male' : 'inactive'}`}
                      >
                        <Building2 size={18} />
                      </div>
                      <div className='user-info'>
                        <span
                          className={`name ${!prov.estado ? 'inactive' : ''}`}
                        >
                          {prov.razon_social}
                        </span>
                        <span
                          className='audit-text'
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <MapPin size={10} />
                          {prov.direccion || 'Sin dirección'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className='dni-text'>{prov.ruc}</span>
                  </td>
                  <td>
                    <span className='empresa-text'>
                      {prov.nombre_contacto || '-'}
                    </span>
                  </td>
                  <td>
                    {prov.telefono_contacto ? (
                      <div className='email-cell'>
                        <Phone size={12} /> {prov.telefono_contacto}
                      </div>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>-</span>
                    )}
                  </td>
                  <td>
                    {prov.email_contacto ? (
                      <div className='email-cell'>
                        <Mail size={12} /> {prov.email_contacto}
                      </div>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>-</span>
                    )}
                  </td>
                  <td className='center'>
                    {prov.sitio_web ? (
                      <a
                        href={formatUrl(prov.sitio_web)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='website-link'
                        title={`Visitar ${prov.sitio_web}`}
                      >
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>-</span>
                    )}
                  </td>
                  <td className='center'>
                    {prov.contrato_url ? (
                      <a
                        href={getBackendFileUrl(prov.contrato_url)}
                        target='_blank'
                        rel='noopener noreferrer'
                        download
                        className='contract-link'
                        title='Descargar Contrato'
                      >
                        <FileDown size={16} />
                      </a>
                    ) : (
                      <span style={{ color: '#cbd5e1' }}>-</span>
                    )}
                  </td>
                  <td className='center'>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '20px',
                        fontWeight: '700',
                        color: '#374151',
                        fontSize: '0.85rem',
                      }}
                    >
                      <Laptop
                        size={12}
                        color='#6b7280'
                      />
                      {prov.total_equipos || 0}
                    </div>
                  </td>
                  <td>
                    <div className='actions-cell'>
                      {prov.estado ? (
                        <>
                          <button
                            className='action-btn edit'
                            onClick={() => handleEdit(prov)}
                            title='Editar'
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            className='action-btn delete'
                            onClick={() => confirmDeactivate(prov)}
                            title='Dar de baja'
                          >
                            <Ban size={18} />
                          </button>
                        </>
                      ) : (
                        <button
                          className='action-btn activate'
                          onClick={() => handleActivate(prov.id)}
                          title='Reactivar'
                        >
                          <Undo2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtered.length > 0 && (
          <div className='pagination-footer'>
            <div className='info'>
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
              <strong>{Math.min(indexOfLastItem, filtered.length)}</strong> de{' '}
              <strong>{filtered.length}</strong>
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={providerToEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      >
        <AddProveedorForm
          onSuccess={handleFormSuccess}
          providerToEdit={providerToEdit}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title='Confirmar Acción'
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon'>
            <AlertTriangle size={40} />
          </div>
          <h3>¿Desactivar Proveedor?</h3>
          <p>
            Estás a punto de dar de baja a{' '}
            <strong>{providerToAction?.razon_social}</strong>.<br />
            Ya no aparecerá en la selección de nuevos equipos.
          </p>
          <div className='modal-actions'>
            <button
              className='btn-cancel'
              onClick={() => setIsDeleteModalOpen(false)}
            >
              <X size={18} /> Cancelar
            </button>
            <button
              className='btn-confirm'
              onClick={handleDeactivate}
            >
              <Check size={18} /> Confirmar Baja
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Proveedores;
