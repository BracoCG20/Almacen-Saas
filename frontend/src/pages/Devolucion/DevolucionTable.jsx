import {
  History,
  Check,
  X as IconX,
  FileText,
  Upload,
  Eye,
  Ban,
  Mail,
  AlertTriangle,
  CalendarDays,
  Circle,
} from 'lucide-react';

const DevolucionTable = ({
  historial,
  onVerPdf,
  onVerFirmado,
  onSubirClick,
  onInvalidar,
  onReenviarCorreo,
}) => {
  const formatDateTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(
      isoString.endsWith('Z') ? isoString : `${isoString}Z`,
    );
    return date.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusBadge = (estado) => {
    const estLower = (estado || '').toLowerCase().trim();

    if (estLower === 'operativo') {
      return {
        color: '#16a34a',
        bg: '#dcfce7',
        text: 'Operativo',
        Icon: Check,
      };
    } else if (
      estLower === 'inoperativo' ||
      estLower === 'malogrado' ||
      estLower === 'mantenimiento'
    ) {
      return { color: '#ea580c', bg: '#ffedd5', text: estado, Icon: IconX };
    } else if (estLower === 'robado' || estLower === 'perdido') {
      return { color: '#dc2626', bg: '#fee2e2', text: estado, Icon: IconX };
    }
    return {
      color: '#64748b',
      bg: '#f1f5f9',
      text: estado || 'Desc.',
      Icon: Circle,
    };
  };

  return (
    <div className='table-container'>
      <div className='table-header-title'>
        <h3>
          <History size={20} /> Últimas Devoluciones
        </h3>
      </div>
      <table>
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Equipo Devuelto</th>
            <th>Usuario</th>
            <th>Motivo</th>
            <th className='center'>Estado</th>
            <th className='center'>Carg.</th>
            <th className='center'>Correo</th>
            <th className='center'>Acta</th>
            <th className='center'>Firma</th>
          </tr>
        </thead>
        <tbody>
          {historial.map((h) => {
            const status = getStatusBadge(h.estado_equipo_momento);
            const StatusIcon = status.Icon;

            return (
              <tr key={h.id}>
                <td>
                  <div className='email-cell'>
                    <CalendarDays size={14} />
                    {formatDateTime(h.fecha_movimiento)}
                  </div>
                </td>
                <td>
                  <div className='info-cell'>
                    <span className='name'>{h.modelo}</span>
                    <span className='audit-text'>S/N: {h.serie}</span>
                  </div>
                </td>
                <td>
                  <div className='info-cell'>
                    <span className='name'>
                      {h.empleado_nombre} {h.empleado_apellido}
                    </span>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                    {h.motivo || 'No especificado'}
                  </span>
                </td>
                <td className='center'>
                  <div
                    className='status-badge'
                    style={{
                      background: status.bg,
                      color: status.color,
                      borderColor: status.bg,
                    }}
                  >
                    <StatusIcon
                      size={10}
                      style={{ marginRight: '4px' }}
                    />{' '}
                    {status.text}
                  </div>
                </td>
                <td className='center'>
                  {h.cargador ? (
                    <Check
                      size={16}
                      className='check-icon'
                    />
                  ) : (
                    <IconX
                      size={16}
                      className='mail-error'
                    />
                  )}
                </td>
                <td className='center'>
                  {h.correo_enviado === true && (
                    <Mail
                      size={16}
                      className='mail-success'
                      title='Correo enviado'
                    />
                  )}
                  {h.correo_enviado === false && (
                    <button
                      onClick={() => onReenviarCorreo(h)}
                      title='Fallo el envío. Clic para reintentar'
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <AlertTriangle
                        size={18}
                        className='mail-error'
                        onMouseOver={(e) =>
                          (e.currentTarget.style.transform = 'scale(1.2)')
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.transform = 'scale(1)')
                        }
                        style={{ transition: 'transform 0.2s' }}
                      />
                    </button>
                  )}
                  {h.correo_enviado === null && (
                    <span style={{ color: '#cbd5e1' }}>-</span>
                  )}
                </td>
                <td className='center'>
                  <div className='actions-cell'>
                    <button
                      onClick={() => onVerPdf(h)}
                      className='action-btn pdf-btn'
                      title='Ver Constancia'
                    >
                      <FileText size={18} />
                    </button>
                  </div>
                </td>
                <td className='center'>
                  <div className='actions-cell'>
                    {!h.pdf_firmado_url && (
                      <button
                        onClick={() => onSubirClick(h.id)}
                        className='btn-upload'
                      >
                        <Upload size={14} /> Subir
                      </button>
                    )}

                    {h.pdf_firmado_url && h.firma_valida !== false && (
                      <>
                        <button
                          onClick={() => onVerFirmado(h.pdf_firmado_url)}
                          className='action-btn view'
                          title='Ver Firmado'
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => onInvalidar(h.id)}
                          className='action-btn delete'
                          title='Invalidar'
                        >
                          <Ban size={18} />
                        </button>
                      </>
                    )}

                    {h.pdf_firmado_url && h.firma_valida === false && (
                      <button
                        onClick={() => onSubirClick(h.id)}
                        className='btn-upload re-upload'
                      >
                        <Upload size={14} /> Re-subir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DevolucionTable;
