import React, { useState, useEffect } from "react";
import {
	Save,
	Building2,
	IdCard,
	User,
	Phone,
	Mail,
	MapPin,
	Globe,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../service/api"; // Ajusta la ruta a tu api si es necesario
import "./AddProveedorForm.scss";

const AddProveedorForm = ({ onSuccess, providerToEdit }) => {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		razon_social: "",
		nombre_comercial: "",
		ruc: "",
		direccion: "",
		departamento: "",
		provincia: "",
		distrito: "",
		nombre_contacto: "",
		email_contacto: "",
		telefono_contacto: "",
		sitio_web: "",
		tipo_servicio: "",
	});

	useEffect(() => {
		if (providerToEdit) {
			setFormData({
				razon_social: providerToEdit.razon_social || "",
				nombre_comercial: providerToEdit.nombre_comercial || "",
				ruc: providerToEdit.ruc || "",
				direccion: providerToEdit.direccion || "",
				departamento: providerToEdit.departamento || "",
				provincia: providerToEdit.provincia || "",
				distrito: providerToEdit.distrito || "",
				nombre_contacto: providerToEdit.nombre_contacto || "",
				email_contacto: providerToEdit.email_contacto || "",
				telefono_contacto: providerToEdit.telefono_contacto || "",
				sitio_web: providerToEdit.sitio_web || "",
				tipo_servicio: providerToEdit.tipo_servicio || "",
			});
		}
	}, [providerToEdit]);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.razon_social || !formData.ruc) {
			return toast.warning("Razón Social y RUC son obligatorios");
		}

		setLoading(true);
		try {
			if (providerToEdit) {
				await api.put(`/proveedores/${providerToEdit.id}`, formData);
				toast.success("Proveedor actualizado");
			} else {
				await api.post("/proveedores", formData);
				toast.success("Proveedor registrado");
			}
			onSuccess();
		} catch (error) {
			console.error(error);
			toast.error(error.response?.data?.error || "Error al guardar");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className='equipo-form' onSubmit={handleSubmit}>
			<div className='form-row'>
				<div className='input-group'>
					<label>
						<Building2 size={16} /> Razón Social *
					</label>
					<input
						name='razon_social'
						value={formData.razon_social}
						onChange={handleChange}
						placeholder='Ej: Renting Perú S.A.C.'
						required
					/>
				</div>
				<div className='input-group'>
					<label>
						<IdCard size={16} /> RUC *
					</label>
					<input
						name='ruc'
						value={formData.ruc}
						onChange={handleChange}
						placeholder='201000...'
						required
						maxLength={11}
					/>
				</div>
			</div>

			<div className='form-row'>
				<div className='input-group'>
					<label>
						<Building2 size={16} /> Nombre Comercial
					</label>
					<input
						name='nombre_comercial'
						value={formData.nombre_comercial}
						onChange={handleChange}
						placeholder='Ej: RentingPe'
					/>
				</div>
				<div className='input-group'>
					<label>
						<Globe size={16} /> Sitio Web
					</label>
					<input
						name='sitio_web'
						value={formData.sitio_web}
						onChange={handleChange}
						placeholder='www.empresa.com'
					/>
				</div>
			</div>

			<hr className='divider' />
			<h4 style={{ margin: "10px 0", color: "#64748b", fontSize: "0.9rem" }}>
				Contacto Principal
			</h4>

			<div className='form-row'>
				<div className='input-group'>
					<label>
						<User size={16} /> Nombre de Contacto
					</label>
					<input
						name='nombre_contacto'
						value={formData.nombre_contacto}
						onChange={handleChange}
						placeholder='Ej: Juan Pérez'
					/>
				</div>
				<div className='input-group'>
					<label>
						<Phone size={16} /> Teléfono / Celular
					</label>
					<input
						name='telefono_contacto'
						value={formData.telefono_contacto}
						onChange={handleChange}
						placeholder='+51 999...'
					/>
				</div>
			</div>

			<div className='form-row'>
				<div className='input-group'>
					<label>
						<Mail size={16} /> Correo Electrónico
					</label>
					<input
						type='email'
						name='email_contacto'
						value={formData.email_contacto}
						onChange={handleChange}
						placeholder='contacto@empresa.com'
					/>
				</div>
				<div className='input-group'>
					<label>Tipo de Servicio</label>
					<input
						name='tipo_servicio'
						value={formData.tipo_servicio}
						onChange={handleChange}
						placeholder='Ej: Alquiler de Laptops'
					/>
				</div>
			</div>

			<hr className='divider' />
			<h4 style={{ margin: "10px 0", color: "#64748b", fontSize: "0.9rem" }}>
				Ubicación
			</h4>

			<div className='form-row'>
				<div className='input-group'>
					<label>
						<MapPin size={16} /> Dirección Exacta
					</label>
					<input
						name='direccion'
						value={formData.direccion}
						onChange={handleChange}
						placeholder='Av. Principal 123...'
					/>
				</div>
			</div>

			<div className='form-actions'>
				<button type='submit' className='btn-submit' disabled={loading}>
					<Save size={20} style={{ marginRight: "8px" }} />
					{providerToEdit ? "Actualizar Proveedor" : "Registrar Proveedor"}
				</button>
			</div>
		</form>
	);
};

export default AddProveedorForm;
