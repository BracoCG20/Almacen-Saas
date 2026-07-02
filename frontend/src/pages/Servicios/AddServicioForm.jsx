import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import Select from 'react-select';
import {
  CloudUpload,
  Save,
  Link as LinkIcon,
  Wallet,
  CreditCard,
  Landmark,
  FileText,
} from 'lucide-react';
import './AddServicioForm.scss';

const AddServicioForm = ({ onSuccess, servicioToEdit }) => {
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
    usuario_id_responsable: '',
  });

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
        toast.error('Error al cargar datos iniciales');
      }
    };
    fetchIniciales();
  }, []);

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
        usuario_id_responsable: servicioToEdit.usuario_id_responsable || '',
      });
    }
  }, [servicioToEdit]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' && value !== '' ? Number(value) : value,
    }));
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    setFormData((prev) => ({
      ...prev,
      [actionMeta.name]: selectedOption ? selectedOption.value : null,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim())
      return toast.warning('El nombre es obligatorio.');

    setLoading(true);
    try {
      if (servicioToEdit) {
        await api.put(`/servicios/${servicioToEdit.id}`, formData);
        toast.success('Servicio actualizado correctamente');
      } else {
        await api.post('/servicios', formData);
        toast.success('Servicio registrado correctamente');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
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
      cursor: 'pointer',
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
      fontWeight: '400',
      fontSize: '0.8rem',
      margin: '0px',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.8rem',
      margin: '0px',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f5f3ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      fontSize: '0.8rem',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
  };

  return (
    <form
      className='servicio-form-modern'
      onSubmit={handleSubmit}
    >
      {/* SECCIÓN 1: GENERAL */}
      <div className='form-section'>
        <div className='section-header'>
          <div className='indicator' />
          <h4>Información del Servicio</h4>
        </div>
        <div className='form-grid'>
          <div className='input-group'>
            <label>Nombre del Servicio *</label>
            <input
              name='nombre'
              value={formData.nombre}
              onChange={handleChange}
              required
              placeholder='Ej: AWS, Jira, Zoom...'
            />
          </div>
          <div className='input-group'>
            <label>Categoría</label>
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
            />
          </div>
          <div className='input-group full-width'>
            <label>
              <LinkIcon size={14} /> URL / Enlace del Servicio
            </label>
            <input
              type='url'
              name='link_servicio'
              value={formData.link_servicio}
              onChange={handleChange}
              placeholder='https://'
            />
          </div>
          <div className='input-group full-width'>
            <label>
              <FileText size={14} /> Descripción de uso
            </label>
            <input
              name='descripcion'
              value={formData.descripcion}
              onChange={handleChange}
              placeholder='¿Para qué se usa este software?'
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: COSTOS */}
      <div className='form-section'>
        <div className='section-header'>
          <div className='indicator' />
          <h4>Costos y Responsable</h4>
        </div>
        <div className='form-grid'>
          <div className='input-group'>
            <label>Precio y Moneda</label>
            <div className='currency-group'>
              <div className='select-wrapper'>
                <Select
                  name='moneda'
                  options={monedaOptions}
                  value={monedaOptions.find(
                    (op) => op.value === formData.moneda,
                  )}
                  onChange={handleSelectChange}
                  styles={customSelectStyles}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                />
              </div>
              <input
                type='number'
                step='0.01'
                name='precio'
                value={formData.precio}
                onChange={handleChange}
                placeholder='0.00'
              />
            </div>
          </div>
          <div className='input-group'>
            <label>Frecuencia de Pago</label>
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
            />
          </div>
          <div className='input-group'>
            <label>Próximo Vencimiento</label>
            <input
              type='date'
              name='fecha_proximo_pago'
              value={formData.fecha_proximo_pago}
              onChange={handleChange}
            />
          </div>
          <div className='input-group'>
            <label>Responsable Directo</label>
            <Select
              name='usuario_id_responsable'
              options={usuariosOptions}
              value={usuariosOptions.find(
                (op) => op.value === formData.usuario_id_responsable,
              )}
              onChange={handleSelectChange}
              styles={customSelectStyles}
              placeholder='Seleccionar...'
              isClearable
              menuPortalTarget={document.body}
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: FACTURACIÓN */}
      <div className='form-section'>
        <div className='section-header'>
          <div className='indicator' />
          <h4>Datos de Facturación</h4>
        </div>
        <div className='billing-container'>
          {/* Empresa Pago */}
          <div className='billing-card factura'>
            <div className='card-title'>
              <Wallet size={14} /> Empresa que Paga
            </div>
            <Select
              name='empresa_id_factura'
              options={empresasOptions}
              value={empresasOptions.find(
                (op) => op.value === formData.empresa_id_factura,
              )}
              onChange={handleSelectChange}
              styles={customSelectStyles}
              placeholder='Empresa...'
              isClearable
              menuPortalTarget={document.body}
            />
            <div className='mini-grid'>
              <div className='mini-group'>
                <label>N° Tarjeta</label>
                <input
                  name='numero_tarjeta_empresa_factura'
                  value={formData.numero_tarjeta_empresa_factura}
                  onChange={handleChange}
                  placeholder='0000...'
                />
              </div>
              <div className='mini-group'>
                <label>CCI</label>
                <input
                  name='cci_cuenta_empresa_factura'
                  value={formData.cci_cuenta_empresa_factura}
                  onChange={handleChange}
                  placeholder='CCI...'
                />
              </div>
            </div>
          </div>

          {/* Empresa Usuaria */}
          <div className='billing-card usuaria'>
            <div className='card-title'>
              <Landmark size={14} /> Empresa Usuaria
            </div>
            <Select
              name='empresa_id_usuaria'
              options={empresasOptions}
              value={empresasOptions.find(
                (op) => op.value === formData.empresa_id_usuaria,
              )}
              onChange={handleSelectChange}
              styles={customSelectStyles}
              placeholder='Empresa...'
              isClearable
              menuPortalTarget={document.body}
            />
            <div className='mini-grid'>
              <div className='mini-group'>
                <label>N° Tarjeta</label>
                <input
                  name='numero_tarjeta_empresa_usuaria'
                  value={formData.numero_tarjeta_empresa_usuaria}
                  onChange={handleChange}
                  placeholder='0000...'
                />
              </div>
              <div className='mini-group'>
                <label>CCI</label>
                <input
                  name='cci_cuenta_empresa_usuaria'
                  value={formData.cci_cuenta_empresa_usuaria}
                  onChange={handleChange}
                  placeholder='CCI...'
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='form-footer'>
        <button
          type='submit'
          className='btn-submit-modern'
          disabled={loading}
        >
          {servicioToEdit ? <Save size={18} /> : <CloudUpload size={18} />}
          {loading
            ? 'Procesando...'
            : servicioToEdit
              ? 'Actualizar Servicio'
              : 'Registrar Servicio'}
        </button>
      </div>
    </form>
  );
};

export default AddServicioForm;
