import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../service/api';
import {
  Laptop,
  CheckCircle,
  HandCoins,
  AlertOctagon,
  CreditCard,
  TrendingUp,
  HelpCircle,
  Ticket,
  Clock,
  LayoutList,
} from 'lucide-react';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import {
  MovementsChart,
  StatusChart,
  AgeChart,
  SignaturesChart,
  CompanyChart,
  ProviderChart,
  InventoryOriginChart,
  GlobalInventoryChart,
  CategoryCostChart,
  ServiceCostChart,
  TicketsTypeChart,
  SLACategoryChart,
} from './DashboardCharts';

import './Dashboard.scss';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    total: 0,
    disponibles: 0,
    ocupados: 0,
    inoperativos: 0,
  });

  const [movementsData, setMovementsData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [signatureData, setSignatureData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [providerData, setProviderData] = useState([]);
  const [inventoryOriginData, setInventoryOriginData] = useState([]);
  const [globalInventoryData, setGlobalInventoryData] = useState([]);

  const [serviciosActivos, setServiciosActivos] = useState([]);
  const [frecuenciaCosto, setFrecuenciaCosto] = useState('Todos');
  const [costosAgrupados, setCostosAgrupados] = useState({});

  const [chartCurrency, setChartCurrency] = useState('USD');
  const [categoryCostData, setCategoryCostData] = useState([]);
  const [serviceCostData, setServiceCostData] = useState([]);

  const [loading, setLoading] = useState(true);

  const [ticketStats, setTicketStats] = useState({
    total: 0,
    pendientes: 0,
    proceso: 0,
    resueltos: 0,
  });
  const [ticketTypeData, setTicketTypeData] = useState([]);
  const [averageResolutionTime, setAverageResolutionTime] = useState(0);

  const MESES = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];
  const currencySymbols = { USD: '$', PEN: 'S/', EUR: '€' };

  const startDashboardTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      allowClose: true,
      overlayColor: 'rgba(15, 23, 42, 0.6)',
      steps: [
        {
          element: '#tour-welcome',
          popover: {
            title: 'Bienvenido a tu Panel',
            description: 'Vista general del inventario y costos.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-stats',
          popover: {
            title: 'Resumen Rápido',
            description: 'Controla el estado de tus equipos de un vistazo.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-costs',
          popover: {
            title: 'Inversión en Servicios',
            description: 'Monitorea el gasto en licencias de software.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-expense-charts',
          popover: {
            title: 'Análisis de Gastos',
            description: 'Descubre en qué servicios se va el presupuesto.',
            side: 'top',
            align: 'start',
          },
        },
        {
          element: '#tour-equipment-charts',
          popover: {
            title: 'Análisis de Equipos',
            description: 'Mide entregas, estado del hardware y firmas.',
            side: 'top',
            align: 'start',
          },
        },
      ],
    });
    driverObj.drive();
  };

  const processData = (equipos, historial) => {
    // 1. MOVIMIENTOS
    const months = {};
    historial.forEach((h) => {
      const date = new Date(h.fecha_movimiento);
      const mesNombre = MESES[date.getMonth()];
      const anio = date.getFullYear();
      const key = `${mesNombre} ${anio}`;
      if (!months[key])
        months[key] = {
          name: key,
          entregas: 0,
          devoluciones: 0,
          sort: anio * 100 + date.getMonth(),
        };
      if (h.tipo_movimiento === 'entrega') months[key].entregas += 1;
      if (h.tipo_movimiento === 'devolucion') months[key].devoluciones += 1;
    });
    setMovementsData(
      Object.values(months)
        .sort((a, b) => a.sort - b.sort)
        .slice(-6),
    );

    // 2. ESTADO DEL INVENTARIO
    const statusCounts = { operativo: 0, mantenimiento: 0, inoperativo: 0 };
    equipos.forEach((e) => {
      const estadoFisico = (e.estado_fisico || '').toLowerCase().trim();
      const esOperativo =
        e.estado_fisico_id === 1 || estadoFisico === 'operativo';
      if (esOperativo) statusCounts.operativo++;
      else if (
        estadoFisico.includes('inoperativo') ||
        estadoFisico.includes('robado') ||
        estadoFisico.includes('perdido')
      )
        statusCounts.inoperativo++;
      else statusCounts.mantenimiento++;
    });
    setStatusData(
      [
        { name: 'Operativos', value: statusCounts.operativo },
        { name: 'En Mantenimiento', value: statusCounts.mantenimiento },
        { name: 'Inoperativos', value: statusCounts.inoperativo },
      ].filter((i) => i.value > 0),
    );

    // 3. ESTADO POR ORIGEN DE INVENTARIO
    let propiosDisp = 0,
      propiosOcup = 0,
      propiosInop = 0;
    let provDisp = 0,
      provOcup = 0,
      provInop = 0;

    equipos.forEach((e) => {
      const isOperativo =
        e.estado_fisico_id === 1 ||
        (e.estado_fisico || '').toLowerCase() === 'operativo';
      const isDisponible = e.disponible === true && isOperativo;
      const isOcupado = e.disponible === false && isOperativo;
      const isInoperativo = !isOperativo;

      if (e.es_propio) {
        if (isDisponible) propiosDisp++;
        else if (isOcupado) propiosOcup++;
        else if (isInoperativo) propiosInop++;
      } else {
        if (isDisponible) provDisp++;
        else if (isOcupado) provOcup++;
        else if (isInoperativo) provInop++;
      }
    });

    setInventoryOriginData([
      {
        name: 'Equipos Propios',
        Disponibles: propiosDisp,
        Ocupados: propiosOcup,
        Inoperativos: propiosInop,
      },
      {
        name: 'De Proveedor',
        Disponibles: provDisp,
        Ocupados: provOcup,
        Inoperativos: provInop,
      },
    ]);

    setGlobalInventoryData(
      [
        { name: 'Propios (Almacén)', value: propiosDisp + propiosInop },
        { name: 'Propios (Asignados)', value: propiosOcup },
        { name: 'Proveedor (Almacén)', value: provDisp + provInop },
        { name: 'Proveedor (Asignados)', value: provOcup },
      ].filter((item) => item.value > 0),
    );

    // 4. ANTIGÜEDAD
    const yearsCount = {};
    equipos.forEach((e) => {
      if (e.fecha_adquisicion) {
        const year = new Date(e.fecha_adquisicion).getFullYear();
        yearsCount[year] = (yearsCount[year] || 0) + 1;
      }
    });
    setAgeData(
      Object.entries(yearsCount)
        .map(([year, cantidad]) => ({ year, cantidad }))
        .sort((a, b) => a.year - b.year),
    );

    // 5. CUMPLIMIENTO DE FIRMAS
    let firmados = 0,
      pendientes = 0,
      rechazados = 0;
    historial.forEach((h) => {
      if (
        h.tipo_movimiento === 'entrega' ||
        h.tipo_movimiento === 'devolucion'
      ) {
        if (!h.pdf_firmado_url) pendientes++;
        else if (h.firma_valida === false) rechazados++;
        else firmados++;
      }
    });
    setSignatureData(
      [
        { name: 'Firmados', value: firmados },
        { name: 'Pendientes', value: pendientes },
        { name: 'Rechazados', value: rechazados },
      ].filter((i) => i.value > 0),
    );

    // 6. TOP EMPRESAS Y PROVEEDORES
    const companyCount = {};
    const providerCount = {};
    equipos.forEach((e) => {
      if (e.es_propio) {
        const n = e.empresa_nombre
          ? String(e.empresa_nombre).trim().toUpperCase()
          : 'SIN EMPRESA';
        companyCount[n] = (companyCount[n] || 0) + 1;
      } else {
        const p = e.proveedor_nombre
          ? String(e.proveedor_nombre).trim().toUpperCase()
          : 'DESCONOCIDO';
        providerCount[p] = (providerCount[p] || 0) + 1;
      }
    });
    setCompanyData(
      Object.entries(companyCount)
        .map(([name, cantidad]) => ({ name, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5),
    );
    setProviderData(
      Object.entries(providerCount)
        .map(([name, cantidad]) => ({ name, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5),
    );
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard');
        const equipos = res.data.equipos || [];
        const movimientos = res.data.movimientos || [];
        const serviciosSaaS = res.data.servicios || [];
        const tickets = res.data.tickets || [];

        const total = equipos.length;
        const inoperativos = equipos.filter(
          (e) =>
            e.estado_fisico_id !== 1 &&
            (e.estado_fisico || '').toLowerCase() !== 'operativo',
        ).length;
        const disponibles = equipos.filter(
          (e) =>
            e.disponible === true &&
            (e.estado_fisico_id === 1 ||
              (e.estado_fisico || '').toLowerCase() === 'operativo'),
        ).length;
        const ocupados = equipos.filter(
          (e) =>
            e.disponible === false &&
            (e.estado_fisico_id === 1 ||
              (e.estado_fisico || '').toLowerCase() === 'operativo'),
        ).length;

        setStats({ total, ocupados, disponibles, inoperativos });
        processData(equipos, movimientos);
        setServiciosActivos(serviciosSaaS);

        // --- LÓGICA DE TICKETS ---
        if (tickets) {
          let pendientes = 0,
            proceso = 0,
            resueltos = 0;
          const typeCount = {};
          const slaStorage = {};

          tickets.forEach((t) => {
            if (t.estado === 'Pendiente') pendientes++;
            else if (t.estado === 'En Proceso') proceso++;
            else if (t.estado === 'Resuelto') resueltos++;

            const tipo = t.tipo_solicitud || 'Otro';
            const tipoShort = tipo
              .split('/')[0]
              .trim()
              .replace(/[^\w\s]/gi, '');
            typeCount[tipoShort] = (typeCount[tipoShort] || 0) + 1;

            // Agrupación por tipo para el promedio
            if (
              t.estado === 'Resuelto' &&
              t.fecha_inicio_atencion &&
              t.fecha_cierre
            ) {
              const start = new Date(t.fecha_inicio_atencion).getTime();
              const end = new Date(t.fecha_cierre).getTime();
              const diffMins = (end - start) / (1000 * 60);

              if (diffMins > 0) {
                if (!slaStorage[tipoShort])
                  slaStorage[tipoShort] = { total: 0, count: 0 };
                slaStorage[tipoShort].total += diffMins;
                slaStorage[tipoShort].count += 1;
              }
            }
          });

          setTicketStats({
            total: tickets.length,
            pendientes,
            proceso,
            resueltos,
          });

          setTicketTypeData(
            Object.entries(typeCount)
              .map(([name, value]) => ({ name, value }))
              .sort((a, b) => b.value - a.value),
          );

          // NUEVO: Se crea el array para el gráfico de promedios por categoría
          const promediosPorTipo = Object.entries(slaStorage)
            .map(([name, data]) => ({
              name,
              promedio: data.total / data.count,
            }))
            .sort((a, b) => b.promedio - a.promedio);

          setAverageResolutionTime(promediosPorTipo);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (!serviciosActivos.length) return;
    const sumasPorMoneda = {};
    serviciosActivos.forEach((s) => {
      if (
        frecuenciaCosto === 'Todos' ||
        s.frecuencia_pago === frecuenciaCosto
      ) {
        const mon = s.moneda || 'USD';
        if (!sumasPorMoneda[mon]) sumasPorMoneda[mon] = 0;
        sumasPorMoneda[mon] += Number(s.precio || 0);
      }
    });
    setCostosAgrupados(sumasPorMoneda);
  }, [serviciosActivos, frecuenciaCosto]);

  useEffect(() => {
    if (!serviciosActivos.length) return;
    const catMap = {};
    const servMap = {};

    serviciosActivos.forEach((s) => {
      if (s.moneda !== chartCurrency) return;
      let monthlyCost = Number(s.precio || 0);
      if (s.frecuencia_pago === 'Anual') monthlyCost /= 12;
      else if (s.frecuencia_pago === 'Trimestral') monthlyCost /= 3;

      const cat = s.categoria_servicio || 'Sin Categoría';
      const nom = s.nombre || 'Desconocido';

      catMap[cat] = (catMap[cat] || 0) + monthlyCost;
      servMap[nom] = (servMap[nom] || 0) + monthlyCost;
    });

    setCategoryCostData(
      Object.entries(catMap)
        .map(([name, costo]) => ({ name, costo }))
        .sort((a, b) => b.costo - a.costo)
        .slice(0, 5),
    );
    setServiceCostData(
      Object.entries(servMap)
        .map(([name, costo]) => ({ name, costo }))
        .sort((a, b) => b.costo - a.costo)
        .slice(0, 5),
    );
  }, [serviciosActivos, chartCurrency]);

  if (loading)
    return <div className='loading-state'>Cargando tu dashboard...</div>;

  const firstName = user?.nombre ? user.nombre.split(' ')[0] : 'Usuario';

  return (
    <div className='dashboard-container-modern'>
      {/* SECCIÓN BIENVENIDA */}
      <div
        className='welcome-section'
        id='tour-welcome'
      >
        <div className='text-content'>
          <h1>
            Hola, <span className='user-name'>{firstName}!</span> 👋
          </h1>
          <p>Aquí tienes un resumen de la gestión de equipos y servicios.</p>
        </div>
        <button
          className='btn-tour-modern'
          onClick={startDashboardTour}
          title='Iniciar recorrido'
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* TARJETAS DE ESTADO (EQUIPOS) */}
      <div
        className='stats-grid-modern'
        id='tour-stats'
      >
        <div className='stat-card'>
          <div className='info'>
            <span className='label'>Total Equipos</span>
            <span className='number'>{stats.total}</span>
          </div>
          <div className='icon-wrapper bg-indigo'>
            <Laptop size={24} />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <span className='label'>Equipos Disponibles</span>
            <span className='number text-success'>{stats.disponibles}</span>
          </div>
          <div className='icon-wrapper bg-success'>
            <CheckCircle size={24} />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <span className='label'>Equipos Asignados</span>
            <span className='number text-primary'>{stats.ocupados}</span>
          </div>
          <div className='icon-wrapper bg-primary'>
            <HandCoins size={24} />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <span className='label'>Inoperativos</span>
            <span className='number text-danger'>{stats.inoperativos}</span>
          </div>
          <div className='icon-wrapper bg-danger'>
            <AlertOctagon size={24} />
          </div>
        </div>
      </div>

      {/* TARJETA DE COSTOS */}
      <div
        className='cost-summary-modern'
        id='tour-costs'
      >
        <div className='cost-header'>
          <div className='title-group'>
            <div className='icon-circle'>
              <CreditCard size={20} />
            </div>
            <h2>Inversión en Servicios Activos</h2>
          </div>
          <div className='filter-tabs-modern'>
            {['Todos', 'Mensual', 'Anual', 'Trimestral', 'Único'].map(
              (freq) => (
                <button
                  key={freq}
                  className={`filter-btn ${frecuenciaCosto === freq ? 'active' : ''}`}
                  onClick={() => setFrecuenciaCosto(freq)}
                >
                  {freq}
                </button>
              ),
            )}
          </div>
        </div>
        <div className='cost-body'>
          {Object.keys(costosAgrupados).length === 0 ? (
            <p className='no-costs'>
              No hay servicios registrados con esta frecuencia.
            </p>
          ) : (
            Object.keys(costosAgrupados).map((moneda) => (
              <div
                className='currency-card'
                key={moneda}
              >
                <div className='currency-info'>
                  <span className='currency-label'>Total en {moneda}</span>
                  <span className='currency-value'>
                    {currencySymbols[moneda] || ''}
                    {costosAgrupados[moneda].toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <TrendingUp
                  size={32}
                  className='bg-icon'
                />
              </div>
            ))
          )}
        </div>
      </div>

      <div className='section-divider'></div>

      {/* GRÁFICOS DE GASTOS SAAS */}
      <div className='section-title-modern'>
        <div className='title-block'>
          <h2>Análisis de Gastos</h2>
          <p>Desglose mensualizado por categoría y servicio.</p>
        </div>
        <div className='currency-toggle-modern'>
          {['USD', 'PEN', 'EUR'].map((c) => (
            <button
              key={c}
              className={chartCurrency === c ? 'active' : ''}
              onClick={() => setChartCurrency(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div
        className='charts-grid-modern'
        id='tour-expense-charts'
      >
        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator'></div>
            <h3>Top Categorías (Mensual)</h3>
          </div>
          <div className='chart-wrapper'>
            {categoryCostData.length > 0 ? (
              <CategoryCostChart
                data={categoryCostData}
                currency={currencySymbols[chartCurrency]}
              />
            ) : (
              <span className='empty-chart'>
                No hay datos en {chartCurrency}
              </span>
            )}
          </div>
        </div>
        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator secondary'></div>
            <h3>Top Servicios Costosos (Mensual)</h3>
          </div>
          <div className='chart-wrapper'>
            {serviceCostData.length > 0 ? (
              <ServiceCostChart
                data={serviceCostData}
                currency={currencySymbols[chartCurrency]}
              />
            ) : (
              <span className='empty-chart'>
                No hay datos en {chartCurrency}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className='section-title-modern'>
        <div className='title-block'>
          <h2>Mesa de Ayuda (Soporte TI)</h2>
          <p>Rendimiento del equipo de soporte y estado de solicitudes.</p>
        </div>
      </div>

      {/* Tarjetas de Tickets */}
      <div
        className='stats-grid-modern'
        style={{ marginBottom: '1.5rem' }}
      >
        <div className='stat-card'>
          <div className='info'>
            <span className='label'>Total Tickets</span>
            <span className='number'>{ticketStats.total}</span>
          </div>
          <div className='icon-wrapper bg-indigo'>
            <LayoutList size={24} />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <span className='label'>Pendientes</span>
            <span className='number text-danger'>{ticketStats.pendientes}</span>
          </div>
          <div className='icon-wrapper bg-danger'>
            <AlertOctagon size={24} />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <span className='label'>En Proceso</span>
            <span className='number text-primary'>{ticketStats.proceso}</span>
          </div>
          <div className='icon-wrapper bg-primary'>
            <Clock size={24} />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <span className='label'>Resueltos</span>
            <span className='number text-success'>{ticketStats.resueltos}</span>
          </div>
          <div className='icon-wrapper bg-success'>
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Gráficos de Tickets */}
      <div
        className='charts-grid-modern'
        style={{ marginBottom: '3rem' }}
      >
        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator secondary'></div>
            <h3>Tipos de Problemas Recurrentes</h3>
          </div>
          <div className='chart-wrapper'>
            {ticketTypeData.length > 0 ? (
              <TicketsTypeChart data={ticketTypeData} />
            ) : (
              <span className='empty-chart'>No hay tickets registrados</span>
            )}
          </div>
        </div>

        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator success'></div>
            <h3>Nivel de Respuesta por Categoría</h3>
          </div>
          <div className='chart-wrapper'>
            <SLACategoryChart data={averageResolutionTime} />
          </div>
        </div>
      </div>

      {/* GRÁFICOS DE EQUIPOS */}
      <div className='section-title-modern'>
        <div className='title-block'>
          <h2>Análisis de Equipos</h2>
          <p>Métricas clave sobre el estado y flujo del inventario.</p>
        </div>
      </div>

      <div
        className='charts-masonry-modern'
        id='tour-equipment-charts'
      >
        {/* Fila 1: Principales */}
        <div className='chart-card span-2-col'>
          <div className='chart-header'>
            <div className='indicator'></div>
            <h3>Movimientos (Últimos 6 Meses)</h3>
          </div>
          <div className='chart-wrapper'>
            <MovementsChart data={movementsData} />
          </div>
        </div>
        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator warning'></div>
            <h3>Estado Físico Global</h3>
          </div>
          <div className='chart-wrapper'>
            <StatusChart data={statusData} />
          </div>
        </div>

        {/* Fila 2 y 3: Secundarios */}
        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator'></div>
            <h3>Disp. (Propios vs Proveedor)</h3>
          </div>
          <div className='chart-wrapper'>
            <InventoryOriginChart data={inventoryOriginData} />
          </div>
        </div>
        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator secondary'></div>
            <h3>Distribución Equipos</h3>
          </div>
          <div className='chart-wrapper'>
            <GlobalInventoryChart data={globalInventoryData} />
          </div>
        </div>
        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator'></div>
            <h3>Distribución de Equipos Propios</h3>
          </div>
          <div className='chart-wrapper'>
            <CompanyChart data={companyData} />
          </div>
        </div>
        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator secondary'></div>
            <h3>Top Proveedores</h3>
          </div>
          <div className='chart-wrapper'>
            <ProviderChart data={providerData} />
          </div>
        </div>
        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator'></div>
            <h3>Antigüedad Inventario</h3>
          </div>
          <div className='chart-wrapper'>
            <AgeChart data={ageData} />
          </div>
        </div>
        <div className='chart-card'>
          <div className='chart-header'>
            <div className='indicator success'></div>
            <h3>Firmas de Actas</h3>
          </div>
          <div className='chart-wrapper'>
            <SignaturesChart data={signatureData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
