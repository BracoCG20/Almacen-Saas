import { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import { Plus, FileSpreadsheet, AlertTriangle, X, Check } from 'lucide-react'; // <-- Agregamos iconos
import * as XLSX from 'xlsx';
import Modal from '../../components/Modal/Modal';

import DirectorioStats from './DirectorioStats';
import DirectorioTable from './DirectorioTable';
import DirectorioForm from './DirectorioForm';
import DirectorioHistorial from './DirectorioHistorial';
import './Directorio.scss';

const Directorio = () => {
  const [directorio, setDirectorio] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [historialAuditoria, setHistorialAuditoria] = useState([]);

  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD');
  const [currentId, setCurrentId] = useState(null);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);

  // --- NUEVO ESTADO PARA LA ALERTA DE CONFIRMACIÓN ---
  const [confirmBajaOpen, setConfirmBajaOpen] = useState(false);

  const [formData, setFormData] = useState({
    colaborador_id: '',
    tipo_licencia: 'BUSINESS_STARTER',
    estado: true,
    datos_transferidos: false,
    colaborador_destino_id: '',
  });

  const fetchData = async () => {
    try {
      const [resDir, resCol, resStats, resHist] = await Promise.all([
        api.get('/directorio'),
        api.get('/colaboradores'),
        api.get('/directorio/estadisticas'),
        api.get('/directorio/historial'),
      ]);
      setDirectorio(resDir.data);
      setColaboradores(resCol.data);
      setEstadisticas(resStats.data);
      setHistorialAuditoria(resHist.data);
    } catch (error) {
      toast.error('Error al cargar datos del directorio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const exportarHistorialExcel = () => {
    if (historialAuditoria.length === 0)
      return toast.info('No hay historial para exportar.');
    const data = historialAuditoria.map((h) => ({
      'Fecha Registro': new Date(h.fecha_registro).toLocaleString('es-PE'),
      Acción: h.accion,
      Licencia: h.tipo_licencia,
      'Colaborador Afectado': `${h.col_nombres} ${h.col_apellidos}`,
      Detalles: h.detalles,
      'Transferido A':
        h.datos_transferidos && h.dest_nombres
          ? `${h.dest_nombres} ${h.dest_apellidos}`
          : 'No aplica',
      'Responsable (Usuario)': h.resp_nombres
        ? `${h.resp_nombres} ${h.resp_apellidos}`
        : 'Sistema',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');
    XLSX.writeFile(wb, 'Historial_Directorio.xlsx');
    toast.success('Excel generado correctamente');
  };

  const openAddModal = () => {
    setModalMode('ADD');
    setFormData({
      colaborador_id: '',
      tipo_licencia: 'BUSINESS_STARTER',
      estado: true,
      datos_transferidos: false,
      colaborador_destino_id: '',
    });
    setModalOpen(true);
  };
  const openEditModal = (registro) => {
    setModalMode('EDIT');
    setCurrentId(registro.id);
    setFormData({
      colaborador_id: registro.colaborador_id,
      tipo_licencia: registro.tipo_licencia,
      estado: registro.estado,
      datos_transferidos: registro.datos_transferidos || false,
      colaborador_destino_id: registro.colaborador_destino_id || '',
    });
    setModalOpen(true);
  };
  const openBajaModal = (registro) => {
    setModalMode('BAJA');
    setCurrentId(registro.id);
    setFormData({
      colaborador_id: registro.colaborador_id,
      tipo_licencia: registro.tipo_licencia,
      estado: false,
      datos_transferidos: registro.datos_transferidos || false,
      colaborador_destino_id: registro.colaborador_destino_id || '',
    });
    setModalOpen(true);
  };

  const handleViewHistory = (registro) => {
    const historialFiltrado = historialAuditoria.filter(
      (h) => h.directorio_id === registro.id,
    );
    setSelectedHistory(historialFiltrado);
    setShowHistoryModal(true);
  };

  const handleReactivar = async (registro) => {
    const statsLicencia = estadisticas.find(
      (s) => s.tipo_licencia === registro.tipo_licencia,
    );
    if (statsLicencia && statsLicencia.disponibles <= 0) {
      return toast.error(
        `No te quedan licencias disponibles de tipo ${registro.tipo_licencia} para reactivar.`,
      );
    }
    try {
      await api.put(`/directorio/${registro.id}`, {
        ...registro,
        estado: true,
        datos_transferidos: false,
        colaborador_destino_id: null,
      });
      toast.success('Licencia reactivada correctamente');
      fetchData();
    } catch (error) {
      toast.error('Error al reactivar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.colaborador_id)
      return toast.warning('Selecciona un colaborador');

    if ((modalMode === 'ADD' || modalMode === 'EDIT') && formData.estado) {
      const statsLicencia = estadisticas.find(
        (s) => s.tipo_licencia === formData.tipo_licencia,
      );
      if (statsLicencia && statsLicencia.disponibles <= 0) {
        return toast.error(
          `No te quedan licencias disponibles de tipo ${formData.tipo_licencia}.`,
        );
      }
    }

    // Si es BAJA, interceptamos aquí y abrimos la alerta de confirmación
    if (modalMode === 'BAJA') {
      if (formData.datos_transferidos && !formData.colaborador_destino_id) {
        return toast.warning(
          'Selecciona a quién se le transfirieron los datos',
        );
      }
      setConfirmBajaOpen(true); // <-- Abre la alerta final
      return;
    }

    // Si es ADD o EDIT se ejecuta normal
    executeSave();
  };

  // Función normal para ADD y EDIT
  const executeSave = async () => {
    try {
      if (modalMode === 'ADD') {
        await api.post('/directorio', formData);
        toast.success('Licencia asignada exitosamente');
      } else {
        await api.put(`/directorio/${currentId}`, formData);
        toast.success('Licencia actualizada');
      }
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Ocurrió un error al guardar');
    }
  };

  // --- NUEVA FUNCIÓN: Ejecuta la BAJA tras confirmar ---
  const executeBaja = async () => {
    try {
      await api.put(`/directorio/${currentId}`, formData);
      toast.success('Servicio dado de baja correctamente');
      setConfirmBajaOpen(false);
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(
        error.response?.data?.error || 'Ocurrió un error al dar de baja',
      );
    }
  };

  if (loading)
    return <div className='loading-state'>Cargando Directorio...</div>;

  return (
    <div className='directorio-container'>
      <div className='page-header'>
        <h1>Directorio Workspace</h1>
        <div className='header-actions'>
          <button
            className='btn-excel-header'
            onClick={exportarHistorialExcel}
            title='Exportar Auditoría'
          >
            <FileSpreadsheet size={16} /> <span>Exportar Historial</span>
          </button>
          <button
            className='btn-add'
            onClick={openAddModal}
          >
            <Plus size={18} /> Asignar Licencia
          </button>
        </div>
      </div>

      <DirectorioStats estadisticas={estadisticas} />

      <DirectorioTable
        directorio={directorio}
        onEdit={openEditModal}
        onBaja={openBajaModal}
        onReactivar={handleReactivar}
        onViewHistory={handleViewHistory}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalMode === 'ADD'
            ? 'Asignar Licencia'
            : modalMode === 'EDIT'
              ? 'Editar Licencia'
              : 'Dar de Baja'
        }
      >
        <DirectorioForm
          formData={formData}
          setFormData={setFormData}
          colaboradores={colaboradores}
          directorio={directorio}
          modalMode={modalMode}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title='Auditoría de Licencia'
      >
        <DirectorioHistorial historyData={selectedHistory} />
      </Modal>

      {/* --- NUEVO MODAL DE CONFIRMACIÓN DE BAJA --- */}
      <Modal
        isOpen={confirmBajaOpen}
        onClose={() => setConfirmBajaOpen(false)}
        title=''
        maxWidth='400px'
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon reject'>
            <AlertTriangle size={40} />
          </div>
          <h3>¿Estás seguro?</h3>
          <p>
            Esta acción suspenderá la cuenta de Workspace y{' '}
            <strong>desactivará automáticamente</strong> a este empleado en el
            registro general de colaboradores.
          </p>
          <div className='modal-actions'>
            <button
              className='btn-cancel'
              onClick={() => setConfirmBajaOpen(false)}
            >
              <X size={18} /> Cancelar
            </button>
            <button
              className='btn-confirm-reject'
              onClick={executeBaja}
            >
              <Check size={18} /> Sí, dar de baja
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Directorio;
