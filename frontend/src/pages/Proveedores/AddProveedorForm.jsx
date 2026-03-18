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
import FileUploader from '../../components/FileUploader/FileUploader';
import './AddProveedorForm.scss';

const AddProveedorForm = ({ onSuccess, providerToEdit }) => {
  // --- 1. ESTADO PRINCIPAL ---
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

  // --- 2. ESTADOS PARA ARCHIVO ADJUNTO (PDF) ---
  const [archivoContrato, setArchivoContrato] = useState(null);
  const [removeExisting, setRemoveExisting] = useState(false);

  /**
   * 3. CARGA DE DATOS (MODO EDICIÓN)
   * Si recibo un proveedor por props, lleno el formulario automáticamente.
   */
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
        // Separo la hora (T00:00:00) para que el input type="date" acepte el formato YYYY-MM-DD
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

  // Manejador genérico para inputs de texto
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * HELPER: FORMATO DE URL DEL PDF
   * Determino si el PDF guardado viene de un bucket (Cloudinary) o si está en mi servidor local.
   */
  const getBackendFileUrl = (path) => {
    if (!path) return null;

    if (path.includes('cloudinary.com') || path.includes('http')) {
      return path.startsWith('/') ? path.substring(1) : path;
    }

    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:4000';

    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  };

  /**
   * 4. ENVÍO AL SERVIDOR (SUBMIT)
   * Valido datos críticos, verifico la lógica de fechas y empaqueto todo (incluido el PDF) en un FormData.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.razon_social || !formData.ruc)
      return toast.warning('Razón Social y RUC son obligatorios');

    // Valido que no viajen en el tiempo
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

    // Adjunto solo los campos que tienen valor
    Object.keys(formData).forEach((key) => {
      if (formData[key]) dataToSend.append(key, formData[key]);
    });

    // Adjunto el archivo físico si subieron uno nuevo
    if (archivoContrato) dataToSend.append('contrato_pdf', archivoContrato);

    // Bandera para decirle al backend que borre el archivo viejo
    if (removeExisting) dataToSend.append('eliminar_contrato', 'true');

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
      className='proveedor-form-modern'
      onSubmit={handleSubmit}
    >
      {/* SECCIÓN 1: DATOS GENERALES EMPRESARIALES */}
      <div className='form-section'>
        <div className='section-header'>
          <div className='indicator' />
          <h4>Información Principal</h4>
        </div>
        <div className='form-grid'>
          <div className='input-group'>
            <label>
              <Building2 size={14} /> Razón Social *
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
              <IdCard size={14} /> RUC *
            </label>
            <input
              name='ruc'
              inputMode='numeric'
              pattern='[0-9]*'
              value={formData.ruc}
              onChange={handleChange}
              placeholder='201000...'
              maxLength={11}
              required
            />
          </div>
          <div className='input-group'>
            <label>
              <Building2 size={14} /> Nombre Comercial
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
              <Globe size={14} /> Sitio Web
            </label>
            <input
              name='sitio_web'
              value={formData.sitio_web}
              onChange={handleChange}
              placeholder='www.empresa.com'
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CONTRATO FÍSICO Y VIGENCIA */}
      <div className='form-section'>
        <div className='section-header'>
          <div className='indicator' />
          <h4>Datos del Contrato</h4>
        </div>
        <div className='form-grid'>
          <div className='input-group'>
            <label>
              <CalendarDays size={14} /> Inicio de Contrato
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
              <CalendarDays size={14} /> Fin de Contrato
            </label>
            <input
              type='date'
              name='fecha_fin_contrato'
              value={formData.fecha_fin_contrato}
              onChange={handleChange}
            />
          </div>

          <div className='input-group full-width'>
            <label>
              <FileText size={14} /> Documento Adjunto (PDF)
            </label>
            <FileUploader
              accept='.pdf'
              newFile={archivoContrato}
              onFileSelect={(file) => {
                if (file.type !== 'application/pdf')
                  toast.error('El contrato debe ser un archivo PDF.');
                else setArchivoContrato(file);
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
      </div>

      {/* SECCIÓN 3: UBICACIÓN Y CONTACTO DIRECTO */}
      <div className='form-section'>
        <div className='section-header'>
          <div className='indicator' />
          <h4>Contacto y Ubicación</h4>
        </div>
        <div className='form-grid'>
          <div className='input-group'>
            <label>
              <User size={14} /> Nombre Contacto
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
              <Phone size={14} /> Teléfono / Celular
            </label>
            <input
              name='telefono_contacto'
              value={formData.telefono_contacto}
              onChange={handleChange}
              placeholder='+51 999...'
            />
          </div>
          <div className='input-group'>
            <label>
              <Mail size={14} /> Correo Electrónico
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
          <div className='input-group full-width'>
            <label>
              <MapPin size={14} /> Dirección Exacta
            </label>
            <input
              name='direccion'
              value={formData.direccion}
              onChange={handleChange}
              placeholder='Av. Principal 123...'
            />
          </div>
        </div>
      </div>

      <div className='form-footer'>
        <button
          type='submit'
          className='btn-save-modern'
          disabled={loading}
        >
          <Save size={18} />
          {loading
            ? 'Procesando...'
            : providerToEdit
              ? 'Actualizar Proveedor'
              : 'Registrar Proveedor'}
        </button>
      </div>
    </form>
  );
};

export default AddProveedorForm;
