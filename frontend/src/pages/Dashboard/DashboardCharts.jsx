import React from "react";
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
} from "recharts";

// --- PALETA DE COLORES MODERNA (Estilo Synaptix/Premium) ---
const COLORS = {
	primary: "#7c3aed", // Morado vibrante
	primaryLight: "#c4b5fd", // Morado claro
	secondary: "#3b82f6", // Azul moderno
	secondaryLight: "#93c5fd", // Azul claro
	success: "#10b981", // Verde esmeralda
	warning: "#f59e0b", // Ámbar/Naranja
	danger: "#ef4444", // Rojo
	textMuted: "#94a3b8", // Gris para textos secundarios
	gridLine: "#f1f5f9", // Líneas de cuadrícula muy sutiles
};

const tooltipStyle = {
	backgroundColor: "#ffffff",
	borderRadius: "16px",
	border: "none",
	boxShadow:
		"0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 5px 10px -5px rgba(0, 0, 0, 0.04)",
	padding: "12px 16px",
};

// 1. Gráfico de Barras: Entregas vs Devoluciones
// SE AÑADIÓ debounce={150} a todos los ResponsiveContainer
export const MovementsChart = ({ data }) => {
	return (
		<ResponsiveContainer width='100%' height={320} debounce={150}>
			<BarChart
				data={data}
				margin={{ top: 20, right: 0, left: -15, bottom: 0 }}
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
					tick={{ fill: COLORS.textMuted, fontSize: 12, fontWeight: 500 }}
					dy={10}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fill: COLORS.textMuted, fontSize: 12 }}
					dx={-10}
				/>
				<Tooltip
					cursor={{ fill: "#f8fafc", opacity: 0.5 }}
					contentStyle={tooltipStyle}
					labelStyle={{
						fontWeight: 700,
						color: "#1e293b",
						marginBottom: "5px",
					}}
				/>
				<Legend wrapperStyle={{ paddingTop: "20px" }} iconType='circle' />
				<Bar
					dataKey='entregas'
					name='Entregas'
					fill={COLORS.success}
					radius={[8, 8, 0, 0]}
					barSize={28}
				/>
				<Bar
					dataKey='devoluciones'
					name='Devoluciones'
					fill={COLORS.secondaryLight}
					radius={[8, 8, 0, 0]}
					barSize={28}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

// 2. Gráfico de Dona: Estado del Inventario
export const StatusChart = ({ data }) => {
	const STATUS_COLORS = {
		Operativos: COLORS.success,
		"En Mantenimiento": COLORS.warning,
		Inoperativos: COLORS.danger,
	};
	return (
		<ResponsiveContainer width='100%' height={280} debounce={150}>
			<PieChart>
				<Pie
					data={data}
					cx='50%'
					cy='50%'
					innerRadius={75}
					outerRadius={95}
					paddingAngle={5}
					dataKey='value'
					cornerRadius={8}
				>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={STATUS_COLORS[entry.name] || COLORS.textMuted}
							stroke='none'
						/>
					))}
				</Pie>
				<Tooltip contentStyle={tooltipStyle} itemStyle={{ fontWeight: 600 }} />
				<Legend
					verticalAlign='bottom'
					height={36}
					iconType='circle'
					wrapperStyle={{
						fontSize: "13px",
						color: COLORS.textMuted,
						fontWeight: 500,
					}}
				/>
			</PieChart>
		</ResponsiveContainer>
	);
};

// 3. Gráfico de Barras Apiladas: Disponibilidad
export const InventoryOriginChart = ({ data }) => {
	return (
		<ResponsiveContainer width='100%' height={280} debounce={150}>
			<BarChart
				data={data}
				margin={{ top: 20, right: 0, left: -15, bottom: 0 }}
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
					tick={{ fill: COLORS.textMuted, fontSize: 12, fontWeight: 600 }}
					dy={10}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fill: COLORS.textMuted, fontSize: 12 }}
					dx={-10}
				/>
				<Tooltip
					cursor={{ fill: "#f8fafc", opacity: 0.5 }}
					contentStyle={tooltipStyle}
				/>
				<Legend
					verticalAlign='bottom'
					height={36}
					iconType='circle'
					wrapperStyle={{ fontSize: "12px", paddingTop: "15px" }}
				/>
				<Bar
					dataKey='Disponibles'
					stackId='a'
					fill={COLORS.success}
					barSize={40}
				/>
				<Bar
					dataKey='Ocupados'
					stackId='a'
					fill={COLORS.secondary}
					barSize={40}
				/>
				<Bar
					dataKey='Inoperativos'
					stackId='a'
					fill={COLORS.danger}
					radius={[8, 8, 0, 0]}
					barSize={40}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

