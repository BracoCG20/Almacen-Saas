import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  Laptop,
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
} from 'lucide-react';

import './Sidebar.scss';
import logo from '../../assets/logo_grupoSP.png';

const Sidebar = () => {
  // Inicia abierto en PC, cerrado en celular
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  // Efecto para ajustar si el usuario cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Función que cierra el sidebar en móviles después de hacer clic en una ruta
  const handleNavigation = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  const routes = [
    { path: '/', name: 'Dashboard', icon: <Home size={22} /> },
    { path: '/equipos', name: 'Equipos', icon: <Laptop size={22} /> },
    {
      path: '/colaboradores',
      name: 'Colaboradores',
      icon: <Users size={22} />,
    },
    { path: '/proveedores', name: 'Proveedores', icon: <Truck size={22} /> },
    { path: '/servicios', name: 'Servicios', icon: <Cloud size={22} /> },
    {
      path: '/asignacion',
      name: 'Realizar Entrega',
      icon: <ArrowRightLeft size={22} />,
      type: 'entrega',
    },
    {
      path: '/devolucion',
      name: 'Devolución',
      icon: <Undo2 size={22} />,
      type: 'devolucion',
    },
    { path: '/historial', name: 'Historial', icon: <History size={22} /> },
    {
      path: '/configuracion',
      name: 'Configuración',
      icon: <Settings size={22} />,
    },
  ];

  const avatarUrl = user?.foto_url
    ? `http://localhost:4000${user.foto_url}`
    : null;

  return (
    <>
      {/* Fondo oscuro semi-transparente solo visible en móviles cuando está abierto */}
      {isOpen && (
        <div
          className='mobile-overlay'
          onClick={toggleSidebar}
        ></div>
      )}

      <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
        <button
          className='toggle-btn'
          onClick={toggleSidebar}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className='logo-container'>
          <img
            src={logo}
            alt='Logo GrupoSP'
          />
        </div>

        <nav>
          {routes.map((route, index) => (
            <NavLink
              key={index}
              to={route.path}
              onClick={handleNavigation} // Cierra el menú al navegar en celular
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''} ${route.type || ''}`
              }
              title={!isOpen ? route.name : ''}
            >
              <div className='icon-wrapper'>{route.icon}</div>
              <span className='label'>{route.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className='footer-actions'>
          <div className='user-mini-card'>
            <div className='avatar'>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt='User'
                />
              ) : (
                <CircleUser size={24} />
              )}
            </div>
            <div className='info'>
              <span className='name'>{user?.nombre || 'Usuario'}</span>
              <span
                className='email'
                title={user?.email}
              >
                {user?.email || 'Cargando...'}
              </span>
            </div>
          </div>

          <button
            className='logout-btn'
            onClick={handleLogout}
            title='Cerrar Sesión'
          >
            <span className='icon-wrapper'>
              <LogOut size={20} />
            </span>
            <span className='label'>Cerrar Sesión</span>
          </button>

          <p className='copyright'>© {currentYear} Grupo SP</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
