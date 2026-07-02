import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { UserPlus, Save, Lock } from 'lucide-react';
import api from '../../service/api';
import Select from 'react-select';
import './AddColaboradorForm.scss';

const AddColaboradorForm = ({ onSuccess, colaboradorToEdit }) => {
  // --- 1. ESTADO DEL FORMULARIO ---
  // Guardo todos los datos del nuevo colaborador. Si se edita, esto se llenará automáticamente.
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

  // Catálogos para los dropdowns
  const [empresaOptions, setEmpresaOptions] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);

  // Bandera para saber si estoy creando uno nuevo o editando uno existente
  const isEdit = !!colaboradorToEdit;

  // Opciones estáticas
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

  // --- 2. CARGA DE CATÁLOGOS ---
  // Traigo las empresas disponibles al cargar el componente
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

  // --- 3. LÓGICA DE EDICIÓN ---
  // Si recibo un colaborador por props, relleno el formulario con sus datos
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
        // Corto la fecha para que el input type="date" la lea correctamente (YYYY-MM-DD)
        fecha_fin_proyecto: colaboradorToEdit.fecha_fin_proyecto
          ? colaboradorToEdit.fecha_fin_proyecto.split('T')[0]
          : '',
      });
    }
  }, [colaboradorToEdit]);

  // --- 4. MANEJADORES DE INPUTS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Limpio el DNI para asegurar que sean solo 8 números
  const handleDniChange = (e) => {
    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 8);
    setFormData({ ...formData, dni: onlyNums });
  };

  // Limpio el Teléfono para evitar letras
  const handlePhoneChange = (e) => {
    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 15);
    setFormData({ ...formData, telefono: onlyNums });
  };

  // Manejador especial para los React-Select (Género, Vínculo y Empresa)
  const handleSelectChange = (name, selectedOption) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: selectedOption ? selectedOption.value : '',
      };
      // Si cambian a "Planilla", borro la fecha de fin de contrato porque ya no aplica
      if (name === 'tipo_vinculo' && selectedOption?.value === 'Planilla') {
        newData.fecha_fin_proyecto = '';
      }
      return newData;
    });
  };

  // --- 5. ENVÍO DE DATOS ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones extra que HTML5 no capta bien
    if (formData.dni.length !== 8)
      return toast.warning('El DNI debe tener 8 dígitos.');
    if (!formData.empresa_id) return toast.warning('Debe asignar una empresa.');
    if (formData.tipo_vinculo !== 'Planilla' && !formData.fecha_fin_proyecto) {
      return toast.warning('Debe indicar la fecha de fin de contrato externo.');
    }

    try {
      if (isEdit) {
        await api.put(`/colaboradores/${colaboradorToEdit.id}`, formData);
        toast.success('Datos actualizados correctamente');
      } else {
        await api.post('/colaboradores', formData);
        toast.success('Colaborador registrado correctamente');
      }
      // Llamo a la función onSuccess (ej: cerrar modal, refrescar tabla)
      onSuccess();
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Error al guardar en el servidor',
      );
    }
  };

  const disabledStyle = {
    background: '#f8fafc',
    color: '#94a3b8',
    cursor: 'not-allowed',
  };

  /**
   * ESTILOS SHADCN PARA REACT-SELECT
   * Mantengo la interfaz uniforme con bordes redondeados y sombra violeta al hacer foco.
   */
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      background: state.isDisabled ? '#f8fafc' : '#fff',
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0',
      borderRadius: '8px',
      height: '40px',
      minHeight: '40px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
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
    }),
    input: (provided) => ({ ...provided, margin: '0px', padding: '0px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontSize: '0.8rem',
      margin: '0px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.8rem',
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
    <form
      className='colab-form-modern'
      onSubmit={handleSubmit}
    >
      {isEdit && (
        <div className='edit-warning'>
          <Lock size={14} /> Identidad bloqueada por seguridad. Contacte a
          soporte para cambios de DNI.
        </div>
      )}

      <div className='form-grid'>
        <div className='input-group'>
          <label>DNI / Documento *</label>
          <input
            name='dni'
            inputMode='numeric'
            pattern='[0-9]*'
            value={formData.dni}
            onChange={handleDniChange}
            required
            disabled={isEdit}
            style={isEdit ? disabledStyle : {}}
            placeholder='Ej: 77123456'
          />
        </div>
        <div className='input-group'>
          <label>Género *</label>
          <Select
            options={genderOptions}
            value={genderOptions.find((op) => op.value === formData.genero)}
            onChange={(opt) => handleSelectChange('genero', opt)}
            isDisabled={isEdit}
            styles={customSelectStyles}
            menuPortalTarget={document.body}
          />
        </div>

        <div className='input-group'>
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
        <div className='input-group'>
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

        <div className='input-group'>
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
        <div className='input-group'>
          <label>WhatsApp / Celular *</label>
          <input
            name='telefono'
            inputMode='numeric'
            pattern='[0-9]*'
            type='tel'
            value={formData.telefono}
            onChange={handlePhoneChange}
            required
            placeholder='Ej: 987654321'
          />
        </div>

        <div className='input-group'>
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
            required
          />
        </div>
        <div className='input-group'>
          <label>Cargo / Puesto *</label>
          <input
            name='cargo'
            value={formData.cargo}
            onChange={handleChange}
            required
            placeholder='Ej: Analista de Sistemas'
          />
        </div>

        <div className='input-group'>
          <label>Tipo de Vínculo *</label>
          <Select
            options={vinculoOptions}
            value={vinculoOptions.find(
              (op) => op.value === formData.tipo_vinculo,
            )}
            onChange={(opt) => handleSelectChange('tipo_vinculo', opt)}
            styles={customSelectStyles}
            menuPortalTarget={document.body}
          />
        </div>

        {/* Renderizado condicional: Solo muestro la fecha de fin si no es personal de Planilla */}
        {formData.tipo_vinculo !== 'Planilla' ? (
          <div className='input-group'>
            <label>Fecha Fin (Contrato) *</label>
            <input
              type='date'
              name='fecha_fin_proyecto'
              value={formData.fecha_fin_proyecto}
              onChange={handleChange}
              required
            />
          </div>
        ) : (
          <div className='input-group'></div> // Div vacío para mantener el grid simétrico
        )}
      </div>

      <div className='form-footer'>
        <button
          type='submit'
          className='btn-save-modern'
        >
          {isEdit ? <Save size={16} /> : <UserPlus size={16} />}
          {isEdit ? 'Guardar Cambios' : 'Registrar Colaborador'}
        </button>
      </div>
    </form>
  );
};

export default AddColaboradorForm;
