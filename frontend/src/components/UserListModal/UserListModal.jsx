import React, { useState, useEffect } from "react";
import api from "../../service/api";
import { toast } from "react-toastify";
import {
	X,
	Users,
	KeyRound,
	ToggleLeft,
	ToggleRight,
	ShieldCheck,
} from "lucide-react";
import "./UserListModal.scss";

const UserListModal = ({ onClose }) => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);

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

				{loading ? (
					<p className='loading-state'>Cargando usuarios...</p>
				) : (
					<div className='table-wrapper'>
						<table>
							<thead>
								<tr>
									<th>Colaborador</th>
									<th>Email (Login)</th>
									<th>Rol</th>
									<th>Empresa</th>
									{/* AHORA TIENE CLASE CENTER */}
									<th className='center'>Estado</th>
									<th className='center'>Acciones</th>
								</tr>
							</thead>
							<tbody>
								{users.map((u) => (
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

										{/* AHORA TIENE CLASE CENTER */}
										<td className='center'>
											<span
												className={`status-badge ${u.activo ? "active" : "inactive"}`}
											>
												{u.activo ? "Activo" : "Inactivo"}
											</span>
										</td>

										{/* LA CELDA VUELVE A SER NORMAL, EL DIV INTERNO HACE EL FLEX */}
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
				)}

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
