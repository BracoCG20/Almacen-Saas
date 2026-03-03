import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../service/api';
import { FileText, ShieldCheck, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
//import './FirmarDocumento.scss'; // Puedes crear un SCSS básico luego

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
        toast.error(
          error.response?.data?.error || 'Enlace inválido o expirado.',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [token]);

  const handleFirmar = async (e) => {
    e.preventDefault();
    if (!dni || dni.length < 8) return toast.warning('Ingrese un DNI válido.');

    setFirmando(true);
    try {
      await api.post(`/firmas/${token}`, { dni_ingresado: dni });
      setFirmadoSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al firmar documento.');
    } finally {
      setFirmando(false);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        Cargando documento...
      </div>
    );

  if (!docInfo && !firmadoSuccess)
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: '#dc2626' }}>
        <h2>Enlace no válido</h2>
        <p>El documento ya fue firmado o el enlace es incorrecto.</p>
      </div>
    );

  if (firmadoSuccess)
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f3f4f6',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
            maxWidth: '400px',
          }}
        >
          <CheckCircle
            size={60}
            color='#16a34a'
            style={{ margin: '0 auto 20px auto' }}
          />
          <h2 style={{ color: '#16a34a' }}>¡Documento Firmado!</h2>
          <p style={{ color: '#64748b' }}>
            Tu firma digital se ha registrado exitosamente. Ya puedes cerrar
            esta ventana.
          </p>
        </div>
      </div>
    );

  const baseUrl = api.defaults.baseURL
    ? api.defaults.baseURL.replace(/\/api\/?$/, '')
    : 'http://localhost:4000';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            backgroundColor:
              docInfo.tipo_movimiento === 'entrega' ? '#4f46e5' : '#dc2626',
            padding: '30px 20px',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <FileText
            size={40}
            style={{ margin: '0 auto 10px auto' }}
          />
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
            {docInfo.tipo_movimiento === 'entrega'
              ? 'Acta de Asignación'
              : 'Constancia de Devolución'}
          </h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>
            Revisa el documento y firma ingresando tu DNI.
          </p>
        </div>

        <div style={{ padding: '30px' }}>
          <div
            style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
            }}
          >
            <p
              style={{
                margin: '0 0 5px 0',
                fontSize: '0.9rem',
                color: '#64748b',
              }}
            >
              Colaborador:
            </p>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>
              {docInfo.nombres} {docInfo.apellidos}
            </p>
            <p
              style={{
                margin: '15px 0 5px 0',
                fontSize: '0.9rem',
                color: '#64748b',
              }}
            >
              Equipo:
            </p>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#1e293b' }}>
              {docInfo.marca} {docInfo.modelo}
            </p>
          </div>

          <div
            style={{
              height: '400px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              marginBottom: '20px',
              overflow: 'hidden',
            }}
          >
            <iframe
              src={`${baseUrl}${docInfo.pdf_generado_url}`}
              width='100%'
              height='100%'
              title='Documento'
            />
          </div>

          <form
            onSubmit={handleFirmar}
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                  color: '#334155',
                }}
              >
                Para firmar, ingresa tu número de DNI:
              </label>
              <input
                type='text'
                maxLength='8'
                required
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                placeholder='Ej: 71234567'
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '1rem',
                }}
              />
            </div>
            <button
              type='submit'
              disabled={firmando || dni.length < 8}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: firmando || dni.length < 8 ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ShieldCheck size={20} />{' '}
              {firmando ? 'Procesando firma...' : 'Firmar Documento'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FirmarDocumento;
