import React, { useState, useEffect, useRef } from "react";
import api from "../../service/api";
import { toast } from "react-toastify";
import Select from "react-select";
import {
	CalendarCheck,
	History,
	Eye,
	Download,
	Trash2,
	FileImage,
	FileText,
	Save,
	AlertTriangle, // NUEVO
	X, // NUEVO
	Check, // NUEVO
} from "lucide-react";
import Modal from "../../components/Modal/Modal"; // IMPORTAMOS TU MODAL
import "./AddServicioForm.scss";
import "./PagoServicioModal.scss";

const PagoServicioModal = ({ servicio, onClose }) => {
	const [pagos, setPagos] = useState([]);
	const [loading, setLoading] = useState(false);
	const fileInputRef = useRef(null);

	const [formData, setFormData] = useState({
		fecha_pago: new Date().toISOString().split("T")[0],
		monto_pagado: servicio?.precio || "",
		moneda: servicio?.moneda || "USD",
		periodo_mes: new Date().getMonth() + 1,
		periodo_anio: new Date().getFullYear(),
		nueva_fecha_proximo_pago: "",
	});

	const [archivo, setArchivo] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);

	// --- NUEVOS ESTADOS PARA EL MODAL DE ANULAR PAGO ---
	const [isAnularModalOpen, setIsAnularModalOpen] = useState(false);
	const [pagoToAnular, setPagoToAnular] = useState(null);

	const monedaOptions = [
		{ value: "USD", label: "USD" },
		{ value: "PEN", label: "PEN" },
		{ value: "EUR", label: "EUR" },
	];

	const mesesOptions = [
		{ value: 1, label: "Enero" },
		{ value: 2, label: "Febrero" },
		{ value: 3, label: "Marzo" },
		{ value: 4, label: "Abril" },
		{ value: 5, label: "Mayo" },
		{ value: 6, label: "Junio" },
		{ value: 7, label: "Julio" },
		{ value: 8, label: "Agosto" },
		{ value: 9, label: "Septiembre" },
		{ value: 10, label: "Octubre" },
		{ value: 11, label: "Noviembre" },
		{ value: 12, label: "Diciembre" },
	];

	const aniosOptions = [
		{ value: 2024, label: "2024" },
		{ value: 2025, label: "2025" },
		{ value: 2026, label: "2026" },
		{ value: 2027, label: "2027" },
	];

	const fetchPagos = async () => {
		if (!servicio) return;
		try {
			const res = await api.get(`/servicios/${servicio.id}/pagos`);
			setPagos(res.data);
		} catch (error) {
			toast.error("Error al cargar historial");
		}
	};

	useEffect(() => {
		fetchPagos();
		if (servicio?.fecha_proximo_pago) {
			const proxima = new Date(servicio.fecha_proximo_pago);
			proxima.setMonth(proxima.getMonth() + 1);
			setFormData((prev) => ({
				...prev,
				nueva_fecha_proximo_pago: proxima.toISOString().split("T")[0],
			}));
		}
	}, [servicio]);

	useEffect(() => {
		return () => {
			if (previewUrl) URL.revokeObjectURL(previewUrl);
		};
	}, [previewUrl]);

	const getUrlCompleta = (url) => {
		if (!url) return "";
		return url.startsWith("http") ? url : `http://localhost:4000${url}`;
	};

	const handleChange = (e) =>
		setFormData({ ...formData, [e.target.name]: e.target.value });
	const handleSelectChange = (selectedOption, actionMeta) =>
		setFormData({
			...formData,
			[actionMeta.name]: selectedOption ? selectedOption.value : null,
		});

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setArchivo(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const handleRemoveFile = () => {
		setArchivo(null);
		setPreviewUrl(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.monto_pagado || !formData.periodo_mes)
			return toast.warning("Completa el monto y el periodo.");

		setLoading(true);
		const form = new FormData();
		Object.keys(formData).forEach((key) => form.append(key, formData[key]));
		if (archivo) form.append("comprobante", archivo);

		try {
			await api.post(`/servicios/${servicio.id}/pagos`, form, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			toast.success("Pago registrado ✅");
			handleRemoveFile();
			fetchPagos();
		} catch (error) {
			toast.error("Error al registrar ❌");
		} finally {
			setLoading(false);
		}
	};

	// --- NUEVAS FUNCIONES PARA ANULAR PAGO CON MODAL ---
	const triggerAnularPago = (pagoId) => {
		setPagoToAnular(pagoId);
		setIsAnularModalOpen(true);
	};

	const confirmAnularPago = async () => {
		if (!pagoToAnular) return;
		try {
			await api.put(`/servicios/pagos/${pagoToAnular}/anular`);
			toast.success("Pago anulado exitosamente");
			setIsAnularModalOpen(false);
			setPagoToAnular(null);
			fetchPagos();
		} catch (error) {
			toast.error("Error al anular el pago");
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return "-";
		const date = new Date(
			dateString.includes("T") ? dateString : `${dateString}T12:00:00Z`,
		);
		return date.toLocaleDateString("es-PE", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		});
	};

	const getMesNombre = (num) =>
		mesesOptions.find((m) => m.value === num)?.label || num;

	const customSelectStyles = {
		control: (provided) => ({
			...provided,
			borderRadius: "8px",
			minHeight: "50px",
			height: "50px",
			borderColor: "#cbd5e1",
		}),
		valueContainer: (provided) => ({
			...provided,
			position: "relative",
			padding: "0 14px",
		}),
		input: (provided) => ({ ...provided, margin: "0px", padding: "0px" }),
		indicatorSeparator: () => ({ display: "none" }),
		singleValue: (provided) => ({
			...provided,
			color: "#334155",
			position: "absolute",
			top: "50%",
			transform: "translateY(-50%)",
		}),
		menuPortal: (base) => ({ ...base, zIndex: 9999 }),
	};

	if (!servicio) return null;

	return (
		<div className='pago-modal-container'>
			<div className='modal-card padding-content'>
				<h4 className='section-title'>
					<CalendarCheck size={18} /> Registrar Nuevo Pago
				</h4>
				<form
					className='equipo-form'
					onSubmit={handleSubmit}
					style={{ padding: 0, maxHeight: "none", overflow: "visible" }}
				>
					<div className='form-row'>
						<div className='input-group'>
							<label>Fecha de Pago</label>
							<input
								type='date'
								name='fecha_pago'
								value={formData.fecha_pago}
								onChange={handleChange}
								required
							/>
						</div>
						<div className='input-group'>
							<label>Monto Pagado</label>
							<div style={{ display: "flex", gap: "8px" }}>
								<div style={{ width: "100px" }}>
									<Select
										name='moneda'
										options={monedaOptions}
										value={monedaOptions.find(
											(op) => op.value === formData.moneda,
										)}
										onChange={handleSelectChange}
										styles={customSelectStyles}
										isSearchable={false}
										menuPortalTarget={document.body}
									/>
								</div>
								<input
									type='number'
									step='0.01'
									name='monto_pagado'
									value={formData.monto_pagado}
									onChange={handleChange}
									style={{ flex: 1 }}
									required
								/>
							</div>
						</div>
					</div>

					<div className='form-row'>
						<div className='input-group'>
							<label>Período (Mes y Año)</label>
							<div style={{ display: "flex", gap: "8px" }}>
								<Select
									name='periodo_mes'
									options={mesesOptions}
									value={mesesOptions.find(
										(m) => m.value === formData.periodo_mes,
									)}
									onChange={handleSelectChange}
									styles={customSelectStyles}
									isSearchable={false}
									menuPortalTarget={document.body}
								/>
								<Select
									name='periodo_anio'
									options={aniosOptions}
									value={aniosOptions.find(
										(a) => a.value === formData.periodo_anio,
									)}
									onChange={handleSelectChange}
									styles={customSelectStyles}
									isSearchable={false}
									menuPortalTarget={document.body}
								/>
							</div>
						</div>
						<div className='input-group'>
							<label>Actualizar Próximo Cobro a:</label>
							<input
								type='date'
								name='nueva_fecha_proximo_pago'
								value={formData.nueva_fecha_proximo_pago}
								onChange={handleChange}
							/>
						</div>
					</div>

					<div className='input-group'>
						<label>Comprobante / Factura (PDF o Imagen)</label>
						{!archivo && (
							<input
								type='file'
								accept='.pdf,image/*'
								ref={fileInputRef}
								onChange={handleFileChange}
								className='file-input-custom'
							/>
						)}
						{archivo && (
							<div className='file-preview-box'>
								<div className='file-info'>
									{archivo.type.includes("image") ? (
										<FileImage className='icon img' />
									) : (
										<FileText className='icon pdf' />
									)}
									<div className='details'>
										<span className='filename'>{archivo.name}</span>
										<span className='filesize'>
											{(archivo.size / 1024).toFixed(1)} KB
										</span>
									</div>
								</div>
								<div className='file-actions'>
									<button
										type='button'
										className='action-btn view'
										onClick={() => window.open(previewUrl, "_blank")}
										title='Vista Previa'
									>
										<Eye size={16} />
									</button>
									<a
										href={previewUrl}
										download={archivo.name}
										target='_blank'
										rel='noreferrer'
										className='action-btn download'
										title='Descargar'
									>
										<Download size={16} />
									</a>
									<button
										type='button'
										className='action-btn remove'
										onClick={handleRemoveFile}
										title='Quitar archivo'
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						)}
					</div>

					<button type='submit' className='btn-submit' disabled={loading}>
						<Save size={18} style={{ marginRight: "8px" }} />{" "}
						{loading ? "Guardando..." : "Guardar Comprobante"}
					</button>
				</form>
			</div>

			<div className='history-container'>
				<h4 className='history-header'>
					<History size={18} /> Historial de Pagos
				</h4>
				{pagos.length === 0 ? (
					<div className='empty-state'>
						Aún no hay pagos registrados para este servicio.
					</div>
				) : (
					<div className='table-scroll'>
						<table>
							<thead>
								<tr>
									<th>Fecha de Pago</th>
									<th>Período</th>
									<th>Monto</th>
									<th className='center'>Acciones</th>
								</tr>
							</thead>
							<tbody>
								{pagos.map((pago) => {
									const urlCompleta = getUrlCompleta(pago.url_factura);
									return (
										<tr key={pago.id}>
											<td className='date'>{formatDate(pago.fecha_pago)}</td>
											<td className='period'>
												{getMesNombre(pago.periodo_mes)} {pago.periodo_anio}
											</td>
											<td className='amount'>
												{pago.moneda} {Number(pago.monto_pagado).toFixed(2)}
											</td>
											<td className='center'>
												<div className='table-actions'>
													{pago.url_factura ? (
														<>
															<button
																onClick={() =>
																	window.open(urlCompleta, "_blank")
																}
																className='btn-icon view'
																title='Ver Comprobante'
															>
																<Eye size={14} />
															</button>
															<a
																href={urlCompleta}
																download
																target='_blank'
																rel='noreferrer'
																className='btn-icon download'
																title='Descargar Comprobante'
															>
																<Download size={14} />
															</a>
														</>
													) : (
														<span style={{ color: "#cbd5e1" }}></span>
													)}

													{/* BOTÓN PARA ANULAR PAGO */}
													<button
														type='button'
														onClick={() => triggerAnularPago(pago.id)}
														className='btn-icon remove'
														title='Anular Pago'
													>
														<Trash2 size={14} />
													</button>
												</div>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* --- MODAL PARA CONFIRMAR ANULACIÓN DEL PAGO --- */}
			<Modal
				isOpen={isAnularModalOpen}
				onClose={() => setIsAnularModalOpen(false)}
				title='Confirmar Anulación'
			>
				<div className='confirm-modal-content'>
					<div className='warning-icon'>
						<AlertTriangle size={40} />
					</div>
					<h3>¿Anular este pago?</h3>
					<p>
						Se dejará constancia de esta anulación en el historial de auditoría
						del servicio.
					</p>
					<div className='modal-actions'>
						<button
							type='button'
							className='btn-cancel'
							onClick={() => setIsAnularModalOpen(false)}
						>
							<X size={18} /> Cancelar
						</button>
						<button
							type='button'
							className='btn-confirm'
							onClick={confirmAnularPago}
						>
							<Check size={18} /> Confirmar Anulación
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
};

export default PagoServicioModal;
