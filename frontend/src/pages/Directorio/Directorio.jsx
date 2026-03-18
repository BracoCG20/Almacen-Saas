import { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import {
  Plus,
  FileSpreadsheet,
  AlertTriangle,
  X,
  Check,
  HelpCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import Modal from '../../components/Modal/Modal';

import DirectorioStats from './DirectorioStats';
import DirectorioTable from './DirectorioTable';
import DirectorioForm from './DirectorioForm';
import DirectorioHistorial from './DirectorioHistorial';
import './Directorio.scss';

const Directorio = () => {
  // --- 1. ESTADOS DE DATOS ---
  // Guardo las listas principales: correos, personal, estadísticas de licencias y el historial de cambios.
  const [directorio, setDirectorio] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [estadisticas, setEstadisticas] = useState([]);
  const [historialAuditoria, setHistorialAuditoria] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- 2. ESTADOS DE CONTROL DE MODALES (FORMULARIOS) ---
  // Defino qué modal está abierto, en qué modo (ADD, EDIT, BAJA) y sobre qué registro actúo.
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('ADD');
  const [currentId, setCurrentId] = useState(null);

  // --- 3. ESTADOS DE HISTORIAL Y ALERTAS ---
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [confirmBajaOpen, setConfirmBajaOpen] = useState(false);

  // --- 4. ESTADO DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    colaborador_id: '',
    tipo_licencia: 'BUSINESS_STARTER',
    estado: true,
    datos_transferidos: false,
    colaborador_destino_id: '',
  });

  /**
   * TOUR GUIADO
   * Enseño al usuario rápidamente para qué sirve cada bloque de esta pantalla.
   */
  const startDirectorioTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      allowClose: true,
      overlayColor: 'rgba(15, 23, 42, 0.6)',
      steps: [
        {
          element: '#tour-dir-header',
          popover: {
            title: 'Directorio Workspace',
            description:
              'Aquí puedes asignar nuevas licencias o exportar el historial a Excel.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-dir-stats',
          popover: {
            title: 'Límites en Tiempo Real',
            description:
              'Observa cuántas licencias te quedan disponibles. Si llegas a 0, se bloquean nuevas asignaciones.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-dir-table',
          popover: {
            title: 'Control de Cuentas',
            description:
              'Revisa el estado de cada correo. Edita, da de baja o mira la auditoría de la cuenta.',
            side: 'top',
            align: 'start',
          },
        },
      ],
    });
    driverObj.drive();
  };

  /**
   * CARGA PRINCIPAL
   * Ejecuto las 4 consultas necesarias en paralelo para cargar la pantalla sin cuellos de botella.
   */
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

  /**
   * EXPORTAR A EXCEL
   * Limpio el formato del historial y lo convierto en un archivo descargable.
   */
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

  // --- CONTROLADORES DE APERTURA DE MODALES ---

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

  // Filtro el historial global para mostrar solo el del registro seleccionado
  const handleViewHistory = (registro) => {
    const historialFiltrado = historialAuditoria.filter(
      (h) => h.directorio_id === registro.id,
    );
    setSelectedHistory(historialFiltrado);
    setShowHistoryModal(true);
  };

  // --- LÓGICA DE NEGOCIO Y GUARDADO ---

  /**
   * REACTIVAR LICENCIA
   * Antes de reactivar, compruebo si tenemos espacio ("cupos") para ese tipo de licencia.
   */
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

  /**
   * VALIDACIÓN PREVIA AL GUARDADO
   * Determino si voy a lanzar una alerta de error (sin stock), un modal de confirmación (baja) o ejecutar directo.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.colaborador_id)
      return toast.warning('Selecciona un colaborador');

    // Valido disponibilidad si es una cuenta activa
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

    // Valido el flujo de baja de usuario
    if (modalMode === 'BAJA') {
      if (formData.datos_transferidos && !formData.colaborador_destino_id) {
        return toast.warning(
          'Selecciona a quién se le transfirieron los datos',
        );
      }
      setConfirmBajaOpen(true);
      return; // Detengo aquí para esperar confirmación del modal
    }

    executeSave();
  };

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
      <div
        className='page-header'
        id='tour-dir-header'
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1>Directorio</h1>
        </div>
        <div className='header-actions'>
          <button
            className='btn-tour'
            onClick={startDirectorioTour}
            title='Guía Rápida'
          >
            <HelpCircle size={18} />
          </button>
          <button
            className='btn-excel-header'
            onClick={exportarHistorialExcel}
            title='Exportar Auditoría'
          >
            <FileSpreadsheet size={16} /> <span>Exportar</span>
          </button>
          <button
            className='btn-add'
            onClick={openAddModal}
          >
            <Plus size={18} /> Asignar Licencia
          </button>
        </div>
      </div>

      <div id='tour-dir-stats'>
        <DirectorioStats estadisticas={estadisticas} />
      </div>

      <div id='tour-dir-table'>
        <DirectorioTable
          directorio={directorio}
          onEdit={openEditModal}
          onBaja={openBajaModal}
          onReactivar={handleReactivar}
          onViewHistory={handleViewHistory}
        />
      </div>

      {/* --- MODALES --- */}

      {/* Modal Principal: Add/Edit/Baja */}
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

      {/* Modal de Auditoría */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title='Auditoría de Licencia'
      >
        <DirectorioHistorial historyData={selectedHistory} />
      </Modal>

      {/* Modal de Confirmación Crítica (Baja) */}
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
