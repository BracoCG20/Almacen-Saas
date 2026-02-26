import { useState, useEffect } from 'react';
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
} from 'lucide-react';

// --- IMPORTACIONES PARA EL TOUR ---
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import './Sidebar.scss';
import logo from '../../assets/logo_grupoSP.png';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
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

  // --- FUNCIÓN DEL TOUR GUIADO ---
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
              'Aquí puedes ver tu cuenta actual. Si eres SuperAdmin, tendrás permisos especiales.',
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
          element: '#tour-nav-inventario',
          popover: {
            title: 'Inventario General',
            description:
              'Aquí registras Laptops, Celulares, Cables y todo lo que pertenece a la empresa.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-nav-asignacion',
          popover: {
            title: 'Entregas',
            description:
              'Usa esta opción para asignar un equipo a un colaborador y generar el Acta PDF.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-nav-historial',
          popover: {
            title: 'Auditoría',
            description:
              'Un registro inmutable de quién entregó qué, y todas las firmas de los colaboradores.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-nav-configuracion',
          popover: {
            title: 'Configuración',
            description:
              'Si tienes permisos, aquí podrás crear nuevos usuarios, editar empresas y cambiar contraseñas.',
            side: 'right',
            align: 'start',
          },
        },
      ],
    });

    setTimeout(() => {
      driverObj.drive();
    }, 300);
  };

  const routes = [
    {
      id: 'tour-nav-dashboard',
      path: '/',
      name: 'Dashboard',
      icon: <LayoutDashboard size={22} />,
    },
    {
      id: 'tour-nav-inventario',
      path: '/equipos',
      name: 'Inventario',
      icon: <Package size={22} />,
    },
    {
      path: '/colaboradores',
      name: 'Colaboradores',
      icon: <Users size={22} />,
    },
    { path: '/proveedores', name: 'Proveedores', icon: <Truck size={22} /> },
    { path: '/servicios', name: 'Servicios', icon: <Cloud size={22} /> },
    {
      id: 'tour-nav-asignacion',
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
    {
      id: 'tour-nav-historial',
      path: '/historial',
      name: 'Historial',
      icon: <History size={22} />,
    },
    {
      id: 'tour-nav-configuracion',
      path: '/configuracion',
      name: 'Configuración',
      icon: <Settings size={22} />,
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
        <Menu size={24} />
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
          <div
            className='user-mini-card'
            id='tour-profile'
          >
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
          <div className='action-buttons-row'>
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
            <button
              className='tour-icon-btn'
              onClick={startTour}
              title='Tour del Sistema'
            >
              <HelpCircle size={22} />
            </button>
          </div>

          <p className='copyright'>© {currentYear} Grupo SP</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
