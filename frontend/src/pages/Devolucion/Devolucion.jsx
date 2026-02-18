import { useEffect, useState, useRef } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import PdfModal from '../../components/Modal/PdfModal';
import Modal from '../../components/Modal/Modal';

import DevolucionForm from './DevolucionForm';
import DevolucionTable from './DevolucionTable';
import { generarPDFDevolucion } from '../../utils/pdfGeneratorDevolucion';

import { AlertTriangle, X, Check } from 'lucide-react';
import './Devolucion.scss';

const Devolucion = () => {
  const [allEquipos, setAllEquipos] = useState([]);
  const [allUsuarios, setAllUsuarios] = useState([]);
  const [estadosEquipos, setEstadosEquipos] = useState([]);

  const [usuariosConEquipo, setUsuariosConEquipo] = useState([]);
  const [mapaAsignaciones, setMapaAsignaciones] = useState({});
  const [historialVisual, setHistorialVisual] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [equipoDetectado, setEquipoDetectado] = useState(null);

  const fileInputRef = useRef(null);
  const [selectedMovimientoId, setSelectedMovimientoId] = useState(null);

  const [formData, setFormData] = useState({
    equipo_id: '',
    empleado_id: '',
    cargador: true,
    observaciones: '',
    estado_fisico_id: '',
    motivo: '',
  });

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [movimientoToInvalidar, setMovimientoToInvalidar] = useState(null);

  const fetchData = async () => {
    try {
      const [resEq, resUs, resHis, resEstados] = await Promise.all([
        api.get('/equipos'),
        api.get('/colaboradores'),
        api.get('/movimientos'),
        api.get('/equipos/estados'),
      ]);

      setAllEquipos(resEq.data);
      setAllUsuarios(resUs.data);
      setEstadosEquipos(resEstados.data);

      const sortedHistory = [...resHis.data].sort(
        (a, b) => new Date(a.fecha_movimiento) - new Date(b.fecha_movimiento),
      );

      const asignacionesTemp = {};
      sortedHistory.forEach((mov) => {
        if (mov.tipo === 'entrega') {
          asignacionesTemp[mov.empleado_id] = mov.equipo_id;
        } else if (mov.tipo === 'devolucion') {
          delete asignacionesTemp[mov.empleado_id];
        }
      });

      const usuariosList = [];
      const mapaCompleto = {};

      Object.keys(asignacionesTemp).forEach((userIdStr) => {
        const uId = parseInt(userIdStr);
        const eqId = asignacionesTemp[userIdStr];

        const usuario = resUs.data.find((u) => u.id === uId);
        const equipo = resEq.data.find((e) => e.id === eqId);

        if (usuario && equipo && usuario.estado) {
          usuariosList.push(usuario);
          mapaCompleto[uId] = equipo;
        }
      });

      setUsuariosConEquipo(usuariosList);
      setMapaAsignaciones(mapaCompleto);

      const ultimasDevoluciones = resHis.data
        .filter((h) => h.tipo === 'devolucion')
        .sort(
          (a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento),
        )
        .slice(0, 10);

      setHistorialVisual(ultimasDevoluciones);
    } catch (e) {
      console.error(e);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubirClick = (id) => {
    setSelectedMovimientoId(id);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedMovimientoId) return;

    const toastId = toast.loading('Subiendo...');
    const form = new FormData();
    form.append('pdf', file);

    try {
      await api.post(
        `/movimientos/${selectedMovimientoId}/subir-firmado`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      toast.update(toastId, {
        render: 'Guardado ✅',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
      });
      fetchData();
    } catch (err) {
      toast.update(toastId, {
        render: 'Error subida ❌',
        type: 'error',
        isLoading: false,
        autoClose: 2000,
      });
    }
    e.target.value = null;
  };

  const onInvalidarClick = (id) => {
    setMovimientoToInvalidar(id);
    setIsRejectModalOpen(true);
  };

  const handleInvalidar = async () => {
    try {
      await api.put(`/movimientos/${movimientoToInvalidar}/invalidar`);
      toast.info('Documento invalidado');
      setIsRejectModalOpen(false);
      fetchData();
    } catch (e) {
      toast.error('Error al invalidar');
    }
  };

  const getBackendUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

  const handleVerFirmado = (url) => {
    setPdfUrl(getBackendUrl(url));
    setShowPdfModal(true);
  };

  const handleUserChange = (selectedOption) => {
    const userId = selectedOption?.value;
    if (userId) {
      const eq = mapaAsignaciones[userId];
      if (eq) {
        setEquipoDetectado(eq);
        const operativoId =
          estadosEquipos.find((est) => est.nombre.toLowerCase() === 'operativo')
            ?.id || '';
        setFormData({
          ...formData,
          empleado_id: userId,
          equipo_id: eq.id,
          estado_fisico_id: operativoId,
          observaciones: '',
          motivo: '',
        });
      } else {
        toast.error('Error de sincronización de datos.');
      }
    } else {
      setEquipoDetectado(null);
      setFormData({
        ...formData,
        empleado_id: '',
        equipo_id: '',
        estado_fisico_id: '',
        observaciones: '',
        motivo: '',
      });
    }
  };

  const handleVerPdfHistorial = (item) => {
    const us = {
      nombres: item.empleado_nombre,
      apellidos: item.empleado_apellido,
      dni: item.dni || '---',
    };
    const eq = {
      marca: item.marca,
      modelo: item.modelo,
      serie: item.serie,
    };

    const url = generarPDFDevolucion(
      eq,
      us,
      item.cargador,
      item.observaciones,
      item.estado_equipo_momento,
      item.motivo,
    );
    setPdfUrl(url);
    setShowPdfModal(true);
  };

  const handleReenviarCorreo = async (item) => {
    if (!item.empleado_correo) {
      return toast.error(
        'Este colaborador no tiene correo registrado en el sistema.',
      );
    }

    const toastId = toast.loading('Reintentando envío de correo...');
    try {
      const us = {
        nombres: item.empleado_nombre,
        apellidos: item.empleado_apellido,
        dni: item.dni || '---',
      };
      const eq = { marca: item.marca, modelo: item.modelo, serie: item.serie };

      const pdfUrlBlob = generarPDFDevolucion(
        eq,
        us,
        item.cargador,
        item.observaciones,
        item.estado_equipo_momento,
        item.motivo,
      );
      const blob = await fetch(pdfUrlBlob).then((r) => r.blob());

      const form = new FormData();
      form.append('pdf', blob, 'Constancia_Devolucion.pdf');
      form.append('movimiento_id', item.id);
      form.append('destinatario', item.empleado_correo);
      form.append('nombreEmpleado', item.empleado_nombre);
      form.append('tipoEquipo', item.modelo);
      form.append('tipo_movimiento', 'devolucion');

      await api.post('/movimientos/reenviar-correo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.update(toastId, {
        render: '¡Correo reenviado con éxito!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      fetchData();
    } catch (e) {
      toast.update(toastId, {
        render: 'Volvió a fallar el envío.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleAction = async (tipoAccion) => {
    if (
      !formData.equipo_id ||
      !formData.empleado_id ||
      !formData.estado_fisico_id ||
      !formData.motivo
    ) {
      return toast.warning('Faltan datos por completar');
    }

    const us = allUsuarios.find((u) => u.id === formData.empleado_id);
    const eq = allEquipos.find((e) => e.id === formData.equipo_id);
    const estadoNombre =
      estadosEquipos.find((est) => est.id === formData.estado_fisico_id)
        ?.nombre || 'Desconocido';

    if (tipoAccion === 'EMAIL' && !us.email_contacto)
      return toast.error('Usuario sin correo registrado');

    const equipoParaPdf = { ...eq, serie: eq.numero_serie };
    const pdfUrlBlob = generarPDFDevolucion(
      equipoParaPdf,
      us,
      formData.cargador,
      formData.observaciones,
      estadoNombre,
      formData.motivo,
    );

    const blob = await fetch(pdfUrlBlob).then((r) => r.blob());

    try {
      if (tipoAccion === 'GUARDAR' || tipoAccion === 'WHATSAPP') {
        await api.post('/movimientos/devolucion', {
          ...formData,
          estado_final_nombre: estadoNombre,
          fecha: new Date().toISOString(),
        });
        toast.success('Devolución registrada');

        setPdfUrl(pdfUrlBlob);
        setShowPdfModal(true);

        if (tipoAccion === 'WHATSAPP') {
          const link = document.createElement('a');
          link.href = pdfUrlBlob;
          link.download = `Constancia_Devolucion_${us.nombres}.pdf`;
          link.click();

          const numero = us.telefono ? us.telefono.replace(/\D/g, '') : '';
          const msg = `Hola ${us.nombres}, adjunto constancia de devolución del equipo ${eq.modelo}.`;
          const waLink = numero
            ? `https://wa.me/51${numero}?text=${encodeURIComponent(msg)}`
            : `https://wa.me/?text=${encodeURIComponent(msg)}`;
          window.open(waLink, '_blank');
          toast.info('PDF Descargado. Arrástralo al chat.', {
            autoClose: 5000,
          });
        }
      } else if (tipoAccion === 'EMAIL') {
        const toastId = toast.loading('Enviando correo...');
        const form = new FormData();
        form.append('pdf', blob, 'Constancia_Devolucion.pdf');
        form.append('equipo_id', formData.equipo_id);
        form.append('empleado_id', formData.empleado_id);
        form.append('cargador', formData.cargador);
        form.append('observaciones', formData.observaciones);
        form.append('estado_fisico_id', formData.estado_fisico_id);
        form.append('estado_final_nombre', estadoNombre);
        form.append('motivo', formData.motivo); // <-- AÑADIDO
        form.append('destinatario', us.email_contacto);
        form.append('nombreEmpleado', us.nombres);
        form.append('tipoEquipo', eq.modelo);

        const res = await api.post('/movimientos/devolucion-con-correo', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data.warning) {
          toast.update(toastId, {
            render: 'Guardado, pero correo falló ⚠️',
            type: 'warning',
            isLoading: false,
            autoClose: 4000,
          });
        } else {
          toast.update(toastId, {
            render: '¡Enviado con éxito! ✅',
            type: 'success',
            isLoading: false,
            autoClose: 3000,
          });
        }
        setPdfUrl(pdfUrlBlob);
        setShowPdfModal(true);
      }

      setFormData({
        equipo_id: '',
        empleado_id: '',
        cargador: true,
        observaciones: '',
        estado_fisico_id: '',
        motivo: '',
      });
      setEquipoDetectado(null);
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Error procesando solicitud');
      toast.dismiss();
    }
  };

  if (loading) return <div className='loading-state'>Cargando sistema...</div>;

  const usuariosOptions = usuariosConEquipo.map((us) => ({
    value: us.id,
    label: `${us.nombres} ${us.apellidos}`,
  }));

  const estadosOptions = estadosEquipos.map((est) => ({
    value: est.id,
    label: est.nombre,
  }));

  return (
    <div className='devolucion-container'>
      <div className='page-header'>
        <h1>Registrar Devolución</h1>
      </div>

      <input
        type='file'
        ref={fileInputRef}
        className='hidden-input'
        accept='application/pdf'
        onChange={handleFileChange}
      />

      <div className='content-grid'>
        <DevolucionForm
          usuariosOptions={usuariosOptions}
          estadosOptions={estadosOptions}
          formData={formData}
          setFormData={setFormData}
          equipoDetectado={equipoDetectado}
          handleUserChange={handleUserChange}
          onAction={handleAction}
        />

        <DevolucionTable
          historial={historialVisual}
          onVerPdf={handleVerPdfHistorial}
          onVerFirmado={handleVerFirmado}
          onSubirClick={handleSubirClick}
          onInvalidar={onInvalidarClick}
          onReenviarCorreo={handleReenviarCorreo}
        />

        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title='Confirmar Rechazo'
        >
          <div className='confirm-modal-content'>
            <div className='warning-icon reject'>
              <AlertTriangle size={40} />
            </div>
            <h3>¿Rechazar firma del documento?</h3>
            <p>
              Esta acción invalidará el PDF firmado actualmente.
              <br />
              Deberás subir un nuevo archivo válido.
            </p>
            <div className='modal-actions'>
              <button
                className='btn-cancel'
                onClick={() => setIsRejectModalOpen(false)}
              >
                <X size={18} /> Cancelar
              </button>
              <button
                className='btn-confirm-reject'
                onClick={handleInvalidar}
              >
                <Check size={18} /> Confirmar Rechazo
              </button>
            </div>
          </div>
        </Modal>
      </div>

      <PdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        pdfUrl={pdfUrl}
        title='Constancia de Devolución'
      />
    </div>
  );
};

export default Devolucion;
