import { useEffect, useState } from "react";
import api from "../../service/api";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import Select from "react-select";
import {
	Plus,
	Eye,
	Edit,
	Laptop,
	CalendarDays,
	Barcode,
	FileSpreadsheet,
	Search,
	ChevronLeft,
	ChevronRight,
	AlertTriangle,
	Ban,
	Undo2,
	X,
	Check,
	Handshake,
	Building2,
	Clock,
	History,
} from "lucide-react";
import Modal from "../../components/Modal/Modal";
import AddEquipoForm from "./AddEquipoForm";
import "./Equipos.scss";

const Equipos = () => {
	const [equipos, setEquipos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [userRole, setUserRole] = useState(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [filterCondicion, setFilterCondicion] = useState({
		value: "todos",
		label: "Todos los Equipos",
	});

	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [modalType, setModalType] = useState("specs");
	const [historyData, setHistoryData] = useState([]);

	const [selectedEquipo, setSelectedEquipo] = useState(null);
	const [equipoToEdit, setEquipoToEdit] = useState(null);
	const [equipoToDelete, setEquipoToDelete] = useState(null);

	const condicionOptions = [
		{ value: "todos", label: "Todos los Equipos" },
		{ value: "propios", label: "Equipos Propios" },
		{ value: "alquilados", label: "Equipos Alquilados" },
	];

	const fetchData = async () => {
		setLoading(true);
		try {
			const resPerfil = await api.get("/auth/perfil");
			setUserRole(Number(resPerfil.data.rol_id));

			const resEquipos = await api.get("/equipos");
			const sorted = resEquipos.data.sort((a, b) => {
				if (a.disponible === b.disponible) return b.id - a.id;
				return a.disponible === false ? 1 : -1;
			});
			setEquipos(sorted);
		} catch (error) {
			toast.error("Error al cargar datos");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, filterCondicion]);

	const formatDate = (dateString) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		return date.toLocaleDateString("es-PE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	// --- LÓGICA DE ANTIGÜEDAD DINÁMICA ---
	const calcularAntiguedad = (fecha) => {
		if (!fecha) return "Sin fecha";
		const inicio = new Date(fecha);
		const ahora = new Date();

		let anios = ahora.getFullYear() - inicio.getFullYear();
		let meses = ahora.getMonth() - inicio.getMonth();

		if (meses < 0) {
			anios--;
			meses += 12;
		}

		if (anios === 0 && meses === 0) return "Reciente";

		const partAnios =
			anios > 0 ? `${anios} ${anios === 1 ? "año" : "años"}` : "";
		const partMeses =
			meses > 0 ? `${meses} ${meses === 1 ? "mes" : "meses"}` : "";

		return [partAnios, partMeses].filter(Boolean).join(" y ");
	};

	const filteredEquipos = equipos.filter((item) => {
		const term = searchTerm.toLowerCase();
		const matchesSearch =
			(item.marca || "").toLowerCase().includes(term) ||
			(item.modelo || "").toLowerCase().includes(term) ||
			(item.numero_serie || "").toLowerCase().includes(term) ||
			(item.codigo_patrimonial || "").toLowerCase().includes(term);

		let matchesCondicion = true;
		if (filterCondicion.value === "propios")
			matchesCondicion = item.es_propio === true;
		else if (filterCondicion.value === "alquilados")
			matchesCondicion = item.es_propio === false;

		return matchesSearch && matchesCondicion;
	});

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredEquipos.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(filteredEquipos.length / itemsPerPage);

	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	const exportarExcel = () => {
		const dataParaExcel = filteredEquipos.map((e) => ({
			ID: e.id,
			Marca: e.marca,
			Modelo: e.modelo,
			"N° Serie": e.numero_serie,
			"Cód. Patrimonial": e.codigo_patrimonial || "-",
			Estado: e.disponible ? e.estado_fisico_nombre : "INACTIVO",
			Observaciones: e.observaciones || "Ninguna",
			Condición: e.es_propio ? "PROPIO" : "ALQUILADO",
			"Empresa Propietaria": e.empresa_nombre || "-",
			Proveedor: e.nombre_proveedor || "-",
			"Fecha Adquisición": e.fecha_adquisicion
				? formatDate(e.fecha_adquisicion)
				: "-",
			Antigüedad: calcularAntiguedad(e.fecha_adquisicion),
			"Fin Contrato": e.fecha_fin_alquiler
				? formatDate(e.fecha_fin_alquiler)
				: "-",
		}));

		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Inventario_Completo");
		XLSX.writeFile(wb, "Reporte_Equipos_Detallado.xlsx");
	};

	const handleViewSpecs = (equipo) => {
		setModalType("specs");
		setSelectedEquipo(equipo);
		setIsModalOpen(true);
	};

	const handleAddEquipo = () => {
		setModalType("form");
		setEquipoToEdit(null);
		setIsModalOpen(true);
	};

	const handleEditEquipo = (equipo) => {
		setModalType("form");
		setEquipoToEdit(equipo);
		setIsModalOpen(true);
	};

	const confirmDelete = (equipo) => {
		setEquipoToDelete(equipo);
		setIsDeleteModalOpen(true);
	};

	const toggleDisponibilidad = async (equipo, nuevaDisponibilidad) => {
		try {
			await api.put(`/equipos/${equipo.id}/disponibilidad`, {
				disponible: nuevaDisponibilidad,
			});
			toast.success(
				`Equipo ${nuevaDisponibilidad ? "reactivado" : "dado de baja"} exitosamente`,
			);
			fetchData();
			setIsDeleteModalOpen(false);
			setEquipoToDelete(null);
		} catch (error) {
			toast.error("Error al actualizar disponibilidad");
		}
	};

	const handleFormSuccess = () => {
		setIsModalOpen(false);
		fetchData();
	};

	const customFilterStyles = {
		control: (provided, state) => ({
			...provided,
			backgroundColor: "white",
			border: state.isFocused ? "1px solid #7c3aed" : "1px solid #e2e8f0",
			borderRadius: "12px",
			padding: "0px 6px",
			height: "48px",
			minHeight: "48px",
			boxShadow: state.isFocused ? "0 0 0 3px rgba(124, 58, 237, 0.1)" : "none",
			cursor: "pointer",
			"&:hover": { borderColor: "#7c3aed" },
		}),
		indicatorSeparator: () => ({ display: "none" }),
		singleValue: (provided) => ({
			...provided,
			color: "#1e293b",
			fontWeight: "500",
			fontSize: "0.95rem",
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isSelected
				? "#7c3aed"
				: state.isFocused
					? "#f8fafc"
					: "white",
			color: state.isSelected ? "white" : "#334155",
			cursor: "pointer",
		}),
	};

	// --- FUNCIÓN PARA VER HISTORIAL ---
	const handleViewHistory = async (equipo) => {
		setSelectedEquipo(equipo);
		setModalType("history");
		setHistoryData([]);
		setIsModalOpen(true);
		try {
			const res = await api.get(`/equipos/${equipo.id}/historial`);
			setHistoryData(res.data);
		} catch (error) {
			toast.error("Error al cargar historial");
		}
	};

	if (loading)
		return <div className='loading-state'>Cargando inventario...</div>;

	return (
		<div className='equipos-container'>
			<div className='page-header'>
				<h1>Inventario de Equipos</h1>
				<div className='header-actions'>
					<button
						onClick={exportarExcel}
						className='btn-action-header btn-excel'
					>
						<FileSpreadsheet size={18} /> Exportar Excel
					</button>
					<button
						className='btn-action-header btn-add'
						onClick={handleAddEquipo}
					>
						<Plus size={18} /> Nuevo Equipo
					</button>
				</div>
			</div>

			<div className='filters-bar'>
				<div className='search-input'>
					<Search size={20} color='#94a3b8' />
					<input
						type='text'
						placeholder='Buscar por Marca, Modelo, Serie o Cód. Pat...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
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

			<div className='table-container'>
				{currentItems.length === 0 ? (
					<div className='no-data'>No se encontraron equipos.</div>
				) : (
					<table>
						<thead>
							<tr>
								<th className='center'>Icono</th>
								<th>Equipo</th>
								<th>S/N & Código</th>
								<th>Condición</th>
								<th>Adquisición</th>
								<th>Antigüedad</th>
								<th>Estado Físico</th>
								<th className='center'>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{currentItems.map((item) => (
								<tr
									key={item.id}
									className={!item.disponible ? "inactive-row" : ""}
								>
									<td className='center'>
										<div className='device-icon-box'>
											<Laptop size={20} />
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
											<span
												className='name'
												style={{ fontFamily: "monospace" }}
											>
												{item.numero_serie}
											</span>
											<span className='audit-text'>
												{item.codigo_patrimonial || "Sin código"}
											</span>
										</div>
									</td>
									<td>
										<div className='info-cell'>
											<span
												className='name'
												style={{
													color: item.es_propio ? "#4f46e5" : "#ea580c",
												}}
											>
												{item.es_propio ? "PROPIO" : "ALQUILADO"}
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
											<span className='audit-text'>
												<CalendarDays
													size={10}
													style={{ marginRight: "3px" }}
												/>{" "}
												{formatDate(item.fecha_adquisicion)}
											</span>
										</div>
									</td>
									<td>
										<div className='info-cell'>
											<span className='name' style={{ color: "#4f46e5" }}>
												{calcularAntiguedad(item.fecha_adquisicion)}
											</span>
										</div>
									</td>
									<td>
										<span
											className={`status-badge ${item.estado_fisico_nombre?.toLowerCase() === "operativo" ? "operativo" : "mantenimiento"}`}
										>
											{item.estado_fisico_nombre || "Desconocido"}
										</span>
									</td>
									<td className='center'>
										<div className='actions-cell'>
											{/* BOTÓN HISTORIAL */}
											<button
												className='action-btn history'
												onClick={() => handleViewHistory(item)}
												title='Ver Historial'
											>
												<History size={18} />
											</button>
											<button
												className='action-btn view'
												onClick={() => handleViewSpecs(item)}
												title='Ver Ficha'
											>
												<Eye size={18} />
											</button>
											{item.disponible ? (
												<>
													<button
														className='action-btn edit'
														onClick={() => handleEditEquipo(item)}
														title='Editar'
													>
														<Edit size={18} />
													</button>
													{userRole === 1 && (
														<button
															className='action-btn delete'
															onClick={() => confirmDelete(item)}
															title='Dar de baja'
														>
															<Ban size={18} />
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
														<Undo2 size={18} />
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

				{filteredEquipos.length > 0 && (
					<div className='pagination-footer'>
						<div className='info'>
							Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
							<strong>
								{Math.min(indexOfLastItem, filteredEquipos.length)}
							</strong>{" "}
							de <strong>{filteredEquipos.length}</strong>
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

			{/* MODALES DINÁMICOS SEGÚN EL ESTADO modalType */}
			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title={
					modalType === "specs"
						? "Ficha Técnica del Equipo"
						: modalType === "history"
							? "Historial del Equipo"
							: equipoToEdit
								? "Editar Equipo"
								: "Registrar Nuevo Equipo"
				}
			>
				{/* --- RENDERIZADO DEL HISTORIAL --- */}
				{modalType === "history" ? (
					<div className='history-container'>
						<div className='history-header'>
							<div className='big-icon'>
								<History size={36} color='#4f46e5' />
							</div>
							<div className='title-info-wrapper'>
								<h3>
									{selectedEquipo?.marca} {selectedEquipo?.modelo}
								</h3>
								<span style={{ fontFamily: "monospace", color: "#64748b" }}>
									S/N: {selectedEquipo?.numero_serie} | Cód:{" "}
									{selectedEquipo?.codigo_patrimonial || "N/A"}
								</span>
							</div>
						</div>

						{historyData.length === 0 ? (
							<p className='no-history'>
								No hay movimientos registrados para este equipo.
							</p>
						) : (
							<div className='history-timeline'>
								{historyData.map((hist) => (
									<div key={hist.id} className='timeline-item'>
										<div className='timeline-date'>
											<strong>
												{new Date(hist.fecha_accion).toLocaleDateString(
													"es-PE",
												)}
											</strong>
											<span>
												{new Date(hist.fecha_accion).toLocaleTimeString(
													"es-PE",
													{ hour: "2-digit", minute: "2-digit" },
												)}
											</span>
										</div>

										<div className='timeline-content'>
											<h5>{hist.accion_realizada}</h5>

											<div className='hist-details-grid'>
												<span
													className={`hist-tag ${hist.es_propio ? "owned" : "rented"}`}
												>
													{hist.es_propio ? (
														<Building2 size={10} />
													) : (
														<Handshake size={10} />
													)}
													{hist.es_propio
														? hist.empresa_nombre
														: hist.proveedor_nombre}
												</span>

												<span
													className={`status-badge ${hist.estado_fisico_nombre?.toLowerCase() === "operativo" ? "operativo" : "mantenimiento"}`}
												>
													{hist.estado_fisico_nombre || "Estado Desconocido"}
												</span>

												<span
													className={`status-badge ${hist.disponible ? "operativo" : "malogrado"}`}
												>
													{hist.disponible ? "DISPONIBLE" : "INACTIVO"}
												</span>
											</div>

											{hist.observaciones_equipo && (
												<div className='hist-observations'>
													<AlertTriangle size={12} />
													<span>
														<strong>Obs:</strong> {hist.observaciones_equipo}
													</span>
												</div>
											)}

											<div className='timeline-footer'>
												<small>
													Responsable:{" "}
													{hist.usuario_nombres
														? `${hist.usuario_nombres} ${hist.usuario_apellidos}`
														: hist.usuario_email || "Sistema"}
												</small>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				) : modalType === "specs" ? (
					selectedEquipo && (
						<div className='specs-grid'>
							<div className='header-specs'>
								<div className='big-icon'>
									<Laptop size={36} />
								</div>
								<div className='title-info-wrapper'>
									<h3>
										{selectedEquipo.marca} {selectedEquipo.modelo}
									</h3>
									<div className='badge-wrapper'>
										<span
											className={`status-badge ${selectedEquipo.disponible ? "operativo" : "malogrado"}`}
										>
											{selectedEquipo.disponible ? "DISPONIBLE" : "INACTIVO"}
										</span>
										<span
											className={`ownership-badge ${selectedEquipo.es_propio ? "owned" : "rented"}`}
										>
											{selectedEquipo.es_propio ? (
												<>
													<Building2 size={12} /> PROPIO
												</>
											) : (
												<>
													<Handshake size={12} /> ALQUILADO
												</>
											)}
										</span>
									</div>
									<div className='owner-info-text'>
										{selectedEquipo.es_propio
											? `Empresa: ${selectedEquipo.empresa_nombre}`
											: `Proveedor: ${selectedEquipo.nombre_proveedor}`}
									</div>
								</div>
							</div>

							{selectedEquipo.observaciones && (
								<div className='observation-alert'>
									<h5>
										<AlertTriangle size={14} /> Observaciones
									</h5>
									<p>"{selectedEquipo.observaciones}"</p>
								</div>
							)}

							<h4>Identificación y Adquisición</h4>
							<div className='grid-2-col'>
								<div className='info-box light'>
									<Barcode size={24} className='icon-barcode' />
									<div>
										<span className='label'>Código Patrimonial</span>
										<span className='value'>
											{selectedEquipo.codigo_patrimonial || "N/A"}
										</span>
									</div>
								</div>
								<div className='info-box'>
									<span className='label'>Número de Serie (S/N)</span>
									<span className='value'>{selectedEquipo.numero_serie}</span>
								</div>
							</div>

							<div className='grid-2-col'>
								<div className='info-box'>
									<span className='label'>Fecha de Adquisición</span>
									<span
										className='value-text'
										style={{
											fontSize: "0.9rem",
											color: "#334155",
											fontWeight: "700",
										}}
									>
										{formatDate(selectedEquipo.fecha_adquisicion)}
									</span>
								</div>
								<div className='info-box'>
									<span className='label'>Tiempo en la Empresa</span>
									<span
										className='value-text'
										style={{
											fontSize: "0.9rem",
											color: "#4f46e5",
											fontWeight: "700",
										}}
									>
										<Clock size={12} />{" "}
										{calcularAntiguedad(selectedEquipo.fecha_adquisicion)}
									</span>
								</div>
							</div>

							{selectedEquipo.especificaciones &&
								Object.keys(selectedEquipo.especificaciones).length > 0 && (
									<>
										<h4 className='mt'>Especificaciones Técnicas</h4>
										<div className='specs-list'>
											{Object.entries(selectedEquipo.especificaciones).map(
												([key, value], index) => (
													<div
														key={key}
														className={`spec-item ${index % 2 !== 0 ? "odd" : ""}`}
													>
														<strong>{key}:</strong>{" "}
														<span>{value || "N/A"}</span>
													</div>
												),
											)}
										</div>
									</>
								)}
						</div>
					)
				) : (
					<AddEquipoForm
						onSuccess={handleFormSuccess}
						equipoToEdit={equipoToEdit}
					/>
				)}
			</Modal>

			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				title='Confirmar Baja'
			>
				<div className='confirm-modal-content'>
					<div className='warning-icon'>
						<AlertTriangle size={40} />
					</div>
					<h3>¿Estás seguro?</h3>
					<p>
						Estás a punto de dar de baja el equipo{" "}
						<strong>
							{equipoToDelete?.marca} {equipoToDelete?.modelo}
						</strong>{" "}
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
