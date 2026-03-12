import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [estadoActual, setEstadoActual] = useState(ticket.estado);

  const [showMobileDetails, setShowMobileDetails] = useState(false);

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

  const handleEnviarComentario = async (e) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    try {
      await api.post(`/tickets/${ticket.id}/comentarios`, { comentario });
      setComentario('');
    } catch (error) {
      toast.error('Error al enviar el comentario');
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
      {/* --- BOTÓN EXCLUSIVO PARA MÓVILES --- */}
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

      {/* --- COLUMNA IZQUIERDA (INFO DEL TICKET) --- */}
      <div
        className={`ticket-info-sidebar ${showMobileDetails ? 'show-in-mobile' : ''}`}
      >
        <div className='info-block'>
          <h4>Descripción Original</h4>
          <p className='descripcion-original'>{ticket.descripcion}</p>
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

      {/* --- COLUMNA DERECHA (CHAT Y LÍNEA DE TIEMPO) --- */}
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
                      <p>{item.detalles}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* INPUT DE CHAT */}
        <form
          className='chat-input-area'
          onSubmit={handleEnviarComentario}
        >
          <textarea
            placeholder='Escribe un mensaje aquí...'
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows='1'
          ></textarea>
          <button
            type='submit'
            disabled={!comentario.trim()}
            className='btn-send'
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketDetails;
