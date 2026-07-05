import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sileo";
import { AlertTriangle, LogOut } from "lucide-react";

import { AuthProvider, useAuth } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import MainLayout from "./layout/MainLayout";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Equipos from "./pages/Equipos/Equipos";
import Colaboradores from "./pages/Colaboradores/Colaboradores";
import Proveedores from "./pages/Proveedores/Proveedores";
import Servicios from "./pages/Servicios/Servicios";
import Asignacion from "./pages/Asignacion/Asignacion";
import Devolucion from "./pages/Devolucion/Devolucion";
import Historial from "./pages/Historial/Historial";
import Configuracion from "./pages/Configuracion/Configuracion";
import FirmarDocumento from "./pages/FirmarDocumento/FirmarDocumento";
import Directorio from "./pages/Directorio/Directorio";
import Perfil from "./pages/Perfil/Perfil";
import Tickets from "./pages/Tickets/Tickets";

import "./App.scss";

// Componente para proteger las rutas públicas (Evita que usuarios logueados vean el login)
const PublicRoute = ({ children }) => {
	const { user, loading } = useAuth();
	if (loading) return null;
	return user ? <Navigate to='/dashboard' replace /> : children;
};

const GlobalForceLogoutModal = () => {
	const { isForceLogout, executeForceLogout } = useAuth();
	if (!isForceLogout) return null;

	return (
		<div className='force-logout-overlay'>
			<div className='force-logout-modal'>
				<div className='warning-icon-container'>
					<AlertTriangle size={36} />
				</div>
				<h2 className='force-logout-title'>Acceso Revocado</h2>
				<p className='force-logout-text'>
					Un administrador ha desactivado tu cuenta. Tu sesión será terminada
					inmediatamente.
				</p>
				<button onClick={executeForceLogout} className='force-logout-btn'>
					<LogOut size={18} /> Entendido
				</button>
			</div>
		</div>
	);
};

function AppContent() {
	return (
		<>
			<GlobalForceLogoutModal />

			<Routes>
				{/* RUTA DE LOGIN PROTEGIDA */}
				<Route
					path='/login'
					element={
						<PublicRoute>
							<Login />
						</PublicRoute>
					}
				/>

				{/* RUTA PÚBLICA PARA EL EMPLEADO */}
				<Route path='/firmar/:token' element={<FirmarDocumento />} />

				{/* RUTAS PRIVADAS DEL SISTEMA */}
				<Route element={<PrivateRoute />}>
					<Route path='/' element={<MainLayout />}>
						{/* Si entran a la raíz (/), los mandamos automáticamente a /dashboard */}
						<Route index element={<Navigate to='dashboard' replace />} />

						{/* Ruta oficial del Dashboard */}
						<Route path='dashboard' element={<Dashboard />} />

						<Route path='equipos' element={<Equipos />} />
						<Route path='colaboradores' element={<Colaboradores />} />
						<Route path='directorio' element={<Directorio />} />
						<Route path='proveedores' element={<Proveedores />} />
						<Route path='servicios' element={<Servicios />} />
						<Route path='tickets' element={<Tickets />} />
						<Route path='asignacion' element={<Asignacion />} />
						<Route path='devolucion' element={<Devolucion />} />
						<Route path='Historial' element={<Historial />} />
						<Route path='configuracion' element={<Configuracion />} />
						<Route path='perfil' element={<Perfil />} />
					</Route>
				</Route>

				{/* CUALQUIER OTRA RUTA INVALIDA SE MANDA A LA RAÍZ */}
				<Route path='*' element={<Navigate to='/' />} />
			</Routes>

			{/* TOASTER GLOBAL DE SILEO */}
			<Toaster position='top-right' />
		</>
	);
}

function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<AppContent />
			</AuthProvider>
		</BrowserRouter>
	);
}

export default App;
