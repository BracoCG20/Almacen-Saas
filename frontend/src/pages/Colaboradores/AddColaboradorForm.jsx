import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { UserPlus, Save, Lock } from 'lucide-react';
import api from '../../service/api';
import Select from 'react-select';
import './AddColaboradorForm.scss';

const AddColaboradorForm = ({ onSuccess, colaboradorToEdit }) => {
  // --- ESTADO PRINCIPAL ---
  const [formData, setFormData] = useState({
    empresa_id: '',
    dni: '',
    nombres: '',
    apellidos: '',
    email_contacto: '',
    cargo: '',
    genero: 'M',
    telefono: '',
    tipo_vinculo: 'Planilla',
    fecha_fin_proyecto: '',
  });

  const [empresaOptions, setEmpresaOptions] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const isEdit = !!colaboradorToEdit;

  // --- OPCIONES ESTÁTICAS ---
  const genderOptions = [
    { value: 'M', label: 'Hombre (M)' },
    { value: 'F', label: 'Mujer (F)' },
    { value: 'O', label: 'Otro' },
  ];

  const vinculoOptions = [
    { value: 'Planilla', label: 'Planilla (Indefinido)' },
    { value: 'Freelance', label: 'Freelance / RxH' },
    { value: 'Practicante', label: 'Practicante' },
  ];

  // --- CARGAR DATOS INICIALES (EMPRESAS) ---
  useEffect(() => {
    const fetchEmpresas = async () => {
      setLoadingEmpresas(true);
      try {
        const res = await api.get('/empresas');
        const options = res.data.map((emp) => ({
          value: emp.id,
          label: emp.razon_social,
        }));
        setEmpresaOptions(options);
      } catch (error) {
        toast.error('No se pudo cargar la lista de empresas');
      } finally {
        setLoadingEmpresas(false);
      }
    };
    fetchEmpresas();
  }, []);

  // --- CARGAR DATOS SI ESTAMOS EN MODO EDICIÓN ---
  useEffect(() => {
    if (colaboradorToEdit) {
      setFormData({
        empresa_id: colaboradorToEdit.empresa_id || '',
        dni: colaboradorToEdit.dni || '',
        nombres: colaboradorToEdit.nombres || '',
        apellidos: colaboradorToEdit.apellidos || '',
        email_contacto: colaboradorToEdit.email_contacto || '',
        cargo: colaboradorToEdit.cargo || '',
        genero: colaboradorToEdit.genero || 'M',
        telefono: colaboradorToEdit.telefono || '',
        tipo_vinculo: colaboradorToEdit.tipo_vinculo || 'Planilla',
        fecha_fin_proyecto: colaboradorToEdit.fecha_fin_proyecto
          ? colaboradorToEdit.fecha_fin_proyecto.split('T')[0]
          : '',
      });
    }
  }, [colaboradorToEdit]);

  // --- MANEJADORES DE INPUTS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validación estricta para DNI (Solo números, máx 8)
  const handleDniChange = (e) => {
    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 8);
    setFormData({ ...formData, dni: onlyNums });
  };

  // Validación estricta para Teléfono (Solo números, máx 15)
  const handlePhoneChange = (e) => {
    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 15);
    setFormData({ ...formData, telefono: onlyNums });
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: selectedOption ? selectedOption.value : '',
      };

      // Si cambia a Planilla, limpiamos la fecha de fin porque es indefinido
      if (name === 'tipo_vinculo' && selectedOption?.value === 'Planilla') {
        newData.fecha_fin_proyecto = '';
      }

      return newData;
    });
  };

  // --- ENVÍO DEL FORMULARIO ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones Front-End de negocio
    if (formData.dni.length !== 8) {
      return toast.warning('El DNI debe tener exactamente 8 dígitos.');
    }
    if (!formData.empresa_id) {
      return toast.warning('Debe asignar una empresa al colaborador.');
    }
    if (formData.tipo_vinculo !== 'Planilla' && !formData.fecha_fin_proyecto) {
      return toast.warning(
        'Debe indicar la fecha de fin de contrato para el personal externo.',
      );
    }

    try {
      if (isEdit) {
        await api.put(`/colaboradores/${colaboradorToEdit.id}`, formData);
        toast.success('Datos actualizados correctamente');
      } else {
        await api.post('/colaboradores', formData);
        toast.success('Colaborador registrado correctamente');
      }
      onSuccess();
    } catch (error) {
      console.error('Error en submit:', error);
      toast.error(
        error.response?.data?.error ||
          'Error al guardar los datos en el servidor',
      );
    }
  };

  // --- ESTILOS REACT-SELECT Y ESTADOS DESHABILITADOS ---
  const disabledStyle = {
    background: '#f8fafc',
    color: '#94a3b8',
    cursor: 'not-allowed',
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      background: state.isDisabled ? '#f8fafc' : '#fff',
      borderColor: state.isFocused ? '#7c3aed' : '#cbd5e1',
      borderRadius: '8px',
      height: '50px',
      minHeight: '50px',
      boxShadow: state.isFocused
        ? '0 0 0 3px rgba(124, 58, 237, 0.15)'
        : 'none',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '100%',
      padding: '0 14px',
      display: 'flex',
      alignItems: 'center',
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      padding: '0px',
    }),
    singleValue: (provided) => ({
      ...provided,
      marginTop: '2px',
      color: '#1e293b',
      fontSize: '0.95rem',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '100%',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f3f0ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
      padding: '12px 15px',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <form
      className='usuario-form-grid'
      onSubmit={handleSubmit}
    >
      {/* Aviso en modo edición para explicar por qué ciertos campos están bloqueados */}
      {isEdit && (
        <div className='edit-warning'>
          <Lock size={16} /> Por seguridad, los datos de identidad (DNI,
          Nombres) no se pueden editar aquí.
        </div>
      )}

      {/* --- FILA 1: Identidad --- */}
      <div className='form-row'>
        <div className='form-group'>
          <label>DNI / Documento *</label>
          <input
            name='dni'
            value={formData.dni}
            onChange={handleDniChange}
            required
            disabled={isEdit}
            style={isEdit ? disabledStyle : {}}
            placeholder='Ej: 77123456'
          />
        </div>
        <div className='form-group'>
          <label>Género *</label>
          <Select
            options={genderOptions}
            value={genderOptions.find((op) => op.value === formData.genero)}
            onChange={(opt) => handleSelectChange('genero', opt)}
            isDisabled={isEdit}
            styles={customSelectStyles}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
          />
        </div>
      </div>

      {/* --- FILA 2: Nombres --- */}
      <div className='form-row'>
        <div className='form-group'>
          <label>Nombres *</label>
          <input
            name='nombres'
            value={formData.nombres}
            onChange={handleChange}
            required
            disabled={isEdit}
            style={isEdit ? disabledStyle : {}}
            placeholder='Ej: Juan Carlos'
          />
        </div>
        <div className='form-group'>
          <label>Apellidos *</label>
          <input
            name='apellidos'
            value={formData.apellidos}
            onChange={handleChange}
            required
            disabled={isEdit}
            style={isEdit ? disabledStyle : {}}
            placeholder='Ej: Pérez Silva'
          />
        </div>
      </div>

      {/* --- FILA 3: Contacto --- */}
      <div className='form-row'>
        <div className='form-group'>
          <label>Correo Electrónico *</label>
          <input
            type='email'
            name='email_contacto'
            value={formData.email_contacto}
            onChange={handleChange}
            required
            placeholder='ejemplo@empresa.com'
          />
        </div>
        <div className='form-group'>
          <label>WhatsApp / Celular *</label>
          <input
            name='telefono'
            type='tel'
            value={formData.telefono}
            onChange={handlePhoneChange}
            required
            placeholder='Ej: 999888777'
          />
        </div>
      </div>

      {/* --- FILA 4: Empresa y Cargo --- */}
      <div className='form-row'>
        <div className='form-group'>
          <label>Empresa Asignada *</label>
          <Select
            options={empresaOptions}
            value={empresaOptions.find(
              (op) => op.value === formData.empresa_id,
            )}
            onChange={(opt) => handleSelectChange('empresa_id', opt)}
            styles={customSelectStyles}
            placeholder={loadingEmpresas ? 'Cargando...' : 'Seleccione'}
            isLoading={loadingEmpresas}
            isClearable
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
            required
          />
        </div>
        <div className='form-group'>
          <label>Cargo / Puesto *</label>
          <input
            name='cargo'
            value={formData.cargo}
            onChange={handleChange}
            required
            placeholder='Ej: Analista de Sistemas'
          />
        </div>
      </div>

      {/* --- FILA 5: Tipo de Contrato --- */}
      <div className='form-row'>
        <div className='form-group'>
          <label>Tipo de Vínculo *</label>
          <Select
            options={vinculoOptions}
            value={vinculoOptions.find(
              (op) => op.value === formData.tipo_vinculo,
            )}
            onChange={(opt) => handleSelectChange('tipo_vinculo', opt)}
            styles={customSelectStyles}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
          />
        </div>

        {/* Mostrar fecha de fin SOLO si NO está en Planilla */}
        {formData.tipo_vinculo !== 'Planilla' ? (
          <div className='form-group'>
            <label>Fecha de Fin (Contrato) *</label>
            <input
              type='date'
              name='fecha_fin_proyecto'
              value={formData.fecha_fin_proyecto}
              onChange={handleChange}
              required
            />
          </div>
        ) : (
          <div className='form-group'></div> // Espaciador para mantener el layout grid
        )}
      </div>

      {/* --- BOTÓN SUBMIT --- */}
      <div className='form-actions'>
        <button
          type='submit'
          className='btn-submit'
        >
          {isEdit ? <Save size={18} /> : <UserPlus size={18} />}
          {isEdit ? 'Guardar Cambios' : 'Registrar Colaborador'}
        </button>
      </div>
    </form>
  );
};

export default AddColaboradorForm;
