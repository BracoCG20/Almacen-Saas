import { useEffect, useState } from "react";
import api from "../../service/api";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import Select from "react-select";
import {
	Plus,
	User,
	UserRound,
	MessageCircle,
	Edit,
	Ban,
	Mail,
	AlertTriangle,
	X,
	Check,
	FileSpreadsheet,
	Search,
	Undo2,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";

import Modal from "../../components/Modal/Modal";
import AddColaboradorForm from "./AddColaboradorForm";
import "./Colaboradores.scss";

const Colaboradores = () => {
	// --- ESTADOS PRINCIPALES ---
	const [colaboradores, setColaboradores] = useState([]);
	const [empresasOptions, setEmpresasOptions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [userRole, setUserRole] = useState(null);

	// --- ESTADOS DE FILTRO Y BÚSQUEDA ---
	const [searchTerm, setSearchTerm] = useState("");
	const [filterEmpresa, setFilterEmpresa] = useState({
		value: "todas",
		label: "Todas las Empresas",
	});

	// --- ESTADOS DE PAGINACIÓN ---
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 8;

	// --- ESTADOS DE MODALES ---
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [colaboradorToEdit, setColaboradorToEdit] = useState(null);
	const [colaboradorToDelete, setColaboradorToDelete] = useState(null);

	// --- FETCH INICIAL DE DATOS ---
	const fetchData = async () => {
		setLoading(true);
		try {
			// 1. Obtener rol del usuario
			const resPerfil = await api.get("/auth/perfil");
			setUserRole(Number(resPerfil.data.rol_id));

			// 2. Obtener lista de empresas para el filtro
			try {
				const resEmpresas = await api.get("/empresas");
				const options = resEmpresas.data
					.filter((e) => e.estado === true || e.estado === "Activo")
					.map((e) => ({
						value: e.id,
						label: e.razon_social,
					}));
				setEmpresasOptions([
					{ value: "todas", label: "Todas las Empresas" },
					...options,
				]);
			} catch (err) {
				console.error("Error cargando empresas", err);
				setEmpresasOptions([{ value: "todas", label: "Todas las Empresas" }]);
			}

			// 3. Obtener lista de colaboradores
			const res = await api.get("/colaboradores");
			const sorted = res.data.sort((a, b) => {
				// Ordenar por estado (Activos primero) y luego alfabéticamente
				if (a.estado === b.estado) return a.nombres.localeCompare(b.nombres);
				return a.estado ? -1 : 1;
			});
			setColaboradores(sorted);
		} catch (error) {
			console.error(error);
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
	}, [searchTerm, filterEmpresa]);

	// --- LÓGICA DE FILTRADO ---
	const filteredColaboradores = colaboradores.filter((c) => {
		const term = searchTerm.toLowerCase();
		const matchesSearch =
			c.nombres.toLowerCase().includes(term) ||
			c.apellidos.toLowerCase().includes(term) ||
			(c.dni && c.dni.includes(term));

		let matchesEmpresa = true;
		if (filterEmpresa.value !== "todas") {
			matchesEmpresa = c.empresa_id === filterEmpresa.value;
		}

		return matchesSearch && matchesEmpresa;
	});

	// --- CÁLCULOS DE PAGINACIÓN ---
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredColaboradores.slice(
		indexOfFirstItem,
		indexOfLastItem,
	);
	const totalPages = Math.ceil(filteredColaboradores.length / itemsPerPage);

	// --- FUNCIONES DE ACCIÓN ---
	const exportarExcel = () => {
		const dataParaExcel = filteredColaboradores.map((c) => ({
			ID: c.id,
			Estado: c.estado ? "ACTIVO" : "INACTIVO",
			DNI: c.dni || "-",
			Nombres: c.nombres,
			Apellidos: c.apellidos,
			"Correo Electrónico": c.email_contacto,
			Empresa: c.empresa_nombre,
			Cargo: c.cargo,
			Género: c.genero,
			Teléfono: c.telefono || "-",
			"Registrado Por": c.creador_nombre || "Sistema",
		}));
		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Colaboradores");
		XLSX.writeFile(wb, "Reporte_Colaboradores.xlsx");
	};

	const handleAdd = () => {
		setColaboradorToEdit(null);
		setIsFormModalOpen(true);
	};

	const handleEdit = (colab) => {
		setColaboradorToEdit(colab);
		setIsFormModalOpen(true);
	};

	const confirmDelete = (colab) => {
		setColaboradorToDelete(colab);
		setIsDeleteModalOpen(true);
	};

	const executeDelete = async () => {
		if (!colaboradorToDelete) return;
		try {
			await api.delete(`/colaboradores/${colaboradorToDelete.id}`);
			toast.success("Colaborador dado de baja");
			fetchData();
			setIsDeleteModalOpen(false);
			setColaboradorToDelete(null);
		} catch (error) {
			toast.error("Error al anular colaborador");
		}
	};

	const handleActivate = async (colab) => {
		try {
			await api.put(`/colaboradores/${colab.id}/activate`);
			toast.success(`Colaborador ${colab.nombres} reactivado`);
			fetchData();
		} catch (error) {
			toast.error("Error al reactivar colaborador");
		}
	};

	const handleFormSuccess = () => {
		setIsFormModalOpen(false);
		fetchData();
	};

	// --- ESTILOS PERSONALIZADOS REACT-SELECT ---
	const customFilterStyles = {
		control: (provided, state) => ({
			...provided,
			backgroundColor: "white",
			border: state.isFocused ? "1px solid #7c3aed" : "1px solid #e2e8f0",
			borderRadius: "12px",
			padding: "2px 6px",
			minHeight: "46px",
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
		placeholder: (provided) => ({
			...provided,
			color: "#94a3b8",
			fontSize: "0.95rem",
		}),
		menu: (provided) => ({
			...provided,
			borderRadius: "12px",
			overflow: "hidden",
			zIndex: 9999,
			border: "1px solid #e2e8f0",
			boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
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
			fontSize: "0.9rem",
			padding: "10px 15px",
		}),
	};

	if (loading) return <div className='loading-state'>Cargando...</div>;

	return (
		<div className='usuarios-container'>
			<div className='page-header'>
				<h1>Directorio de Personal</h1>
				<div className='header-actions'>
					<button
						onClick={exportarExcel}
						className='btn-action-header btn-excel'
					>
						<FileSpreadsheet size={18} /> Exportar Excel
					</button>
					<button className='btn-action-header btn-add' onClick={handleAdd}>
						<Plus size={18} /> Nuevo Colaborador
					</button>
				</div>
			</div>

			<div className='filters-bar'>
				<div className='search-input'>
					<Search size={18} color='#94a3b8' />
					<input
						type='text'
						placeholder='Buscar por Nombre o DNI...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>

				<div className='condition-filter'>
					<Select
						options={empresasOptions}
						value={filterEmpresa}
						onChange={setFilterEmpresa}
						styles={customFilterStyles}
						isSearchable={true}
						placeholder='Filtrar por Empresa'
					/>
				</div>
			</div>

			<div className='table-container'>
				{currentItems.length === 0 ? (
					<div className='no-data'>
						No se encontraron colaboradores con los filtros actuales.
					</div>
				) : (
					<table>
						<thead>
							<tr>
								<th>Estado</th>
								<th>DNI</th>
								<th>Colaborador</th>
								<th>Correo Electrónico</th>
								<th>Contacto</th>
								<th>Empresa</th>
								<th>Cargo</th>
								<th className='center'>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{currentItems.map((colab) => {
								const isWoman = colab.genero === "F";
								return (
									<tr
										key={colab.id}
										className={!colab.estado ? "inactive-row" : ""}
									>
										<td>
											<span
												className={`status-badge ${colab.estado ? "operativo" : "malogrado"}`}
											>
												{colab.estado ? "ACTIVO" : "INACTIVO"}
											</span>
										</td>
										<td>
											<span className='dni-text'>{colab.dni}</span>
										</td>
										<td>
											<div className='user-avatar-cell'>
												<div
													className={`avatar-circle ${!colab.estado ? "inactive" : isWoman ? "female" : "male"}`}
												>
													{isWoman ? (
														<UserRound size={18} />
													) : (
														<User size={18} />
													)}
												</div>
												<div className='user-info'>
													<span
														className={`name ${!colab.estado ? "inactive" : ""}`}
													>
														{colab.nombres} {colab.apellidos}
													</span>
													{colab.creador_nombre && (
														<span className='audit-text'>
															Reg: {colab.creador_nombre}
														</span>
													)}
												</div>
											</div>
										</td>
										<td>
											<div className='email-cell'>
												<Mail size={16} /> {colab.email_contacto || "-"}
											</div>
										</td>
										<td>
											{colab.telefono && colab.estado ? (
												<a
													href={`https://wa.me/${colab.telefono.replace(/\s+/g, "")}`}
													target='_blank'
													rel='noreferrer'
													className='whatsapp-btn'
												>
													<MessageCircle size={14} /> {colab.telefono}
												</a>
											) : (
												<span className='no-contact'>-</span>
											)}
										</td>
										<td>
											<span className='empresa-text'>
												{colab.empresa_nombre || "-"}
											</span>
										</td>
										<td>
											{colab.cargo ? (
												<span className='cargo-badge'>{colab.cargo}</span>
											) : (
												<span style={{ color: "#cbd5e1" }}>-</span>
											)}
										</td>
										<td>
											<div className='actions-cell'>
												{colab.estado ? (
													<>
														<button
															className='action-btn edit'
															onClick={() => handleEdit(colab)}
															title='Editar'
														>
															<Edit size={16} />
														</button>
														{userRole === 1 && (
															<button
																className='action-btn delete'
																onClick={() => confirmDelete(colab)}
																title='Dar de baja'
															>
																<Ban size={16} />
															</button>
														)}
													</>
												) : (
													userRole === 1 && (
														<button
															className='action-btn activate'
															onClick={() => handleActivate(colab)}
															title='Reactivar'
														>
															<Undo2 size={16} />
														</button>
													)
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}

				{filteredColaboradores.length > 0 && (
					<div className='pagination-footer'>
						<div className='info'>
							Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
							<strong>
								{Math.min(indexOfLastItem, filteredColaboradores.length)}
							</strong>{" "}
							de <strong>{filteredColaboradores.length}</strong>
						</div>

						{/* PAGINACIÓN ELEGANTE */}
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

			{/* MODALES */}
			<Modal
				isOpen={isFormModalOpen}
				onClose={() => setIsFormModalOpen(false)}
				title={colaboradorToEdit ? "Editar Colaborador" : "Registrar Nuevo"}
			>
				<AddColaboradorForm
					onSuccess={handleFormSuccess}
					colaboradorToEdit={colaboradorToEdit}
				/>
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
						Estás a punto de dar de baja a{" "}
						<strong>
							{colaboradorToDelete?.nombres} {colaboradorToDelete?.apellidos}
						</strong>
						.<br />
						Pasará a estado <strong>INACTIVO</strong>.
					</p>
					<div className='modal-actions'>
						<button
							className='btn-cancel'
							onClick={() => setIsDeleteModalOpen(false)}
						>
							<X size={16} /> Cancelar
						</button>
						<button className='btn-confirm' onClick={executeDelete}>
							<Check size={16} /> Confirmar Baja
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default Colaboradores;
