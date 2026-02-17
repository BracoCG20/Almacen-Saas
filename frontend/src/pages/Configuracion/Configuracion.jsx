import React, { useState, useEffect } from "react";
import api from "../../service/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
	Building2,
	Camera,
	Save,
	Lock,
	Mail,
	Phone,
	Briefcase,
	Plus,
	List,
	Fingerprint,
} from "lucide-react";
import "./Configuracion.scss";

import RegisterAdminModal from "../../components/RegisterAdminModal/RegisterAdminModal";
import UserListModal from "../../components/UserListModal/UserListModal";
import AddEmpresaModal from "../../components/AddEmpresaModal/AddEmpresaModal";
import EmpresaListModal from "../../components/EmpresaListModal/EmpresaListModal";

const Configuracion = () => {
	const { updateUser } = useAuth();

	const [showUserModal, setShowUserModal] = useState(false);
	const [showUserList, setShowUserList] = useState(false);
	const [showEmpresaModal, setShowEmpresaModal] = useState(false);
	const [showEmpresaList, setShowEmpresaList] = useState(false);
	const [empresaToEdit, setEmpresaToEdit] = useState(null);

	const [loading, setLoading] = useState(true);
	const [preview, setPreview] = useState(null);
	const [userRole, setUserRole] = useState(null);

	const [formData, setFormData] = useState({
		nickname: "",
		email_login: "",
		telefono: "",
		password: "",
		nombres: "",
		apellidos: "",
		cargo: "",
		empresa_nombre: "",
	});
	const [fotoFile, setFotoFile] = useState(null);

	useEffect(() => {
		const fetchPerfil = async () => {
			try {
				const res = await api.get("/auth/perfil");
				const u = res.data;
				setUserRole(Number(u.rol_id)); // ¡AHORA SÍ TRAERÁ EL ID REAL!

				setFormData({
					nickname: u.nickname || "",
					email_login: u.email_login || "",
					telefono: u.telefono || "",
					password: "",
					nombres: u.nombres || "",
					apellidos: u.apellidos || "",
					cargo: u.cargo || "",
					empresa_nombre: u.empresa_nombre || "No asignada",
				});

				if (u.foto_perfil_url) {
					setPreview(`http://localhost:4000${u.foto_perfil_url}`);
				}
			} catch (error) {
				console.error(error);
				toast.error("Error al cargar perfil");
			} finally {
				setLoading(false);
			}
		};
		fetchPerfil();
	}, []);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setFotoFile(file);
			setPreview(URL.createObjectURL(file));
		}
	};

	const isSuperAdmin = userRole === 1;

	const handleSubmit = async (e) => {
		e.preventDefault();
		const toastId = toast.loading("Guardando cambios...");

		const data = new FormData();
		if (formData.password) data.append("password", formData.password);
		if (formData.telefono) data.append("telefono", formData.telefono);
		if (fotoFile) data.append("foto", fotoFile);

		// Si es SuperAdmin, enviamos las modificaciones de datos personales
		if (isSuperAdmin) {
			data.append("nombres", formData.nombres);
			data.append("apellidos", formData.apellidos);
			data.append("email_login", formData.email_login);
			data.append("cargo", formData.cargo);
		}

		try {
			await api.put("/auth/perfil", data, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			if (fotoFile || isSuperAdmin) {
				updateUser({
					foto_url: preview,
					nombre: `${formData.nombres} ${formData.apellidos}`,
					email: formData.email_login,
				});
			}

			toast.update(toastId, {
				render: "Perfil actualizado ✅",
				type: "success",
				isLoading: false,
				autoClose: 3000,
			});
			setFormData((prev) => ({ ...prev, password: "" }));
		} catch (error) {
			console.error(error);
			toast.update(toastId, {
				render: "Error al actualizar ❌",
				type: "error",
				isLoading: false,
				autoClose: 3000,
			});
		}
	};

	if (loading) return <div className='loading-state'>Cargando perfil...</div>;

	const defaultImage = `https://ui-avatars.com/api/?name=${formData.nombres}+${formData.apellidos}&background=random`;

	return (
		<div className='config-container'>
			<div className='header-actions'>
				<div className='page-header'>
					<h1>Configuración de Cuenta</h1>
					<span>Administra tu información personal y corporativa.</span>
				</div>

				{/* ¡AHORA SÍ SE MOSTRARÁ ESTO PORQUE userRole YA NO ES NULL! */}
				{isSuperAdmin && (
					<div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
						<div className='button-group'>
							<button
								type='button'
								className='btn-main indigo'
								onClick={() => setShowEmpresaList(true)}
							>
								<List size={18} /> Ver Empresas
							</button>
							<button
								type='button'
								className='btn-main indigo-light'
								onClick={() => {
									setEmpresaToEdit(null);
									setShowEmpresaModal(true);
								}}
							>
								<Plus size={18} /> Nueva Empresa
							</button>
						</div>

						<div className='divider-vertical'></div>

						<div className='button-group'>
							<button
								type='button'
								className='btn-main blue'
								onClick={() => setShowUserList(true)}
							>
								<List size={18} /> Ver Accesos
							</button>
							<button
								type='button'
								className='btn-main green'
								onClick={() => setShowUserModal(true)}
							>
								<Plus size={18} /> Crear Acceso (Login)
							</button>
						</div>
					</div>
				)}
			</div>

			<form onSubmit={handleSubmit} className='config-grid'>
				{/* TARJETA IZQUIERDA: FOTO */}
				<div className='card profile-card'>
					<div className='photo-wrapper'>
						<img
							src={preview || defaultImage}
							alt='Perfil'
							onError={(e) => {
								e.target.src = defaultImage;
							}}
						/>
						<label htmlFor='fotoInput' className='btn-camera'>
							<Camera size={18} />
						</label>
						<input
							id='fotoInput'
							type='file'
							accept='image/*'
							onChange={handleImageChange}
							style={{ display: "none" }}
						/>
					</div>
					<h3>
						{formData.nombres} {formData.apellidos}
					</h3>
					<p className='role-text'>{formData.cargo || "Sin cargo definido"}</p>

					<hr className='divider' />

					<div className='input-group'>
						<label>
							<Fingerprint size={16} /> Nickname (Lectura)
						</label>
						<input
							type='text'
							value={formData.nickname}
							disabled
							className='input-field input-gray'
						/>
					</div>
				</div>

				{/* TARJETA DERECHA: DATOS */}
				<div className='card details-card'>
					<h3 className='section-title'>Información Personal</h3>

					{/* EL AVISO SOLO SE MUESTRA A LOS QUE NO SON SUPER ADMIN */}
					{!isSuperAdmin && (
						<div
							className='edit-warning'
							style={{
								marginBottom: "20px",
								fontSize: "0.85rem",
								color: "#b45309",
								background: "#fffbeb",
								padding: "10px",
								borderRadius: "8px",
								display: "flex",
								gap: "8px",
							}}
						>
							<Lock size={16} /> Tus nombres, correo y cargo están bloqueados
							por seguridad.
						</div>
					)}

					<div className='form-row'>
						<div className='input-group'>
							<label>Nombres</label>
							<input
								type='text'
								name='nombres'
								value={formData.nombres}
								onChange={handleChange}
								disabled={!isSuperAdmin}
								className={`input-field ${!isSuperAdmin ? "input-gray" : ""}`}
							/>
						</div>
						<div className='input-group'>
							<label>Apellidos</label>
							<input
								type='text'
								name='apellidos'
								value={formData.apellidos}
								onChange={handleChange}
								disabled={!isSuperAdmin}
								className={`input-field ${!isSuperAdmin ? "input-gray" : ""}`}
							/>
						</div>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>
								<Mail size={16} /> Correo Electrónico (Login)
							</label>
							<input
								type='email'
								name='email_login'
								value={formData.email_login}
								onChange={handleChange}
								disabled={!isSuperAdmin}
								className={`input-field ${!isSuperAdmin ? "input-gray" : ""}`}
							/>
						</div>
						<div className='input-group'>
							<label>
								<Phone size={16} /> Teléfono
							</label>
							<input
								type='tel'
								name='telefono'
								value={formData.telefono}
								onChange={handleChange}
								className='input-field'
							/>
						</div>
					</div>

					<h3 className='section-title mt-large'>Información Corporativa</h3>
					<div className='form-row'>
						<div className='input-group'>
							<label>
								<Building2 size={16} /> Empresa (Solo Lectura)
							</label>
							<input
								type='text'
								value={formData.empresa_nombre}
								disabled
								className='input-field input-gray'
							/>
						</div>
						<div className='input-group'>
							<label>
								<Briefcase size={16} /> Cargo
							</label>
							<input
								type='text'
								name='cargo'
								value={formData.cargo}
								onChange={handleChange}
								disabled={!isSuperAdmin}
								className={`input-field ${!isSuperAdmin ? "input-gray" : ""}`}
							/>
						</div>
					</div>

					<h3 className='section-title mt-large'>Seguridad</h3>
					<div className='input-group'>
						<label>
							<Lock size={16} /> Cambiar Contraseña
						</label>
						<input
							type='password'
							name='password'
							value={formData.password}
							onChange={handleChange}
							placeholder='Deja en blanco si no deseas cambiar tu contraseña.'
							className='input-field'
						/>
					</div>

					<button type='submit' className='btn-save'>
						<Save size={18} /> Guardar Cambios
					</button>
				</div>
			</form>

			{/* --- MODALES --- */}
			{showUserModal && (
				<RegisterAdminModal onClose={() => setShowUserModal(false)} />
			)}
			{showUserList && <UserListModal onClose={() => setShowUserList(false)} />}
			{showEmpresaModal && (
				<AddEmpresaModal
					empresaToEdit={empresaToEdit}
					onClose={() => setShowEmpresaModal(false)}
					onSuccess={() => {
						setEmpresaToEdit(null);
					}}
				/>
			)}
			{showEmpresaList && (
				<EmpresaListModal
					onClose={() => setShowEmpresaList(false)}
					onEditEmpresa={(empresa) => {
						setEmpresaToEdit(empresa);
						setShowEmpresaModal(true);
					}}
				/>
			)}
		</div>
	);
};

export default Configuracion;
