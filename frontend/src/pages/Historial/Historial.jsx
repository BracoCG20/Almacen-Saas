import { useEffect, useState } from 'react';
import api from '../../service/api';
import * as XLSX from 'xlsx';
import Select from 'react-select';
import {
  FileSpreadsheet,
  Search,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Laptop,
  User,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  HelpCircle,
  Barcode,
} from 'lucide-react';
import { toast } from 'react-toastify';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import './Historial.scss';

const Historial = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE FILTRO ---
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState({
    value: 'todos',
    label: 'Todos los movimientos',
  });

  // --- ESTADOS DE PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const typeOptions = [
    { value: 'todos', label: 'Todos los movimientos' },
    { value: 'entrega', label: 'Asignaciones' },
    { value: 'devolucion', label: 'Devoluciones' },
  ];

  const startHistorialTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      steps: [
        {
          element: '#tour-historial-filtros',
          popover: {
            title: 'Busca y Filtra',
            description:
              'Encuentra rápidamente el historial de un empleado específico, o filtra para ver solamente Entregas o solo Devoluciones.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-historial-tabla',
          popover: {
            title: 'Auditoría Total',
            description:
              'Aquí queda el registro inmutable. Podrás ver exactamente en qué fecha y hora se hizo el movimiento y qué administrador lo ejecutó.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-historial-estado',
          popover: {
            title: 'Estado del Equipo',
            description:
              'En el caso de las devoluciones, esta columna te indicará si el equipo regresó Operativo, Dañado o Perdido.',
            side: 'left',
            align: 'center',
          },
        },
      ],
    });
    driverObj.drive();
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
      height: '40px',
      minHeight: '40px',
      backgroundColor: 'white',
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
      fontSize: '0.85rem',
      fontWeight: '500',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      margin: '0px',
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
      padding: '8px 12px',
      fontSize: '0.85rem',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const res = await api.get('/movimientos');
        setHistorial(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Error cargando el historial');
      } finally {
        setLoading(false);
      }
    };
    fetchHistorial();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroTexto, filtroTipo]);

  const formatDuration = (intervalObj) => {
    if (!intervalObj) return '-';
    let texto = [];
    if (intervalObj.years) texto.push(`${intervalObj.years} años`);
    if (intervalObj.months) texto.push(`${intervalObj.months} meses`);
    if (intervalObj.days) texto.push(`${intervalObj.days} días`);
    if (texto.length === 0) return 'Reciente';
    return texto.join(', ');
  };

  const getBackendUrl = () => {
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:4000';
    return baseUrl;
  };

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  const historialFiltrado = historial.filter((h) => {
    const coincideTexto =
      h.empleado_nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      h.empleado_apellido?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      h.serie?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      h.modelo?.toLowerCase().includes(filtroTexto.toLowerCase());
    const coincideTipo =
      filtroTipo.value === 'todos' || h.tipo.toLowerCase() === filtroTipo.value;
    return coincideTexto && coincideTipo;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historialFiltrado.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(historialFiltrado.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // --- EXPORTAR EXCEL ---
  const exportarExcel = () => {
    if (historialFiltrado.length === 0)
      return toast.info('No hay datos para exportar');

    const dataParaExcel = historialFiltrado.map((h) => ({
      'ID Registro': h.id,
      'Fecha y Hora': new Date(h.fecha_movimiento).toLocaleString('es-PE'),
      'Tipo de Acción': h.tipo === 'entrega' ? 'ASIGNACIÓN' : 'DEVOLUCIÓN',
      'Equipo (Marca/Modelo)': `${h.marca} ${h.modelo}`,
      'N° Serie': h.serie,
      'Estado Físico Reportado': h.estado_equipo_momento || 'Operativo',
      '¿Incluyó Cargador?': h.cargador ? 'SÍ' : 'NO',
      'Tiempo de Uso':
        h.tipo === 'entrega' ? formatDuration(h.tiempo_uso) : 'N/A',
      'Colaborador Asignado': `${h.empleado_nombre} ${h.empleado_apellido}`,
      'DNI Colaborador': h.dni || '-',
      'Correo Colaborador': h.empleado_correo || '-',
      'Observaciones del Movimiento': h.observaciones || 'Ninguna',
      'Registrado Por': h.admin_nombre
        ? `${h.admin_nombre} (${h.admin_correo})`
        : 'Sistema',
      'Auditoría: Correo Enviado': h.correo_enviado ? 'SÍ' : 'NO',
      'Auditoría: Firma PDF': h.firma_valida
        ? 'VÁLIDO'
        : h.pdf_firmado_url
          ? 'SIN VALIDAR'
          : 'NO SUBIDO',
      'Enlace Documento (Acta)': h.pdf_firmado_url
        ? `${getBackendUrl()}${h.pdf_firmado_url}`
        : 'No disponible',
    }));

    const ws = XLSX.utils.json_to_sheet(dataParaExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria_Movimientos');
    XLSX.writeFile(wb, 'Reporte_Auditoria_Equipos.xlsx');
    toast.success('Reporte de Auditoría generado exitosamente');
  };

  const formatDateOnly = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading)
    return <div className='loading-state'>Cargando Historial...</div>;

  return (
    <div className='historial-container'>
      <div className='page-header'>
        <h1>Historial y Auditoría</h1>
        <div className='header-actions'>
          <button
            onClick={startHistorialTour}
            className='btn-action-header btn-tour'
          >
            <HelpCircle size={16} />
          </button>
          <button
            id='tour-historial-excel'
            onClick={exportarExcel}
            className='btn-action-header btn-excel'
          >
            <FileSpreadsheet size={16} /> Exportar
          </button>
        </div>
      </div>

      <div
        className='filters-container'
        id='tour-historial-filtros'
      >
        <div className='search-bar'>
          <Search
            size={18}
            color='#94a3b8'
          />
          <input
            type='text'
            placeholder='Buscar por empleado, serie o modelo...'
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>
        <div className='select-filter'>
          <Select
            options={typeOptions}
            value={filtroTipo}
            onChange={setFiltroTipo}
            styles={customSelectStyles}
            isSearchable={false}
          />
        </div>
      </div>

      <div
        className='table-container'
        id='tour-historial-tabla'
      >
        {currentItems.length === 0 ? (
          <div className='no-data'>
            No se encontraron registros que coincidan.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th className='center'>Tipo</th>
                <th>Equipo</th>
                <th>Colaborador</th>
                <th>Registrado Por</th>
                <th>Tiempo de Uso</th>
                <th className='center'>Estado</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((h, index) => {
                const isEntrega = h.tipo === 'entrega';
                const estLower = (h.estado_equipo_momento || '')
                  .toLowerCase()
                  .trim();
                let estadoClass = 'neutro';

                if (estLower === 'operativo') estadoClass = 'operativo';
                else if (estLower === 'inoperativo')
                  estadoClass = 'inoperativo';
                else if (
                  estLower === 'mantenimiento' ||
                  estLower === 'malogrado'
                )
                  estadoClass = 'malogrado';
                else if (estLower === 'robado' || estLower === 'perdido')
                  estadoClass = 'robado';

                return (
                  <tr key={h.id}>
                    <td>
                      <div className='date-time-cell'>
                        <span className='date-part'>
                          <CalendarDays size={13} />{' '}
                          {formatDateOnly(h.fecha_movimiento)}
                        </span>
                        <span className='time-part'>
                          <Clock size={12} />{' '}
                          {formatTimeOnly(h.fecha_movimiento)}
                        </span>
                      </div>
                    </td>
                    <td className='center'>
                      <span className={`status-badge ${h.tipo}`}>
                        {isEntrega ? (
                          <ArrowUpRight
                            size={12}
                            style={{ marginRight: '4px' }}
                          />
                        ) : (
                          <ArrowDownLeft
                            size={12}
                            style={{ marginRight: '4px' }}
                          />
                        )}
                        {isEntrega ? 'ASIGNADO' : 'DEVOLUCIÓN'}
                      </span>
                    </td>
                    <td>
                      <div className='info-cell'>
                        <span className='name'>
                          <Laptop
                            size={14}
                            style={{ color: '#64748b' }}
                          />{' '}
                          {h.marca} {h.modelo}
                        </span>
                        <span className='audit-text'>
                          <Barcode size={12} /> {h.serie}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className='info-cell'>
                        <span className='name'>
                          <User
                            size={14}
                            style={{ color: '#64748b' }}
                          />{' '}
                          {h.empleado_nombre} {h.empleado_apellido}
                        </span>
                        {h.dni && (
                          <span className='audit-text'>DNI: {h.dni}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className='audit-cell'>
                        {h.admin_nombre ? (
                          <div className='user-info'>
                            <span className='name'>
                              <ShieldCheck
                                size={14}
                                style={{ color: '#7c3aed' }}
                              />{' '}
                              {h.admin_nombre}
                            </span>
                            <span className='audit-text'>{h.admin_correo}</span>
                          </div>
                        ) : (
                          <span className='system-text'>Sistema</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {isEntrega ? (
                        <div className='info-cell'>
                          <span className='name time-use'>
                            <Clock size={12} /> {formatDuration(h.tiempo_uso)}
                          </span>
                        </div>
                      ) : (
                        <span className='dash'>-</span>
                      )}
                    </td>
                    <td
                      className='center'
                      id={index === 0 ? 'tour-historial-estado' : undefined}
                    >
                      {!isEntrega && h.estado_equipo_momento ? (
                        <span className={`status-badge-mini ${estadoClass}`}>
                          {h.estado_equipo_momento}
                        </span>
                      ) : (
                        <span className='dash'>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {historialFiltrado.length > itemsPerPage && (
          <div className='pagination-footer'>
            <div className='info'>
              Mostrando <strong>{indexOfFirstItem + 1}</strong> a{' '}
              <strong>
                {Math.min(indexOfLastItem, historialFiltrado.length)}
              </strong>{' '}
              de <strong>{historialFiltrado.length}</strong>
            </div>
            <div className='controls'>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Historial;
