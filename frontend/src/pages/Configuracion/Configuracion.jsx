import { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import {
  Plus,
  List,
  Settings as SettingsIcon,
  Cloud,
  Save,
  X,
} from 'lucide-react';
import './Configuracion.scss';

import RegisterAdminModal from '../../components/RegisterAdminModal/RegisterAdminModal';
import UserListModal from '../../components/UserListModal/UserListModal';
import AddEmpresaModal from '../../components/AddEmpresaModal/AddEmpresaModal';
import EmpresaListModal from '../../components/EmpresaListModal/EmpresaListModal';

const Configuracion = () => {
  // --- 1. ESTADOS DE MODALES ---
  // Controlo la visibilidad de las ventanas flotantes para crear o listar entidades.
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [showEmpresaList, setShowEmpresaList] = useState(false);
  const [showLicensesModal, setShowLicensesModal] = useState(false);

  // --- 2. ESTADOS DE DATOS ---
  const [empresaToEdit, setEmpresaToEdit] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para visualizar y editar las licencias de Google Workspace
  const [licenciasStarter, setLicenciasStarter] = useState(0);
  const [licenciasStandard, setLicenciasStandard] = useState(0);
  const [editStarter, setEditStarter] = useState('');
  const [editStandard, setEditStandard] = useState('');

  // Identifico si tengo permisos máximos en el sistema
  const isSuperAdmin = userRole === 1;

  /**
   * CARGA INICIAL
   * Verifico mi rol actual y, si tengo permisos, traigo la configuración global
   * (como los límites de licencias) desde la base de datos.
   */
  useEffect(() => {
    const fetchConfiguracionGlobal = async () => {
      try {
        const resPerfil = await api.get('/auth/perfil');
        setUserRole(Number(resPerfil.data.rol_id));

        const resConfig = await api.get('/configuracion');
        if (resConfig.data) {
          setLicenciasStarter(resConfig.data.starter || 0);
          setLicenciasStandard(resConfig.data.standard || 0);
          setEditStarter(resConfig.data.starter || 0);
          setEditStandard(resConfig.data.standard || 0);
        }
      } catch (error) {
        console.error('Error cargando configuración', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfiguracionGlobal();
  }, []);

  /**
   * ACTUALIZAR LICENCIAS
   * Envío los nuevos límites de licencias de Google al backend y actualizo la UI.
   */
  const handleSaveLicenses = async (e) => {
    e.preventDefault();

    if (editStarter === '' || editStandard === '') {
      return toast.warning('Debes llenar ambos campos.');
    }

    try {
      await api.put('/configuracion/licencias', {
        starter: Number(editStarter),
        standard: Number(editStandard),
      });

      setLicenciasStarter(Number(editStarter));
      setLicenciasStandard(Number(editStandard));
      setShowLicensesModal(false);
      toast.success(
        'Límites de licencias actualizados. El Directorio se sincronizará automáticamente.',
      );
    } catch (error) {
      toast.error('Error al guardar en el servidor');
    }
  };

  // --- RENDERIZADO CONDICIONAL ---

  if (loading)
    return <div className='loading-state'>Cargando configuración...</div>;

  // Bloqueo de seguridad: Si no soy SuperAdmin, muestro pantalla de acceso denegado.
  if (!isSuperAdmin) {
    return (
      <div className='config-container restricted'>
        <SettingsIcon
          size={60}
          className='icon-restricted'
        />
        <h2>Área Restringida</h2>
        <p>
          Solo los administradores del sistema pueden gestionar la configuración
          global.
        </p>
      </div>
    );
  }

  return (
    <div className='config-container'>
      <div className='page-header'>
        <h1>Configuración del Sistema</h1>
        <span>Administra las empresas, los accesos y los recursos clave.</span>
      </div>

      <div className='config-cards-grid'>
        {/* BLOQUE EMPRESAS */}
        <div className='admin-card'>
          <div className='card-content'>
            <h2>Gestión de Empresas</h2>
            <p>Administra las razones sociales y sedes de la compañía.</p>
          </div>
          <div className='card-actions'>
            <button
              className='btn-main indigo-light'
              onClick={() => setShowEmpresaList(true)}
            >
              <List size={16} /> Ver Lista
            </button>
            <button
              className='btn-main indigo'
              onClick={() => {
                setEmpresaToEdit(null);
                setShowEmpresaModal(true);
              }}
            >
              <Plus size={16} /> Nueva
            </button>
          </div>
        </div>

        {/* BLOQUE USUARIOS */}
        <div className='admin-card'>
          <div className='card-content'>
            <h2>Control de Accesos</h2>
            <p>Crea y gestiona las credenciales de acceso al dashboard.</p>
          </div>
          <div className='card-actions'>
            <button
              className='btn-main indigo-light'
              onClick={() => setShowUserList(true)}
            >
              <List size={16} /> Ver Accesos
            </button>
            <button
              className='btn-main green'
              onClick={() => setShowUserModal(true)}
            >
              <Plus size={16} /> Crear Login
            </button>
          </div>
        </div>

        {/* BLOQUE LICENCIAS GOOGLE */}
        <div className='admin-card'>
          <div className='card-content'>
            <h2>Google Workspace</h2>
            <p>
              Controla el límite máximo de licencias pagadas. Esto afecta los
              cálculos del Directorio.
            </p>

            <div className='license-stats-dual'>
              <div className='stat-row'>
                <Cloud
                  size={16}
                  className='icon-cloud'
                />
                <span className='type-label'>Business Starter:</span>
                <strong className='limit-value'>
                  {licenciasStarter} Adquiridas
                </strong>
              </div>
              <div className='stat-row'>
                <Cloud
                  size={16}
                  className='icon-cloud'
                />
                <span className='type-label'>Business Standard:</span>
                <strong className='limit-value'>
                  {licenciasStandard} Adquiridas
                </strong>
              </div>
            </div>
          </div>
          <div className='card-actions'>
            <button
              className='btn-main indigo'
              onClick={() => setShowLicensesModal(true)}
              style={{ width: '100%' }}
            >
              <SettingsIcon size={16} /> Ajustar Límites de Licencias
            </button>
          </div>
        </div>
      </div>

      {/* --- MODALES RENDERIZADOS FUERA DEL GRID --- */}

      {showUserModal && (
        <RegisterAdminModal onClose={() => setShowUserModal(false)} />
      )}
      {showUserList && <UserListModal onClose={() => setShowUserList(false)} />}

      {showEmpresaModal && (
        <AddEmpresaModal
          empresaToEdit={empresaToEdit}
          onClose={() => setShowEmpresaModal(false)}
          onSuccess={() => {
            setEmpresaToEdit(null);
            setShowEmpresaModal(false);
          }}
        />
      )}

      {showEmpresaList && (
        <EmpresaListModal
          onClose={() => setShowEmpresaList(false)}
          onEditEmpresa={(empresa) => {
            setEmpresaToEdit(empresa);
            setShowEmpresaModal(true);
          }}
        />
      )}

      {/* MODAL PARA EDITAR LICENCIAS */}
      {showLicensesModal && (
        <div
          className='config-modal-overlay'
          onClick={() => setShowLicensesModal(false)}
        >
          <div
            className='config-modal-content'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='modal-header'>
              <h2>
                <Cloud size={20} /> Ajustar Licencias
              </h2>
              <button
                className='btn-close'
                onClick={() => setShowLicensesModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveLicenses}>
              <div className='input-group'>
                <label>Límite Business Starter</label>
                <input
                  type='number'
                  required
                  min='0'
                  value={editStarter}
                  onChange={(e) => setEditStarter(e.target.value)}
                  placeholder='Cantidad...'
                />
              </div>

              <div className='input-group'>
                <label>Límite Business Standard</label>
                <input
                  type='number'
                  required
                  min='0'
                  value={editStandard}
                  onChange={(e) => setEditStandard(e.target.value)}
                  placeholder='Cantidad...'
                />
              </div>

              <div className='modal-actions'>
                <button
                  type='button'
                  className='btn-cancel'
                  onClick={() => setShowLicensesModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type='submit'
                  className='btn-confirm'
                >
                  <Save size={16} /> Guardar en Servidor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracion;
