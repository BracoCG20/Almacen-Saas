import React, { useState, useEffect, useRef } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  Send,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Paperclip, // Nuevo ícono para adjuntar
  X, // Nuevo ícono para quitar el archivo seleccionado
} from 'lucide-react';
import { io } from 'socket.io-client';
import './TicketDetails.scss';

const SOCKET_URL = api.defaults.baseURL
  ? api.defaults.baseURL.replace(/\/api\/?$/, '')
  : 'http://localhost:4000';

const TicketDetails = ({ ticket, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [comentario, setComentario] = useState('');
  const [archivoAdjunto, setArchivoAdjunto] = useState(null); // Estado para el archivo
  const [loading, setLoading] = useState(true);
  const [estadoActual, setEstadoActual] = useState(ticket.estado);
  const [showMobileDetails, setShowMobileDetails] = useState(false);

  const fileInputRef = useRef(null); // Referencia al input de archivo oculto

  const fetchHistorial = async () => {
    try {
      const res = await api.get(`/tickets/${ticket.id}/historial`);
      setHistorial(res.data);
    } catch (error) {
      toast.error('Error al cargar el historial del ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, [ticket.id]);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on('actualizacion_ticket', (data) => {
      if (String(data.ticketId) === String(ticket.id)) {
        fetchHistorial();
        onUpdate();
      }
    });
    return () => socket.disconnect();
  }, [ticket.id]);

  // --- Función para detectar y convertir enlaces ---
  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target='_blank'
            rel='noopener noreferrer'
            className='chat-link'
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoAdjunto(e.target.files[0]);
    }
  };

  const handleEnviarComentario = async (e) => {
    e.preventDefault();
    if (!comentario.trim() && !archivoAdjunto) return; // Permitir enviar si solo hay archivo o solo texto

    try {
      // Usamos FormData para poder enviar el archivo adjunto
      const formData = new FormData();
      formData.append('comentario', comentario);

      if (archivoAdjunto) {
        formData.append('archivo', archivoAdjunto);
      }

      await api.post(`/tickets/${ticket.id}/comentarios`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setComentario('');
      setArchivoAdjunto(null);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Limpiar el input file
    } catch (error) {
      toast.error('Error al enviar el mensaje');
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    if (nuevoEstado === estadoActual) return;
    try {
      await api.put(`/tickets/${ticket.id}`, {
        ...ticket,
        estado: nuevoEstado,
      });
      setEstadoActual(nuevoEstado);
      toast.success(`Estado cambiado a ${nuevoEstado}`);
    } catch (error) {
      toast.error('Error al cambiar el estado');
    }
  };

  if (loading) return <div className='loading-chat'>Cargando detalles...</div>;

  return (
    <div className='ticket-details-container'>
      <div className='mobile-details-header'>
        <button
          className='btn-toggle-details'
          onClick={() => setShowMobileDetails(!showMobileDetails)}
        >
          <Info size={16} />
          <span>
            {showMobileDetails
              ? 'Ocultar Detalles'
              : 'Ver Detalles de la Solicitud'}
          </span>
          {showMobileDetails ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>
      </div>

      {/* --- COLUMNA IZQUIERDA --- */}
      <div
        className={`ticket-info-sidebar ${showMobileDetails ? 'show-in-mobile' : ''}`}
      >
        <div className='info-block'>
          <h4>Descripción Original</h4>
          <p className='descripcion-original'>
            {renderTextWithLinks(ticket.descripcion)}
          </p>
        </div>

        <div className='info-block divider'>
          <div className='info-row'>
            <span className='label'>Solicitante:</span>
            <span className='value'>
              <User size={14} /> {ticket.solicitante_nombres}{' '}
              {ticket.solicitante_apellidos}
            </span>
          </div>
          <div className='info-row'>
            <span className='label'>Tipo:</span>
            <span className='value'>{ticket.tipo_solicitud}</span>
          </div>
          <div className='info-row'>
            <span className='label'>Prioridad:</span>
            <span className={`badge-prio ${ticket.prioridad.toLowerCase()}`}>
              {ticket.prioridad}
            </span>
          </div>
        </div>

        {Number(user?.rol_id) === 1 && (
          <div className='info-block divider'>
            <h4>Cambiar Estado</h4>
            <div className='status-buttons'>
              <button
                className={`btn-status ${estadoActual === 'En Proceso' ? 'active-proceso' : ''}`}
                onClick={() => handleCambiarEstado('En Proceso')}
              >
                En Proceso
              </button>
              <button
                className={`btn-status ${estadoActual === 'Resuelto' ? 'active-resuelto' : ''}`}
                onClick={() => handleCambiarEstado('Resuelto')}
              >
                Resuelto
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- COLUMNA DERECHA (CHAT) --- */}
      <div className='ticket-chat-area'>
        <div className='chat-history'>
          {historial.map((item) => {
            const isComentario = item.accion === 'COMENTARIO';
            return (
              <div
                key={item.id}
                className={`history-item ${isComentario ? 'type-comment' : 'type-system'}`}
              >
                {!isComentario && (
                  <div className='system-event'>
                    <div className='icon'>
                      {item.accion === 'CREADO' ? (
                        <Info size={14} />
                      ) : item.accion === 'CERRADO' ? (
                        <CheckCircle size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                    </div>
                    <div className='content'>
                      <span className='text'>{item.detalles}</span>
                      <span className='time'>
                        {new Date(item.fecha_registro).toLocaleString('es-PE')}
                      </span>
                    </div>
                  </div>
                )}

                {isComentario && (
                  <div className='chat-bubble-wrapper'>
                    <div className='chat-bubble'>
                      <div className='bubble-header'>
                        <strong>
                          {item.usuario_nombres} {item.usuario_apellidos}
                        </strong>
                        <span>
                          <Clock size={12} />{' '}
                          {new Date(item.fecha_registro).toLocaleTimeString(
                            'es-PE',
                            { hour: '2-digit', minute: '2-digit' },
                          )}
                        </span>
                      </div>
                      {/* Aplicamos la función para parsear links aquí */}
                      <p>{renderTextWithLinks(item.detalles)}</p>

                      {/* Si el backend envía la URL del archivo, lo mostramos (Ajusta 'item.archivo_url' según tu BD) */}
                      {item.archivo_url && (
                        <a
                          href={item.archivo_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='attachment-link'
                        >
                          <Paperclip size={14} /> Ver archivo adjunto
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* --- CONTENEDOR DEL INPUT --- */}
        <div className='chat-input-wrapper'>
          {/* Vista previa del archivo seleccionado */}
          {archivoAdjunto && (
            <div className='file-preview-badge'>
              <span className='file-name'>
                <Paperclip size={12} /> {archivoAdjunto.name}
              </span>
              <button
                onClick={() => setArchivoAdjunto(null)}
                title='Quitar archivo'
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form
            className='chat-input-area'
            onSubmit={handleEnviarComentario}
          >
            <input
              type='file'
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept='image/*,.pdf,.doc,.docx,.xls,.xlsx' // Limita los tipos si lo deseas
            />

            <button
              type='button'
              className='btn-attach'
              onClick={() => fileInputRef.current.click()}
              title='Adjuntar archivo'
            >
              <Paperclip size={18} />
            </button>

            <textarea
              placeholder='Escribe un mensaje aquí...'
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows='1'
            ></textarea>

            <button
              type='submit'
              disabled={!comentario.trim() && !archivoAdjunto}
              className='btn-send'
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
