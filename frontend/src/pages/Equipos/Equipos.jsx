//frontend/src/pages/Equipos/Equipos.jsx
import {
  AlertTriangle,
  Ban,
  Barcode,
  Cable,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  FileSpreadsheet,
  History,
  Keyboard,
  Laptop,
  Monitor,
  Package,
  Plus,
  Search,
  Smartphone,
  Undo2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Select from 'react-select';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import api from '../../service/api';

import 'driver.js/dist/driver.css';

import Modal from '../../components/Modal/Modal';
import AddEquipoForm from './AddEquipoForm';
import EquipoHistorial from './EquipoHistorial';
import EquipoSpecs from './EquipoSpecs';
import './Equipos.scss';

const Equipos = () => {
  // --- 1. ESTADOS DE DATOS ---
  // Guardo todo el inventario, mi rol para permisos y controlo la pantalla de carga.
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  // --- 2. ESTADOS DE BÚSQUEDA Y FILTRADO ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondicion, setFilterCondicion] = useState({
    value: 'todos',
    label: 'Todos (Propiedad)',
  });
  const [filterCategoria, setFilterCategoria] = useState({
    value: 'todos',
    label: 'Todas las Categorías',
  });

  // --- 3. ESTADOS DE PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- 4. ESTADOS DE MODALES Y ACCIONES ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modalType, setModalType] = useState('specs'); // 'specs' | 'history' | 'form'
  const [historyData, setHistoryData] = useState([]);
  const [selectedEquipo, setSelectedEquipo] = useState(null);
  const [equipoToEdit, setEquipoToEdit] = useState(null);
  const [equipoToDelete, setEquipoToDelete] = useState(null);

  // --- Opciones Estáticas para Filtros ---
  const condicionOptions = [
    { value: 'todos', label: 'Todos (Propiedad)' },
    { value: 'propios', label: 'Propios' },
    { value: 'alquilados', label: 'Alquilados' },
  ];

  const categoriasFiltroOptions = [
    { value: 'todos', label: 'Todas las Categorías' },
    { value: 'Laptop/PC', label: 'Laptops y PCs' },
    { value: 'Celular/Tablet', label: 'Celulares y Tablets' },
    { value: 'Monitor/Pantalla', label: 'Monitores' },
    { value: 'Periférico', label: 'Periféricos' },
    { value: 'Audiovisual', label: 'Audiovisual' },
    { value: 'Redes/Cables', label: 'Redes y Cables' },
    { value: 'Otros', label: 'Otros' },
  ];

  /**
   * CARGA INICIAL
   * Traigo mi perfil de usuario y la lista completa de equipos, ordenándolos para que
   * los inactivos/dados de baja aparezcan al final.
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const resPerfil = await api.get('/auth/perfil');
      setUserRole(Number(resPerfil.data.rol_id));

      const resEquipos = await api.get('/equipos');
      const sorted = resEquipos.data.sort((a, b) => {
        if (a.disponible === b.disponible) return b.id - a.id;
        return a.disponible === false ? 1 : -1;
      });
      setEquipos(sorted);
    } catch (error) {
      toast.error('Error al cargar datos del inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Si busco algo o cambio de filtro, regreso a la página 1.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCondicion, filterCategoria]);

  // --- HELPERS DE FORMATEO ---
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const calcularAntiguedad = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const inicio = new Date(fecha);
    const ahora = new Date();
    let anios = ahora.getFullYear() - inicio.getFullYear();
    let meses = ahora.getMonth() - inicio.getMonth();
    if (meses < 0) {
      anios--;
      meses += 12;
    }
    if (anios === 0 && meses === 0) return 'Reciente';
    const partAnios =
      anios > 0 ? `${anios} ${anios === 1 ? 'año' : 'años'}` : '';
    const partMeses =
      meses > 0 ? `${meses} ${meses === 1 ? 'mes' : 'meses'}` : '';
    return [partAnios, partMeses].filter(Boolean).join(' y ');
  };

  const getCategoryIcon = (categoria) => {
    switch (categoria) {
      case 'Laptop/PC':
        return <Laptop size={18} />;
      case 'Celular/Tablet':
        return <Smartphone size={18} />;
      case 'Monitor/Pantalla':
        return <Monitor size={18} />;
      case 'Periférico':
        return <Keyboard size={18} />;
      case 'Audiovisual':
        return <Camera size={18} />;
      case 'Redes/Cables':
        return <Cable size={18} />;
      default:
        return <Package size={18} />;
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const filteredEquipos = equipos.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.marca || '').toLowerCase().includes(term) ||
      (item.modelo || '').toLowerCase().includes(term) ||
      (item.numero_serie || '').toLowerCase().includes(term) ||
      (item.codigo_patrimonial || '').toLowerCase().includes(term);

    let matchesCondicion = true;
    if (filterCondicion.value === 'propios')
      matchesCondicion = item.es_propio === true;
    else if (filterCondicion.value === 'alquilados')
      matchesCondicion = item.es_propio === false;

    let matchesCat = true;
    if (filterCategoria.value !== 'todos') {
      matchesCat = item.categoria === filterCategoria.value;
    }

    return matchesSearch && matchesCondicion && matchesCat;
  });

  // --- PAGINACIÓN ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEquipos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEquipos.length / itemsPerPage);

  /**
   * EXPORTACIÓN A EXCEL
   * Genero un reporte detallado "desempaquetando" el JSON de especificaciones técnicas.
   */
  const exportarExcel = () => {
    if (equipos.length === 0) return toast.info('No hay datos para exportar');

    const dataParaExcel = filteredEquipos.map((e) => {
      let specs = {};
      try {
        if (typeof e.especificaciones === 'string')
          specs = JSON.parse(e.especificaciones);
        else if (
          typeof e.especificaciones === 'object' &&
          e.especificaciones !== null
        )
          specs = e.especificaciones;
      } catch (error) {
        specs = {};
      }

      return {
        'ID Inventario': e.id,
        Categoría: e.categoria || 'Laptop/PC',
        'Código Patrimonial': e.codigo_patrimonial || 'No asignado',
        Marca: e.marca,
        Modelo: e.modelo,
        'Número de Serie': e.numero_serie,
        'Estado Actual': e.disponible ? 'ACTIVO' : 'BAJA',
        'Condición Física': e.estado_fisico_nombre || 'Desconocido',
        'Tipo de Propiedad': e.es_propio ? 'PROPIO' : 'ALQUILADO',
        'Empresa Propietaria': e.empresa_nombre || '-',
        Proveedor: e.nombre_proveedor || '-',
        'Fecha Adquisición': e.fecha_adquisicion
          ? formatDate(e.fecha_adquisicion)
          : '-',
        'Fecha Fin Alquiler': e.fecha_fin_alquiler
          ? formatDate(e.fecha_fin_alquiler)
          : '-',
        'Tiempo de Antigüedad': calcularAntiguedad(e.fecha_adquisicion),
        Procesador: specs.procesador || '-',
        'Memoria RAM': specs.ram || '-',
        Almacenamiento: specs.almacenamiento || '-',
        'Notas Adicionales': e.observaciones || 'Ninguna',
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, 'Reporte_Inventario.xlsx');
    toast.success('Reporte generado exitosamente');
  };

  // --- MANEJADORES DE MODALES ---
  const handleViewSpecs = (equipo) => {
    setModalType('specs');
    setSelectedEquipo(equipo);
    setIsModalOpen(true);
  };

  const handleAddEquipo = () => {
    setModalType('form');
    setEquipoToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditEquipo = (equipo) => {
    setModalType('form');
    setEquipoToEdit(equipo);
    setIsModalOpen(true);
  };

  const confirmDelete = (equipo) => {
    setEquipoToDelete(equipo);
    setIsDeleteModalOpen(true);
  };

  const handleViewHistory = async (equipo) => {
    setSelectedEquipo(equipo);
    setModalType('history');
    setHistoryData([]);
    setIsModalOpen(true);
    try {
      const res = await api.get(`/equipos/${equipo.id}/historial`);
      setHistoryData(res.data);
    } catch (error) {
      toast.error('Error al cargar historial');
    }
  };

  // --- ACCIONES CRUD ---
  const toggleDisponibilidad = async (equipo, nuevaDisponibilidad) => {
    try {
      await api.put(`/equipos/${equipo.id}/disponibilidad`, {
        disponible: nuevaDisponibilidad,
      });
      toast.success(
        `Ítem ${nuevaDisponibilidad ? 'reactivado' : 'dado de baja'}`,
      );
      fetchData();
      setIsDeleteModalOpen(false);
      setEquipoToDelete(null);
    } catch (error) {
      toast.error('Error al actualizar disponibilidad');
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
  };

  // --- ESTILOS DE SELECT ---
  const customFilterStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'white',
      border: state.isFocused ? '1px solid #155dfc' : '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '0px 4px',
      height: '40px',
      minHeight: '40px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
      cursor: 'pointer',
      '&:hover': { borderColor: '#155dfc' },
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '400',
      fontSize: '0.8rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.7rem',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#155dfc'
        : state.isFocused
          ? '#f8fafc'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
      fontSize: '0.8rem',
      padding: '7px 12px',
      borderRadius: '5px',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  if (loading)
    return <div className='loading-state'>Cargando inventario...</div>;

  return (
    <div className='equipos-container'>
      <div className='page-header'>
        <h1>Inventario General</h1>
        <div className='header-actions'>
          <button
            onClick={exportarExcel}
            className='btn-action-header btn-excel'
          >
            <FileSpreadsheet size={16} /> Exportar
          </button>
          <button
            className='btn-action-header btn-add'
            onClick={handleAddEquipo}
          >
            <Plus size={16} /> Nuevo Ítem
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className='filters-bar'>
        <div className='search-input'>
          <Search
            size={18}
            color='#94a3b8'
          />
          <input
            type='text'
            placeholder='Buscar marca, modelo, serie o código...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className='condition-filter'>
          <Select
            options={categoriasFiltroOptions}
            value={filterCategoria}
            onChange={setFilterCategoria}
            styles={customFilterStyles}
            isSearchable={false}
          />
        </div>
        <div className='condition-filter'>
          <Select
            options={condicionOptions}
            value={filterCondicion}
            onChange={setFilterCondicion}
            styles={customFilterStyles}
            isSearchable={false}
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className='table-container'>
        {currentItems.length === 0 ? (
          <div className='no-data'>
            No se encontraron registros en el inventario.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className='center'>Tipo</th>
                <th>Ítem</th>
                <th>S/N & Código</th>
                <th>Condición</th>
                <th>Adquisición</th>
                <th>Estado Físico</th>
                <th className='center'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item, index) => (
                <tr
                  key={item.id}
                  className={!item.disponible ? 'inactive-row' : ''}
                >
                  <td className='center'>
                    <div
                      className='device-icon-box'
                      title={item.categoria}
                    >
                      {getCategoryIcon(item.categoria)}
                    </div>
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span className='name'>{item.marca}</span>
                      <span className='audit-text'>{item.modelo}</span>
                    </div>
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span className='name'>
                        <Barcode size={12} />
                        <span className='name-font'>{item.numero_serie}</span>
                      </span>
                      <span className='audit-text'>
                        {item.codigo_patrimonial || 'Sin código'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span
                        className={`condicion-text ${item.es_propio ? 'propio' : 'alquilado'}`}
                      >
                        {item.es_propio ? 'PROPIO' : 'ALQUILADO'}
                      </span>
                      <span className='audit-text'>
                        {item.es_propio
                          ? item.empresa_nombre
                          : item.nombre_proveedor}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className='info-cell'>
                      <span className='date-text'>
                        <CalendarDays size={12} />{' '}
                        {calcularAntiguedad(item.fecha_adquisicion)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${item.estado_fisico_nombre?.toLowerCase() === 'operativo' ? 'operativo' : 'mantenimiento'}`}
                    >
                      {item.estado_fisico_nombre || 'Desconocido'}
                    </span>
                  </td>
                  <td className='center'>
                    <div
                      className='actions-cell'
                      id={index === 0 ? 'tour-inventario-acciones' : undefined}
                    >
                      <button
                        className='action-btn history'
                        onClick={() => handleViewHistory(item)}
                        title='Ver Historial'
                      >
                        <History size={16} />
                      </button>
                      <button
                        className='action-btn view'
                        onClick={() => handleViewSpecs(item)}
                        title='Ver Ficha'
                      >
                        <Eye size={16} />
                      </button>

                      {/* ACCIONES CRÍTICAS (Editar, Dar de Baja, Reactivar) */}
                      {item.disponible ? (
                        <>
                          <button
                            className='action-btn edit'
                            onClick={() => handleEditEquipo(item)}
                            title='Editar'
                          >
                            <Edit size={16} />
                          </button>
                          {userRole === 1 && (
                            <button
                              className='action-btn delete'
                              onClick={() => confirmDelete(item)}
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
                            onClick={() => toggleDisponibilidad(item, true)}
                            title='Reactivar'
                          >
                            <Undo2 size={16} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* PAGINACIÓN */}
        {filteredEquipos.length > itemsPerPage && (
          <div className='pagination-footer'>
            <div className='info'>
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
              <strong>
                {Math.min(indexOfLastItem, filteredEquipos.length)}
              </strong>{' '}
              de <strong>{filteredEquipos.length}</strong>
            </div>
            <div className='controls'>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className='btn-paginate'
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
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

      {/* Modal Principal Multipropósito */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalType === 'specs'
            ? 'Ficha Técnica'
            : modalType === 'history'
              ? 'Historial del Ítem'
              : equipoToEdit
                ? 'Editar Ítem'
                : 'Registrar Nuevo Ítem'
        }
      >
        {modalType === 'history' ? (
          <EquipoHistorial
            equipo={selectedEquipo}
            historyData={historyData}
          />
        ) : modalType === 'specs' ? (
          <EquipoSpecs
            equipo={selectedEquipo}
            calcularAntiguedad={calcularAntiguedad}
            formatDate={formatDate}
          />
        ) : (
          <AddEquipoForm
            onSuccess={handleFormSuccess}
            equipoToEdit={equipoToEdit}
          />
        )}
      </Modal>

      {/* Modal Confirmación de Baja */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title='Confirmar Baja'
        maxWidth='450px'
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon'>
            <AlertTriangle size={40} />
          </div>
          <h3>¿Estás seguro?</h3>
          <p>
            Estás a punto de dar de baja el ítem{' '}
            <strong>
              {equipoToDelete?.marca} {equipoToDelete?.modelo}
            </strong>{' '}
            (S/N: {equipoToDelete?.numero_serie}).
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
              onClick={() => toggleDisponibilidad(equipoToDelete, false)}
            >
              <Check size={18} /> Confirmar Baja
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Equipos;
