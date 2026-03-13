import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../service/api';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PenTool,
} from 'lucide-react';
import { toast } from 'react-toastify';
import './FirmarDocumento.scss';

const FirmarDocumento = () => {
  const { token } = useParams();
  const [docInfo, setDocInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dni, setDni] = useState('');
  const [firmando, setFirmando] = useState(false);
  const [firmadoSuccess, setFirmadoSuccess] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.get(`/firmas/${token}`);
        setDocInfo(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [token]);

  const handleFirmar = async (e) => {
    e.preventDefault();
    if (!dni || dni.length < 8)
      return toast.warning('Ingrese un DNI válido de 8 dígitos.');

    setFirmando(true);
    try {
      await api.post(`/firmas/${token}`, { dni_ingresado: dni });
      setFirmadoSuccess(true);
      toast.success('¡Documento firmado correctamente!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al procesar la firma.');
      setFirmando(false);
    }
  };

  // --- ESTADO: CARGANDO ---
  if (loading)
    return (
      <div className='firma-public-container'>
        <div className='status-screen'>
          <Loader2
            className='animate-spin spinner'
            size={40}
          />
          <h2>Verificando enlace</h2>
          <p>Espera un momento mientras validamos el documento...</p>
        </div>
      </div>
    );

  // --- ESTADO: ÉXITO ---
  if (firmadoSuccess)
    return (
      <div className='firma-public-container'>
        <div className='status-screen'>
          <div className='icon-box success'>
            <CheckCircle2
              size={48}
              strokeWidth={1.5}
            />
          </div>
          <h2>Documento Firmado</h2>
          <p>
            Tu firma digital ha sido registrada y validada exitosamente por el
            sistema. Ya puedes cerrar esta pestaña.
          </p>
        </div>
      </div>
    );

  // --- ESTADO: ENLACE INVÁLIDO ---
  if (!docInfo)
    return (
      <div className='firma-public-container'>
        <div className='status-screen'>
          <div className='icon-box error'>
            <AlertCircle
              size={48}
              strokeWidth={1.5}
            />
          </div>
          <h2>Enlace no válido o expirado</h2>
          <p>
            El documento que intentas abrir ya fue firmado anteriormente o el
            enlace ha caducado por seguridad.
          </p>
        </div>
      </div>
    );

  const baseUrl = api.defaults.baseURL
    ? api.defaults.baseURL.replace(/\/api\/?$/, '')
    : 'http://localhost:4000';

  const isEntrega = docInfo.tipo_movimiento === 'entrega';

  return (
    <div className='firma-public-container'>
      <div className='firma-card'>
        {/* CABECERA MINIMALISTA */}
        <div className='firma-header'>
          <div className='header-title'>
            <div className='icon-wrapper'>
              <FileText
                size={24}
                strokeWidth={1.5}
              />
            </div>
            <div>
              <h1>
                {isEntrega ? 'Acta de Entrega' : 'Constancia de Devolución'}
              </h1>
              <p>Valida la recepción o devolución de tus herramientas.</p>
            </div>
          </div>
          <span
            className={`badge-tipo ${isEntrega ? 'badge-entrega' : 'badge-devolucion'}`}
          >
            {isEntrega ? 'Entrega' : 'Devolución'}
          </span>
        </div>

        <div className='firma-body'>
          {/* RESUMEN DE INFORMACIÓN */}
          <div className='info-summary'>
            <div className='info-item'>
              <label>Colaborador</label>
              <span>
                {docInfo.nombres} {docInfo.apellidos}
              </span>
            </div>
            <div className='info-item'>
              <label>Equipo asignado</label>
              <span>
                {docInfo.marca} {docInfo.modelo}
              </span>
            </div>
          </div>

          {/* VISOR PDF */}
          <div className='pdf-preview-container'>
            <iframe
              src={
                docInfo.pdf_generado_url?.startsWith('http')
                  ? `${docInfo.pdf_generado_url}#toolbar=0&navpanes=0`
                  : `${baseUrl}${docInfo.pdf_generado_url}#toolbar=0&navpanes=0`
              }
              width='100%'
              height='100%'
              title='Vista previa del documento'
            />
          </div>

          {/* FORMULARIO DE FIRMA / ANIMACIÓN DE CARGA */}
          {firmando ? (
            <div className='signing-animation-container'>
              <Loader2
                className='spinner-icon'
                size={40}
                strokeWidth={1.5}
              />
              <p className='signing-text'>Aplicando firma digital...</p>
              <span className='signing-subtext'>
                Asegurando el documento con tu DNI
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleFirmar}
              className='firma-form'
            >
              <div className='input-group'>
                <label htmlFor='dniInput'>
                  Confirma tu identidad con tu DNI
                </label>
                <input
                  id='dniInput'
                  type='text'
                  maxLength='8'
                  inputMode='numeric'
                  required
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                  placeholder='Ingresa tus 8 dígitos'
                  autoComplete='off'
                />
              </div>

              <button
                type='submit'
                disabled={dni.length < 8}
                className='btn-firmar-shadcn'
              >
                <PenTool size={18} /> Firmar Documento
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirmarDocumento;
