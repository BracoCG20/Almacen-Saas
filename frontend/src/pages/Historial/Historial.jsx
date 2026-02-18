import { useEffect, useState } from "react";
import api from "../../service/api";
import * as XLSX from "xlsx";
import Select from "react-select";
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
} from "lucide-react";
import { toast } from "react-toastify";
import "./Historial.scss";

const Historial = () => {
	// --- ESTADOS PRINCIPALES ---
	const [historial, setHistorial] = useState([]);
	const [loading, setLoading] = useState(true);

	// --- ESTADOS DE FILTRO ---
	const [filtroTexto, setFiltroTexto] = useState("");
	const [filtroTipo, setFiltroTipo] = useState({
		value: "todos",
		label: "Todos los movimientos",
	});

	// --- ESTADOS DE PAGINACIÓN ---
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	const typeOptions = [
		{ value: "todos", label: "Todos los movimientos" },
		{ value: "entrega", label: "Asignaciones" },
		{ value: "devolucion", label: "Devoluciones" },
	];

	// --- ESTILOS REACT-SELECT ---
	const customSelectStyles = {
		control: (provided, state) => ({
			...provided,
			borderRadius: "8px",
			borderColor: state.isFocused ? "#4f46e5" : "#cbd5e1",
			boxShadow: state.isFocused ? "0 0 0 3px rgba(79, 70, 229, 0.15)" : "none",
			minHeight: "50px",
			height: "50px",
			backgroundColor: "white",
			cursor: "pointer",
		}),
		valueContainer: (provided) => ({
			...provided,
			padding: "0 14px",
			position: "relative",
		}),
		input: (provided) => ({ ...provided, margin: "0px", padding: "0px" }),
		indicatorSeparator: () => ({ display: "none" }),
		indicatorsContainer: (provided) => ({ ...provided, height: "50px" }),
		singleValue: (provided) => ({
			...provided,
			color: "#1e293b",
			fontSize: "0.95rem",
			fontWeight: "600",
			position: "absolute",
			top: "50%",
			transform: "translateY(-50%)",
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isSelected
				? "#4f46e5"
				: state.isFocused
					? "#f8fafc"
					: "white",
			color: state.isSelected ? "white" : "#334155",
			cursor: "pointer",
			padding: "12px 15px",
			fontSize: "0.95rem",
		}),
		menuPortal: (base) => ({ ...base, zIndex: 9999 }),
	};

	// --- FETCH DE DATOS ---
	useEffect(() => {
		const fetchHistorial = async () => {
			try {
				const res = await api.get("/movimientos");
				setHistorial(res.data);
			} catch (error) {
				console.error(error);
				toast.error("Error cargando el historial");
			} finally {
				setLoading(false);
			}
		};
		fetchHistorial();
	}, []);

	// Reiniciar paginación al filtrar
	useEffect(() => {
		setCurrentPage(1);
	}, [filtroTexto, filtroTipo]);

	// --- FORMATEADORES ---
	const formatDateTime = (isoString) => {
		if (!isoString) return "-";
		const date = new Date(isoString);
		return date.toLocaleString("es-PE", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	const formatDuration = (intervalObj) => {
		if (!intervalObj) return "-";
		let texto = [];
		if (intervalObj.years) texto.push(`${intervalObj.years} años`);
		if (intervalObj.months) texto.push(`${intervalObj.months} meses`);
		if (intervalObj.days) texto.push(`${intervalObj.days} días`);
		if (texto.length === 0) return "Reciente";
		return texto.join(", ");
	};

	// Obtenemos la URL base del backend dinámicamente para los PDFs
	const getBackendUrl = () => {
		const baseUrl = api.defaults.baseURL
			? api.defaults.baseURL.replace(/\/api\/?$/, "")
			: "http://localhost:5000";
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
			filtroTipo.value === "todos" || h.tipo.toLowerCase() === filtroTipo.value;
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

	// --- EXPORTAR EXCEL DETALLADO PARA DIRECTORES ---
	const exportarExcel = () => {
		if (historialFiltrado.length === 0)
			return toast.info("No hay datos para exportar");

		const dataParaExcel = historialFiltrado.map((h) => ({
			"ID Registro": h.id,
			"Fecha y Hora": formatDateTime(h.fecha_movimiento),
			"Tipo de Acción": h.tipo === "entrega" ? "ASIGNACIÓN" : "DEVOLUCIÓN",

			// Datos del Equipo
			"Equipo (Marca/Modelo)": `${h.marca} ${h.modelo}`,
			"N° Serie": h.serie,
			"Estado Físico Reportado": h.estado_equipo_momento || "Operativo",
			"¿Incluyó Cargador?": h.cargador ? "SÍ" : "NO",
			"Tiempo de Uso":
				h.tipo === "entrega" ? formatDuration(h.tiempo_uso) : "N/A",

			// Datos del Colaborador
			"Colaborador Asignado": `${h.empleado_nombre} ${h.empleado_apellido}`,
			"DNI Colaborador": h.dni || "-",
			"Correo Colaborador": h.empleado_correo || "-",

			// Auditoría y Sistema
			"Observaciones del Movimiento": h.observaciones || "Ninguna",
			"Registrado Por": h.admin_nombre
				? `${h.admin_nombre} (${h.admin_correo})`
				: "Sistema",
			"Auditoría: Correo Enviado": h.correo_enviado ? "SÍ" : "NO",
			"Auditoría: Firma PDF": h.firma_valida
				? "VÁLIDO"
				: h.pdf_firmado_url
					? "SIN VALIDAR"
					: "NO SUBIDO",
			"Enlace Documento (Acta)": h.pdf_firmado_url
				? `${getBackendUrl()}${h.pdf_firmado_url}`
				: "No disponible",
		}));

		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Auditoria_Movimientos");
		XLSX.writeFile(wb, "Reporte_Auditoria_Equipos_GTH.xlsx");
		toast.success("Reporte de Auditoría generado exitosamente");
	};

	if (loading)
		return <div className='loading-state'>Cargando Historial...</div>;

	return (
		<div className='historial-container'>
			<div className='page-header'>
				<h1>Historial y Auditoría</h1>
				<div className='header-actions'>
					<button
						onClick={exportarExcel}
						className='btn-action-header btn-excel'
					>
						<FileSpreadsheet size={18} /> Exportar Excel
					</button>
				</div>
			</div>

			<div className='filters-container'>
				<div className='search-bar'>
					<Search size={20} color='#94a3b8' />
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

			<div className='table-container'>
				{currentItems.length === 0 ? (
					<div className='no-data'>
						No se encontraron registros que coincidan.
					</div>
				) : (
					<table>
						<thead>
							<tr>
								<th>Fecha</th>
								<th className='center'>Tipo</th>
								<th>Equipo</th>
								<th>Colaborador</th>
								<th>Registrado Por</th>
								<th>Tiempo de Uso</th>
								<th className='center'>Estado</th>
							</tr>
						</thead>
						<tbody>
							{currentItems.map((h) => {
								const isEntrega = h.tipo === "entrega";
								const estLower = (h.estado_equipo_momento || "")
									.toLowerCase()
									.trim();
								let estadoClass = "neutro";

								if (estLower === "operativo") {
									estadoClass = "operativo";
								} else if (estLower === "inoperativo") {
									estadoClass = "inoperativo";
								} else if (
									estLower === "mantenimiento" ||
									estLower === "malogrado"
								) {
									estadoClass = "malogrado";
								} else if (estLower === "robado" || estLower === "perdido") {
									estadoClass = "robado";
								}

								return (
									<tr key={h.id}>
										<td>
											<div className='email-cell' style={{ color: "#64748b" }}>
												<CalendarDays size={14} />{" "}
												{formatDateTime(h.fecha_movimiento)}
											</div>
										</td>
										<td className='center'>
											<span className={`status-badge ${h.tipo}`}>
												{isEntrega ? (
													<ArrowUpRight
														size={12}
														style={{ marginRight: "4px" }}
													/>
												) : (
													<ArrowDownLeft
														size={12}
														style={{ marginRight: "4px" }}
													/>
												)}
												{isEntrega ? "ASIGNADO" : "DEVOLUCIÓN"}
											</span>
										</td>
										<td>
											<div className='info-cell'>
												<span
													className='name'
													style={{
														display: "flex",
														alignItems: "center",
														gap: "6px",
													}}
												>
													<Laptop size={14} style={{ color: "#94a3b8" }} />{" "}
													{h.marca} {h.modelo}
												</span>
												<span
													className='audit-text'
													style={{ fontFamily: "monospace" }}
												>
													S/N: {h.serie}
												</span>
											</div>
										</td>
										<td>
											<div className='info-cell'>
												<span
													className='name'
													style={{
														display: "flex",
														alignItems: "center",
														gap: "6px",
													}}
												>
													<User size={14} style={{ color: "#94a3b8" }} />{" "}
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
														<span
															className='name'
															style={{
																display: "flex",
																alignItems: "center",
																gap: "4px",
															}}
														>
															<ShieldCheck
																size={14}
																style={{ color: "#4f46e5" }}
															/>{" "}
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
													<span
														className='name'
														style={{
															color: "#059669",
															fontSize: "0.85rem",
															display: "flex",
															alignItems: "center",
															gap: "4px",
														}}
													>
														<Clock size={12} /> {formatDuration(h.tiempo_uso)}
													</span>
												</div>
											) : (
												<span style={{ color: "#cbd5e1" }}>-</span>
											)}
										</td>
										<td className='center'>
											{!isEntrega && h.estado_equipo_momento ? (
												<span className={`status-badge-mini ${estadoClass}`}>
													{h.estado_equipo_momento}
												</span>
											) : (
												<span style={{ color: "#cbd5e1" }}>-</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}

				{historialFiltrado.length > 0 && (
					<div className='pagination-footer'>
						<div className='info'>
							Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
							<strong>
								{Math.min(indexOfLastItem, historialFiltrado.length)}
							</strong>{" "}
							de <strong>{historialFiltrado.length}</strong>
						</div>

						{/* --- PAGINACIÓN ELEGANTE --- */}
						<div
							className='controls'
							style={{ display: "flex", alignItems: "center", gap: "15px" }}
						>
							<button
								onClick={() => paginate(currentPage - 1)}
								disabled={currentPage === 1}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "5px",
									padding: "6px 12px",
									borderRadius: "8px",
									fontWeight: "600",
									width: "auto",
								}}
							>
								<ChevronLeft size={16} /> Anterior
							</button>

							<span
								style={{
									fontSize: "0.9rem",
									color: "#64748b",
									fontWeight: "600",
								}}
							>
								Página {currentPage} de {totalPages}
							</span>

							<button
								onClick={() => paginate(currentPage + 1)}
								disabled={currentPage === totalPages}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "5px",
									padding: "6px 12px",
									borderRadius: "8px",
									fontWeight: "600",
									width: "auto",
								}}
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