// 4. Gráfico de Área: Antigüedad
export const AgeChart = ({ data }) => {
	return (
		<ResponsiveContainer width='100%' height={280} debounce={150}>
			<AreaChart
				data={data}
				margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
			>
				<defs>
					<linearGradient id='colorAge' x1='0' y1='0' x2='0' y2='1'>
						<stop offset='5%' stopColor={COLORS.primary} stopOpacity={0.3} />
						<stop offset='95%' stopColor={COLORS.primary} stopOpacity={0} />
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
					tick={{ fill: COLORS.textMuted, fontSize: 12 }}
					dy={10}
				/>
				<YAxis
					axisLine={false}
					tickLine={false}
					tick={{ fill: COLORS.textMuted, fontSize: 12 }}
					dx={-10}
				/>
				<Tooltip contentStyle={tooltipStyle} />
				<Area
					type='monotone'
					dataKey='cantidad'
					name='Equipos Adquiridos'
					stroke={COLORS.primary}
					strokeWidth={3}
					fillOpacity={1}
					fill='url(#colorAge)'
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
		<ResponsiveContainer width='100%' height={280} debounce={150}>
			<PieChart>
				<Pie
					data={data}
					cx='50%'
					cy='65%'
					startAngle={180}
					endAngle={0}
					innerRadius={80}
					outerRadius={100}
					paddingAngle={4}
					dataKey='value'
					cornerRadius={8}
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
					height={36}
					iconType='circle'
					wrapperStyle={{
						fontSize: "13px",
						color: COLORS.textMuted,
						fontWeight: 500,
					}}
				/>
			</PieChart>
		</ResponsiveContainer>
	);
};

// 6. Top Empresas
export const CompanyChart = ({ data }) => {
	return (
		<ResponsiveContainer width='100%' height={280} debounce={150}>
			<BarChart
				layout='vertical'
				data={data}
				margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
			>
				<CartesianGrid
					strokeDasharray='3 3'
					horizontal={true}
					vertical={false}
					stroke={COLORS.gridLine}
				/>
				<XAxis type='number' hide />
				<YAxis
					dataKey='name'
					type='category'
					width={100}
					tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 500 }}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip
					cursor={{ fill: "#f8fafc", opacity: 0.5 }}
					contentStyle={tooltipStyle}
				/>
				<Bar
					dataKey='cantidad'
					name='Equipos Propios'
					fill={COLORS.primary}
					radius={[0, 8, 8, 0]}
					barSize={20}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

// 7. Top Proveedores
export const ProviderChart = ({ data }) => {
	return (
		<ResponsiveContainer width='100%' height={280} debounce={150}>
			<BarChart
				layout='vertical'
				data={data}
				margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
			>
				<CartesianGrid
					strokeDasharray='3 3'
					horizontal={true}
					vertical={false}
					stroke={COLORS.gridLine}
				/>
				<XAxis type='number' hide />
				<YAxis
					dataKey='name'
					type='category'
					width={100}
					tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 500 }}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip
					cursor={{ fill: "#f8fafc", opacity: 0.5 }}
					contentStyle={tooltipStyle}
				/>
				<Bar
					dataKey='cantidad'
					name='Equipos de Proveedor'
					fill={COLORS.secondary}
					radius={[0, 8, 8, 0]}
					barSize={20}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

// 8. Gráfico de Dona: Resumen Total
export const GlobalInventoryChart = ({ data }) => {
	const PIE_COLORS = {
		"Propios (Almacén)": COLORS.primaryLight,
		"Propios (Asignados)": COLORS.primary,
		"Proveedor (Almacén)": COLORS.secondaryLight,
		"Proveedor (Asignados)": COLORS.secondary,
	};
	return (
		<ResponsiveContainer width='100%' height={280} debounce={150}>
			<PieChart>
				<Pie
					data={data}
					cx='50%'
					cy='45%'
					innerRadius={55}
					outerRadius={85}
					paddingAngle={3}
					dataKey='value'
					cornerRadius={6}
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
					height={48}
					iconType='circle'
					wrapperStyle={{
						fontSize: "11px",
						color: COLORS.textMuted,
						fontWeight: 500,
					}}
				/>
			</PieChart>
		</ResponsiveContainer>
	);
};

// 9. Gasto por Categoría de Servicio
export const CategoryCostChart = ({ data, currency }) => {
	return (
		<ResponsiveContainer width='100%' height={280} debounce={150}>
			<BarChart
				layout='vertical'
				data={data}
				margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
			>
				<CartesianGrid
					strokeDasharray='3 3'
					horizontal={true}
					vertical={false}
					stroke={COLORS.gridLine}
				/>
				<XAxis type='number' hide />
				<YAxis
					dataKey='name'
					type='category'
					width={120}
					tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 500 }}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip
					cursor={{ fill: "#f8fafc", opacity: 0.5 }}
					contentStyle={tooltipStyle}
					formatter={(value) => [
						`${currency} ${value.toFixed(2)}`,
						"Costo Mensual",
					]}
				/>
				<Bar
					dataKey='costo'
					name='Costo Mensualizado'
					fill={COLORS.primary}
					radius={[0, 8, 8, 0]}
					barSize={20}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};

// 10. Top Servicios más costosos
export const ServiceCostChart = ({ data, currency }) => {
	return (
		<ResponsiveContainer width='100%' height={280} debounce={150}>
			<BarChart
				layout='vertical'
				data={data}
				margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
			>
				<CartesianGrid
					strokeDasharray='3 3'
					horizontal={true}
					vertical={false}
					stroke={COLORS.gridLine}
				/>
				<XAxis type='number' hide />
				<YAxis
					dataKey='name'
					type='category'
					width={120}
					tick={{ fill: COLORS.textMuted, fontSize: 11, fontWeight: 500 }}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip
					cursor={{ fill: "#f8fafc", opacity: 0.5 }}
					contentStyle={tooltipStyle}
					formatter={(value) => [
						`${currency} ${value.toFixed(2)}`,
						"Costo Mensual",
					]}
				/>
				<Bar
					dataKey='costo'
					name='Costo Mensualizado'
					fill={COLORS.secondary}
					radius={[0, 8, 8, 0]}
					barSize={20}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
};
