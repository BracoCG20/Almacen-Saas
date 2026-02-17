import React, { useState, useEffect } from "react";
import api from "../../service/api";
import { toast } from "react-toastify";
import { X, UserPlus, Key } from "lucide-react";
import Select from "react-select";
import "./RegisterAdminModal.scss";

const RegisterAdminModal = ({ onClose }) => {
	const [newUser, setNewUser] = useState({
		colaborador_id: "",
		nickname: "",
		email_login: "",
		password: "",
		rol_id: 2,
	});

	const [colaboradoresOptions, setColaboradoresOptions] = useState([]);
	const [loadingColab, setLoadingColab] = useState(false);

	const roleOptions = [
		{ value: 2, label: "Administrador" },
		{ value: 1, label: "Super Administrador" },
	];

	useEffect(() => {
		const fetchDatosParaFiltro = async () => {
			setLoadingColab(true);
			try {
				// Hacemos ambas peticiones al mismo tiempo para que sea instantáneo
				const [resColab, resUsers] = await Promise.all([
					api.get("/colaboradores"),
					api.get("/auth/users"),
				]);

				// 1. Extraemos los DNIs de los que YA tienen un acceso creado
				const dnisConAcceso = resUsers.data.map((u) => u.dni);

				// 2. Filtramos la lista: Solo activos Y que su DNI NO esté en la lista de arriba
				const options = resColab.data
					.filter((c) => c.estado === true && !dnisConAcceso.includes(c.dni))
					.map((c) => ({
						value: c.id,
						label: `${c.nombres} ${c.apellidos} - DNI: ${c.dni}`,
						email: c.email_contacto,
					}));

				setColaboradoresOptions(options);
			} catch (error) {
				toast.error("Error al cargar lista de colaboradores");
			} finally {
				setLoadingColab(false);
			}
		};

		fetchDatosParaFiltro();
	}, []);

	const handleChange = (e) => {
		setNewUser({ ...newUser, [e.target.name]: e.target.value });
	};

	const handleRoleChange = (selectedOption) => {
		setNewUser({ ...newUser, rol_id: selectedOption.value });
	};

	const handleColaboradorChange = (selectedOption) => {
		if (selectedOption) {
			setNewUser({
				...newUser,
				colaborador_id: selectedOption.value,
				email_login: selectedOption.email, // Auto-completamos con el correo de RRHH
			});
		} else {
			setNewUser({ ...newUser, colaborador_id: "", email_login: "" });
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!newUser.colaborador_id)
			return toast.warning("Debes seleccionar un colaborador");

		try {
			await api.post("/auth/register", newUser);
			toast.success("Acceso concedido exitosamente");
			onClose();
		} catch (error) {
			toast.error(error.response?.data?.error || "Error al crear credenciales");
		}
	};

	// Estilos con la corrección de 50px y centrado vertical
	const customSelectStyles = {
		control: (provided, state) => ({
			...provided,
			borderRadius: "8px",
			borderColor: state.isFocused ? "#4f46e5" : "#cbd5e1",
			boxShadow: state.isFocused ? "0 0 0 3px rgba(79, 70, 229, 0.1)" : "none",
			height: "50px",
			minHeight: "50px",
			display: "flex",
			alignItems: "center",
		}),
		valueContainer: (provided) => ({
			...provided,
			height: "100%",
			padding: "0 14px",
			display: "flex",
			alignItems: "center",
		}),
		input: (provided) => ({
			...provided,
			margin: "0px",
			padding: "0px",
		}),
		singleValue: (provided) => ({
			...provided,
			marginTop: "2px",
			color: "#1e293b",
			fontSize: "0.95rem",
		}),
		indicatorsContainer: (provided) => ({
			...provided,
			height: "100%",
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isSelected
				? "#4f46e5"
				: state.isFocused
					? "#e0e7ff"
					: "white",
			color: state.isSelected ? "white" : "#334155",
			cursor: "pointer",
			padding: "12px 15px",
		}),
		menuPortal: (base) => ({ ...base, zIndex: 9999 }),
	};

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div className='modal-content' onClick={(e) => e.stopPropagation()}>
				<div className='modal-header'>
					<h2>
						<Key size={24} /> Otorgar Acceso al Sistema
					</h2>
					<button className='btn-close' onClick={onClose}>
						<X size={24} />
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className='input-group'>
						<label>Seleccionar Colaborador *</label>
						<Select
							options={colaboradoresOptions}
							value={colaboradoresOptions.find(
								(op) => op.value === newUser.colaborador_id,
							)}
							onChange={handleColaboradorChange}
							styles={customSelectStyles}
							placeholder={
								loadingColab ? "Cargando..." : "Buscar colaborador..."
							}
							isLoading={loadingColab}
							isClearable
							menuPortalTarget={document.body}
							menuPosition={"fixed"}
						/>
						<small style={{ color: "#64748b", fontSize: "0.75rem" }}>
							Solo aparecen colaboradores registrados, activos y que NO tengan
							acceso al sistema.
						</small>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>Nickname (Identificador único) *</label>
							<input
								type='text'
								name='nickname'
								required
								onChange={handleChange}
								value={newUser.nickname}
								placeholder='ej: jperez'
							/>
						</div>
						<div className='input-group'>
							<label>Rol de Acceso *</label>
							<Select
								options={roleOptions}
								value={roleOptions.find((op) => op.value === newUser.rol_id)}
								onChange={handleRoleChange}
								styles={customSelectStyles}
								isSearchable={false}
								menuPortalTarget={document.body}
								menuPosition={"fixed"}
							/>
						</div>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>Email (Usuario de Login) *</label>
							<input
								type='email'
								name='email_login'
								required
								onChange={handleChange}
								value={newUser.email_login}
							/>
						</div>
						<div className='input-group'>
							<label>Contraseña *</label>
							<input
								type='password'
								name='password'
								required
								onChange={handleChange}
								value={newUser.password}
							/>
						</div>
					</div>

					<div className='modal-actions'>
						<button type='button' className='btn-cancel' onClick={onClose}>
							Cancelar
						</button>
						<button type='submit' className='btn-confirm'>
							<UserPlus size={18} /> Crear Credenciales
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default RegisterAdminModal;
