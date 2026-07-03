//frontend/src/pages/Colaboradores/Colaboradores.jsx
import { useEffect, useState } from 'react';
import api from '../../service/api';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import Select from 'react-select';
import {
  Plus,
  User,
  UserRound,
  MessageCircle,
  Edit,
  Ban,
  Mail,
  AlertTriangle,
  X,
  Check,
  FileSpreadsheet,
  Search,
  Undo2,
  ChevronLeft,
  ChevronRight,
  History,
  HelpCircle,
  Barcode,
} from 'lucide-react';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import Modal from '../../components/Modal/Modal';
import AddColaboradorForm from './AddColaboradorForm';
import ColaboradorHistorial from './ColaboradorHistorial';
import './Colaboradores.scss';

const Colaboradores = () => {
  // --- 1. ESTADOS DE DATOS ---
  // Aquí guardo la lista maestra del personal, las empresas (para el filtro) y mi rol para permisos.
  const [colaboradores, setColaboradores] = useState([]);
  const [empresasOptions, setEmpresasOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // --- 2. ESTADOS DE BÚSQUEDA Y FILTRADO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState({
    value: 'todas',
    label: 'Todas las Empresas',
  });

  // --- 3. ESTADOS DE PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- 4. ESTADOS DE MODALES Y ACCIONES ---
  // Controlo qué modales están abiertos y sobre qué colaborador estoy actuando.
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [colaboradorToEdit, setColaboradorToEdit] = useState(null);
  const [colaboradorToDelete, setColaboradorToDelete] = useState(null);
  const [colabToAction, setColabToAction] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  /**
   * TOUR GUIADO
   * Configuro los pasos para enseñar cómo funciona el directorio de personal.
   */
  const startColaboradoresTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      steps: [
        {
          element: '#tour-colab-filtros',
          popover: {
            title: 'Búsqueda de Personal',
            description: 'Escribe el nombre o DNI, o filtra por empresa.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-colab-tabla',
          popover: {
            title: 'Directorio Activo',
            description:
              'Aquí verás a todo el personal. Usa el ícono verde para chatear por WhatsApp.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-colab-acciones',
          popover: {
            title: 'Gestión del Empleado',
            description:
              'Ve su historial, edita sus datos o dalo de baja del sistema.',
            side: 'left',
            align: 'center',
          },
        },
        {
          element: '#tour-colab-excel',
          popover: {
            title: 'Exportar Reporte',
            description:
              'Genera un archivo Excel con la lista completa del personal.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-colab-nuevo',
          popover: {
            title: 'Nuevo Ingreso',
            description: 'Registra un colaborador antes de asignarle equipos.',
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
   * Obtengo mi rol, las empresas habilitadas y la lista de colaboradores ordenados.
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const resPerfil = await api.get('/auth/perfil');
      setUserRole(Number(resPerfil.data.rol_id));

      // Intento cargar el catálogo de empresas para el select de filtros
      try {
        const resEmpresas = await api.get('/empresas');
        const options = resEmpresas.data
          .filter((e) => e.estado === true || e.estado === 'Activo')
          .map((e) => ({ value: e.id, label: e.razon_social }));
        setEmpresasOptions([
          { value: 'todas', label: 'Todas las Empresas' },
          ...options,
        ]);
      } catch (err) {
        setEmpresasOptions([{ value: 'todas', label: 'Todas las Empresas' }]);
      }

      // Traigo al personal y ordeno: Primero los Activos, luego alfabéticamente.
      const res = await api.get('/colaboradores');
      const sorted = res.data.sort((a, b) => {
        if (a.estado === b.estado) return a.nombres.localeCompare(b.nombres);
        return a.estado ? -1 : 1;
      });
      setColaboradores(sorted);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Si escribo algo en el buscador o cambio de empresa, me regreso a la página 1 automáticamente
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEmpresa]);

  /**
   * LÓGICA DE FILTRADO Y PAGINACIÓN
   * Combino la búsqueda por texto (nombre/DNI) con el filtro del Select de Empresa.
   */
  const filteredColaboradores = colaboradores.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.nombres.toLowerCase().includes(term) ||
      c.apellidos.toLowerCase().includes(term) ||
      (c.dni && c.dni.includes(term));

    let matchesEmpresa = true;
    if (filterEmpresa.value !== 'todas') {
      matchesEmpresa = c.empresa_id === filterEmpresa.value;
    }

    return matchesSearch && matchesEmpresa;
  });

  // Corto el arreglo filtrado matemáticamente para mostrar solo la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredColaboradores.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredColaboradores.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  /**
   * EXPORTACIÓN A EXCEL
   * Armo un objeto plano con la información legible y lo descargo.
   */
  const exportarExcel = () => {
    if (colaboradores.length === 0)
      return toast.info('No hay datos para exportar');

    const dataParaExcel = filteredColaboradores.map((c) => ({
      'Estado Actual': c.estado ? 'ACTIVO' : 'INACTIVO',
      'Nombres Completos': c.nombres,
      Apellidos: c.apellidos,
      'DNI / Cédula': c.dni || '-',
      Género: c.genero === 'F' ? 'Femenino' : 'Masculino',
      'Empresa Asignada': c.empresa_nombre,
      'Cargo / Puesto': c.cargo,
      'Correo Corporativo/Personal': c.email_contacto,
      'Teléfono / Celular': c.telefono || '-',
      'Registrado Por': c.creador_nombre ? `${c.creador_nombre}` : 'Sistema',
      'Fecha de Registro': c.fecha_creacion
        ? new Date(c.fecha_creacion).toLocaleDateString('es-PE')
        : '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Directorio_Personal');
    XLSX.writeFile(wb, 'Reporte_Gerencial_Colaboradores.xlsx');
    toast.success('Reporte gerencial generado exitosamente');
  };

  // --- MANEJADORES DE MODALES Y ACCIONES CRUD ---

  const handleAdd = () => {
    setColaboradorToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (colab) => {
    setColaboradorToEdit(colab);
    setIsFormModalOpen(true);
  };

  const confirmDelete = (colab) => {
    setColaboradorToDelete(colab);
    setIsDeleteModalOpen(true);
  };

  const handleViewHistory = async (colab) => {
    setColabToAction(colab);
    setIsHistoryModalOpen(true);
    setHistoryData([]);
    try {
      const res = await api.get(`/colaboradores/${colab.id}/historial`);
      setHistoryData(res.data);
    } catch (error) {
      toast.error('Error al cargar el historial.');
    }
  };

  const executeDelete = async () => {
    if (!colaboradorToDelete) return;
    try {
      await api.delete(`/colaboradores/${colaboradorToDelete.id}`);
      toast.success('Colaborador dado de baja');
      fetchData();
      setIsDeleteModalOpen(false);
      setColaboradorToDelete(null);
    } catch (error) {
      toast.error('Error al anular colaborador');
    }
  };

  const handleActivate = async (colab) => {
    try {
      await api.put(`/colaboradores/${colab.id}/activate`);
      toast.success(`Colaborador ${colab.nombres} reactivado`);
      fetchData();
    } catch (error) {
      toast.error('Error al reactivar colaborador');
    }
  };

  // Cierro el modal y refresco la tabla si el formulario guardó con éxito
  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    fetchData();
  };

  // Estilos de Shadcn para el filtro de empresas
  const customFilterStyles = {
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
    indicatorSeparator: () => ({ display: 'none' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '500',
      fontSize: '0.8rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.8rem',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
      overflow: 'hidden',
      zIndex: 9999,
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f8fafc'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
      fontSize: '0.8rem',
      padding: '8px 12px',
    }),
  };

  if (loading)
    return <div className='loading-state'>Cargando colaboradores...</div>;

  return (
    <div className='usuarios-container'>
      <div className='page-header'>
        <h1>Directorio de Personal</h1>
        <div className='header-actions'>
          <button
            onClick={startColaboradoresTour}
            className='btn-action-header btn-tour'
          >
            <HelpCircle size={18} />
          </button>
          <button
            id='tour-colab-excel'
            onClick={exportarExcel}
            className='btn-action-header btn-excel'
          >
            <FileSpreadsheet size={16} /> Exportar
          </button>
          <button
            id='tour-colab-nuevo'
            className='btn-action-header btn-add'
            onClick={handleAdd}
          >
            <Plus size={16} /> Nuevo Colaborador
          </button>
        </div>
      </div>

      <div
        className='filters-bar'
        id='tour-colab-filtros'
      >
        <div className='search-input'>
          <Search
            size={18}
            color='#94a3b8'
          />
          <input
            type='text'
            placeholder='Buscar por Nombre o DNI...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className='condition-filter'>
          <Select
            options={empresasOptions}
            value={filterEmpresa}
            onChange={setFilterEmpresa}
            styles={customFilterStyles}
            isSearchable={true}
            placeholder='Filtrar por Empresa'
          />
        </div>
      </div>

      <div
        className='table-container'
        id='tour-colab-tabla'
      >
        {currentItems.length === 0 ? (
          <div className='no-data'>
            No se encontraron colaboradores con los filtros actuales.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className='center'>Estado</th>
                <th>DNI</th>
                <th>Colaborador</th>
                <th>Correo Electrónico</th>
                <th>Contacto</th>
                <th>Empresa</th>
                <th>Cargo</th>
                <th className='center'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((colab, index) => {
                const isWoman = colab.genero === 'F';
                return (
                  <tr
                    key={colab.id}
                    className={!colab.estado ? 'inactive-row' : ''}
                  >
                    <td className='center'>
                      <span
                        className={`status-badge ${colab.estado ? 'operativo' : 'malogrado'}`}
                      >
                        {colab.estado ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td>
                      <span className='dni-text'>
                        <Barcode size={12} /> {colab.dni}
                      </span>
                    </td>
                    <td>
                      <div className='user-avatar-cell'>
                        <div
                          className={`avatar-circle ${!colab.estado ? 'inactive' : isWoman ? 'female' : 'male'}`}
                        >
                          {isWoman ? (
                            <UserRound size={16} />
                          ) : (
                            <User size={16} />
                          )}
                        </div>
                        <div className='user-info'>
                          <span
                            className={`name ${!colab.estado ? 'inactive' : ''}`}
                          >
                            {colab.nombres} {colab.apellidos}
                          </span>
                          {colab.creador_nombre && (
                            <span className='audit-text'>
                              Reg: {colab.creador_nombre}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className='email-cell'>
                        <Mail size={14} /> {colab.email_contacto || '-'}
                      </div>
                    </td>
                    <td>
                      {colab.telefono && colab.estado ? (
                        <a
                          href={`https://wa.me/${colab.telefono.replace(/\s+/g, '')}`}
                          target='_blank'
                          rel='noreferrer'
                          className='whatsapp-btn'
                        >
                          <MessageCircle size={14} /> {colab.telefono}
                        </a>
                      ) : (
                        <span className='no-contact'>-</span>
                      )}
                    </td>
                    <td>
                      <span className='empresa-text'>
                        {colab.empresa_nombre || '-'}
                      </span>
                    </td>
                    <td>
                      {colab.cargo ? (
                        <span className='cargo-badge'>{colab.cargo}</span>
                      ) : (
                        <span className='dash'>-</span>
                      )}
                    </td>
                    <td className='center'>
                      <div
                        className='actions-cell'
                        id={index === 0 ? 'tour-colab-acciones' : undefined}
                      >
                        <button
                          className='action-btn history'
                          onClick={() => handleViewHistory(colab)}
                          title='Ver Historial'
                        >
                          <History size={16} />
                        </button>

                        {colab.estado ? (
                          <>
                            <button
                              className='action-btn edit'
                              onClick={() => handleEdit(colab)}
                              title='Editar'
                            >
                              <Edit size={16} />
                            </button>
                            {userRole === 1 && (
                              <button
                                className='action-btn delete'
                                onClick={() => confirmDelete(colab)}
                                title='Dar de baja'
                              >
                                <Ban size={16} />
                              </button>
                            )}
                          </>
                        ) : (
                          userRole === 1 && (
                            <button
                              className='action-btn activate'
                              onClick={() => handleActivate(colab)}
                              title='Reactivar'
                            >
                              <Undo2 size={16} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filteredColaboradores.length > itemsPerPage && (
          <div className='pagination-footer'>
            <div className='info'>
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
              <strong>
                {Math.min(indexOfLastItem, filteredColaboradores.length)}
              </strong>{' '}
              de <strong>{filteredColaboradores.length}</strong>
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

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={colaboradorToEdit ? 'Editar Colaborador' : 'Registrar Nuevo'}
      >
        <AddColaboradorForm
          onSuccess={handleFormSuccess}
          colaboradorToEdit={colaboradorToEdit}
        />
      </Modal>

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Historial: ${colabToAction?.nombres} ${colabToAction?.apellidos}`}
      >
        <ColaboradorHistorial historyData={historyData} />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title='Confirmar Baja'
        maxWidth='400px'
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon'>
            <AlertTriangle size={40} />
          </div>
          <h3>¿Estás seguro?</h3>
          <p>
            Estás a punto de dar de baja a{' '}
            <strong>
              {colaboradorToDelete?.nombres} {colaboradorToDelete?.apellidos}
            </strong>
            .<br />
            Pasará a estado <strong>INACTIVO</strong>.
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
              onClick={executeDelete}
            >
              <Check size={18} /> Confirmar Baja
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Colaboradores;
