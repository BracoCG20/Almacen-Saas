import {
  Mail,
  CornerDownRight,
  Edit,
  UserMinus,
  UserCheck,
  History,
} from 'lucide-react'; // <-- Importar History
import './DirectorioTable.scss';

const DirectorioTable = ({
  directorio,
  onEdit,
  onBaja,
  onReactivar,
  onViewHistory,
}) => {
  // <-- Nuevo prop onViewHistory
  if (directorio.length === 0) {
    return (
      <div className='no-data'>
        No hay licencias asignadas en el directorio.
      </div>
    );
  }

  return (
    <div className='table-container dir-table'>
      <table>
        <thead>
          <tr>
            <th>Colaborador</th>
            <th>Correo Corporativo</th>
            <th className='center'>Tipo Licencia</th>
            <th className='center'>Estado Cuenta</th>
            <th>Detalle Transferencia</th>
            <th className='center'>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {directorio.map((d) => (
            <tr
              key={d.id}
              className={!d.estado ? 'row-inactive' : ''}
            >
              <td>
                <span className='name'>
                  {d.colaborador_nombres} {d.colaborador_apellidos}
                </span>
              </td>
              <td>
                <span className='email-badge'>
                  <Mail size={14} /> {d.email_corporativo || 'Sin correo'}
                </span>
              </td>
              <td className='center'>
                <span
                  className={`lic-badge ${d.tipo_licencia === 'BUSINESS_STARTER' ? 'starter' : 'standard'}`}
                >
                  {d.tipo_licencia === 'BUSINESS_STARTER'
                    ? 'STARTER'
                    : 'STANDARD'}
                </span>
              </td>
              <td className='center'>
                <span
                  className={`status-badge ${d.estado ? 'active' : 'inactive'}`}
                >
                  {d.estado ? 'ACTIVA' : 'SUSPENDIDA'}
                </span>
              </td>
              <td>
                {!d.estado &&
                d.datos_transferidos &&
                d.colaborador_destino_id ? (
                  <div className='transfer-info'>
                    <CornerDownRight
                      size={14}
                      className='icon-transfer'
                    />
                    <span>
                      Transferido a:{' '}
                      <strong>
                        {d.destino_nombres} {d.destino_apellidos}
                      </strong>
                    </span>
                  </div>
                ) : !d.estado ? (
                  <span className='no-transfer'>Sin transferencia</span>
                ) : (
                  <span className='dash'>-</span>
                )}
              </td>
              <td className='center'>
                <div className='actions-cell'>
                  {/* BOTÓN HISTORIAL (Siempre visible) */}
                  <button
                    className='action-btn history'
                    onClick={() => onViewHistory(d)}
                    title='Ver Historial de Cambios'
                  >
                    <History size={16} />
                  </button>

                  {/* BOTONES SEGÚN ESTADO */}
                  {d.estado ? (
                    <>
                      <button
                        className='action-btn view'
                        onClick={() => onEdit(d)}
                        title='Cambiar Tipo de Licencia'
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className='action-btn baja'
                        onClick={() => onBaja(d)}
                        title='Dar de Baja / Transferir'
                      >
                        <UserMinus size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      className='action-btn reactivar'
                      onClick={() => onReactivar(d)}
                      title='Reactivar Licencia'
                    >
                      <UserCheck size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DirectorioTable;
