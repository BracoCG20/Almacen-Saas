//frontend/src/pages/FirmarDocumento/FirmarDocumento.jsx
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  PenTool,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sileo } from 'sileo';
import api from '../../service/api';
import './FirmarDocumento.scss';

const FirmarDocumento = () => {
  // --- 1. PARÁMETROS Y ESTADOS ---
  const { token } = useParams();
  const [docInfo, setDocInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dni, setDni] = useState('');
  const [firmando, setFirmando] = useState(false);
  const [firmadoSuccess, setFirmadoSuccess] = useState(false);

  /**
   * 2. VALIDACIÓN INICIAL DEL TOKEN
   */
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.get(`/firmas/${token}`);
        setDocInfo(res.data);
      } catch (error) {
        console.error('Error al validar token de firma:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [token]);

  /**
   * 3. PROCESO DE FIRMA DIGITAL
   */
  const handleFirmar = async (e) => {
    e.preventDefault();
    if (!dni || dni.length < 8)
      return sileo.warning({
        title: 'DNI inválido',
        description: 'Por favor, ingresa un DNI válido de 8 dígitos.',
      });

    setFirmando(true);
    try {
      // Envío el DNI como factor de autenticación para aplicar la firma
      await api.post(`/firmas/${token}`, { dni_ingresado: dni });
      setFirmadoSuccess(true);
      sileo.success({
        title: 'Documento firmado',
        description: '¡Documento firmado correctamente!',
      });
    } catch (error) {
      sileo.error({
        title: 'Error al firmar',
        description:
          error.response?.data?.error || 'Error al procesar la firma.',
      });
      setFirmando(false);
    }
  };

  // Pantalla de carga mientras valido el enlace
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

  // Pantalla de éxito tras confirmar la firma en el servidor
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
            Tu firma digital ha sido registrada y validada exitosamente. Ya
            puedes cerrar esta pestaña.
          </p>
        </div>
      </div>
    );

  // Pantalla de error si el token no existe o ya se usó
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
            El documento ya fue firmado anteriormente o el enlace ha caducado
            por seguridad.
          </p>
        </div>
      </div>
    );

  // --- CONFIGURACIÓN DE VISTA PREVIA ---
  const baseUrl = api.defaults.baseURL
    ? api.defaults.baseURL.replace(/\/api\/?$/, '')
    : 'http://localhost:4000';

  const isEntrega = docInfo.tipo_movimiento === 'entrega';

  return (
    <div className='firma-public-container'>
      <div className='firma-card'>
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
          <div className='info-summary'>
            <div className='info-item'>
              <label>Colaborador</label>
              <span>
                {docInfo.nombres} {docInfo.apellidos}
              </span>
            </div>
            <div className='info-item'>
              <label>Equipo involucrado</label>
              <span>
                {docInfo.marca} {docInfo.modelo}
              </span>
            </div>
          </div>
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
                  type='password'
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
