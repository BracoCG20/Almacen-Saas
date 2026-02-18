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
	FileSpreadsheet,
	Search,
	ChevronLeft,
	ChevronRight,
	AlertTriangle,
	Ban,
	Undo2,
	X,
	Check,
	History,
} from "lucide-react";
import Modal from "../../components/Modal/Modal";
import AddEquipoForm from "./AddEquipoForm";
import EquipoHistorial from "./EquipoHistorial";
import EquipoSpecs from "./EquipoSpecs";
import "./Equipos.scss";

const Equipos = () => {
	// --- ESTADOS PRINCIPALES ---
	const [equipos, setEquipos] = useState([]);
	const [loading, setLoading] = useState(true);
	const [userRole, setUserRole] = useState(null);

	// --- ESTADOS DE FILTRO ---
	const [searchTerm, setSearchTerm] = useState("");
	const [filterCondicion, setFilterCondicion] = useState({
		value: "todos",
		label: "Todos los Equipos",
	});

	// --- ESTADOS DE PAGINACIÓN ---
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// --- ESTADOS DE MODALES ---
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

	// --- FETCH DE DATOS ---
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

	// Reiniciar paginación al filtrar
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm, filterCondicion]);

	// --- FORMATEADORES ---
	const formatDate = (dateString) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		return date.toLocaleDateString("es-PE", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

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

	// --- LÓGICA DE FILTRADO ---
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

	// --- EXPORTAR EXCEL DETALLADO PARA DIRECTORES ---
	const exportarExcel = () => {
		if (equipos.length === 0) return toast.info("No hay datos para exportar");

		const dataParaExcel = filteredEquipos.map((e) => {
			// --- LÓGICA DE SEGURIDAD PARA EL JSON ---
			let specs = {};
			try {
				if (typeof e.especificaciones === "string") {
					// Si viene como texto, lo convertimos a objeto
					specs = JSON.parse(e.especificaciones);
				} else if (
					typeof e.especificaciones === "object" &&
					e.especificaciones !== null
				) {
					// Si ya es un objeto, lo usamos directamente
					specs = e.especificaciones;
				}
			} catch (error) {
				console.warn("Error parseando especificaciones:", error);
				specs = {};
			}

			return {
				"ID Inventario": e.id,
				"Código Patrimonial": e.codigo_patrimonial || "No asignado",
				Marca: e.marca,
				Modelo: e.modelo,
				"Número de Serie": e.numero_serie,
				"Estado Actual": e.disponible ? "ACTIVO" : "BAJA",
				"Condición Física": e.estado_fisico_nombre || "Desconocido",

				// Datos de Propiedad
				"Tipo de Propiedad": e.es_propio ? "PROPIO" : "ALQUILADO",
				"Empresa Propietaria": e.empresa_nombre || "-",
				"Proveedor (Si es alquilado)": e.nombre_proveedor || "-",

				// Fechas Clave
				"Fecha Adquisición/Inicio": e.fecha_adquisicion
					? formatDate(e.fecha_adquisicion)
					: "-",
				"Fecha Fin Alquiler": e.fecha_fin_alquiler
					? formatDate(e.fecha_fin_alquiler)
					: "-",
				"Tiempo de Antigüedad": calcularAntiguedad(e.fecha_adquisicion),

				// Especificaciones Técnicas (Ahora sí seguras)
				// Probamos con minúsculas y Mayúsculas por si acaso
				Procesador: specs.procesador || specs.Procesador || "-",
				"Memoria RAM": specs.ram || specs.RAM || specs.Ram || "-",
				Almacenamiento: specs.almacenamiento || specs.Almacenamiento || "-",

				// Observaciones
				"Notas Adicionales": e.observaciones || "Ninguna",
			};
		});

		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Inventario_Equipos");
		XLSX.writeFile(wb, "Reporte_Gerencial_Inventario.xlsx");
		toast.success("Reporte gerencial generado exitosamente");
	};

	// --- HANDLERS DE MODALES ---
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
						<div
							className='controls'
							style={{ display: "flex", alignItems: "center", gap: "15px" }}
						>
							<button
								onClick={() => setCurrentPage(currentPage - 1)}
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
								onClick={() => setCurrentPage(currentPage + 1)}
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
				{modalType === "history" ? (
					<EquipoHistorial equipo={selectedEquipo} historyData={historyData} />
				) : modalType === "specs" ? (
					<EquipoSpecs
						equipo={selectedEquipo}
						calcularAntiguedad={calcularAntiguedad}
						formatDate={formatDate}
					/>
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
