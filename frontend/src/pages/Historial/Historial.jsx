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
	const [historial, setHistorial] = useState([]);
	const [filtroTexto, setFiltroTexto] = useState("");
	const [filtroTipo, setFiltroTipo] = useState({
		value: "todos",
		label: "Todos los movimientos",
	});
	const [loading, setLoading] = useState(true);

	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const typeOptions = [
		{ value: "todos", label: "Todos los movimientos" },
		{ value: "entrega", label: "Asignaciones" }, // <-- Cambiado visualmente a Asignaciones
		{ value: "devolucion", label: "Devoluciones" },
	];

	// --- ESTILOS REACT-SELECT A 50PX Y CENTRADOS ---
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

	useEffect(() => {
		setCurrentPage(1);
	}, [filtroTexto, filtroTipo]);

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

	const exportarExcel = () => {
		const dataParaExcel = historial.map((h) => ({
			Fecha: formatDateTime(h.fecha_movimiento),
			Tipo: h.tipo === "entrega" ? "ASIGNADO" : "DEVOLUCIÓN", // <-- Cambiado en el Excel
			Marca: h.marca,
			Modelo: h.modelo,
			Serie: h.serie,
			Empleado: `${h.empleado_nombre} ${h.empleado_apellido}`,
			DNI: h.dni || "-",
			Responsable: h.admin_nombre ? h.admin_nombre : "Sistema",
			"Correo Responsable": h.admin_correo || "-",
			"Tiempo de Uso":
				h.tipo === "entrega" ? formatDuration(h.tiempo_uso) : "-",
			"Estado Final": h.estado_equipo_momento || "-",
			Observaciones: h.observaciones || "",
		}));

		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Historial");
		XLSX.writeFile(wb, "Reporte_Historial_GTH.xlsx");
	};

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

								// --- SOLUCIÓN AL BUG DEL COLOR DE INOPERATIVO ---
								const estLower = (h.estado_equipo_momento || "")
									.toLowerCase()
									.trim();
								let estadoClass = "neutro";

								// Usamos coincidencia exacta (===) en lugar de .includes()
								if (estLower === "operativo") {
									estadoClass = "operativo";
								} else if (estLower === "inoperativo") {
									estadoClass = "inoperativo"; // <-- Nueva clase CSS
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
											{/* Aquí se define el color y el texto: ASIGNADO O DEVOLUCIÓN */}
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
						<div className='controls'>
							<button
								onClick={() => paginate(currentPage - 1)}
								disabled={currentPage === 1}
							>
								<ChevronLeft size={16} />
							</button>
							{[...Array(totalPages)].map((_, i) => (
								<button
									key={i + 1}
									onClick={() => paginate(i + 1)}
									className={currentPage === i + 1 ? "active" : ""}
									disabled={currentPage === i + 1}
								>
									{i + 1}
								</button>
							))}
							<button
								onClick={() => paginate(currentPage + 1)}
								disabled={currentPage === totalPages}
							>
								<ChevronRight size={16} />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Historial;
