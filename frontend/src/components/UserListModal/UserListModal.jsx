import { useState, useEffect } from "react";
import api from "../../service/api";
import * as XLSX from "xlsx"; // <-- Importamos XLSX
import { toast } from "react-toastify";
import {
	X,
	Users,
	KeyRound,
	ToggleLeft,
	ToggleRight,
	ShieldCheck,
	Search,
	ChevronLeft,
	ChevronRight,
	FileSpreadsheet, // <-- Icono de Excel
} from "lucide-react";
import "./UserListModal.scss";

const UserListModal = ({ onClose }) => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);

	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	const [passModal, setPassModal] = useState({
		show: false,
		userId: null,
		newPass: "",
	});

	const fetchUsers = async () => {
		try {
			const res = await api.get("/auth/users");
			setUsers(res.data);
		} catch (error) {
			toast.error("Error al cargar lista de usuarios");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);

	const handleToggleStatus = async (user) => {
		try {
			const nuevoEstado = !user.activo;
			await api.put(`/auth/users/${user.usuario_id}/status`, {
				activo: nuevoEstado,
			});

			setUsers(
				users.map((u) =>
					u.usuario_id === user.usuario_id ? { ...u, activo: nuevoEstado } : u,
				),
			);
			toast.success(
				`Acceso ${nuevoEstado ? "Activado" : "Inactivado"} correctamente`,
			);
		} catch (error) {
			toast.error("Error al cambiar estado");
		}
	};

	const handleChangePass = async (e) => {
		e.preventDefault();
		try {
			await api.put(`/auth/users/${passModal.userId}/password`, {
				newPassword: passModal.newPass,
			});
			toast.success("Contraseña actualizada");
			setPassModal({ show: false, userId: null, newPass: "" });
		} catch (error) {
			toast.error("Error al actualizar contraseña");
		}
	};

	const filteredUsers = users.filter((u) => {
		const term = searchTerm.toLowerCase();
		return (
			(u.nombres && u.nombres.toLowerCase().includes(term)) ||
			(u.apellidos && u.apellidos.toLowerCase().includes(term)) ||
			(u.email_login && u.email_login.toLowerCase().includes(term)) ||
			(u.empresa_nombre && u.empresa_nombre.toLowerCase().includes(term))
		);
	});

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

	// --- FUNCIÓN EXPORTAR EXCEL ---
	const exportarExcel = () => {
		if (filteredUsers.length === 0)
			return toast.info("No hay datos para exportar");

		const dataParaExcel = filteredUsers.map((u) => ({
			"Estado del Acceso": u.activo ? "ACTIVO" : "INACTIVO",
			Nombres: u.nombres,
			Apellidos: u.apellidos,
			DNI: u.dni || "-",
			"Correo de Acceso (Login)": u.email_login,
			"Cargo / Puesto": u.cargo || "-",
			"Empresa Asignada": u.empresa_nombre || "-",
			"Rol en el Sistema": u.nombre_rol || "Administrador",
			"Requiere Cambio Clave": u.requiere_cambio_password ? "SÍ" : "NO",
		}));

		const ws = XLSX.utils.json_to_sheet(dataParaExcel);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Accesos");
		XLSX.writeFile(wb, "Reporte_Accesos_Usuarios.xlsx");
		toast.success("Excel de usuarios generado exitosamente");
	};

	return (
		<div className='list-modal-overlay' onClick={onClose}>
			<div className='list-modal-content' onClick={(e) => e.stopPropagation()}>
				<div className='modal-header'>
					<h2>
						<Users size={24} /> Gestión de Accesos (Usuarios)
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
							placeholder='Buscar por nombre, correo o empresa...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<button className='btn-excel-modal' onClick={exportarExcel}>
						<FileSpreadsheet size={18} /> Exportar Excel
					</button>
				</div>

				{loading ? (
					<p className='loading-state'>Cargando usuarios...</p>
				) : filteredUsers.length === 0 ? (
					<p className='loading-state'>No se encontraron accesos.</p>
				) : (
					<>
						<div className='table-wrapper'>
							<table>
								<thead>
									<tr>
										<th>Colaborador</th>
										<th>Email (Login)</th>
										<th>Rol</th>
										<th>Empresa</th>
										<th className='center'>Estado</th>
										<th className='center'>Acciones</th>
									</tr>
								</thead>
								<tbody>
									{currentItems.map((u) => (
										<tr
											key={u.usuario_id}
											style={{ opacity: u.activo ? 1 : 0.6 }}
										>
											<td>
												<strong>
													{u.nombres} {u.apellidos}
												</strong>
												<br />
												<small style={{ color: "#64748b" }}>{u.cargo}</small>
											</td>
											<td>{u.email_login}</td>
											<td>
												{u.rol_id === 1 ? (
													<span
														style={{
															color: "#7c3aed",
															fontWeight: "bold",
															display: "flex",
															alignItems: "center",
															gap: "5px",
														}}
													>
														<ShieldCheck size={16} /> {u.nombre_rol}
													</span>
												) : (
													<span style={{ color: "#334155", fontWeight: "500" }}>
														{u.nombre_rol || "Admin"}
													</span>
												)}
											</td>
											<td>{u.empresa_nombre || "-"}</td>
											<td className='center'>
												<span
													className={`status-badge ${u.activo ? "active" : "inactive"}`}
												>
													{u.activo ? "Activo" : "Inactivo"}
												</span>
											</td>
											<td className='center'>
												<div className='actions-cell'>
													<button
														className={`btn-toggle ${u.activo ? "danger" : "success"}`}
														onClick={() => handleToggleStatus(u)}
														title={
															u.activo ? "Inactivar Acceso" : "Activar Acceso"
														}
													>
														{u.activo ? (
															<ToggleRight size={22} />
														) : (
															<ToggleLeft size={22} />
														)}
													</button>
													<button
														className='btn-key'
														onClick={() =>
															setPassModal({
																show: true,
																userId: u.usuario_id,
																newPass: "",
															})
														}
														title='Forzar Cambio de Contraseña'
													>
														<KeyRound size={18} />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* --- PAGINACIÓN --- */}
						{filteredUsers.length > itemsPerPage && (
							<div className='pagination-footer'>
								<div className='info'>
									Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
									<strong>
										{Math.min(indexOfLastItem, filteredUsers.length)}
									</strong>{" "}
									de <strong>{filteredUsers.length}</strong>
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

				{/* MODAL CAMBIAR CONTRASEÑA */}
				{passModal.show && (
					<div
						className='password-modal-overlay'
						onClick={() =>
							setPassModal({ show: false, userId: null, newPass: "" })
						}
					>
						<div
							className='password-modal-card'
							onClick={(e) => e.stopPropagation()}
						>
							<h3>Nueva Contraseña</h3>
							<form onSubmit={handleChangePass}>
								<input
									type='text'
									placeholder='Escribe nueva contraseña'
									value={passModal.newPass}
									onChange={(e) =>
										setPassModal({ ...passModal, newPass: e.target.value })
									}
									required
								/>
								<div className='modal-actions'>
									<button
										type='button'
										className='btn-cancel'
										onClick={() =>
											setPassModal({ show: false, userId: null, newPass: "" })
										}
									>
										Cancelar
									</button>
									<button type='submit' className='btn-save'>
										Guardar
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default UserListModal;
