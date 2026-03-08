import { useState, useEffect } from "react";
import api from "../../service/api";
import { toast } from "react-toastify";
import { Contact, Plus } from "lucide-react";
import Modal from "../../components/Modal/Modal";

import DirectorioStats from "./DirectorioStats";
import DirectorioTable from "./DirectorioTable";
import DirectorioForm from "./DirectorioForm";
import "./Directorio.scss";

const Directorio = () => {
	const [directorio, setDirectorio] = useState([]);
	const [colaboradores, setColaboradores] = useState([]);
	const [estadisticas, setEstadisticas] = useState([]);
	const [loading, setLoading] = useState(true);

	const [modalOpen, setModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState("ADD"); // "ADD", "EDIT", "BAJA"
	const [currentId, setCurrentId] = useState(null);

	const [formData, setFormData] = useState({
		colaborador_id: "",
		tipo_licencia: "BUSINESS_STARTER",
		estado: true,
		datos_transferidos: false,
		colaborador_destino_id: "",
	});

	const fetchData = async () => {
		try {
			const [resDir, resCol, resStats] = await Promise.all([
				api.get("/directorio"),
				api.get("/colaboradores"),
				api.get("/directorio/estadisticas"),
			]);
			setDirectorio(resDir.data);
			setColaboradores(resCol.data.filter((c) => c.estado === true));
			setEstadisticas(resStats.data);
		} catch (error) {
			toast.error("Error al cargar datos del directorio");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const openAddModal = () => {
		setModalMode("ADD");
		setFormData({
			colaborador_id: "",
			tipo_licencia: "BUSINESS_STARTER",
			estado: true,
			datos_transferidos: false,
			colaborador_destino_id: "",
		});
		setModalOpen(true);
	};

	const openEditModal = (registro) => {
		setModalMode("EDIT");
		setCurrentId(registro.id);
		setFormData({
			colaborador_id: registro.colaborador_id,
			tipo_licencia: registro.tipo_licencia,
			estado: registro.estado,
			datos_transferidos: registro.datos_transferidos || false,
			colaborador_destino_id: registro.colaborador_destino_id || "",
		});
		setModalOpen(true);
	};

	const openBajaModal = (registro) => {
		setModalMode("BAJA");
		setCurrentId(registro.id);
		setFormData({
			colaborador_id: registro.colaborador_id,
			tipo_licencia: registro.tipo_licencia, // Mantenemos la que tenía
			estado: false, // Forzamos el estado a false (Inactivo)
			datos_transferidos: registro.datos_transferidos || false,
			colaborador_destino_id: registro.colaborador_destino_id || "",
		});
		setModalOpen(true);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.colaborador_id)
			return toast.warning("Selecciona un colaborador");

		// Validar disponibilidad de licencias solo si se está añadiendo o activando una
		if ((modalMode === "ADD" || modalMode === "EDIT") && formData.estado) {
			const statsLicencia = estadisticas.find(
				(s) => s.tipo_licencia === formData.tipo_licencia,
			);
			if (statsLicencia && statsLicencia.disponibles <= 0) {
				return toast.error(
					`No te quedan licencias disponibles de tipo ${formData.tipo_licencia}.`,
				);
			}
		}

		// Validación de transferencia al dar de baja
		if (
			modalMode === "BAJA" &&
			formData.datos_transferidos &&
			!formData.colaborador_destino_id
		) {
			return toast.warning("Selecciona a quién se le transfirieron los datos");
		}

		try {
			if (modalMode === "ADD") {
				await api.post("/directorio", formData);
				toast.success("Licencia asignada exitosamente");
			} else {
				// Tanto EDIT como BAJA usan el mismo endpoint PUT, solo cambia la data enviada
				await api.put(`/directorio/${currentId}`, formData);
				if (modalMode === "BAJA") {
					toast.success("Servicio dado de baja correctamente");
				} else {
					toast.success("Licencia actualizada");
				}
			}
			setModalOpen(false);
			fetchData();
		} catch (error) {
			toast.error(error.response?.data?.error || "Ocurrió un error al guardar");
		}
	};

	// Determinar título del modal
	const getModalTitle = () => {
		if (modalMode === "ADD") return "Asignar Nueva Licencia";
		if (modalMode === "EDIT") return "Cambiar Plan de Licencia";
		return "Dar de Baja y Transferir";
	};

	if (loading)
		return <div className='loading-state'>Cargando Directorio...</div>;

	return (
		<div className='directorio-container'>
			<div className='page-header'>
				<h1>
					<Contact size={28} /> Directorio Workspace
				</h1>
				<button className='btn-add' onClick={openAddModal}>
					<Plus size={18} /> Asignar Licencia
				</button>
			</div>

			<DirectorioStats estadisticas={estadisticas} />

			<DirectorioTable
				directorio={directorio}
				onEdit={openEditModal}
				onBaja={openBajaModal} // Cambiado onDelete por onBaja
			/>

			<Modal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				title={getModalTitle()}
			>
				<DirectorioForm
					formData={formData}
					setFormData={setFormData}
					colaboradores={colaboradores}
					directorio={directorio}
					modalMode={modalMode} // Pasamos el modo actual en lugar del booleano editMode
					onSubmit={handleSubmit}
					onCancel={() => setModalOpen(false)}
				/>
			</Modal>
		</div>
	);
};

export default Directorio;
