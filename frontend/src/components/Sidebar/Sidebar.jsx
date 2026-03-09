import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../service/api';
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
  HelpCircle,
  LayoutDashboard,
  NotebookTabs,
  UserCircle,
} from 'lucide-react';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './Sidebar.scss';
import logo from '../../assets/logo_grupoSP.png';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleNavigation = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  const startTour = () => {
    if (window.innerWidth <= 768 && !isOpen) {
      setIsOpen(true);
    }
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      steps: [
        {
          element: '#tour-profile',
          popover: {
            title: 'Tu Perfil',
            description:
              'Haz clic aquí para editar tus datos personales o cerrar sesión.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-nav-dashboard',
          popover: {
            title: 'Dashboard',
            description:
              'Métricas, gráficos y el resumen general de todo el almacén en tiempo real.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-nav-configuracion',
          popover: {
            title: 'Configuración Global',
            description:
              'Aquí administras las empresas del grupo y creas usuarios nuevos (solo administradores).',
            side: 'right',
            align: 'start',
          },
        },
      ],
    });
    setTimeout(() => driverObj.drive(), 300);
  };

  const routes = [
    {
      id: 'tour-nav-dashboard',
      path: '/',
      name: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      id: 'tour-nav-inventario',
      path: '/equipos',
      name: 'Inventario',
      icon: <Package size={20} />,
    },
    {
      path: '/colaboradores',
      name: 'Colaboradores',
      icon: <Users size={20} />,
    },
    {
      path: '/directorio',
      name: 'Directorio',
      icon: <NotebookTabs size={20} />,
    },
    { path: '/proveedores', name: 'Proveedores', icon: <Truck size={20} /> },
    { path: '/servicios', name: 'Servicios', icon: <Cloud size={20} /> },
    {
      id: 'tour-nav-asignacion',
      path: '/asignacion',
      name: 'Realizar Entrega',
      icon: <ArrowRightLeft size={20} />,
      type: 'entrega',
    },
    {
      path: '/devolucion',
      name: 'Devolución',
      icon: <Undo2 size={20} />,
      type: 'devolucion',
    },
    {
      id: 'tour-nav-historial',
      path: '/historial',
      name: 'Historial',
      icon: <History size={20} />,
    },
    {
      id: 'tour-nav-configuracion',
      path: '/configuracion',
      name: 'Configuración',
      icon: <Settings size={20} />,
    },
  ];

  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:4000';
    return `${baseUrl}${path}`;
  };

  const avatarUrl = getAvatarUrl(user?.foto_url);

  return (
    <>
      <button
        className={`mobile-hamburger ${isOpen ? 'hidden' : ''}`}
        onClick={toggleSidebar}
      >
        <Menu size={20} />
      </button>

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
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
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
              id={route.id}
              onClick={handleNavigation}
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
          {/* BOTÓN AYUDA MOVIDO ARRIBA DEL USUARIO */}
          <div className='action-buttons-row'>
            <button
              className='tour-icon-btn'
              onClick={startTour}
              title='Tour del Sistema'
            >
              <HelpCircle size={18} />
              <span className='label'>Ayuda</span>
            </button>
          </div>

          {/* TARJETA DE USUARIO INTERACTIVA */}
          <div
            className='user-menu-container'
            ref={menuRef}
          >
            <div
              className={`user-mini-card ${showUserMenu ? 'active' : ''}`}
              id='tour-profile'
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={!isOpen ? 'Opciones de Usuario' : ''}
            >
              <div className='avatar'>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt='User'
                  />
                ) : (
                  <CircleUser size={20} />
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

            {showUserMenu && (
              <div className='user-dropdown'>
                <button
                  className='dropdown-item'
                  onClick={() => {
                    navigate('/perfil');
                    setShowUserMenu(false);
                    handleNavigation();
                  }}
                >
                  <UserCircle size={16} /> Mi Perfil
                </button>
                <div className='dropdown-divider'></div>
                <button
                  className='dropdown-item logout'
                  onClick={handleLogout}
                >
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
