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
  Layers,
} from 'lucide-react';
import { toast } from 'react-toastify';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import './Historial.scss';

const Historial = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState({
    value: 'todos',
    label: 'Todos los movimientos',
  });

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
            description: 'Encuentra rápidamente el historial o filtra.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-historial-tabla',
          popover: {
            title: 'Auditoría Total',
            description: 'Aquí queda el registro inmutable.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-historial-estado',
          popover: {
            title: 'Estado del Equipo',
            description: 'Si el equipo regresó Operativo, Dañado o Perdido.',
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
    if (texto.length === 0) return 'Recientes';
    return texto.join(', ');
  };

  const getBackendUrl = (path) => {
    if (!path) return 'No disponible';
    if (path.includes('cloudinary.com') || path.includes('http'))
      return path.startsWith('/') ? path.substring(1) : path;
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:4000';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  };

  const formatDateOnly = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeOnly = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEstadoClass = (estado) => {
    const estLower = (estado || '').toLowerCase().trim();
    if (estLower === 'operativo') return 'operativo';
    if (estLower === 'inoperativo') return 'inoperativo';
    if (estLower === 'mantenimiento' || estLower === 'malogrado')
      return 'malogrado';
    if (estLower === 'robado' || estLower === 'perdido') return 'robado';
    return 'neutro';
  };

  const historialAgrupadoCrudo = Object.values(
    historial.reduce((acc, h) => {
      const key = `${h.tipo}-${h.empleado_id}-${h.fecha_movimiento.substring(0, 16)}`;
      if (!acc[key]) acc[key] = { ...h, equipos_agrupados: [h] };
      else acc[key].equipos_agrupados.push(h);
      return acc;
    }, {}),
  ).sort((a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento));

  const historialFiltrado = historialAgrupadoCrudo.filter((h) => {
    const coincideTexto = h.equipos_agrupados.some(
      (eq) =>
        eq.empleado_nombre?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        eq.empleado_apellido
          ?.toLowerCase()
          .includes(filtroTexto.toLowerCase()) ||
        eq.serie?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        eq.modelo?.toLowerCase().includes(filtroTexto.toLowerCase()),
    );
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

  const exportarExcel = () => {
    if (historialFiltrado.length === 0)
      return toast.info('No hay datos para exportar');

    const dataPlana = [];
    historialFiltrado.forEach((h) => {
      h.equipos_agrupados.forEach((eq) => {
        dataPlana.push({
          'ID Registro': eq.id,
          'Fecha y Hora': new Date(eq.fecha_movimiento).toLocaleString('es-PE'),
          'Tipo de Acción': eq.tipo === 'entrega' ? 'ASIGNACIÓN' : 'DEVOLUCIÓN',
          'Equipo (Marca/Modelo)': `${eq.marca} ${eq.modelo}`,
          'N° Serie': eq.serie,
          'Estado Físico Reportado': eq.estado_equipo_momento || 'Operativo',
          '¿Incluyó Cargador?': eq.cargador ? 'SÍ' : 'NO',
          'Tiempo de Uso':
            eq.tipo === 'entrega' ? formatDuration(eq.tiempo_uso) : 'N/A',
          'Colaborador Asignado': `${eq.empleado_nombre} ${eq.empleado_apellido}`,
          'DNI Colaborador': eq.dni || '-',
          Observaciones: eq.observaciones || 'Ninguna',
          'Registrado Por': eq.admin_nombre
            ? `${eq.admin_nombre} (${eq.admin_correo})`
            : 'Sistema',
          'Auditoría: Correo Enviado': eq.correo_enviado ? 'SÍ' : 'NO',
          'Enlace Documento (Acta)': getBackendUrl(eq.pdf_firmado_url),
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(dataPlana);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria_Movimientos');
    XLSX.writeFile(wb, 'Reporte_Auditoria_Equipos.xlsx');
    toast.success('Reporte generado exitosamente');
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
        <div className='table-responsive-wrapper'>
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
                  <th>Equipo(s)</th>
                  <th>Colaborador</th>
                  <th>Registrado Por</th>
                  <th>Tiempo de Uso</th>
                  <th className='center'>Estado</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((h, index) => {
                  const isEntrega = h.tipo === 'entrega';
                  const isMultiple = h.equipos_agrupados.length > 1;

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
                              className='icon-status'
                              size={12}
                            />
                          ) : (
                            <ArrowDownLeft
                              className='icon-status'
                              size={12}
                            />
                          )}
                          {isEntrega ? 'ASIGNADO' : 'DEVOLUCIÓN'}
                        </span>
                      </td>
                      <td>
                        <div className='info-cell'>
                          {isMultiple ? (
                            <div className='shadcn-tooltip-container'>
                              <span className='multiple-badge'>
                                <Layers size={14} /> Varios (
                                {h.equipos_agrupados.length})
                              </span>
                              <div className='shadcn-tooltip-content left-align'>
                                {h.equipos_agrupados.map((eq, i) => (
                                  <div
                                    key={i}
                                    className='tooltip-item'
                                  >
                                    <strong className='model-text'>
                                      {eq.modelo}
                                    </strong>
                                    <span className='serial-text'>
                                      SN: {eq.serie}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <>
                              <span className='name'>
                                <Laptop
                                  className='icon-slate'
                                  size={14}
                                />{' '}
                                {h.marca} {h.modelo}
                              </span>
                              <span className='audit-text'>
                                <Barcode size={12} /> {h.serie}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className='info-cell'>
                          <span className='name'>
                            <User
                              className='icon-slate'
                              size={14}
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
                                  className='icon-violet'
                                  size={14}
                                />{' '}
                                {h.admin_nombre}
                              </span>
                              <span className='audit-text'>
                                {h.admin_correo}
                              </span>
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
                        {!isEntrega ? (
                          isMultiple ? (
                            <div className='shadcn-tooltip-container'>
                              <span className='multiple-badge light'>
                                <Layers size={14} /> Varios
                              </span>
                              <div className='shadcn-tooltip-content right-align'>
                                {h.equipos_agrupados.map((eq, i) => (
                                  <div
                                    key={i}
                                    className='tooltip-item state-item'
                                  >
                                    <strong
                                      className='state-model'
                                      title={eq.modelo}
                                    >
                                      {eq.modelo}
                                    </strong>
                                    <span
                                      className={`status-badge-mini ${getEstadoClass(eq.estado_equipo_momento)}`}
                                    >
                                      {eq.estado_equipo_momento || 'N/A'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : h.estado_equipo_momento ? (
                            <span
                              className={`status-badge-mini ${getEstadoClass(h.estado_equipo_momento)}`}
                            >
                              {h.estado_equipo_momento}
                            </span>
                          ) : (
                            <span className='dash'>-</span>
                          )
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
        </div>

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
    </div>
  );
};

export default Historial;
