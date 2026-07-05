//frontend/src/components/Sidebar/Sidebar.jsx
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../service/api";
import { io } from "socket.io-client";
import {
	Package,
	Users,
	Truck,
	Cloud,
	ArrowRightLeft,
	Undo2,
	History,
	Settings,
	CircleUser,
	LogOut,
	ChevronRight,
	ChevronLeft,
	Menu,
	LayoutDashboard,
	NotebookTabs,
	UserCircle,
	Tickets,
} from "lucide-react";

import "./Sidebar.scss";
import logo from "../../assets/logo_grupoSP.png";

const SOCKET_URL = api.defaults.baseURL
	? api.defaults.baseURL.replace(/\/api\/?$/, "")
	: "http://localhost:4000";

const Sidebar = () => {
	const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [unreadTickets, setUnreadTickets] = useState(0);
	const menuRef = useRef(null);

	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const currentYear = new Date().getFullYear();

	// EFECTO CORREGIDO: Se movió la función adentro del useEffect para evitar el error exhaustive-deps
	useEffect(() => {
		if (Number(user?.rol_id) !== 1) return;

		const fetchUnreadCount = async () => {
			try {
				const res = await api.get("/tickets");
				const count = res.data.filter((t) => t.estado === "Pendiente").length;
				setUnreadTickets(count);
			} catch (error) {
				console.error("Error al obtener conteo de tickets", error);
			}
		};

		fetchUnreadCount();

		const socket = io(SOCKET_URL);
		socket.on("nuevo_ticket", () => fetchUnreadCount());
		socket.on("actualizacion_ticket", () => fetchUnreadCount());

		return () => socket.disconnect();
	}, [user?.rol_id]); // Dependencia segura

	useEffect(() => {
		const handleResize = () => {
			setIsOpen(window.innerWidth > 768);
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setShowUserMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	const toggleSidebar = () => setIsOpen(!isOpen);

	const handleNavigation = () => {
		if (window.innerWidth <= 768) setIsOpen(false);
	};

	const routes = [
		{
			path: "/dashboard",
			name: "Dashboard",
			icon: <LayoutDashboard size={20} />,
		},
		{
			path: "/equipos",
			name: "Inventario",
			icon: <Package size={20} />,
		},
		{
			path: "/colaboradores",
			name: "Colaboradores",
			icon: <Users size={20} />,
		},
		{
			path: "/directorio",
			name: "Directorio",
			icon: <NotebookTabs size={20} />,
		},
		{ path: "/proveedores", name: "Proveedores", icon: <Truck size={20} /> },
		{ path: "/servicios", name: "Servicios", icon: <Cloud size={20} /> },
		{
			path: "/tickets",
			name: "Tickets",
			icon: <Tickets size={20} />,
			isTicketRoute: true,
		},
		{
			path: "/asignacion",
			name: "Realizar Entrega",
			icon: <ArrowRightLeft size={20} />,
			type: "entrega",
		},
		{
			path: "/devolucion",
			name: "Devolución",
			icon: <Undo2 size={20} />,
			type: "devolucion",
		},
		{
			path: "/historial",
			name: "Historial",
			icon: <History size={20} />,
		},
		{
			path: "/configuracion",
			name: "Configuración",
			icon: <Settings size={20} />,
		},
	];

	const getAvatarUrl = (path) => {
		if (!path) return null;
		if (path.startsWith("http") || path.startsWith("blob:")) return path;
		const baseUrl = api.defaults.baseURL
			? api.defaults.baseURL.replace(/\/api\/?$/, "")
			: "http://localhost:4000";
		return `${baseUrl}${path}`;
	};

	const avatarUrl = getAvatarUrl(user?.foto_url);

	return (
		<>
			<button
				className={`mobile-hamburger ${isOpen ? "hidden" : ""}`}
				onClick={toggleSidebar}
			>
				<Menu size={20} />
			</button>
			{isOpen && <div className='mobile-overlay' onClick={toggleSidebar}></div>}

			<div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
				<button className='toggle-btn' onClick={toggleSidebar}>
					{isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
				</button>

				<div className='logo-container'>
					<img src={logo} alt='Logo GrupoSP' />
				</div>

				<nav>
					{routes.map((route, index) => (
						<NavLink
							key={index}
							to={route.path}
							onClick={handleNavigation}
							className={({ isActive }) =>
								`nav-item ${isActive ? "active" : ""} ${route.type || ""}`
							}
							title={!isOpen ? route.name : ""}
						>
							<div className='icon-wrapper'>
								{route.icon}
								{/* VALIDACIÓN: SOLO SUPERADMIN Y SOLO EN RUTA TICKETS */}
								{route.isTicketRoute &&
									Number(user?.rol_id) === 1 &&
									unreadTickets > 0 && (
										<span className='nav-badge'>
											{unreadTickets > 9 ? "9+" : unreadTickets}
										</span>
									)}
							</div>
							<span className='label'>{route.name}</span>
						</NavLink>
					))}
				</nav>

				<div className='footer-actions'>
					<div className='user-menu-container' ref={menuRef}>
						<div
							className={`user-mini-card ${showUserMenu ? "active" : ""}`}
							onClick={() => setShowUserMenu(!showUserMenu)}
							title={!isOpen ? "Opciones de Usuario" : ""}
						>
							<div className='avatar'>
								{avatarUrl ? (
									<img src={avatarUrl} alt='User' />
								) : (
									<CircleUser size={20} />
								)}
							</div>
							<div className='info'>
								<span className='name'>{user?.nombre || "Usuario"}</span>
								<span className='email' title={user?.email}>
									{user?.email || "Cargando..."}
								</span>
							</div>
						</div>

						{showUserMenu && (
							<div className='user-dropdown'>
								<button
									className='dropdown-item'
									onClick={() => {
										navigate("/perfil");
										setShowUserMenu(false);
										handleNavigation();
									}}
								>
									<UserCircle size={16} /> Editar Perfil
								</button>
								<div className='dropdown-divider'></div>
								<button className='dropdown-item logout' onClick={handleLogout}>
									<LogOut size={16} /> Cerrar Sesión
								</button>
							</div>
						)}
					</div>
					<p className='copyright'>© {currentYear} Grupo SP</p>
				</div>
			</div>
		</>
	);
};

export default Sidebar;
