import { useEffect, useState } from 'react';
import api from '../../service/api';
import {
  Laptop,
  CheckCircle,
  HandCoins,
  AlertOctagon,
  CreditCard,
} from 'lucide-react';

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
} from './DashboardCharts';

import './Dashboard.scss';

const Dashboard = () => {
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

  // --- ESTADOS PARA GASTOS DE SERVICIOS ---
  const [serviciosActivos, setServiciosActivos] = useState([]);
  const [frecuenciaCosto, setFrecuenciaCosto] = useState('Todos');
  const [costosAgrupados, setCostosAgrupados] = useState({});

  // --- ESTADOS PARA GRÁFICOS DE SAAS ---
  const [chartCurrency, setChartCurrency] = useState('USD');
  const [categoryCostData, setCategoryCostData] = useState([]);
  const [serviceCostData, setServiceCostData] = useState([]);

  const [loading, setLoading] = useState(true);

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

    // 2. ESTADO DEL INVENTARIO (PARA DONA GENERAL)
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

    // ========================================================
    // 3. ESTADO POR ORIGEN DE INVENTARIO (Propios vs Proveedor)
    // ========================================================
    let propiosDisp = 0;
    let propiosOcup = 0;
    let propiosInop = 0;
    let provDisp = 0;
    let provOcup = 0;
    let provInop = 0;

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

    // Data para el Gráfico de Barras Apiladas (3 niveles)
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

    // ========================================================

    // Dona Global (Almacén Total vs Asignados Totales)
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
    let firmados = 0;
    let pendientes = 0;
    let rechazados = 0;
    historial.forEach((h) => {
      if (
        h.tipo_movimiento === 'entrega' ||
        h.tipo_movimiento === 'devolucion'
      ) {
        if (h.firma_valida === false) rechazados++;
        else if (h.pdf_firmado_url) firmados++;
        else pendientes++;
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
        const equipos = res.data.equipos;
        const movimientos = res.data.movimientos;
        const serviciosSaaS = res.data.servicios;

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
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Efecto para la Tarjeta Resumen Total (Cuadros de Arriba)
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

  // --- EFECTO PARA LAS DOS GRÁFICAS DE SERVICIOS (MENSUALIZADAS) ---
  useEffect(() => {
    if (!serviciosActivos.length) return;

    const catMap = {};
    const servMap = {};

    serviciosActivos.forEach((s) => {
      if (s.moneda !== chartCurrency) return;

      // Estandarizamos TODO a costo Mensual
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
    return <div className='loading-state'>Cargando estadísticas...</div>;

  return (
    <div className='dashboard-container'>
      <h1>Resumen General de Equipos</h1>

      <div className='stats-grid'>
        <div className='stat-card dark-card'>
          <div className='info'>
            <h3>Total Equipos</h3>
            <span className='number'>{stats.total}</span>
          </div>
          <div className='icon-box purple'>
            <Laptop />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <h3>Equipos Disponibles</h3>
            <span className='number'>{stats.disponibles}</span>
          </div>
          <div className='icon-box green'>
            <CheckCircle />
          </div>
        </div>
        <div className='stat-card dark-card'>
          <div className='info'>
            <h3>Equipos Asignados</h3>
            <span className='number'>{stats.ocupados}</span>
          </div>
          <div className='icon-box blue'>
            <HandCoins />
          </div>
        </div>
        <div className='stat-card'>
          <div className='info'>
            <h3>Equipos Inoperativos</h3>
            <span className='number'>{stats.inoperativos}</span>
          </div>
          <div className='icon-box orange'>
            <AlertOctagon />
          </div>
        </div>
      </div>

      {/* --- TARJETA DE INVERSIÓN EN SERVICIOS --- */}
      <div className='cost-summary-card'>
        <div className='cost-header'>
          <h3 className='title'>
            <CreditCard size={24} /> Inversión Total en Servicios Activos
          </h3>
          <div className='filter-tabs'>
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
            <p className='no-costs'>No hay servicios registrados.</p>
          ) : (
            Object.keys(costosAgrupados).map((moneda) => (
              <div
                className='currency-block'
                key={moneda}
              >
                <span className='currency-label'>Total {moneda}</span>
                <span className='currency-value'>
                  {currencySymbols[moneda] || ''}{' '}
                  {costosAgrupados[moneda].toLocaleString('es-PE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- SECCIÓN DE GRÁFICAS DE GASTOS --- */}
      <div className='charts-section-title'>
        <div>
          <h2>Análisis de Gastos</h2>
          <p className='subtitle'>Costo estandarizado de forma mensual.</p>
        </div>
        <div className='currency-toggle'>
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

      <div className='charts-row secondary-row'>
        <div className='chart-card'>
          <h3>Top Categorías (Costo Mensual)</h3>
          <div className='chart-wrapper'>
            {categoryCostData.length > 0 ? (
              <CategoryCostChart
                data={categoryCostData}
                currency={currencySymbols[chartCurrency]}
              />
            ) : (
              <span style={{ color: '#94a3b8' }}>
                No hay datos en {chartCurrency}
              </span>
            )}
          </div>
        </div>
        <div className='chart-card'>
          <h3>Top Servicios más Costosos (Mensual)</h3>
          <div className='chart-wrapper'>
            {serviceCostData.length > 0 ? (
              <ServiceCostChart
                data={serviceCostData}
                currency={currencySymbols[chartCurrency]}
              />
            ) : (
              <span style={{ color: '#94a3b8' }}>
                No hay datos en {chartCurrency}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className='divider-line'></div>

      {/* --- SECCIÓN DE GRÁFICOS DE EQUIPOS --- */}
      <h2
        style={{ marginTop: '2rem', marginBottom: '1.5rem', color: '#1e293b' }}
      >
        Análisis de Equipos
      </h2>
      <div className='charts-row main-row'>
        <div className='chart-card large'>
          <h3>Movimientos (Entregas vs Devoluciones)</h3>
          <div className='chart-wrapper'>
            <MovementsChart data={movementsData} />
          </div>
        </div>
        <div className='chart-card'>
          <h3>Estado Físico Global</h3>
          <div className='chart-wrapper'>
            <StatusChart data={statusData} />
          </div>
        </div>
      </div>

      <div className='charts-row secondary-row'>
        <div className='chart-card'>
          <h3>Disponibilidad (Propios vs Proveedor)</h3>
          <div className='chart-wrapper'>
            <InventoryOriginChart data={inventoryOriginData} />
          </div>
        </div>
        <div className='chart-card'>
          <h3>Resumen Total de Origen</h3>
          <div className='chart-wrapper'>
            <GlobalInventoryChart data={globalInventoryData} />
          </div>
        </div>
        <div className='chart-card'>
          <h3>Distribución (Equipos Propios)</h3>
          <div className='chart-wrapper'>
            <CompanyChart data={companyData} />
          </div>
        </div>
        <div className='chart-card'>
          <h3>Top Proveedores (Alquilados)</h3>
          <div className='chart-wrapper'>
            <ProviderChart data={providerData} />
          </div>
        </div>
        <div className='chart-card'>
          <h3>Antigüedad (Año Compra)</h3>
          <div className='chart-wrapper'>
            <AgeChart data={ageData} />
          </div>
        </div>
        <div className='chart-card'>
          <h3>Cumplimiento (Firmas de Actas)</h3>
          <div className='chart-wrapper'>
            <SignaturesChart data={signatureData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
