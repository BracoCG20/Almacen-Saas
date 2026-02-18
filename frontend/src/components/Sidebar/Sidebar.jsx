import { useState } from 'react';
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
} from 'lucide-react';

import './Sidebar.scss';
import logo from '../../assets/logo_grupoSP.png';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Obtenemos al usuario y la función logout directamente de nuestro Context
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Definición de Rutas del Menú usando Lucide Icons
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
    <div
      className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className='logo-container'>
        <img
          src={logo}
          alt='Logo GrupoSP'
          className={!isOpen ? 'small-logo' : ''}
        />
      </div>
      <nav>
        {routes.map((route, index) => (
          <NavLink
            key={index}
            to={route.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''} ${route.type || ''}`
            }
            title={!isOpen ? route.name : ''}
          >
            <div className='icon-wrapper'>{route.icon}</div>
            <span className={`label ${isOpen ? 'show' : 'hide'}`}>
              {route.name}
            </span>
          </NavLink>
        ))}
      </nav>
      <div className='footer-actions'>
        <div className={`user-mini-card ${!isOpen ? 'collapsed' : ''}`}>
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
          <div className={`info ${isOpen ? 'show' : 'hide'}`}>
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
          className={`logout-btn ${!isOpen ? 'collapsed' : ''}`}
          onClick={handleLogout}
          title='Cerrar Sesión'
        >
          <span className='icon-wrapper'>
            <LogOut size={20} />
          </span>
          <span className={`label ${isOpen ? 'show' : 'hide'}`}>
            Cerrar Sesión
          </span>
        </button>

        {isOpen && <p className='copyright'>© {currentYear} Grupo SP</p>}
      </div>
    </div>
  );
};

export default Sidebar;
