import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';

// Componente para proteger rutas (Se asume que lo tienes o lo crearemos en AuthContext)
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
// Nota: Puedes agregar las demás vistas (Usuarios, Proveedores) cuando las crees

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path='/login'
            element={<Login />}
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
