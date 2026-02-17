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

const COLORS = {
  primary: '#7c3aed',
  secondary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  dark: '#1e293b',
  gray: '#cbd5e1',
};

// 1. Gráfico de Barras: Entregas vs Devoluciones
export const MovementsChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={300}
    >
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          vertical={false}
          stroke='#e2e8f0'
        />
        <XAxis
          dataKey='name'
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: '#f1f5f9' }}
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        />
        <Legend />
        <Bar
          dataKey='entregas'
          name='Entregas'
          fill={COLORS.success}
          radius={[4, 4, 0, 0]}
          barSize={30}
        />
        <Bar
          dataKey='devoluciones'
          name='Devoluciones'
          fill={COLORS.danger}
          radius={[4, 4, 0, 0]}
          barSize={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// 2. Gráfico de Dona: Estado del Inventario
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
    >
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='50%'
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey='value'
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.name] || COLORS.gray}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        />
        <Legend
          verticalAlign='bottom'
          height={36}
          iconType='circle'
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// 3. Gráfico de Barras Apiladas: Disponibilidad según Propiedad
export const InventoryOriginChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          vertical={false}
          stroke='#e2e8f0'
        />
        <XAxis
          dataKey='name'
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        />
        <Legend
          verticalAlign='bottom'
          height={36}
          iconType='circle'
        />

        {/* LAS TRES BARRAS APILADAS (stackId='a' las une en una sola columna) */}
        <Bar
          dataKey='Disponibles'
          stackId='a'
          fill={COLORS.success}
          barSize={45}
        />
        <Bar
          dataKey='Ocupados'
          stackId='a'
          fill={COLORS.secondary}
          barSize={45}
        />
        <Bar
          dataKey='Inoperativos'
          stackId='a'
          fill={COLORS.danger}
          radius={[4, 4, 0, 0]}
          barSize={45}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// 4. Gráfico de Área: Antigüedad
export const AgeChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient
            id='colorPv'
            x1='0'
            y1='0'
            x2='0'
            y2='1'
          >
            <stop
              offset='5%'
              stopColor={COLORS.primary}
              stopOpacity={0.8}
            />
            <stop
              offset='95%'
              stopColor={COLORS.primary}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey='year'
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        />
        <Area
          type='monotone'
          dataKey='cantidad'
          name='Equipos'
          stroke={COLORS.primary}
          fillOpacity={1}
          fill='url(#colorPv)'
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// 5. Gráfico Pie: Estado de Firmas
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
    >
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='50%'
          startAngle={180}
          endAngle={0}
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey='value'
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.name] || COLORS.gray}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        />
        <Legend
          verticalAlign='bottom'
          height={36}
          iconType='circle'
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// 6. Top Empresas
export const CompanyChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={true}
          vertical={false}
          stroke='#e2e8f0'
        />
        <XAxis
          type='number'
          hide
        />
        <YAxis
          dataKey='name'
          type='category'
          width={110}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Bar
          dataKey='cantidad'
          name='Equipos Propios'
          fill={COLORS.primary}
          radius={[0, 4, 4, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// 7. Top Proveedores
export const ProviderChart = ({ data }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={true}
          vertical={false}
          stroke='#e2e8f0'
        />
        <XAxis
          type='number'
          hide
        />
        <YAxis
          dataKey='name'
          type='category'
          width={110}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#fff7ed' }}
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        />
        <Bar
          dataKey='cantidad'
          name='Equipos de Proveedor'
          fill={COLORS.warning}
          radius={[0, 4, 4, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// 8. Gráfico de Dona para Resumen Total
export const GlobalInventoryChart = ({ data }) => {
  const PIE_COLORS = {
    'Propios (Almacén)': '#818cf8',
    'Propios (Asignados)': '#4f46e5',
    'Proveedor (Almacén)': '#fcd34d',
    'Proveedor (Asignados)': '#f59e0b',
  };
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='45%'
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey='value'
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PIE_COLORS[entry.name] || COLORS.gray}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        />
        <Legend
          verticalAlign='bottom'
          height={48}
          iconType='circle'
          wrapperStyle={{ fontSize: '11px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// 9. NUEVO: Gasto por Categoría de Servicio
export const CategoryCostChart = ({ data, currency }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={true}
          vertical={false}
          stroke='#e2e8f0'
        />
        <XAxis
          type='number'
          hide
        />
        <YAxis
          dataKey='name'
          type='category'
          width={130}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value) => [
            `${currency} ${value.toFixed(2)}`,
            'Costo Mensual',
          ]}
        />
        <Bar
          dataKey='costo'
          name='Costo Mensualizado'
          fill='#8b5cf6'
          radius={[0, 4, 4, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// 10. NUEVO: Top Servicios más costosos
export const ServiceCostChart = ({ data, currency }) => {
  return (
    <ResponsiveContainer
      width='100%'
      height={250}
    >
      <BarChart
        layout='vertical'
        data={data}
        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          horizontal={true}
          vertical={false}
          stroke='#e2e8f0'
        />
        <XAxis
          type='number'
          hide
        />
        <YAxis
          dataKey='name'
          type='category'
          width={130}
          tick={{ fill: '#475569', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{
            borderRadius: '8px',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value) => [
            `${currency} ${value.toFixed(2)}`,
            'Costo Mensual',
          ]}
        />
        <Bar
          dataKey='costo'
          name='Costo Mensualizado'
          fill='#ec4899'
          radius={[0, 4, 4, 0]}
          barSize={20}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
