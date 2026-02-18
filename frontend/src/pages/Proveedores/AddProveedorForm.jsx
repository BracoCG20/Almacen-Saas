import { useState, useEffect } from 'react';
import {
  Save,
  Building2,
  IdCard,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../service/api';
import FileUploader from '../../components/FileUploader/FileUploader'; // <-- IMPORTAMOS EL COMPONENTE
import './AddProveedorForm.scss';

const AddProveedorForm = ({ onSuccess, providerToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    razon_social: '',
    nombre_comercial: '',
    ruc: '',
    direccion: '',
    departamento: '',
    provincia: '',
    distrito: '',
    nombre_contacto: '',
    email_contacto: '',
    telefono_contacto: '',
    sitio_web: '',
    tipo_servicio: '',
    fecha_inicio_contrato: '',
    fecha_fin_contrato: '',
  });

  const [archivoContrato, setArchivoContrato] = useState(null);
  const [removeExisting, setRemoveExisting] = useState(false);

  useEffect(() => {
    if (providerToEdit) {
      setFormData({
        razon_social: providerToEdit.razon_social || '',
        nombre_comercial: providerToEdit.nombre_comercial || '',
        ruc: providerToEdit.ruc || '',
        direccion: providerToEdit.direccion || '',
        departamento: providerToEdit.departamento || '',
        provincia: providerToEdit.provincia || '',
        distrito: providerToEdit.distrito || '',
        nombre_contacto: providerToEdit.nombre_contacto || '',
        email_contacto: providerToEdit.email_contacto || '',
        telefono_contacto: providerToEdit.telefono_contacto || '',
        sitio_web: providerToEdit.sitio_web || '',
        tipo_servicio: providerToEdit.tipo_servicio || '',
        fecha_inicio_contrato: providerToEdit.fecha_inicio_contrato
          ? providerToEdit.fecha_inicio_contrato.split('T')[0]
          : '',
        fecha_fin_contrato: providerToEdit.fecha_fin_contrato
          ? providerToEdit.fecha_fin_contrato.split('T')[0]
          : '',
      });
      setRemoveExisting(false);
      setArchivoContrato(null);
    }
  }, [providerToEdit]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getBackendFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000';
    return `${baseUrl}${path}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.razon_social || !formData.ruc) {
      return toast.warning('Razón Social y RUC son obligatorios');
    }

    if (formData.fecha_inicio_contrato && formData.fecha_fin_contrato) {
      if (
        new Date(formData.fecha_inicio_contrato) >
        new Date(formData.fecha_fin_contrato)
      ) {
        return toast.warning(
          'La fecha de fin no puede ser anterior a la de inicio.',
        );
      }
    }

    setLoading(true);
    const dataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) dataToSend.append(key, formData[key]);
    });

    if (archivoContrato) {
      dataToSend.append('contrato_pdf', archivoContrato);
    }

    if (removeExisting) {
      dataToSend.append('eliminar_contrato', 'true');
    }

    try {
      if (providerToEdit) {
        await api.put(`/proveedores/${providerToEdit.id}`, dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Proveedor actualizado');
      } else {
        await api.post('/proveedores', dataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Proveedor registrado');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className='equipo-form'
      onSubmit={handleSubmit}
    >
      <div className='form-row'>
        <div className='input-group'>
          <label>
            <Building2 size={16} /> Razón Social *
          </label>
          <input
            name='razon_social'
            value={formData.razon_social}
            onChange={handleChange}
            placeholder='Ej: Renting Perú S.A.C.'
            required
          />
        </div>
        <div className='input-group'>
          <label>
            <IdCard size={16} /> RUC *
          </label>
          <input
            name='ruc'
            value={formData.ruc}
            onChange={handleChange}
            placeholder='201000...'
            required
            maxLength={11}
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>
            <Building2 size={16} /> Nombre Comercial
          </label>
          <input
            name='nombre_comercial'
            value={formData.nombre_comercial}
            onChange={handleChange}
            placeholder='Ej: RentingPe'
          />
        </div>
        <div className='input-group'>
          <label>
            <Globe size={16} /> Sitio Web
          </label>
          <input
            name='sitio_web'
            value={formData.sitio_web}
            onChange={handleChange}
            placeholder='www.empresa.com'
          />
        </div>
      </div>

      <hr className='divider' />
      <h4
        style={{
          margin: '10px 0',
          color: '#64748b',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <FileText size={16} /> Datos del Contrato
      </h4>

      <div className='form-row'>
        <div className='input-group'>
          <label>
            <CalendarDays size={16} /> Inicio de Contrato
          </label>
          <input
            type='date'
            name='fecha_inicio_contrato'
            value={formData.fecha_inicio_contrato}
            onChange={handleChange}
          />
        </div>
        <div className='input-group'>
          <label>
            <CalendarDays size={16} /> Fin de Contrato
          </label>
          <input
            type='date'
            name='fecha_fin_contrato'
            value={formData.fecha_fin_contrato}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className='form-row'>
        <div
          className='input-group'
          style={{ gridColumn: '1 / -1' }}
        >
          <label>Subir Documento de Contrato (PDF)</label>
          <FileUploader
            accept='.pdf'
            newFile={archivoContrato}
            onFileSelect={(file) => {
              if (file.type !== 'application/pdf') {
                toast.error('El contrato debe ser un archivo PDF.');
              } else {
                setArchivoContrato(file);
              }
            }}
            onFileRemove={() => setArchivoContrato(null)}
            existingUrl={
              providerToEdit?.contrato_url
                ? getBackendFileUrl(providerToEdit.contrato_url)
                : null
            }
            existingName={
              providerToEdit?.contrato_url
                ? providerToEdit.contrato_url.split('/').pop()
                : 'Contrato_Actual.pdf'
            }
            onExistingRemove={() => setRemoveExisting(true)}
            isExistingRemoved={removeExisting}
          />
        </div>
      </div>

      <hr className='divider' />
      <h4 style={{ margin: '10px 0', color: '#64748b', fontSize: '0.9rem' }}>
        Contacto Principal
      </h4>

      <div className='form-row'>
        <div className='input-group'>
          <label>
            <User size={16} /> Nombre de Contacto
          </label>
          <input
            name='nombre_contacto'
            value={formData.nombre_contacto}
            onChange={handleChange}
            placeholder='Ej: Juan Pérez'
          />
        </div>
        <div className='input-group'>
          <label>
            <Phone size={16} /> Teléfono / Celular
          </label>
          <input
            name='telefono_contacto'
            value={formData.telefono_contacto}
            onChange={handleChange}
            placeholder='+51 999...'
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
            name='email_contacto'
            value={formData.email_contacto}
            onChange={handleChange}
            placeholder='contacto@empresa.com'
          />
        </div>
        <div className='input-group'>
          <label>Tipo de Servicio</label>
          <input
            name='tipo_servicio'
            value={formData.tipo_servicio}
            onChange={handleChange}
            placeholder='Ej: Alquiler de Laptops'
          />
        </div>
      </div>

      <hr className='divider' />
      <h4 style={{ margin: '10px 0', color: '#64748b', fontSize: '0.9rem' }}>
        Ubicación
      </h4>

      <div className='form-row'>
        <div className='input-group'>
          <label>
            <MapPin size={16} /> Dirección Exacta
          </label>
          <input
            name='direccion'
            value={formData.direccion}
            onChange={handleChange}
            placeholder='Av. Principal 123...'
          />
        </div>
      </div>

      <div className='form-actions'>
        <button
          type='submit'
          className='btn-submit'
          disabled={loading}
        >
          <Save
            size={20}
            style={{ marginRight: '8px' }}
          />
          {loading
            ? 'Guardando...'
            : providerToEdit
              ? 'Actualizar Proveedor'
              : 'Registrar Proveedor'}
        </button>
      </div>
    </form>
  );
};

export default AddProveedorForm;
