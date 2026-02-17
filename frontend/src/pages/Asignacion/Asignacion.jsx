import { useEffect, useState, useRef } from "react";
import api from "../../service/api";
import { toast } from "react-toastify";
import PdfModal from "../../components/Modal/PdfModal";
import Modal from "../../components/Modal/Modal";

import EntregaForm from "./EntregaForm";
import EntregaTable from "./EntregaTable";
import { generarPDFBlob } from "../../utils/pdfGeneratorAsignacion";

import { AlertTriangle, X, Check } from "lucide-react";

import "./Asignacion.scss";

const Asignacion = () => {
	const [equiposDisponibles, setEquiposDisponibles] = useState([]);
	const [usuariosLibres, setUsuariosLibres] = useState([]);
	const [historialVisual, setHistorialVisual] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showPdfModal, setShowPdfModal] = useState(false);
	const [pdfUrl, setPdfUrl] = useState("");

	const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
	const [movimientoToInvalidar, setMovimientoToInvalidar] = useState(null);

	const fileInputRef = useRef(null);
	const [selectedMovimientoId, setSelectedMovimientoId] = useState(null);

	const [formData, setFormData] = useState({
		equipo_id: "",
		empleado_id: "",
		cargador: true,
		observaciones: "",
	});

	const fetchData = async () => {
		try {
			const [resEquipos, resColaboradores, resMovimientos] = await Promise.all([
				api.get("/equipos"),
				api.get("/colaboradores"),
				api.get("/movimientos"),
			]);

			setEquiposDisponibles(
				resEquipos.data.filter((e) => e.disponible === true),
			);

			const ocupados = new Set();
			resMovimientos.data
				.sort(
					(a, b) => new Date(a.fecha_movimiento) - new Date(b.fecha_movimiento),
				)
				.forEach((m) =>
					m.tipo === "entrega"
						? ocupados.add(m.empleado_id)
						: ocupados.delete(m.empleado_id),
				);

			setUsuariosLibres(
				resColaboradores.data.filter(
					(u) => u.estado === true && !ocupados.has(u.id),
				),
			);

			const entregas = resMovimientos.data
				.filter((h) => h.tipo === "entrega")
				.sort(
					(a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento),
				)
				.slice(0, 10);

			setHistorialVisual(entregas);
		} catch (error) {
			console.error(error);
			toast.error("Error al cargar datos");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleSubirClick = (id) => {
		setSelectedMovimientoId(id);
		fileInputRef.current.click();
	};

	const handleFileChange = async (e) => {
		const file = e.target.files[0];
		if (!file || !selectedMovimientoId) return;
		const toastId = toast.loading("Subiendo archivo...");
		const form = new FormData();
		form.append("pdf", file);
		try {
			await api.post(
				`/movimientos/${selectedMovimientoId}/subir-firmado`,
				form,
				{ headers: { "Content-Type": "multipart/form-data" } },
			);
			toast.update(toastId, {
				render: "Guardado ✅",
				type: "success",
				isLoading: false,
				autoClose: 2000,
			});
			fetchData();
		} catch (err) {
			toast.update(toastId, {
				render: "Error al subir ❌",
				type: "error",
				isLoading: false,
				autoClose: 2000,
			});
		}
		e.target.value = null;
	};

	const onInvalidarClick = (id) => {
		setMovimientoToInvalidar(id);
		setIsRejectModalOpen(true);
	};

	const handleInvalidar = async () => {
		try {
			await api.put(`/movimientos/${movimientoToInvalidar}/invalidar`);
			toast.info("Documento invalidado");
			setIsRejectModalOpen(false);
			fetchData();
		} catch (e) {
			toast.error("Error al invalidar");
		}
	};

	const handleVerFirmado = (url) => {
		setPdfUrl(`http://localhost:4000${url}`);
		setShowPdfModal(true);
	};

	const handleAction = async (tipoAccion) => {
		if (!formData.equipo_id || !formData.empleado_id) return;

		const us = usuariosLibres.find(
			(u) => u.id === parseInt(formData.empleado_id),
		);
		const eq = equiposDisponibles.find(
			(e) => e.id === parseInt(formData.equipo_id),
		);

		// CORRECCIÓN AQUÍ: Cambiamos us.correo por us.email_contacto
		if (tipoAccion === "EMAIL" && !us.email_contacto) {
			return toast.error("El colaborador no tiene correo registrado");
		}

		const equipoParaPdf = { ...eq, serie: eq.numero_serie };
		const docPdf = generarPDFBlob(equipoParaPdf, us, null, formData.cargador);
		const pdfBlob = docPdf.output("blob");

		try {
			if (tipoAccion === "GUARDAR" || tipoAccion === "WHATSAPP") {
				await api.post("/movimientos/entrega", {
					...formData,
					equipo_id: parseInt(formData.equipo_id),
					empleado_id: parseInt(formData.empleado_id),
					fecha: new Date().toISOString(),
				});

				toast.success("Entrega guardada exitosamente");
				setPdfUrl(URL.createObjectURL(pdfBlob));
				setShowPdfModal(true);

				if (tipoAccion === "WHATSAPP") {
					const nombreArchivo = `Acta_${us.nombres.split(" ")[0]}_${eq.modelo}.pdf`;
					docPdf.save(nombreArchivo);
					const numero = us.telefono ? us.telefono.replace(/\D/g, "") : "";
					const mensaje = `Hola ${us.nombres}, te hago entrega del acta de tu equipo ${eq.modelo}.`;
					const link = numero
						? `https://wa.me/51${numero}?text=${encodeURIComponent(mensaje)}`
						: `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
					window.open(link, "_blank");
				}
			} else if (tipoAccion === "EMAIL") {
				const loadingToast = toast.loading("Guardando y enviando correo...");
				const formDataEmail = new FormData();
				formDataEmail.append("pdf", pdfBlob, "Acta_Entrega.pdf");
				formDataEmail.append("equipo_id", formData.equipo_id);
				formDataEmail.append("empleado_id", formData.empleado_id);
				formDataEmail.append("cargador", formData.cargador);

				// CORRECCIÓN AQUÍ: Mandamos us.email_contacto al backend
				formDataEmail.append("destinatario", us.email_contacto);
				formDataEmail.append("nombreEmpleado", us.nombres);
				formDataEmail.append("tipoEquipo", eq.modelo);

				const response = await api.post(
					"/movimientos/entrega-con-correo",
					formDataEmail,
					{ headers: { "Content-Type": "multipart/form-data" } },
				);

				if (response.data.warning) {
					toast.update(loadingToast, {
						render: "Guardado, fallo envío correo ⚠️",
						type: "warning",
						isLoading: false,
						autoClose: 4000,
					});
				} else {
					toast.update(loadingToast, {
						render: "¡Guardado y Enviado! ✅",
						type: "success",
						isLoading: false,
						autoClose: 3000,
					});
				}
				setPdfUrl(URL.createObjectURL(pdfBlob));
				setShowPdfModal(true);
			}

			setFormData({
				equipo_id: "",
				empleado_id: "",
				cargador: true,
				observaciones: "",
			});
			fetchData();
		} catch (error) {
			console.error(error);
			toast.error(error.response?.data?.error || "Error en el proceso");
			toast.dismiss();
		}
	};

	if (loading) return <div className='loading-state'>Cargando...</div>;

	const equiposOptions = equiposDisponibles.map((e) => ({
		value: e.id,
		label: `${e.marca} ${e.modelo} - ${e.numero_serie}`,
	}));

	const usuariosOptions = usuariosLibres.map((u) => ({
		value: u.id,
		label: `${u.nombres} ${u.apellidos}`,
	}));

	return (
		<div className='entrega-container'>
			<div className='page-header'>
				<h1>Registrar Entrega</h1>
			</div>

			<input
				type='file'
				ref={fileInputRef}
				style={{ display: "none" }}
				accept='application/pdf'
				onChange={handleFileChange}
			/>

			<div className='content-grid'>
				<EntregaForm
					equiposOptions={equiposOptions}
					usuariosOptions={usuariosOptions}
					formData={formData}
					setFormData={setFormData}
					onAction={handleAction}
				/>

				<EntregaTable
					historial={historialVisual}
					onVerPdfOriginal={(item) => {
						const doc = generarPDFBlob(
							{ serie: item.serie, marca: item.marca, modelo: item.modelo },
							{
								nombres: item.empleado_nombre,
								apellidos: item.empleado_apellido,
								dni: item.dni || "---",
								genero: item.genero || "hombre",
							},
							item.fecha_movimiento,
							item.cargador,
						);
						setPdfUrl(doc.output("bloburl"));
						setShowPdfModal(true);
					}}
					onVerFirmado={handleVerFirmado}
					onSubirClick={handleSubirClick}
					onInvalidar={onInvalidarClick}
				/>
			</div>

			<Modal
				isOpen={isRejectModalOpen}
				onClose={() => setIsRejectModalOpen(false)}
				title='Confirmar Rechazo'
			>
				<div className='confirm-modal-content'>
					<div className='warning-icon reject'>
						<AlertTriangle size={40} />
					</div>
					<h3>¿Rechazar firma del documento?</h3>
					<p>
						Esta acción invalidará el PDF firmado de esta entrega.
						<br />
						Deberás subir un nuevo archivo escaneado.
					</p>
					<div className='modal-actions'>
						<button
							className='btn-cancel'
							onClick={() => setIsRejectModalOpen(false)}
						>
							<X size={18} /> Cancelar
						</button>
						<button className='btn-confirm-reject' onClick={handleInvalidar}>
							<Check size={18} /> Confirmar Rechazo
						</button>
					</div>
				</div>
			</Modal>

			<PdfModal
				isOpen={showPdfModal}
				onClose={() => setShowPdfModal(false)}
				pdfUrl={pdfUrl}
				title='Documento'
			/>
		</div>
	);
};

export default Asignacion;
