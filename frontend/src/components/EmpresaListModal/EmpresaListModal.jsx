import { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import {
  X,
  Building2,
  MapPin,
  Phone,
  ToggleLeft,
  ToggleRight,
  Edit,
  Mail,
} from 'lucide-react';
import './EmpresaListModal.scss';

const EmpresaListModal = ({ onClose, onEditEmpresa }) => {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmpresas = async () => {
    try {
      const res = await api.get('/empresas');
      setEmpresas(res.data);
    } catch (error) {
      toast.error('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleToggleStatus = async (empresa) => {
    try {
      if (empresa.estado) {
        await api.delete(`/empresas/${empresa.id}`);
      } else {
        await api.put(`/empresas/${empresa.id}/activate`);
      }

      const nuevoEstado = !empresa.estado;
      setEmpresas(
        empresas.map((e) =>
          e.id === empresa.id ? { ...e, estado: nuevoEstado } : e,
        ),
      );
      toast.success(
        `Empresa ${nuevoEstado ? 'Activada' : 'Inactivada'} correctamente`,
      );
    } catch (error) {
      toast.error('Error al cambiar el estado de la empresa');
    }
  };

  return (
    <div
      className='empresa-list-overlay'
      onClick={onClose}
    >
      <div
        className='empresa-list-content'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-header'>
          <h2>
            <Building2 size={24} /> Gestión de Empresas
          </h2>
          <button
            className='btn-close'
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className='loading-state'>Cargando empresas...</div>
        ) : (
          <div className='table-wrapper'>
            <table>
              <thead>
                <tr>
                  <th>Razón Social</th>
                  <th>RUC</th>
                  <th>Contacto</th>
                  <th>Ubicación</th>
                  <th className='center'>Estado</th>
                  <th className='center'>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((e) => (
                  <tr
                    key={e.id}
                    className={!e.estado ? 'row-inactive' : ''}
                  >
                    <td>
                      <div className='main-text'>{e.nombre_comercial}</div>
                      <div className='secondary-text'>{e.razon_social}</div>
                    </td>
                    <td>
                      <div className='secondary-text'>{e.ruc}</div>
                    </td>
                    <td>
                      <div className='contact-info'>
                        {e.email_contacto && (
                          <div
                            className='contact-item'
                            title='Email'
                          >
                            <Mail size={14} /> {e.email_contacto}
                          </div>
                        )}
                        {e.telefono_contacto && (
                          <div
                            className='contact-item'
                            title='Teléfono'
                          >
                            <Phone size={14} /> {e.telefono_contacto}
                          </div>
                        )}
                        {!e.email_contacto && !e.telefono_contacto && (
                          <span className='muted'>-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {e.direccion_fiscal ? (
                        <div
                          className='location-info'
                          title={`${e.direccion_fiscal} - ${e.distrito || ''}`}
                        >
                          <MapPin size={16} />
                          <span>
                            {e.direccion_fiscal.length > 25
                              ? `${e.direccion_fiscal.substring(0, 25)}...`
                              : e.direccion_fiscal}
                          </span>
                        </div>
                      ) : (
                        <span className='muted'>-</span>
                      )}
                    </td>
                    <td className='center'>
                      <span
                        className={`status-badge ${e.estado ? 'active' : 'inactive'}`}
                      >
                        {e.estado ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className='center'>
                      <div className='actions-cell'>
                        <button
                          className={`action-btn toggle ${e.estado ? 'danger' : 'success'}`}
                          onClick={() => handleToggleStatus(e)}
                          title={
                            e.estado ? 'Inactivar Empresa' : 'Activar Empresa'
                          }
                        >
                          {e.estado ? (
                            <ToggleRight size={20} />
                          ) : (
                            <ToggleLeft size={20} />
                          )}
                        </button>

                        <button
                          className='action-btn edit'
                          onClick={() => {
                            onEditEmpresa(e);
                            onClose();
                          }}
                          title='Editar Empresa'
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpresaListModal;
