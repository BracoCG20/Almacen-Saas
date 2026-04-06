import { useState, useRef, useEffect } from 'react';
import {
  Laptop,
  Building2,
  Handshake,
  AlertTriangle,
  Barcode,
  Clock,
  CalendarDays,
  Image as ImageIcon,
  Camera,
  Loader2,
} from 'lucide-react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import './EquipoSpecs.scss';

const EquipoSpecs = ({ equipo, calcularAntiguedad, formatDate }) => {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagenActual, setImagenActual] = useState(null);

  // Sincronizamos la imagen actual cuando cambia el equipo seleccionado
  useEffect(() => {
    if (equipo) {
      setImagenActual(equipo.imagen_url);
    }
  }, [equipo]);

  if (!equipo) return null;

  // --- MANEJADOR DE SUBIDA DE IMAGEN ---
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validación básica de tipo de archivo e imagen
    if (!file.type.startsWith('image/')) {
      return toast.error('Solo se permiten archivos de imagen.');
    }
    if (file.size > 5 * 1024 * 1024) {
      // Límite de 5MB
      return toast.error('La imagen no debe superar los 5MB.');
    }

    const formData = new FormData();
    formData.append('imagen', file);

    setIsUploading(true);
    const toastId = toast.loading('Subiendo fotografía...');

    try {
      const res = await api.put(`/equipos/${equipo.id}/imagen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImagenActual(res.data.imagen_url); // Actualizamos la UI inmediatamente
      toast.update(toastId, {
        render: 'Fotografía guardada correctamente',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: 'Error al subir la fotografía',
        type: 'error',
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setIsUploading(false);
      // Limpiamos el input para permitir subir la misma foto si hubo error
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className='specs-grid-modern'>
      {/* --- VISOR DE FOTOGRAFÍA --- */}
      <div className='equipo-image-container'>
        {imagenActual ? (
          <div
            className='image-present'
            onClick={() => !isUploading && fileInputRef.current.click()}
          >
            <img
              src={imagenActual}
              alt={`Foto de ${equipo.marca} ${equipo.modelo}`}
              className='equipo-photo'
            />
            <div className='image-overlay'>
              <Camera size={24} />
              <span>Cambiar Fotografía</span>
            </div>
          </div>
        ) : (
          <div
            className='empty-image-box'
            onClick={() => !isUploading && fileInputRef.current.click()}
          >
            <ImageIcon
              size={32}
              className='icon-empty'
            />
            <span>Agregar Fotografía del Equipo</span>
            <small>JPG, PNG (Máx 5MB)</small>
          </div>
        )}

        {/* Input invisible para abrir el selector de archivos */}
        <input
          type='file'
          ref={fileInputRef}
          hidden
          accept='image/png, image/jpeg, image/jpg, image/webp'
          onChange={handleImageUpload}
          disabled={isUploading}
        />

        {/* Overlay de carga mientras sube a Cloudinary */}
        {isUploading && (
          <div className='uploading-overlay'>
            <Loader2
              className='spinner'
              size={28}
            />
            <span>Guardando...</span>
          </div>
        )}
      </div>

      {/* --- CABECERA PRINCIPAL --- */}
      <div className='header-specs'>
        <div className='big-icon'>
          <Laptop size={32} />
        </div>
        <div className='title-info-wrapper'>
          <h3>
            {equipo.marca} {equipo.modelo}
          </h3>
          <div className='badge-wrapper'>
            <span
              className={`status-badge ${equipo.disponible ? 'operativo' : 'malogrado'}`}
            >
              {equipo.disponible ? 'DISPONIBLE' : 'INACTIVO'}
            </span>
            <span
              className={`ownership-badge ${equipo.es_propio ? 'owned' : 'rented'}`}
            >
              {equipo.es_propio ? (
                <>
                  <Building2 size={12} /> PROPIO
                </>
              ) : (
                <>
                  <Handshake size={12} /> ALQUILADO
                </>
              )}
            </span>
          </div>
          <div className='owner-info-text'>
            {equipo.es_propio
              ? `Empresa: ${equipo.empresa_nombre}`
              : `Proveedor: ${equipo.nombre_proveedor}`}
          </div>
        </div>
      </div>

      {equipo.observaciones && (
        <div className='observation-alert'>
          <h5>
            <AlertTriangle size={14} /> Observaciones del Equipo
          </h5>
          <p>"{equipo.observaciones}"</p>
        </div>
      )}

      <h4 className='section-subtitle'>Identificación y Adquisición</h4>

      <div className='grid-2-col'>
        <div className='info-box flex-row'>
          <div className='icon-wrapper'>
            <Barcode size={20} />
          </div>
          <div className='text-wrapper'>
            <span className='label'>Código Patrimonial</span>
            <span className='value'>{equipo.codigo_patrimonial || 'N/A'}</span>
          </div>
        </div>
        <div className='info-box'>
          <span className='label'>Número de Serie (S/N)</span>
          <span className='value'>{equipo.numero_serie}</span>
        </div>
      </div>

      <div className='grid-2-col'>
        <div className='info-box flex-row'>
          <div className='icon-wrapper secondary'>
            <CalendarDays size={20} />
          </div>
          <div className='text-wrapper'>
            <span className='label'>Fecha de Adquisición</span>
            <span className='value date-text'>
              {formatDate(equipo.fecha_adquisicion)}
            </span>
          </div>
        </div>
        <div className='info-box flex-row'>
          <div className='icon-wrapper primary'>
            <Clock size={20} />
          </div>
          <div className='text-wrapper'>
            <span className='label'>Tiempo de Uso</span>
            <span className='value highlight-text'>
              {calcularAntiguedad(equipo.fecha_adquisicion)}
            </span>
          </div>
        </div>
      </div>

      {equipo.especificaciones &&
        Object.keys(equipo.especificaciones).length > 0 && (
          <>
            <h4 className='section-subtitle mt-4'>Especificaciones Técnicas</h4>
            <div className='specs-list'>
              {Object.entries(equipo.especificaciones).map(
                ([key, value], index) => (
                  <div
                    key={key}
                    className={`spec-item ${index % 2 !== 0 ? 'odd' : ''}`}
                  >
                    <strong>{key}:</strong> <span>{value || 'N/A'}</span>
                  </div>
                ),
              )}
            </div>
          </>
        )}
    </div>
  );
};

export default EquipoSpecs;
