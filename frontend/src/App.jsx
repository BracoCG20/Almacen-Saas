import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AlertTriangle, LogOut } from 'lucide-react';

import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import MainLayout from './layout/MainLayout';

import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Equipos from './pages/Equipos/Equipos';
import Colaboradores from './pages/Colaboradores/Colaboradores';
import Proveedores from './pages/Proveedores/Proveedores';
import Servicios from './pages/Servicios/Servicios';
import Asignacion from './pages/Asignacion/Asignacion';
import Devolucion from './pages/Devolucion/Devolucion';
import Historial from './pages/Historial/Historial';
import Configuracion from './pages/Configuracion/Configuracion';
import FirmarDocumento from './pages/FirmarDocumento/FirmarDocumento';
import Directorio from './pages/Directorio/Directorio';
import Perfil from './pages/Perfil/Perfil';
import Tickets from './pages/Tickets/Tickets';

// --- IMPORTAMOS LOS ESTILOS DE APP ---
import './App.scss';

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
        <button
          onClick={executeForceLogout}
          className='force-logout-btn'
        >
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
        <Route
          path='/login'
          element={<Login />}
        />

        {/* RUTA PÚBLICA PARA EL EMPLEADO */}
        <Route
          path='/firmar/:token'
          element={<FirmarDocumento />}
        />

        <Route element={<PrivateRoute />}>
          <Route
            path='/'
            element={<MainLayout />}
          >
            <Route
              index
              element={<Dashboard />}
            />
            <Route
              path='equipos'
              element={<Equipos />}
            />
            <Route
              path='colaboradores'
              element={<Colaboradores />}
            />
            <Route
              path='directorio'
              element={<Directorio />}
            />
            <Route
              path='proveedores'
              element={<Proveedores />}
            />
            <Route
              path='servicios'
              element={<Servicios />}
            />
            <Route
              path='tickets'
              element={<Tickets />}
            />
            <Route
              path='asignacion'
              element={<Asignacion />}
            />
            <Route
              path='devolucion'
              element={<Devolucion />}
            />
            <Route
              path='Historial'
              element={<Historial />}
            />
            <Route
              path='configuracion'
              element={<Configuracion />}
            />
            <Route
              path='perfil'
              element={<Perfil />}
            />
          </Route>
        </Route>
        <Route
          path='*'
          element={<Navigate to='/' />}
        />
      </Routes>

      <ToastContainer
        position='top-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='light' // Dejamos solo esto
      />
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
