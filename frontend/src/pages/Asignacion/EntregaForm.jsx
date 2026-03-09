import { Save, Mail, MessageCircle, Laptop, User } from "lucide-react";
import Select from "react-select";
import "./EntregaForm.scss"; // <-- IMPORTAMOS SU PROPIO SCSS

const EntregaForm = ({
	equiposOptions,
	usuariosOptions,
	formData,
	setFormData,
	onAction,
}) => {
	const isFormValid = formData.equipo_id && formData.empleado_id;

	// --- FIX CENTRADO REACT SELECT 40PX ---
	const customSelectStyles = {
		control: (provided, state) => ({
			...provided,
			borderRadius: "8px",
			borderColor: state.isFocused ? "#7c3aed" : "#e2e8f0", // Color Violeta
			boxShadow: state.isFocused ? "0 0 0 2px rgba(124, 58, 237, 0.1)" : "none",
			minHeight: "40px",
			height: "40px",
			backgroundColor: state.isDisabled ? "#f8fafc" : "#fff",
			cursor: state.isDisabled ? "not-allowed" : "pointer",
			display: "flex",
			alignItems: "center",
		}),
		valueContainer: (provided) => ({
			...provided,
			padding: "0 12px",
			height: "100%",
			display: "flex",
			alignItems: "center",
			position: "relative",
		}),
		input: (provided) => ({
			...provided,
			margin: "0px",
			padding: "0px",
			height: "40px",
			color: "transparent",
		}),
		indicatorSeparator: () => ({ display: "none" }),
		indicatorsContainer: (provided) => ({ ...provided, height: "40px" }),
		singleValue: (provided) => ({
			...provided,
			color: "#1e293b",
			fontSize: "0.85rem",
			fontWeight: "500",
			position: "absolute",
			top: "50%",
			transform: "translateY(-50%)",
			margin: "0px",
		}),
		placeholder: (provided) => ({
			...provided,
			color: "#94a3b8",
			fontSize: "0.85rem",
			position: "absolute",
			top: "50%",
			transform: "translateY(-50%)",
			margin: "0px",
		}),
		option: (provided, state) => ({
			...provided,
			backgroundColor: state.isSelected
				? "#7c3aed"
				: state.isFocused
					? "#f5f3ff"
					: "white",
			color: state.isSelected ? "white" : "#334155",
			cursor: "pointer",
			fontSize: "0.85rem",
			padding: "8px 12px",
		}),
		menuPortal: (base) => ({ ...base, zIndex: 9999 }),
	};

	return (
		<div className='form-card'>
			<div className='input-group'>
				<label>
					<Laptop size={16} /> Equipo (Disponibles)
				</label>
				<Select
					options={equiposOptions}
					value={
						equiposOptions.find((op) => op.value === formData.equipo_id) || null
					}
					onChange={(op) =>
						setFormData({ ...formData, equipo_id: op?.value || "" })
					}
					placeholder='Seleccione un equipo...'
					styles={customSelectStyles}
					menuPortalTarget={document.body}
				/>
			</div>

			<div className='input-group' style={{ marginTop: "1.5rem" }}>
				<label>
					<User size={16} /> Colaborador (Sin equipo)
				</label>
				<Select
					options={usuariosOptions}
					value={
						usuariosOptions.find((op) => op.value === formData.empleado_id) ||
						null
					}
					onChange={(op) =>
						setFormData({ ...formData, empleado_id: op?.value || "" })
					}
					placeholder='Seleccione un colaborador...'
					styles={customSelectStyles}
					menuPortalTarget={document.body}
				/>
			</div>

			<label className='checkbox-card'>
				<input
					type='checkbox'
					checked={formData.cargador}
					onChange={(e) =>
						setFormData({ ...formData, cargador: e.target.checked })
					}
				/>
				<span>¿Incluye Cargador / Accesorios?</span>
			</label>

			<div className='actions-container' id='tour-asignacion-acciones'>
				<button
					type='button'
					onClick={() => onAction("GUARDAR")}
					className='btn-action gray'
					disabled={!isFormValid}
				>
					<Save size={16} /> Solo Guardar y Ver Acta
				</button>
				<button
					type='button'
					onClick={() => onAction("EMAIL")}
					className='btn-action blue'
					disabled={!isFormValid}
				>
					<Mail size={16} /> Guardar y Enviar por Correo
				</button>
				<button
					type='button'
					onClick={() => onAction("WHATSAPP")}
					className='btn-action green'
					disabled={!isFormValid}
				>
					<MessageCircle size={16} /> Guardar y Enviar por WhatsApp
				</button>
			</div>
		</div>
	);
};

export default EntregaForm;
