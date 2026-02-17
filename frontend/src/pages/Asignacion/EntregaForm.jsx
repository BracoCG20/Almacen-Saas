import React from "react";
import { Save, Mail, MessageCircle, Laptop, User } from "lucide-react";
import Select from "react-select";

const EntregaForm = ({
	equiposOptions,
	usuariosOptions,
	formData,
	setFormData,
	onAction,
}) => {
	const isFormValid = formData.equipo_id && formData.empleado_id;

	// --- ESTILOS REACT-SELECT A 50PX Y CENTRADOS ---
	const customSelectStyles = {
		control: (provided, state) => ({
			...provided,
			borderRadius: "8px",
			borderColor: state.isFocused ? "#4f46e5" : "#cbd5e1",
			boxShadow: state.isFocused ? "0 0 0 3px rgba(79, 70, 229, 0.15)" : "none",
			minHeight: "50px",
			backgroundColor: state.isDisabled ? "#f8fafc" : "#fff",
			cursor: state.isDisabled ? "not-allowed" : "pointer",
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
			position: "absolute",
			top: "50%",
			transform: "translateY(-50%)",
		}),
		placeholder: (provided) => ({
			...provided,
			color: "#94a3b8",
			fontSize: "0.95rem",
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
				<span>¿Incluye Cargador?</span>
			</label>

			<div className='actions-container'>
				<button
					type='button'
					onClick={() => onAction("GUARDAR")}
					className='btn-action gray'
					disabled={!isFormValid}
				>
					<Save size={18} /> Solo Guardar y Ver Acta
				</button>
				<button
					type='button'
					onClick={() => onAction("EMAIL")}
					className='btn-action blue'
					disabled={!isFormValid}
				>
					<Mail size={18} /> Guardar y Enviar por Correo
				</button>
				<button
					type='button'
					onClick={() => onAction("WHATSAPP")}
					className='btn-action green'
					disabled={!isFormValid}
				>
					<MessageCircle size={18} /> Guardar y Enviar por WhatsApp
				</button>
			</div>
		</div>
	);
};

export default EntregaForm;
