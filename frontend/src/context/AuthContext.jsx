import { createContext, useState, useEffect, useContext } from 'react';
import api from '../service/api';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

// Inicializamos el socket apuntando al backend
// (En producción, cambia esta URL por la de tu servidor)
const socket = io(
  api.defaults.baseURL
    ? api.defaults.baseURL.replace(/\/api\/?$/, '')
    : 'http://localhost:4000',
  {
    autoConnect: false, // No conecta automáticamente hasta que haya un usuario
  },
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado para controlar la aparición del modal de expulsión
  const [isForceLogout, setIsForceLogout] = useState(false);

  // 1. Cargar sesión al iniciar la app
  useEffect(() => {
    const checkUser = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user_data');

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Conectar Socket.io y unirse a la sala personal
          socket.connect();
          socket.emit('join_user_room', parsedUser.id);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error recuperando sesión:', error);
        localStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Efecto para escuchar eventos de expulsión del servidor
  useEffect(() => {
    const handleForceLogout = (data) => {
      console.log('Evento de expulsión recibido:', data);
      setIsForceLogout(true); // Mostramos el modal de expulsión
    };

    socket.on('force_logout', handleForceLogout);

    // Limpiamos el evento al desmontar
    return () => {
      socket.off('force_logout', handleForceLogout);
    };
  }, []);

  // 2. Función de Login
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      const { token, user } = res.data;

      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
        setUser(user);

        // Conectar Socket.io y unirse a la sala
        socket.connect();
        socket.emit('join_user_room', user.id);

        return { success: true };
      }

      return { success: false, message: 'Respuesta del servidor inválida' };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: error.response?.data?.error || 'Error al iniciar sesión',
      };
    }
  };

  // 3. Función de Logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
    setUser(null);
    socket.disconnect(); // Desconectamos del WebSocket
  };

  // 4. Función de Logout Forzado (Se llama cuando el usuario da click en "Aceptar" en el modal)
  const executeForceLogout = () => {
    setIsForceLogout(false);
    logout();
  };

  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        updateUser,
        isForceLogout,
        executeForceLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
