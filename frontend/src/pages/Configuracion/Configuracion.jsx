import { useState, useEffect } from "react";
import api from "../../service/api";
import { Plus, List, Settings as SettingsIcon } from "lucide-react";
import "./Configuracion.scss";

import RegisterAdminModal from "../../components/RegisterAdminModal/RegisterAdminModal";
import UserListModal from "../../components/UserListModal/UserListModal";
import AddEmpresaModal from "../../components/AddEmpresaModal/AddEmpresaModal";
import EmpresaListModal from "../../components/EmpresaListModal/EmpresaListModal";

const Configuracion = () => {
	const [showUserModal, setShowUserModal] = useState(false);
	const [showUserList, setShowUserList] = useState(false);
	const [showEmpresaModal, setShowEmpresaModal] = useState(false);
	const [showEmpresaList, setShowEmpresaList] = useState(false);
	const [empresaToEdit, setEmpresaToEdit] = useState(null);

	const [loading, setLoading] = useState(true);
	const [userRole, setUserRole] = useState(null);

	useEffect(() => {
		const fetchPerfil = async () => {
			try {
				const res = await api.get("/auth/perfil");
				setUserRole(Number(res.data.rol_id));
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};
		fetchPerfil();
	}, []);

	const isSuperAdmin = userRole === 1;

	if (loading)
		return <div className='loading-state'>Cargando configuración...</div>;

	// Si no es SuperAdmin, no tiene nada que hacer aquí
	if (!isSuperAdmin) {
		return (
			<div className='config-container restricted'>
				<SettingsIcon size={60} className='icon-restricted' />
				<h2>Área Restringida</h2>
				<p>
					Solo los administradores del sistema pueden gestionar la configuración
					global.
				</p>
			</div>
		);
	}

	return (
		<div className='config-container'>
			<div className='page-header'>
				<h1>Configuración Global del Sistema</h1>
				<span>Administra las empresas y los accesos de usuario.</span>
			</div>

			<div className='config-cards-grid'>
				{/* BLOQUE EMPRESAS */}
				<div className='admin-card'>
					<h2>Gestión de Empresas</h2>
					<p>Administra las razones sociales y sedes de la compañía.</p>
					<div className='card-actions'>
						<button
							className='btn-main indigo-light'
							onClick={() => setShowEmpresaList(true)}
						>
							<List size={18} /> Ver Lista
						</button>
						<button
							className='btn-main indigo'
							onClick={() => {
								setEmpresaToEdit(null);
								setShowEmpresaModal(true);
							}}
						>
							<Plus size={18} /> Nueva
						</button>
					</div>
				</div>

				{/* BLOQUE USUARIOS */}
				<div className='admin-card'>
					<h2>Control de Accesos</h2>
					<p>Crea y gestiona las credenciales de acceso al dashboard.</p>
					<div className='card-actions'>
						<button
							className='btn-main indigo-light'
							onClick={() => setShowUserList(true)}
						>
							<List size={18} /> Ver Accesos
						</button>
						<button
							className='btn-main green'
							onClick={() => setShowUserModal(true)}
						>
							<Plus size={18} /> Crear Login
						</button>
					</div>
				</div>
			</div>

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
						setShowEmpresaModal(false);
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
