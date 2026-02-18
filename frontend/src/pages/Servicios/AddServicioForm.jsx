import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { CloudUpload, Save, Link } from 'lucide-react';
import './AddServicioForm.scss';

const AddServicioForm = ({ onSuccess, servicioToEdit }) => {
  // --- ESTADO PRINCIPAL ---
  const [loading, setLoading] = useState(false);
  const [empresasOptions, setEmpresasOptions] = useState([]);
  const [usuariosOptions, setUsuariosOptions] = useState([]);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria_servicio: 'Otros',
    link_servicio: '',
    precio: '',
    moneda: 'USD',
    frecuencia_pago: 'Mensual',
    fecha_proximo_pago: '',
    metodo_pago: '',
    empresa_id_factura: '',
    numero_tarjeta_empresa_factura: '',
    cci_cuenta_empresa_factura: '',
    empresa_id_usuaria: '',
    numero_tarjeta_empresa_usuaria: '',
    cci_cuenta_empresa_usuaria: '',
    licencias_totales: 0,
    licencias_usadas: 0,
    usuario_id_responsable: '',
  });

  // --- OPCIONES ESTÁTICAS ---
  const categoriasOptions = [
    { value: 'Inteligencia Artificial', label: 'Inteligencia Artificial' },
    { value: 'Diseño y Multimedia', label: 'Diseño y Multimedia' },
    { value: 'Hosting y Dominios', label: 'Hosting y Dominios' },
    { value: 'Comunicaciones e IT', label: 'Comunicaciones e IT' },
    { value: 'Marketing y Analítica', label: 'Marketing y Analítica' },
    { value: 'Productividad y Gestión', label: 'Productividad y Gestión' },
    { value: 'Otros', label: 'Otros' },
  ];

  const monedaOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'PEN', label: 'PEN (S/)' },
    { value: 'EUR', label: 'EUR (€)' },
  ];

  const frecuenciaOptions = [
    { value: 'Mensual', label: 'Mensual' },
    { value: 'Anual', label: 'Anual' },
    { value: 'Trimestral', label: 'Trimestral' },
    { value: 'Único', label: 'Pago Único' },
  ];

  const metodoPagoOptions = [
    { value: 'BCP', label: 'BCP' },
    { value: 'Interbank', label: 'Interbank' },
    { value: 'BBVA', label: 'BBVA' },
    { value: 'Transferencia', label: 'Transferencia' },
  ];

  // --- CARGA DE DATOS (EMPRESAS Y RESPONSABLES) ---
  useEffect(() => {
    const fetchIniciales = async () => {
      try {
        const [resEmpresas, resUsuarios] = await Promise.all([
          api.get('/empresas'),
          api.get('/servicios/responsables'),
        ]);

        setEmpresasOptions(
          resEmpresas.data
            .filter((emp) => emp.estado)
            .map((emp) => ({ value: emp.id, label: emp.razon_social })),
        );

        setUsuariosOptions(
          resUsuarios.data.map((u) => ({
            value: u.id,
            label:
              `${u.nombres || ''} ${u.apellidos || ''}`.trim() || u.nickname,
          })),
        );
      } catch (error) {
        toast.error('Error al cargar datos iniciales de empresas o usuarios');
      }
    };
    fetchIniciales();
  }, []);

  // --- CARGAR DATOS SI ESTAMOS EN MODO EDICIÓN ---
  useEffect(() => {
    if (servicioToEdit) {
      setFormData({
        nombre: servicioToEdit.nombre || '',
        descripcion: servicioToEdit.descripcion || '',
        categoria_servicio: servicioToEdit.categoria_servicio || 'Otros',
        link_servicio: servicioToEdit.link_servicio || '',
        precio: servicioToEdit.precio || '',
        moneda: servicioToEdit.moneda || 'USD',
        frecuencia_pago: servicioToEdit.frecuencia_pago || 'Mensual',
        fecha_proximo_pago: servicioToEdit.fecha_proximo_pago
          ? servicioToEdit.fecha_proximo_pago.split('T')[0]
          : '',
        metodo_pago: servicioToEdit.metodo_pago || '',
        empresa_id_factura: servicioToEdit.empresa_id_factura || '',
        numero_tarjeta_empresa_factura:
          servicioToEdit.numero_tarjeta_empresa_factura || '',
        cci_cuenta_empresa_factura:
          servicioToEdit.cci_cuenta_empresa_factura || '',
        empresa_id_usuaria: servicioToEdit.empresa_id_usuaria || '',
        numero_tarjeta_empresa_usuaria:
          servicioToEdit.numero_tarjeta_empresa_usuaria || '',
        cci_cuenta_empresa_usuaria:
          servicioToEdit.cci_cuenta_empresa_usuaria || '',
        licencias_totales: servicioToEdit.licencias_totales || 0,
        licencias_usadas: servicioToEdit.licencias_usadas || 0,
        usuario_id_responsable: servicioToEdit.usuario_id_responsable || '',
      });
    }
  }, [servicioToEdit]);

  // --- MANEJADORES DE INPUTS ---
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Si el input es de tipo number, forzamos que se guarde como número
    setFormData({
      ...formData,
      [name]: type === 'number' && value !== '' ? Number(value) : value,
    });
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    setFormData({
      ...formData,
      [actionMeta.name]: selectedOption ? selectedOption.value : null,
    });
  };

  // --- ENVÍO DEL FORMULARIO ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones front-end de negocio
    if (!formData.nombre.trim())
      return toast.warning('El nombre del servicio es obligatorio.');
    if (formData.licencias_usadas > formData.licencias_totales) {
      return toast.warning(
        'Las licencias en uso no pueden superar el total de licencias compradas.',
      );
    }

    setLoading(true);
    try {
      if (servicioToEdit) {
        await api.put(`/servicios/${servicioToEdit.id}`, formData);
        toast.success('Servicio actualizado correctamente ✅');
      } else {
        await api.post('/servicios', formData);
        toast.success('Servicio registrado correctamente ✅');
      }
      onSuccess();
    } catch (error) {
      console.error('Error guardando servicio:', error);
      toast.error(
        error.response?.data?.error ||
          'Error al guardar los datos en el servidor ❌',
      );
    } finally {
      setLoading(false);
    }
  };

  // --- ESTILOS DE SELECT ---
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : 'none',
      minHeight: '50px',
      height: '50px',
      backgroundColor: '#fff',
      cursor: 'pointer',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 14px',
      position: 'relative',
    }),
    input: (provided) => ({ ...provided, margin: '0px', padding: '0px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontSize: '0.95rem',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.95rem',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#4f46e5'
        : state.isFocused
          ? '#f8fafc'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
      padding: '12px 15px',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <form
      className='equipo-form'
      onSubmit={handleSubmit}
    >
      <h4 className='form-section-title'>Información General</h4>

      <div className='form-row'>
        <div className='input-group'>
          <label>Nombre del Servicio *</label>
          <input
            name='nombre'
            value={formData.nombre}
            onChange={handleChange}
            required
            placeholder='Ej: Google Workspace, AWS, Jira...'
          />
        </div>
        <div className='input-group'>
          <label>Categoría del Servicio *</label>
          <Select
            name='categoria_servicio'
            options={categoriasOptions}
            value={categoriasOptions.find(
              (op) => op.value === formData.categoria_servicio,
            )}
            onChange={handleSelectChange}
            styles={customSelectStyles}
            isSearchable={false}
            menuPortalTarget={document.body}
            required
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>
            <Link
              size={14}
              style={{ marginRight: '4px' }}
            />{' '}
            Link del Servicio (URL)
          </label>
          <input
            type='url'
            name='link_servicio'
            value={formData.link_servicio}
            onChange={handleChange}
            placeholder='https://ejemplo.com/login'
          />
        </div>
        <div className='input-group'>
          <label>Descripción</label>
          <input
            name='descripcion'
            value={formData.descripcion}
            onChange={handleChange}
            placeholder='Ej: Correos corporativos y Drive'
          />
        </div>
      </div>

      <div
        className='form-row-all'
        style={{ marginTop: '0.5rem' }}
      >
        <div className='input-group'>
          <label style={{ color: '#4f46e5' }}>Responsable de la Cuenta</label>
          <Select
            name='usuario_id_responsable'
            options={usuariosOptions}
            value={usuariosOptions.find(
              (op) => op.value === formData.usuario_id_responsable,
            )}
            onChange={handleSelectChange}
            styles={customSelectStyles}
            placeholder='Seleccionar Responsable de TI o Gerencia...'
            isClearable
            menuPortalTarget={document.body}
          />
        </div>
      </div>

      <hr className='divider' />

      <h4 className='form-section-title'>Finanzas y Facturación</h4>
      <div className='form-row'>
        <div className='input-group'>
          <label>Precio Estimado y Moneda</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ width: '120px' }}>
              <Select
                name='moneda'
                options={monedaOptions}
                value={monedaOptions.find((op) => op.value === formData.moneda)}
                onChange={handleSelectChange}
                styles={customSelectStyles}
                isSearchable={false}
                menuPortalTarget={document.body}
              />
            </div>
            <input
              type='number'
              step='0.01'
              min='0'
              name='precio'
              value={formData.precio}
              onChange={handleChange}
              placeholder='0.00'
              style={{ flex: 1 }}
            />
          </div>
        </div>
        <div className='input-group'>
          <label>Frecuencia de Pago *</label>
          <Select
            name='frecuencia_pago'
            options={frecuenciaOptions}
            value={frecuenciaOptions.find(
              (op) => op.value === formData.frecuencia_pago,
            )}
            onChange={handleSelectChange}
            styles={customSelectStyles}
            isSearchable={false}
            menuPortalTarget={document.body}
            required
          />
        </div>
      </div>

      {/* --- FILA 4 --- */}
      <div className='form-row'>
        <div className='input-group'>
          <label>Método de Pago Predeterminado</label>
          <CreatableSelect
            name='metodo_pago'
            options={metodoPagoOptions}
            value={
              formData.metodo_pago
                ? { value: formData.metodo_pago, label: formData.metodo_pago }
                : null
            }
            onChange={handleSelectChange}
            styles={customSelectStyles}
            placeholder='Seleccione o escriba uno nuevo'
            isClearable
            menuPortalTarget={document.body}
          />
        </div>
        <div className='input-group'>
          <label>Próximo Pago Estimado (Vencimiento)</label>
          <input
            type='date'
            name='fecha_proximo_pago'
            value={formData.fecha_proximo_pago}
            onChange={handleChange}
          />
        </div>
      </div>

      <hr className='divider' />

      <h4 className='form-section-title'>Asignación y Datos Bancarios</h4>
      <div className='form-row'>
        <div className='input-group company-block'>
          <label style={{ color: '#4f46e5', fontWeight: 'bold' }}>
            Empresa que Factura / Paga
          </label>
          <Select
            name='empresa_id_factura'
            options={empresasOptions}
            value={empresasOptions.find(
              (op) => op.value === formData.empresa_id_factura,
            )}
            onChange={handleSelectChange}
            styles={customSelectStyles}
            placeholder='Seleccione empresa...'
            isClearable
            menuPortalTarget={document.body}
          />
          <div className='bank-details'>
            <div className='field'>
              <label>N° de Tarjeta / Cuenta de cargo</label>
              <input
                name='numero_tarjeta_empresa_factura'
                value={formData.numero_tarjeta_empresa_factura}
                onChange={handleChange}
                placeholder='Ej: 4550 1234 ....'
              />
            </div>
            <div className='field'>
              <label>CCI (Interbancaria)</label>
              <input
                name='cci_cuenta_empresa_factura'
                value={formData.cci_cuenta_empresa_factura}
                onChange={handleChange}
                placeholder='Ej: 002-191-123...'
              />
            </div>
          </div>
        </div>

        <div className='input-group company-block'>
          <label style={{ color: '#059669', fontWeight: 'bold' }}>
            Empresa que Utiliza el Servicio
          </label>
          <Select
            name='empresa_id_usuaria'
            options={empresasOptions}
            value={empresasOptions.find(
              (op) => op.value === formData.empresa_id_usuaria,
            )}
            onChange={handleSelectChange}
            styles={customSelectStyles}
            placeholder='Seleccione empresa...'
            isClearable
            menuPortalTarget={document.body}
          />
          <div className='bank-details'>
            <div className='field'>
              <label>N° de Tarjeta / Cuenta interna</label>
              <input
                name='numero_tarjeta_empresa_usuaria'
                value={formData.numero_tarjeta_empresa_usuaria}
                onChange={handleChange}
                placeholder='Ej: 4550 1234 ....'
              />
            </div>
            <div className='field'>
              <label>CCI (Interbancaria) interna</label>
              <input
                name='cci_cuenta_empresa_usuaria'
                value={formData.cci_cuenta_empresa_usuaria}
                onChange={handleChange}
                placeholder='Ej: 002-191-123...'
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- FILA 5: Licencias --- */}
      <div
        className='form-row'
        style={{ marginTop: '10px' }}
      >
        <div className='input-group'>
          <label>Licencias Compradas (Total)</label>
          <input
            type='number'
            name='licencias_totales'
            value={formData.licencias_totales}
            onChange={handleChange}
            min='0'
          />
        </div>
        <div className='input-group'>
          <label>Licencias en Uso Actual</label>
          <input
            type='number'
            name='licencias_usadas'
            value={formData.licencias_usadas}
            onChange={handleChange}
            min='0'
            max={formData.licencias_totales || undefined} // No permite pasar del total visualmente
          />
        </div>
      </div>

      <hr className='divider' />

      <button
        type='submit'
        className='btn-submit-gigante'
        disabled={loading}
      >
        {servicioToEdit ? (
          <Save
            size={24}
            style={{ marginRight: '10px' }}
          />
        ) : (
          <CloudUpload
            size={24}
            style={{ marginRight: '10px' }}
          />
        )}
        {servicioToEdit ? 'Guardar Cambios' : 'Registrar Servicio'}
      </button>
    </form>
  );
};

export default AddServicioForm;
