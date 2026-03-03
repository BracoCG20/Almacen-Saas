import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../service/api';
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertOctagon,
  Loader2,
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
    } finally {
      setFirmando(false);
    }
  };

  // --- ESTADO: CARGANDO ---
  if (loading)
    return (
      <div className='firma-public-container'>
        <div className='status-screen'>
          <Loader2
            className='animate-spin'
            size={50}
            color='#4f46e5'
            style={{ margin: '0 auto 20px auto' }}
          />
          <h2>Cargando Documento</h2>
          <p>
            Espere un momento mientras verificamos la seguridad del enlace...
          </p>
        </div>
      </div>
    );

  // --- ESTADO: ÉXITO ---
  if (firmadoSuccess)
    return (
      <div className='firma-public-container'>
        <div className='status-screen'>
          <div className='icon-box success'>
            <CheckCircle size={50} />
          </div>
          <h2>¡Firma Completada!</h2>
          <p>
            Tu firma digital ha sido registrada y validada exitosamente por el
            sistema de <strong>Grupo SP</strong>. Ya puedes cerrar esta ventana.
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
            <AlertOctagon size={50} />
          </div>
          <h2>Enlace no válido</h2>
          <p>
            Lo sentimos, este enlace ha expirado, el token es incorrecto o el
            documento ya ha sido firmado anteriormente.
          </p>
        </div>
      </div>
    );

  const baseUrl = api.defaults.baseURL
    ? api.defaults.baseURL.replace(/\/api\/?$/, '')
    : 'http://localhost:4000';

  return (
    <div className='firma-public-container'>
      <div className='firma-card'>
        {/* Cabecera dinámica según tipo de movimiento */}
        <div className={`firma-header ${docInfo.tipo_movimiento}`}>
          <FileText size={48} />
          <h1>
            {docInfo.tipo_movimiento === 'entrega'
              ? 'Acta de Entrega de Equipo'
              : 'Constancia de Devolución'}
          </h1>
          <p>Valida la recepción o devolución de tus herramientas de trabajo</p>
        </div>

        <div className='firma-body'>
          {/* Resumen de Información */}
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

          {/* Vista previa del PDF Original */}
          <div className='pdf-preview-container'>
            <iframe
              src={`${baseUrl}${docInfo.pdf_generado_url}#toolbar=0&navpanes=0`}
              width='100%'
              height='100%'
              title='Vista previa del documento'
            />
          </div>

          {/* Formulario de Firma */}
          <form
            onSubmit={handleFirmar}
            className='firma-form'
          >
            <div className='input-group'>
              <label htmlFor='dniInput'>
                Confirma tu identidad con tu DNI:
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
              disabled={firmando || dni.length < 8}
              className='btn-firmar'
            >
              {firmando ? (
                <>
                  <Loader2
                    className='animate-spin'
                    size={20}
                  />{' '}
                  Procesando firma...
                </>
              ) : (
                <>
                  <ShieldCheck size={22} /> Firmar Documento Digitalmente
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FirmarDocumento;
