//frontend/src/layout/MainLayout.jsx
import { Outlet, useNavigate } from 'react-router-dom';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar/Sidebar';
import './MainLayout.scss';

const MainLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Función que se ejecuta cuando el tiempo se agota
  const onIdle = () => {
    logout(); // 1. Limpiamos el token y estado del usuario

    // 2. Le avisamos por qué lo sacamos del sistema
    toast.info('⏳ Tu sesión se cerró por inactividad.', {
      autoClose: 5000,
    });

    // 3. Lo mandamos al login
    navigate('/login');
  };

  // Configuración del hook
  useIdleTimer({
    onIdle,
    timeout: 1000 * 60 * 20, // 20 minutos de inactividad (en milisegundos)
    throttle: 500,
  });

  return (
    <div className='main-layout-container'>
      <Sidebar />

      <main className='main-content'>
        <div className='main-wrapper'>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
