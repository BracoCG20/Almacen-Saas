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
import FirmarDocumento from './pages/FirmarDocumento/FirmarDocumento'; // <-- NUEVA PANTALLA PÚBLICA

const GlobalForceLogoutModal = () => {
  const { isForceLogout, executeForceLogout } = useAuth();
  if (!isForceLogout) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '30px',
          borderRadius: '16px',
          width: '90%',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 20px 25px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#ef4444',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0 auto 20px auto',
          }}
        >
          <AlertTriangle size={36} />
        </div>
        <h2
          style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.4rem' }}
        >
          Acceso Revocado
        </h2>
        <p
          style={{
            color: '#64748b',
            fontSize: '1rem',
            lineHeight: '1.5',
            marginBottom: '25px',
          }}
        >
          Un administrador ha desactivado tu cuenta. Tu sesión será terminada
          inmediatamente.
        </p>
        <button
          onClick={executeForceLogout}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#ef4444',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}
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
              path='proveedores'
              element={<Proveedores />}
            />
            <Route
              path='servicios'
              element={<Servicios />}
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
