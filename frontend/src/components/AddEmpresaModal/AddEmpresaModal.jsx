import React, { useState, useEffect } from "react";
import api from "../../service/api";
import { toast } from "react-toastify";
import { X, Building2, Save, Plus } from "lucide-react";
// REUTILIZAMOS EL SCSS DE REGISTER ADMIN PORQUE LA ESTRUCTURA GRID ES IGUAL
import "../RegisterAdminModal/RegisterAdminModal.scss";

const AddEmpresaModal = ({ onClose, onSuccess, empresaToEdit }) => {
	const [empresa, setEmpresa] = useState({
		razon_social: "",
		nombre_comercial: "",
		ruc: "",
		direccion_fiscal: "",
		departamento: "",
		provincia: "",
		distrito: "",
		telefono_contacto: "",
		email_contacto: "",
		sitio_web: "",
		nombre_representante_legal: "",
		fecha_inicio_actividades: "",
	});

	useEffect(() => {
		if (empresaToEdit) {
			setEmpresa({
				razon_social: empresaToEdit.razon_social || "",
				nombre_comercial: empresaToEdit.nombre_comercial || "",
				ruc: empresaToEdit.ruc || "",
				direccion_fiscal: empresaToEdit.direccion_fiscal || "",
				departamento: empresaToEdit.departamento || "",
				provincia: empresaToEdit.provincia || "",
				distrito: empresaToEdit.distrito || "",
				telefono_contacto: empresaToEdit.telefono_contacto || "",
				email_contacto: empresaToEdit.email_contacto || "",
				sitio_web: empresaToEdit.sitio_web || "",
				nombre_representante_legal:
					empresaToEdit.nombre_representante_legal || "",
				fecha_inicio_actividades: empresaToEdit.fecha_inicio_actividades
					? empresaToEdit.fecha_inicio_actividades.split("T")[0]
					: "",
			});
		}
	}, [empresaToEdit]);

	const handleChange = (e) => {
		setEmpresa({ ...empresa, [e.target.name]: e.target.value });
	};

	const handleRucChange = (e) => {
		const onlyNums = e.target.value.replace(/\D/g, "").slice(0, 11);
		setEmpresa({ ...empresa, ruc: onlyNums });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (empresa.ruc.length !== 11)
			return toast.warning("El RUC debe tener 11 dígitos");

		try {
			if (empresaToEdit) {
				await api.put(`/empresas/${empresaToEdit.id}`, empresa);
				toast.success("Empresa actualizada exitosamente");
			} else {
				await api.post("/empresas", empresa);
				toast.success("Empresa registrada exitosamente");
			}
			onSuccess();
			onClose();
		} catch (error) {
			console.error(error);
			toast.error(error.response?.data?.error || "Error al guardar empresa");
		}
	};

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div className='modal-content' onClick={(e) => e.stopPropagation()}>
				<div className='modal-header'>
					<h2>
						<Building2 size={24} />{" "}
						{empresaToEdit ? "Editar Empresa" : "Registrar Empresa"}
					</h2>
					<button className='btn-close' onClick={onClose}>
						<X size={24} />
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: "10px" }}
				>
					<div className='form-row'>
						<div className='input-group'>
							<label>Razón Social *</label>
							<input
								name='razon_social'
								required
								value={empresa.razon_social}
								onChange={handleChange}
								placeholder='Ej: Grupo SP S.A.C.'
							/>
						</div>
						<div className='input-group'>
							<label>Nombre Comercial</label>
							<input
								name='nombre_comercial'
								value={empresa.nombre_comercial}
								onChange={handleChange}
								placeholder='Ej: SP'
							/>
						</div>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>RUC *</label>
							<input
								name='ruc'
								required
								value={empresa.ruc}
								onChange={handleRucChange}
								placeholder='11 dígitos'
							/>
						</div>
						<div className='input-group'>
							<label>Teléfono de Contacto</label>
							<input
								name='telefono_contacto'
								type='tel'
								value={empresa.telefono_contacto}
								onChange={handleChange}
								placeholder='+51...'
							/>
						</div>
					</div>

					<div className='input-group'>
						<label>Dirección Fiscal</label>
						<input
							name='direccion_fiscal'
							value={empresa.direccion_fiscal}
							onChange={handleChange}
							placeholder='Av. Principal 123...'
						/>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>Departamento</label>
							<input
								name='departamento'
								value={empresa.departamento}
								onChange={handleChange}
								placeholder='Lima'
							/>
						</div>
						<div className='input-group'>
							<label>Provincia</label>
							<input
								name='provincia'
								value={empresa.provincia}
								onChange={handleChange}
								placeholder='Lima'
							/>
						</div>
						<div className='input-group'>
							<label>Distrito</label>
							<input
								name='distrito'
								value={empresa.distrito}
								onChange={handleChange}
								placeholder='Miraflores'
							/>
						</div>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>Email de Contacto</label>
							<input
								type='email'
								name='email_contacto'
								value={empresa.email_contacto}
								onChange={handleChange}
								placeholder='contacto@empresa.com'
							/>
						</div>
						<div className='input-group'>
							<label>Sitio Web</label>
							<input
								type='text'
								name='sitio_web'
								value={empresa.sitio_web}
								onChange={handleChange}
								placeholder='www.empresa.com'
							/>
						</div>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>Representante Legal</label>
							<input
								type='text'
								name='nombre_representante_legal'
								value={empresa.nombre_representante_legal}
								onChange={handleChange}
							/>
						</div>
						<div className='input-group'>
							<label>Inicio de Actividades</label>
							<input
								type='date'
								name='fecha_inicio_actividades'
								value={empresa.fecha_inicio_actividades}
								onChange={handleChange}
							/>
						</div>
					</div>

					<div className='modal-actions'>
						<button type='button' className='btn-cancel' onClick={onClose}>
							Cancelar
						</button>
						<button type='submit' className='btn-confirm'>
							{empresaToEdit ? <Save size={18} /> : <Plus size={18} />}
							{empresaToEdit ? "Actualizar" : "Guardar Empresa"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddEmpresaModal;
