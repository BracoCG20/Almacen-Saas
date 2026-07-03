//frontend/src/pages/Perfil/Perfil.jsx
import { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Camera,
  Save,
  Lock,
  Mail,
  Phone,
  Briefcase,
  Fingerprint,
} from 'lucide-react';

import './Perfil.scss';

const Perfil = () => {
  // --- 1. ESTADOS Y CONTEXTO ---
  const { updateUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  const [formData, setFormData] = useState({
    nickname: '',
    email_login: '',
    telefono: '',
    password: '',
    nombres: '',
    apellidos: '',
    cargo: '',
    empresa_nombre: '',
  });

  const isSuperAdmin = userRole === 1;

  /**
   * MANEJO DE RUTAS DE IMÁGENES (CLOUDINARY VS LOCAL)
   * Función crítica para asegurar que las URLs que vienen de BD se dibujen
   * correctamente, ya sean URLs absolutas (Cloudinary) o relativas (Local).
   */
  const getAvatarUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;

    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:4000';
    return `${baseUrl}${path}`;
  };

  // --- 2. CARGA INICIAL DE DATOS ---
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await api.get('/auth/perfil');
        const u = res.data;
        setUserRole(Number(u.rol_id));

        setFormData({
          nickname: u.nickname || '',
          email_login: u.email_login || '',
          telefono: u.telefono || '',
          password: '',
          nombres: u.nombres || '',
          apellidos: u.apellidos || '',
          cargo: u.cargo || '',
          empresa_nombre: u.empresa_nombre || 'No asignada',
        });

        if (u.foto_perfil_url) {
          setPreview(getAvatarUrl(u.foto_perfil_url));
        }
      } catch (error) {
        toast.error('Error al cargar tu perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  // --- 3. MANEJADORES DE INPUTS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e) => {
    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 15);
    setFormData({ ...formData, telefono: onlyNums });
  };

  // Cuando escojo una foto, creo un blob local temporal para previsualizarla antes de guardar
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // --- 4. ENVÍO DE DATOS AL SERVIDOR ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password.length < 6) {
      return toast.warning('La contraseña debe tener al menos 6 caracteres.');
    }

    const toastId = toast.loading('Guardando perfil...');
    const data = new FormData();

    // Solo envío lo que se ha modificado o está permitido para este rol
    if (formData.password) data.append('password', formData.password);
    if (formData.telefono) data.append('telefono', formData.telefono);
    if (fotoFile) data.append('foto', fotoFile);

    if (isSuperAdmin) {
      data.append('nombres', formData.nombres);
      data.append('apellidos', formData.apellidos);
      data.append('email_login', formData.email_login);
      data.append('cargo', formData.cargo);
    }

    try {
      const res = await api.put('/auth/perfil', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Recupero la URL procesada por el backend (ej: Cloudinary)
      const nuevaFotoUrl = res.data.foto_url || user?.foto_url;

      if (fotoFile || isSuperAdmin) {
        // Actualizo el Contexto global para que el Sidebar refleje los cambios al instante
        updateUser({
          foto_url: nuevaFotoUrl,
          nombre: `${formData.nombres} ${formData.apellidos}`,
          email: formData.email_login,
        });

        // Actualizo la imagen de este mismo componente
        if (nuevaFotoUrl) setPreview(getAvatarUrl(nuevaFotoUrl));
      }

      toast.update(toastId, {
        render: 'Perfil actualizado ✅',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });

      // Reseteo campos temporales de seguridad
      setFormData((prev) => ({ ...prev, password: '' }));
      setFotoFile(null);
    } catch (error) {
      toast.update(toastId, {
        render: 'Error al guardar',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  if (loading) return <div className='loading-state'>Cargando perfil...</div>;

  // Avatar por defecto generado con las iniciales si el usuario no tiene foto
  const defaultImage = `https://ui-avatars.com/api/?name=${formData.nombres}+${formData.apellidos}&background=random`;

  return (
    <div className='perfil-container'>
      <div className='page-header'>
        <h1>Mi Perfil</h1>
        <span>Actualiza tus datos personales y de seguridad.</span>
      </div>

      <form
        onSubmit={handleSubmit}
        className='perfil-grid'
      >
        {/* --- TARJETA IZQUIERDA: Avatar y Rol --- */}
        <div className='card profile-card'>
          <div className='photo-wrapper'>
            <img
              src={preview || defaultImage}
              alt='Perfil'
              onError={(e) => {
                e.target.src = defaultImage;
              }}
            />
            <label
              htmlFor='fotoInput'
              className='btn-camera'
              title='Cambiar foto'
            >
              <Camera size={18} />
            </label>
            <input
              id='fotoInput'
              type='file'
              accept='image/*'
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>
          <h3>
            {formData.nombres} {formData.apellidos}
          </h3>
          <p className='role-text'>{formData.cargo || 'Sin cargo definido'}</p>
          <hr className='divider' />
          <div className='input-group'>
            <label>
              <Fingerprint size={16} /> Nickname (Usuario)
            </label>
            <input
              type='text'
              value={formData.nickname}
              disabled
              className='input-field input-gray'
            />
          </div>
        </div>

        {/* --- TARJETA DERECHA: Datos de Contacto y Seguridad --- */}
        <div className='card details-card'>
          <h3 className='section-title'>Datos de Contacto</h3>

          {!isSuperAdmin && (
            <div className='edit-warning'>
              <Lock
                size={16}
                className='icon-warning'
              />
              <span>
                Tus nombres, correo y cargo están bloqueados por seguridad.
                Contacta a RRHH para modificarlos.
              </span>
            </div>
          )}

          <div className='form-row'>
            <div className='input-group'>
              <label>Nombres {isSuperAdmin && '*'}</label>
              <input
                type='text'
                name='nombres'
                value={formData.nombres}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                required={isSuperAdmin}
                className={`input-field ${!isSuperAdmin ? 'input-gray' : ''}`}
              />
            </div>
            <div className='input-group'>
              <label>Apellidos {isSuperAdmin && '*'}</label>
              <input
                type='text'
                name='apellidos'
                value={formData.apellidos}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                required={isSuperAdmin}
                className={`input-field ${!isSuperAdmin ? 'input-gray' : ''}`}
              />
            </div>
          </div>

          <div className='form-row'>
            <div className='input-group'>
              <label>
                <Mail size={16} /> Correo Electrónico
              </label>
              <input
                type='email'
                name='email_login'
                value={formData.email_login}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                required={isSuperAdmin}
                className={`input-field ${!isSuperAdmin ? 'input-gray' : ''}`}
              />
            </div>
            <div className='input-group'>
              <label>
                <Phone size={16} /> Celular / WhatsApp
              </label>
              <input
                type='tel'
                name='telefono'
                value={formData.telefono}
                onChange={handlePhoneChange}
                className='input-field'
              />
            </div>
          </div>

          <div className='form-row mt-3'>
            <div className='input-group'>
              <label>
                <Building2 size={16} /> Empresa Registrada
              </label>
              <input
                type='text'
                value={formData.empresa_nombre}
                disabled
                className='input-field input-gray'
              />
            </div>
            <div className='input-group'>
              <label>
                <Briefcase size={16} /> Cargo / Puesto
              </label>
              <input
                type='text'
                name='cargo'
                value={formData.cargo}
                onChange={handleChange}
                disabled={!isSuperAdmin}
                className={`input-field ${!isSuperAdmin ? 'input-gray' : ''}`}
              />
            </div>
          </div>

          <h3 className='section-title mt-large'>Cambiar Contraseña</h3>
          <div className='input-group'>
            <label>
              <Lock size={16} /> Nueva Contraseña
            </label>
            <input
              type='password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              placeholder='Deja en blanco para no cambiarla'
              className='input-field'
              minLength='6'
            />
          </div>

          <button
            type='submit'
            className='btn-save'
            disabled={loading}
          >
            <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Perfil;
