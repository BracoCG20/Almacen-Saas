import { useState, useEffect } from "react";
import api from "../../service/api";
import * as XLSX from "xlsx"; // <-- Importamos XLSX
import { toast } from "react-toastify";
import {
	X,
	Building2,
	MapPin,
	Phone,
	ToggleLeft,
	ToggleRight,
	Edit,
	Mail,
	Search,
	ChevronLeft,
	ChevronRight,
	FileSpreadsheet, // <-- Icono de Excel
} from "lucide-react";
import "./EmpresaListModal.scss";

const EmpresaListModal = ({ onClose, onEditEmpresa }) => {
	const [empresas, setEmpresas] = useState([]);
	const [loading, setLoading] = useState(true);

	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	const fetchEmpresas = async () => {
		try {
			const res = await api.get("/empresas");
			setEmpresas(res.data);
		} catch (error) {
			toast.error("Error al cargar empresas");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchEmpresas();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	const handleToggleStatus = async (empresa) => {
		try {
			if (empresa.estado) {
				await api.delete(`/empresas/${empresa.id}`);
			} else {
				await api.put(`/empresas/${empresa.id}/activate`);
			}

			const nuevoEstado = !empresa.estado;
			setEmpresas(
				empresas.map((e) =>
					e.id === empresa.id ? { ...e, estado: nuevoEstado } : e,
				),
			);
			toast.success(
				`Empresa ${nuevoEstado ? "Activada" : "Inactivada"} correctamente`,
			);
		} catch (error) {
			toast.error("Error al cambiar el estado de la empresa");
		}
	};

	const filteredEmpresas = empresas.filter((e) => {
		const term = searchTerm.toLowerCase();
		return (
			(e.razon_social && e.razon_social.toLowerCase().includes(term)) ||
			(e.ruc && e.ruc.includes(term)) ||
			(e.nombre_comercial && e.nombre_comercial.toLowerCase().includes(term))
		);
	});

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredEmpresas.slice(
		indexOfFirstItem,
		indexOfLastItem,
	);
	const totalPages = Math.ceil(filteredEmpresas.length / itemsPerPage);

	// --- FUNCIÓN EXPORTAR EXCEL ---
	const exportarExcel = () => {
		if (filteredEmpresas.length === 0)
			return toast.info("No hay datos para exportar");

		const dataParaExcel = filteredEmpresas.map((e) => ({
			Estado: e.estado ? "ACTIVA" : "INACTIVA",
			"Razón Social": e.razon_social,
			"Nombre Comercial": e.nombre_comercial || "-",
			RUC: e.ruc,
			"Email de Contacto": e.email_contacto || "-",
			Teléfono: e.telefono_contacto || "-",
			"Dirección Fiscal": e.direccion_fiscal || "-",
			Distrito: e.distrito || "-",
			Provincia: e.provincia || "-",
			Departamento: e.departamento || "-",
			"Representante Legal": e.nombre_representante_legal || "-",
			"Sitio Web": e.sitio_web || "-",
		}));

		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Empresas");
		XLSX.writeFile(wb, "Reporte_Empresas_Registradas.xlsx");
		toast.success("Excel de empresas generado exitosamente");
	};

	return (
		<div className='empresa-list-overlay' onClick={onClose}>
			<div
				className='empresa-list-content'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='modal-header'>
					<h2>
						<Building2 size={24} /> Gestión de Empresas
					</h2>
					<button className='btn-close' onClick={onClose}>
						<X size={24} />
					</button>
				</div>

				{/* --- BARRA DE HERRAMIENTAS (Buscador + Excel) --- */}
				<div className='toolbar-actions'>
					<div className='search-bar'>
						<Search size={20} color='#94a3b8' />
						<input
							type='text'
							placeholder='Buscar por Razón Social o RUC...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<button className='btn-excel-modal' onClick={exportarExcel}>
						<FileSpreadsheet size={18} /> Exportar Excel
					</button>
				</div>

				{loading ? (
					<div className='loading-state'>Cargando empresas...</div>
				) : filteredEmpresas.length === 0 ? (
					<div className='loading-state'>No se encontraron empresas.</div>
				) : (
					<>
						<div className='table-wrapper'>
							<table>
								<thead>
									<tr>
										<th>Razón Social</th>
										<th>RUC</th>
										<th>Contacto</th>
										<th>Ubicación</th>
										<th className='center'>Estado</th>
										<th className='center'>Acciones</th>
									</tr>
								</thead>
								<tbody>
									{currentItems.map((e) => (
										<tr key={e.id} className={!e.estado ? "row-inactive" : ""}>
											<td>
												<div className='main-text'>
													{e.nombre_comercial || e.razon_social}
												</div>
												{e.nombre_comercial && (
													<div className='secondary-text'>{e.razon_social}</div>
												)}
											</td>
											<td>
												<div className='secondary-text'>{e.ruc}</div>
											</td>
											<td>
												<div className='contact-info'>
													{e.email_contacto && (
														<div className='contact-item' title='Email'>
															<Mail size={14} /> {e.email_contacto}
														</div>
													)}
													{e.telefono_contacto && (
														<div className='contact-item' title='Teléfono'>
															<Phone size={14} /> {e.telefono_contacto}
														</div>
													)}
													{!e.email_contacto && !e.telefono_contacto && (
														<span className='muted'>-</span>
													)}
												</div>
											</td>
											<td>
												{e.direccion_fiscal ? (
													<div
														className='location-info'
														title={`${e.direccion_fiscal} - ${e.distrito || ""}`}
													>
														<MapPin size={16} />
														<span>
															{e.direccion_fiscal.length > 25
																? `${e.direccion_fiscal.substring(0, 25)}...`
																: e.direccion_fiscal}
														</span>
													</div>
												) : (
													<span className='muted'>-</span>
												)}
											</td>
											<td className='center'>
												<span
													className={`status-badge ${e.estado ? "active" : "inactive"}`}
												>
													{e.estado ? "Activa" : "Inactiva"}
												</span>
											</td>
											<td className='center'>
												<div className='actions-cell'>
													<button
														className={`action-btn toggle ${e.estado ? "danger" : "success"}`}
														onClick={() => handleToggleStatus(e)}
														title={
															e.estado ? "Inactivar Empresa" : "Activar Empresa"
														}
													>
														{e.estado ? (
															<ToggleRight size={20} />
														) : (
															<ToggleLeft size={20} />
														)}
													</button>
													<button
														className='action-btn edit'
														onClick={() => {
															onEditEmpresa(e);
															onClose();
														}}
														title='Editar Empresa'
													>
														<Edit size={18} />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{filteredEmpresas.length > itemsPerPage && (
							<div className='pagination-footer'>
								<div className='info'>
									Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
									<strong>
										{Math.min(indexOfLastItem, filteredEmpresas.length)}
									</strong>{" "}
									de <strong>{filteredEmpresas.length}</strong>
								</div>
								<div className='controls'>
									<button
										onClick={() => setCurrentPage(currentPage - 1)}
										disabled={currentPage === 1}
									>
										<ChevronLeft size={16} /> Anterior
									</button>
									<span
										style={{
											fontSize: "0.85rem",
											color: "#64748b",
											fontWeight: "600",
										}}
									>
										{currentPage} / {totalPages}
									</span>
									<button
										onClick={() => setCurrentPage(currentPage + 1)}
										disabled={currentPage === totalPages}
									>
										Siguiente <ChevronRight size={16} />
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default EmpresaListModal;
