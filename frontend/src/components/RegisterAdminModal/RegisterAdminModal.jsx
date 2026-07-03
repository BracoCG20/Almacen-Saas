//frontend/src/components/RegisterAdminModal/RegisterAdminModal.jsx
import { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import { X, UserPlus, Key } from 'lucide-react';
import Select from 'react-select';
import './RegisterAdminModal.scss';

const RegisterAdminModal = ({ onClose }) => {
  const [newUser, setNewUser] = useState({
    colaborador_id: '',
    nickname: '',
    email_login: '',
    password: '',
    rol_id: 2,
  });

  const [colaboradoresOptions, setColaboradoresOptions] = useState([]);
  const [loadingColab, setLoadingColab] = useState(false);

  const roleOptions = [
    { value: 2, label: 'Administrador' },
    { value: 1, label: 'Super Administrador' },
  ];

  useEffect(() => {
    const fetchDatosParaFiltro = async () => {
      setLoadingColab(true);
      try {
        const [resColab, resUsers] = await Promise.all([
          api.get('/colaboradores'),
          api.get('/auth/users'),
        ]);

        const dnisConAcceso = resUsers.data.map((u) => u.dni);

        const options = resColab.data
          .filter((c) => c.estado === true && !dnisConAcceso.includes(c.dni))
          .map((c) => ({
            value: c.id,
            label: `${c.nombres} ${c.apellidos} - DNI: ${c.dni}`,
            email: c.email_contacto,
          }));

        setColaboradoresOptions(options);
      } catch (error) {
        toast.error('Error al cargar lista de colaboradores');
      } finally {
        setLoadingColab(false);
      }
    };

    fetchDatosParaFiltro();
  }, []);

  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (selectedOption) => {
    setNewUser({ ...newUser, rol_id: selectedOption.value });
  };

  const handleColaboradorChange = (selectedOption) => {
    if (selectedOption) {
      setNewUser({
        ...newUser,
        colaborador_id: selectedOption.value,
        email_login: selectedOption.email,
      });
    } else {
      setNewUser({ ...newUser, colaborador_id: '', email_login: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newUser.colaborador_id)
      return toast.warning('Debes seleccionar un colaborador');

    try {
      await api.post('/auth/register', newUser);
      toast.success('Acceso concedido exitosamente');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al crear credenciales');
    }
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
      height: '40px',
      minHeight: '40px',
      backgroundColor: state.isDisabled ? '#f8fafc' : '#fff',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 12px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      padding: '0px',
      height: '40px',
      color: 'transparent',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    indicatorsContainer: (provided) => ({ ...provided, height: '40px' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontSize: '0.8rem',
      fontWeight: '500',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      margin: '0px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.8rem',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      margin: '0px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f5f3ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
      fontSize: '0.8rem',
      padding: '8px 12px',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <div
      className='modal-overlay'
      onClick={onClose}
    >
      <div
        className='modal-content-modern'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-header'>
          <h2>
            <Key size={20} /> Otorgar Acceso al Sistema
          </h2>
          <button
            className='btn-close'
            onClick={onClose}
            title='Cerrar'
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className='form-modern-layout'
        >
          <div className='input-group full-width'>
            <label>Seleccionar Colaborador *</label>
            <Select
              options={colaboradoresOptions}
              value={colaboradoresOptions.find(
                (op) => op.value === newUser.colaborador_id,
              )}
              onChange={handleColaboradorChange}
              styles={customSelectStyles}
              placeholder={
                loadingColab ? 'Cargando...' : 'Buscar colaborador...'
              }
              isLoading={loadingColab}
              isClearable
              menuPortalTarget={document.body}
              menuPosition={'fixed'}
            />
            <small className='help-text'>
              Solo aparecen colaboradores registrados, activos y sin acceso
              previo.
            </small>
          </div>

          <div className='form-grid'>
            <div className='input-group'>
              <label>Nickname (Identificador) *</label>
              <input
                type='text'
                name='nickname'
                required
                onChange={handleChange}
                value={newUser.nickname}
                placeholder='Ej: jperez'
              />
            </div>
            <div className='input-group'>
              <label>Rol de Acceso *</label>
              <Select
                options={roleOptions}
                value={roleOptions.find((op) => op.value === newUser.rol_id)}
                onChange={handleRoleChange}
                styles={customSelectStyles}
                isSearchable={false}
                menuPortalTarget={document.body}
                menuPosition={'fixed'}
              />
            </div>
          </div>

          <div className='form-grid'>
            <div className='input-group'>
              <label>Email (Usuario de Login) *</label>
              <input
                type='email'
                name='email_login'
                required
                onChange={handleChange}
                value={newUser.email_login}
                placeholder='correo@empresa.com'
              />
            </div>
            <div className='input-group'>
              <label>Contraseña Temporal *</label>
              <input
                type='password'
                name='password'
                required
                onChange={handleChange}
                value={newUser.password}
                placeholder='*******'
              />
            </div>
          </div>

          <div className='modal-actions'>
            <button
              type='button'
              className='btn-cancel'
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type='submit'
              className='btn-confirm'
            >
              <UserPlus size={16} /> Crear Credenciales
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterAdminModal;
