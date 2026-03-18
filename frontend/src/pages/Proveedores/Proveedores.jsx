import { useEffect, useState } from 'react';
import api from '../../service/api';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import {
  Plus,
  Search,
  Edit,
  Building2,
  Phone,
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
  FileDown,
  History,
  HelpCircle,
} from 'lucide-react';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import Modal from '../../components/Modal/Modal';
import AddProveedorForm from './AddProveedorForm';
import ProveedorHistorial from './ProveedorHistorial';
import './Proveedores.scss';

const Proveedores = () => {
  // --- 1. ESTADOS DE DATOS ---
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 2. ESTADOS DE BÚSQUEDA Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- 3. ESTADOS DE MODALES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [providerToEdit, setProviderToEdit] = useState(null);
  const [providerToAction, setProviderToAction] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  /**
   * TOUR GUIADO
   * Muestra paso a paso cómo interactuar con el panel de proveedores.
   */
  const startProveedoresTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      steps: [
        {
          element: '#tour-prov-buscador',
          popover: {
            title: 'Búsqueda Rápida',
            description: 'Encuentra un proveedor por Razón Social o RUC.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-prov-tabla',
          popover: {
            title: 'Panel de Proveedores',
            description:
              'Descarga el contrato en PDF y revisa la cantidad de equipos que te han alquilado.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-prov-acciones',
          popover: {
            title: 'Auditoría y Edición',
            description:
              'Ve el historial de cambios, actualiza contratos o dalos de baja.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-prov-excel',
          popover: {
            title: 'Reporte Gerencial',
            description:
              'Exporta todos los datos, fechas y contactos a un Excel.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-prov-nuevo',
          popover: {
            title: 'Registrar Proveedor',
            description:
              'Agrega una nueva empresa para luego poder registrarle equipos alquilados.',
            side: 'left',
            align: 'start',
          },
        },
      ],
    });
    driverObj.drive();
  };

  /**
   * CARGA INICIAL DE DATOS
   * Solicita al backend la lista de proveedores y la ordena, poniendo a los activos primero.
   */
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

  // Si busco algo en la barra, devuelvo la paginación a la primera página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- FILTRADO Y PAGINACIÓN MATEMÁTICA ---
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

  // --- HELPERS DE URL Y FECHAS ---
  const getBackendFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:4000';
    return `${baseUrl}${path}`;
  };

  // Fuerzo la zona horaria UTC para que la fecha (ej: "2026-10-15") no se reduzca un día por diferencia horaria
  const formatLocalDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(
      isoString.includes('T') ? isoString : `${isoString}T12:00:00Z`,
    );
    return date.toLocaleDateString('es-PE');
  };

  /**
   * EXPORTACIÓN A EXCEL
   */
  const exportarExcel = () => {
    if (filtered.length === 0) return toast.info('No hay datos para exportar');

    const dataParaExcel = filtered.map((p) => ({
      'Estado Actual': p.estado ? 'ACTIVO' : 'INACTIVO',
      'Razón Social': p.razon_social,
      'Nombre Comercial': p.nombre_comercial || '-',
      RUC: p.ruc,
      'Tipo de Servicio': p.tipo_servicio || '-',
      'Equipos Alquilados (Activos)': p.total_equipos || 0,
      'Inicio de Contrato': formatLocalDate(p.fecha_inicio_contrato),
      'Fin de Contrato': formatLocalDate(p.fecha_fin_contrato),
      'Estado del Contrato': p.contrato_url ? 'DOCUMENTO SUBIDO' : 'PENDIENTE',
      'Enlace al Contrato (PDF)': p.contrato_url
        ? getBackendFileUrl(p.contrato_url)
        : '-',
      'Nombre de Contacto': p.nombre_contacto || '-',
      'Teléfono de Contacto': p.telefono_contacto || '-',
      'Correo Electrónico': p.email_contacto || '-',
      'Sitio Web': p.sitio_web || '-',
      'Dirección Exacta': p.direccion || '-',
      Distrito: p.distrito || '-',
      Provincia: p.provincia || '-',
      Departamento: p.departamento || '-',
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

  // --- MANEJADORES DE MODALES Y ACCIONES CRUD ---

  const handleAdd = () => {
    setProviderToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (prov) => {
    setProviderToEdit(prov);
    setIsModalOpen(true);
  };

  const handleViewHistory = async (prov) => {
    setProviderToAction(prov);
    setIsHistoryModalOpen(true);
    setHistoryData([]);
    try {
      const res = await api.get(`/proveedores/${prov.id}/historial`);
      setHistoryData(res.data);
    } catch (error) {
      toast.error('Error al cargar el historial del proveedor.');
    }
  };

  const confirmDeactivate = (prov) => {
    setProviderToAction(prov);
    setIsDeleteModalOpen(true);
  };

  const handleToggleEstado = async (estado) => {
    try {
      await api.put(`/proveedores/${providerToAction.id}/estado`, { estado });
      toast.success(
        `Proveedor ${estado ? 'reactivado' : 'desactivado'} exitosamente.`,
      );
      setIsDeleteModalOpen(false);
      fetchProveedores();
    } catch (error) {
      toast.error('Error al cambiar el estado del proveedor.');
    }
  };

  // Se ejecuta desde dentro del AddProveedorForm cuando se guarda exitosamente
  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchProveedores();
  };

  if (loading)
    return <div className='loading-state'>Cargando proveedores...</div>;

  return (
    <div className='proveedores-container'>
      <div className='page-header'>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          Gestión de Proveedores
        </h1>
        <div className='header-actions'>
          <button
            onClick={startProveedoresTour}
            className='btn-action-header btn-tour'
          >
            <HelpCircle size={18} />
          </button>
          <button
            id='tour-prov-excel'
            className='btn-action-header btn-excel'
            onClick={exportarExcel}
          >
            <FileSpreadsheet size={18} /> Exportar
          </button>
          <button
            id='tour-prov-nuevo'
            className='btn-action-header btn-add'
            onClick={handleAdd}
          >
            <Plus size={18} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      <div
        className='search-bar'
        id='tour-prov-buscador'
      >
        <Search
          size={18}
          color='#94a3b8'
        />
        <input
          placeholder='Buscar por Razón Social o RUC...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div
        className='table-container'
        id='tour-prov-tabla'
      >
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
                <th className='center'>Contrato</th>
                <th className='center'>Equipos</th>
                <th className='center'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((prov, index) => (
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
                        <Building2 size={16} />
                      </div>
                      <div className='user-info'>
                        <span
                          className={`name ${!prov.estado ? 'inactive' : ''}`}
                        >
                          {prov.razon_social}
                        </span>
                        <span className='audit-text'>
                          <MapPin size={12} />{' '}
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
                        <Phone size={14} /> {prov.telefono_contacto}
                      </div>
                    ) : (
                      <span className='dash'>-</span>
                    )}
                  </td>
                  <td>
                    {prov.email_contacto ? (
                      <div className='email-cell'>
                        <Mail size={14} /> {prov.email_contacto}
                      </div>
                    ) : (
                      <span className='dash'>-</span>
                    )}
                  </td>
                  <td className='center'>
                    {/* Si tiene contrato adjunto, permito descargarlo directamente */}
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
                      <span className='dash'>-</span>
                    )}
                  </td>
                  <td className='center'>
                    <div className='equipos-badge'>
                      <Laptop size={14} /> {prov.total_equipos || 0}
                    </div>
                  </td>
                  <td className='center'>
                    <div
                      className='actions-cell'
                      id={index === 0 ? 'tour-prov-acciones' : undefined}
                    >
                      <button
                        className='action-btn history'
                        onClick={() => handleViewHistory(prov)}
                        title='Ver Historial'
                      >
                        <History size={16} />
                      </button>

                      {/* Si está activo permito editar o suspender. Si está inactivo, solo puedo reactivarlo. */}
                      {prov.estado ? (
                        <>
                          <button
                            className='action-btn edit'
                            onClick={() => handleEdit(prov)}
                            title='Editar'
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className='action-btn delete'
                            onClick={() => confirmDeactivate(prov)}
                            title='Dar de baja'
                          >
                            <Ban size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          className='action-btn activate'
                          onClick={() => {
                            setProviderToAction(prov);
                            handleToggleEstado(true);
                          }}
                          title='Reactivar'
                        >
                          <Undo2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filtered.length > itemsPerPage && (
          <div className='pagination-footer'>
            <div className='info'>
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
              <strong>{Math.min(indexOfLastItem, filtered.length)}</strong> de{' '}
              <strong>{filtered.length}</strong>
            </div>
            <div className='controls'>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className='btn-paginate'
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className='btn-paginate'
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALES --- */}

      {/* Modal Principal: Add/Edit */}
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

      {/* Modal de Auditoría */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Historial: ${providerToAction?.razon_social}`}
      >
        <ProveedorHistorial historyData={historyData} />
      </Modal>

      {/* Modal Confirmación Crítica (Baja) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title='Confirmar Acción'
        maxWidth='450px'
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon'>
            <AlertTriangle size={32} />
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
              <X size={16} /> Cancelar
            </button>
            <button
              className='btn-confirm'
              onClick={() => handleToggleEstado(false)}
            >
              <Check size={16} /> Confirmar Baja
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Proveedores;
