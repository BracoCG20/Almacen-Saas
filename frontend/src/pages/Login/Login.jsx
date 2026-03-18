import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import './Login.scss';

import logo from '../../assets/logo_grupoSP.png';

const Login = () => {
  // --- 1. ESTADOS DEL FORMULARIO ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Consumo el contexto de autenticación y el hook de enrutamiento
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  /**
   * 2. MANEJADOR DE INICIO DE SESIÓN
   * Envío las credenciales al contexto para validarlas contra el backend.
   * Si todo es correcto, redirijo al dashboard.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result && result.success) {
        toast.success('Bienvenido al sistema');
        navigate('/');
      } else {
        // Muestro el mensaje de error exacto que devuelve el backend (ej: "Contraseña incorrecta" o "Usuario inactivo")
        toast.error(result?.message || 'Credenciales incorrectas');
        setIsLoading(false);
      }
    } catch (error) {
      toast.error('Error al conectar con el servidor');
      setIsLoading(false);
    }
  };

  return (
    <div className='modern-login-container'>
      <div className='login-box'>
        {/* --- PANEL IZQUIERDO (Branding y Diseño Visual) --- */}
        <div className='login-brand-panel'>
          <div className='brand-content'>
            <span className='brand-badge'>Plataforma Centralizada</span>
            <h1>
              Visibilidad, <br />
              Eficiencia, <br />
              Seguridad
            </h1>
            <p>
              El sistema integral más eficiente para el control de inventario,
              equipos y servicios de <strong>Grupo SP</strong>.
            </p>
          </div>

          {/* Elementos decorativos de fondo para el panel */}
          <div className='circle-decoration circle-1'></div>
          <div className='circle-decoration circle-2'></div>
        </div>

        {/* --- PANEL DERECHO (Formulario de Acceso) --- */}
        <div className='login-form-panel'>
          <div className='form-wrapper'>
            {/* Cabecera del formulario */}
            <div className='form-header'>
              <div className='logo-container'>
                <img
                  src={logo}
                  alt='Logo Grupo SP'
                />
              </div>
              <h2>Sistema Inventario</h2>
              <p className='subtitle'>Inicio de Sesión</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Input: Correo Electrónico */}
              {/* Uso la clase 'has-value' para animar el label cuando el usuario escribe algo */}
              <div className={`modern-input-group ${email ? 'has-value' : ''}`}>
                <div className='input-content'>
                  <label>Correo Electrónico</label>
                  <input
                    type='email'
                    placeholder='usuario@gruposp.pe'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className='icon-container'>
                  <Mail size={18} />
                </div>
              </div>

              {/* Input: Contraseña */}
              <div
                className={`modern-input-group ${password ? 'has-value' : ''}`}
              >
                <div className='input-content'>
                  <label>Contraseña</label>
                  <input
                    type='password'
                    placeholder='Mínimo 8 caracteres'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className='icon-container'>
                  <Lock size={18} />
                </div>
              </div>

              {/* Botón de Ingreso con estado de carga (Spinner) */}
              <div className='form-actions'>
                <button
                  type='submit'
                  disabled={isLoading}
                  className={`btn-ingresar ${isLoading ? 'loading' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        className='spinner'
                        size={20}
                      />{' '}
                      Ingresando
                    </>
                  ) : (
                    <>
                      Ingresar <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className='footer-copy'>
              @ Copyright {new Date().getFullYear()}, Grupo SP - Todos los
              derechos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
