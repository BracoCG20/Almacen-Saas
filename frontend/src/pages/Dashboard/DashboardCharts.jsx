//frontend/src/pages/Dashboard/DashboardCharts.jsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

// --- CONSTANTES GLOBALES ---
// Defino la paleta de colores y el estilo base de los tooltips para
// garantizar que todos los gráficos compartan la misma identidad visual de la app.
const COLORS = {
  primary: '#7c3aed',
  primaryLight: '#ddd6fe',
  secondary: '#3b82f6',
  secondaryLight: '#bfdbfe',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  textMuted: '#64748b',
  gridLine: '#f1f5f9',
};

const tooltipStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  padding: '10px 14px',
  fontSize: '0.8rem',
};

/**
 * MOVIMIENTOS: Gráfico de barras
 * Muestro una comparativa mensual entre las entregas realizadas y las devoluciones recibidas.
 */
export const MovementsChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          vertical={false}
          stroke={COLORS.gridLine}
        />
        <XAxis
          dataKey='name'
          axisLine={false}
          tickLine={false}
          tick={{ fill: COLORS.textMuted, fontSize: 11 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: COLORS.textMuted, fontSize: 11 }}
          dx={-10}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={tooltipStyle}
          labelStyle={{
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '4px',
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          iconType='circle'
        />
        <Bar
          dataKey='entregas'
          name='Entregas'
          fill={COLORS.success}
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
        <Bar
          dataKey='devoluciones'
          name='Devoluciones'
          fill={COLORS.secondaryLight}
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * ESTADO DEL INVENTARIO: Gráfico de dona
 * Visualizo rápidamente la proporción de equipos operativos, inoperativos y en mantenimiento.
 */
export const StatusChart = ({ data }) => {
  const STATUS_COLORS = {
    Operativos: COLORS.success,
    'En Mantenimiento': COLORS.warning,
    Inoperativos: COLORS.danger,
  };
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='50%'
          innerRadius={60}
          outerRadius={80}
          paddingAngle={4}
          dataKey='value'
          cornerRadius={4}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.name] || COLORS.textMuted}
              stroke='none'
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          itemStyle={{ fontWeight: 600 }}
        />
        <Legend
          verticalAlign='bottom'
          iconType='circle'
          wrapperStyle={{ fontSize: '11px', color: COLORS.textMuted }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * ORIGEN DEL INVENTARIO: Gráfico de barras apiladas
 * Separo la disponibilidad física de los equipos comparando los que son de la empresa vs alquilados/proveedor.
 */
export const InventoryOriginChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          vertical={false}
          stroke={COLORS.gridLine}
        />
        <XAxis
          dataKey='name'
          axisLine={false}
          tickLine={false}
          tick={{ fill: COLORS.textMuted, fontSize: 11 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: COLORS.textMuted, fontSize: 11 }}
          dx={-10}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={tooltipStyle}
        />
        <Legend
          verticalAlign='bottom'
          iconType='circle'
          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
        />
        <Bar
          dataKey='Disponibles'
          stackId='a'
          fill={COLORS.success}
          barSize={30}
        />
        <Bar
          dataKey='Ocupados'
          stackId='a'
          fill={COLORS.secondary}
          barSize={30}
        />
        <Bar
          dataKey='Inoperativos'
          stackId='a'
          fill={COLORS.danger}
          radius={[4, 4, 0, 0]}
          barSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * ANTIGÜEDAD: Gráfico de área
 * Dibujo la curva de crecimiento del inventario mostrando cuántos equipos adquirimos por año.
 */
export const AgeChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
      >
        <defs>
          <linearGradient
            id='colorAge'
            x1='0'
            y1='0'
            x2='0'
            y2='1'
          >
            <stop
              offset='5%'
              stopColor={COLORS.primary}
              stopOpacity={0.2}
            />
            <stop
              offset='95%'
              stopColor={COLORS.primary}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray='3 3'
          vertical={false}
          stroke={COLORS.gridLine}
        />
        <XAxis
          dataKey='year'
          axisLine={false}
          tickLine={false}
          tick={{ fill: COLORS.textMuted, fontSize: 11 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: COLORS.textMuted, fontSize: 11 }}
          dx={-10}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Area
          type='monotone'
          dataKey='cantidad'
          name='Equipos Adquiridos'
          stroke={COLORS.primary}
          strokeWidth={2}
          fillOpacity={1}
          fill='url(#colorAge)'
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

/**
 * CUMPLIMIENTO LEGAL (FIRMAS): Gráfico de semi-dona
 * Muestro la proporción de actas que ya están firmadas, pendientes o rechazadas por los usuarios.
 */
export const SignaturesChart = ({ data }) => {
  const STATUS_COLORS = {
    Firmados: COLORS.success,
    Pendientes: COLORS.warning,
    Rechazados: COLORS.danger,
  };
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='60%'
          startAngle={180}
          endAngle={0}
          innerRadius={70}
          outerRadius={90}
          paddingAngle={4}
          dataKey='value'
          cornerRadius={4}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.name] || COLORS.textMuted}
              stroke='none'
            />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          verticalAlign='bottom'
          iconType='circle'
          wrapperStyle={{ fontSize: '11px', color: COLORS.textMuted }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * TOP EMPRESAS: Barras horizontales
 * Destaco cuáles son las empresas internas (razones sociales) con mayor cantidad de equipos asignados.
 */
export const CompanyChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={true}
          vertical={false}
          stroke={COLORS.gridLine}
        />
        <XAxis
          type='number'
          hide
        />
        <YAxis
          dataKey='name'
          type='category'
          width={90}
          tick={{ fill: COLORS.textMuted, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={tooltipStyle}
        />
        <Bar
          dataKey='cantidad'
          name='Propios'
          fill={COLORS.primary}
          radius={[0, 4, 4, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * TOP PROVEEDORES: Barras horizontales
 * Muestro qué proveedores de hardware nos están alquilando/suministrando la mayor cantidad de equipos.
 */
export const ProviderChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={true}
          vertical={false}
          stroke={COLORS.gridLine}
        />
        <XAxis
          type='number'
          hide
        />
        <YAxis
          dataKey='name'
          type='category'
          width={90}
          tick={{ fill: COLORS.textMuted, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={tooltipStyle}
        />
        <Bar
          dataKey='cantidad'
          name='Alquilados'
          fill={COLORS.secondary}
          radius={[0, 4, 4, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * RESUMEN GLOBAL: Gráfico de dona
 * Obtengo una "foto" general de todo mi universo de equipos: qué está en almacén vs asignado, y qué es propio vs proveedor.
 */
export const GlobalInventoryChart = ({ data }) => {
  const PIE_COLORS = {
    'Propios (Almacén)': COLORS.primaryLight,
    'Propios (Asignados)': COLORS.primary,
    'Proveedor (Almacén)': COLORS.secondaryLight,
    'Proveedor (Asignados)': COLORS.secondary,
  };
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='45%'
          innerRadius={50}
          outerRadius={75}
          paddingAngle={3}
          dataKey='value'
          cornerRadius={4}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PIE_COLORS[entry.name] || COLORS.textMuted}
              stroke='none'
            />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          verticalAlign='bottom'
          iconType='circle'
          wrapperStyle={{ fontSize: '10px', color: COLORS.textMuted }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * COSTOS POR CATEGORÍA SAAS: Barras horizontales
 * Comparo el gasto mensual distribuido entre distintas categorías de software (Ej: Diseño, Desarrollo, Nube).
 */
export const CategoryCostChart = ({ data, currency }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={true}
          vertical={false}
          stroke={COLORS.gridLine}
        />
        <XAxis
          type='number'
          hide
        />
        <YAxis
          dataKey='name'
          type='category'
          width={110}
          tick={{ fill: COLORS.textMuted, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={tooltipStyle}
          formatter={(value) => [
            `${currency} ${value.toFixed(2)}`,
            'Costo Mensual',
          ]}
        />
        <Bar
          dataKey='costo'
          name='Costo Mensual'
          fill={COLORS.primary}
          radius={[0, 4, 4, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * TOP SERVICIOS COSTOSOS: Barras horizontales
 * Enumero los servicios de software individuales que consumen mayor parte de mi presupuesto mensual.
 */
export const ServiceCostChart = ({ data, currency }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={true}
          vertical={false}
          stroke={COLORS.gridLine}
        />
        <XAxis
          type='number'
          hide
        />
        <YAxis
          dataKey='name'
          type='category'
          width={110}
          tick={{ fill: COLORS.textMuted, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={tooltipStyle}
          formatter={(value) => [
            `${currency} ${value.toFixed(2)}`,
            'Costo Mensual',
          ]}
        />
        <Bar
          dataKey='costo'
          name='Costo Mensual'
          fill={COLORS.secondary}
          radius={[0, 4, 4, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * TIPOS DE TICKETS: Gráfico de dona
 * Muestro la proporción de las incidencias o requerimientos más comunes en la mesa de ayuda.
 */
export const TicketsTypeChart = ({ data }) => {
  const TICKET_COLORS = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.warning,
    COLORS.danger,
    COLORS.success,
    COLORS.primaryLight,
  ];
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='50%'
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey='value'
          cornerRadius={4}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={TICKET_COLORS[index % TICKET_COLORS.length]}
              stroke='none'
            />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          verticalAlign='bottom'
          iconType='circle'
          wrapperStyle={{
            fontSize: '10px',
            color: COLORS.textMuted,
            marginTop: '10px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * RENDIMIENTO (SLA) POR CATEGORÍA: Barras horizontales
 * Mido la agilidad de mi equipo de soporte graficando el tiempo promedio de resolución (en minutos/horas) por cada tipo de problema.
 */
export const SLACategoryChart = ({ data }) => {
  // Manejo el caso en el que no haya tickets resueltos para calcular un promedio
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          color: COLORS.textMuted,
          paddingTop: '100px',
        }}
      >
        No hay suficientes tickets resueltos
      </div>
    );
  }

  return (
    <ResponsiveContainer
      width='100%'
      height={250}
      debounce={150}
    >
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={true}
          vertical={false}
          stroke={COLORS.gridLine}
        />
        <XAxis
          type='number'
          hide
        />
        <YAxis
          dataKey='name'
          type='category'
          width={120}
          tick={{ fill: COLORS.textMuted, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={tooltipStyle}
          formatter={(value) => {
            // Convierto los minutos planos a formato Horas/Minutos para mejor lectura en el tooltip
            const h = Math.floor(value / 60);
            const m = Math.round(value % 60);
            return [`${h > 0 ? h + 'h ' : ''}${m}m`, 'Promedio de Resolución'];
          }}
        />
        <Bar
          dataKey='promedio'
          name='Minutos'
          fill={COLORS.success}
          radius={[0, 4, 4, 0]}
          barSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
