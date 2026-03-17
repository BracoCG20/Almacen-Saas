import { useEffect, useState, useRef } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import PdfModal from '../../components/Modal/PdfModal';
import Modal from '../../components/Modal/Modal';

import DevolucionForm from './DevolucionForm';
import DevolucionTable from './DevolucionTable';
import { generarPDFDevolucion } from '../../utils/pdfGeneratorDevolucion';

import { AlertTriangle, X, Check, HelpCircle } from 'lucide-react';
import { io } from 'socket.io-client';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './Devolucion.scss';

const Devolucion = () => {
  const [allEquipos, setAllEquipos] = useState([]);
  const [allUsuarios, setAllUsuarios] = useState([]);
  const [estadosEquipos, setEstadosEquipos] = useState([]);

  // Ahora guardará TODOS los equipos que tiene cada usuario (puede ser más de 1)
  const [usuariosConEquipos, setUsuariosConEquipos] = useState([]);
  const [mapaAsignacionesMutiples, setMapaAsignacionesMutiples] = useState({});
  const [historialVisual, setHistorialVisual] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  // Lista de equipos que tiene el usuario seleccionado actualmente
  const [equiposDetectados, setEquiposDetectados] = useState([]);

  const fileInputRef = useRef(null);
  const [selectedMovimientoId, setSelectedMovimientoId] = useState(null);

  // NUEVO STATE: Soporta un arreglo de devoluciones parciales
  const [formData, setFormData] = useState({
    empleado_id: '',
    motivo: '',
    equiposADevolver: [], // { equipo_id, cargador: true/false/null, estado_fisico_id, observaciones }
  });

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [movimientoToInvalidar, setMovimientoToInvalidar] = useState(null);

  const startDevolucionTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      steps: [
        {
          element: '#tour-devolucion-form',
          popover: {
            title: 'Formulario de Devolución',
            description:
              'Selecciona al colaborador; el sistema detectará todos los equipos que tiene. Marca solo los que va a devolver.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-devolucion-acciones',
          popover: {
            title: 'Generar Constancia',
            description:
              'Guarda la devolución para descargar el PDF, o envíalo por correo o WhatsApp.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-devolucion-tabla',
          popover: {
            title: 'Historial Reciente',
            description:
              'Aquí verás las últimas devoluciones y podrás subir las actas firmadas.',
            side: 'left',
            align: 'start',
          },
        },
      ],
    });
    driverObj.drive();
  };

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

      // Mapa para saber qué equipos tiene EXACTAMENTE cada usuario
      // formato: { 1: [2, 5], 3: [1] } -> Usuario 1 tiene equipos 2 y 5.
      const asignaciones = {};
      sortedHistory.forEach((mov) => {
        if (!asignaciones[mov.empleado_id])
          asignaciones[mov.empleado_id] = new Set();

        if (mov.tipo === 'entrega') {
          asignaciones[mov.empleado_id].add(mov.equipo_id);
        } else if (mov.tipo === 'devolucion') {
          asignaciones[mov.empleado_id].delete(mov.equipo_id);
        }
      });

      const usuariosList = [];
      const mapaCompleto = {};

      // Filtramos y llenamos
      Object.keys(asignaciones).forEach((userIdStr) => {
        const uId = parseInt(userIdStr);
        const eqIds = Array.from(asignaciones[userIdStr]);

        if (eqIds.length > 0) {
          const usuario = resUs.data.find((u) => u.id === uId);
          if (usuario && usuario.estado) {
            usuariosList.push(usuario);
            // Guardamos todos los objetos de equipo que tiene este usuario
            mapaCompleto[uId] = eqIds
              .map((id) => resEq.data.find((e) => e.id === id))
              .filter(Boolean);
          }
        }
      });

      setUsuariosConEquipos(usuariosList);
      setMapaAsignacionesMutiples(mapaCompleto);

      const ultimasDevoluciones = resHis.data
        .filter((h) => h.tipo === 'devolucion')
        .sort(
          (a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento),
        );

      setHistorialVisual(ultimasDevoluciones);
    } catch (e) {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetchData();
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:4000';
    const socket = io(baseUrl);

    socket.on('documento_firmado', () => {
      if (isMounted) {
        toast.info('Actualizando estados...', { icon: '📝' });
        fetchData();
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  const handleSubirClick = (id) => {
    setSelectedMovimientoId(id);
    fileInputRef.current.click();
  };
  const onInvalidarClick = (id) => {
    setMovimientoToInvalidar(id);
    setIsRejectModalOpen(true);
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
      : 'http://localhost:4000';
    return `${baseUrl}${url}`;
  };

  const handleVerFirmado = (url) => {
    setPdfUrl(getBackendUrl(url));
    setShowPdfModal(true);
  };

  const handleUserChange = (selectedOption) => {
    const userId = selectedOption?.value;
    if (userId) {
      const equipos = mapaAsignacionesMutiples[userId] || [];
      setEquiposDetectados(equipos);

      // Reseteamos el form con la lista vacía de devoluciones
      setFormData({
        empleado_id: userId,
        motivo: '',
        equiposADevolver: [],
      });
    } else {
      setEquiposDetectados([]);
      setFormData({ empleado_id: '', motivo: '', equiposADevolver: [] });
    }
  };

  const handleVerPdfHistorial = (item) => {
    const us = {
      nombres: item.empleado_nombre,
      apellidos: item.empleado_apellido,
      dni: item.dni || '---',
    };

    // Creamos arreglo para el PDF
    let equiposAImprimir = [];
    if (item.equipos_agrupados) {
      equiposAImprimir = item.equipos_agrupados.map((eq) => ({
        serie: eq.serie,
        marca: eq.marca,
        modelo: eq.modelo,
        cargador: eq.cargador,
        observaciones: eq.observaciones,
      }));
    } else {
      equiposAImprimir = [
        {
          serie: item.serie,
          marca: item.marca,
          modelo: item.modelo,
          cargador: item.cargador,
          observaciones: item.observaciones,
        },
      ];
    }

    const url = generarPDFDevolucion(equiposAImprimir, us, item.motivo);
    setPdfUrl(url);
    setShowPdfModal(true);
  };

  const handleReenviarCorreo = async (item) => {
    if (!item.empleado_correo)
      return toast.error('Colaborador sin correo registrado.');
    const toastId = toast.loading('Reintentando...');
    try {
      const us = {
        nombres: item.empleado_nombre,
        apellidos: item.empleado_apellido,
        dni: item.dni || '---',
      };

      let equiposAImprimir = [];
      if (item.equipos_agrupados) {
        equiposAImprimir = item.equipos_agrupados.map((eq) => ({
          serie: eq.serie,
          marca: eq.marca,
          modelo: eq.modelo,
          cargador: eq.cargador,
          observaciones: eq.observaciones,
        }));
      } else {
        equiposAImprimir = [
          {
            serie: item.serie,
            marca: item.marca,
            modelo: item.modelo,
            cargador: item.cargador,
            observaciones: item.observaciones,
          },
        ];
      }

      const pdfUrlBlob = generarPDFDevolucion(
        equiposAImprimir,
        us,
        item.motivo,
      );
      const blob = await fetch(pdfUrlBlob).then((r) => r.blob());

      const form = new FormData();
      form.append('pdf', blob, 'Constancia_Devolucion.pdf');
      form.append('movimiento_id', item.id);
      form.append('destinatario', item.empleado_correo);
      form.append('nombreEmpleado', item.empleado_nombre);
      form.append('tipoEquipo', 'Equipos Varios');
      form.append('tipo_movimiento', 'devolucion');

      await api.post('/movimientos/reenviar-correo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.update(toastId, {
        render: 'Reenviado con éxito!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
      fetchData();
    } catch (e) {
      toast.update(toastId, {
        render: 'Volvió a fallar.',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleAction = async (tipoAccion) => {
    if (
      !formData.empleado_id ||
      !formData.motivo ||
      formData.equiposADevolver.length === 0
    ) {
      return toast.warning(
        'Faltan datos o no has seleccionado ningún equipo para devolver',
      );
    }

    const us = allUsuarios.find((u) => u.id === formData.empleado_id);
    if (tipoAccion === 'EMAIL' && !us.email_contacto)
      return toast.error('Usuario sin correo');

    // Preparamos datos para el PDF (Solo los que marcó para devolver)
    const equiposParaPdf = formData.equiposADevolver.map((dev) => {
      const eqOriginal = equiposDetectados.find((e) => e.id === dev.equipo_id);
      return {
        ...eqOriginal,
        serie: eqOriginal.numero_serie,
        cargador: dev.cargador,
        observaciones: dev.observaciones,
      };
    });

    const pdfUrlBlob = generarPDFDevolucion(
      equiposParaPdf,
      us,
      formData.motivo,
    );
    const blob = await fetch(pdfUrlBlob).then((r) => r.blob());

    try {
      const payload = {
        empleado_id: formData.empleado_id,
        motivo: formData.motivo,
        fecha: new Date().toISOString(),
        equipos: formData.equiposADevolver,
      };

      if (tipoAccion === 'GUARDAR' || tipoAccion === 'WHATSAPP') {
        await api.post('/movimientos/devolucion', payload);
        toast.success('Devolución parcial/total registrada');
        setPdfUrl(pdfUrlBlob);
        setShowPdfModal(true);

        if (tipoAccion === 'WHATSAPP') {
          const link = document.createElement('a');
          link.href = pdfUrlBlob;
          link.download = `Constancia_Devolucion_${us.nombres}.pdf`;
          link.click();
          const numero = us.telefono ? us.telefono.replace(/\D/g, '') : '';
          const msg = `Hola ${us.nombres}, adjunto constancia de devolución de equipos.`;
          const waLink = numero
            ? `https://wa.me/51${numero}?text=${encodeURIComponent(msg)}`
            : `https://wa.me/?text=${encodeURIComponent(msg)}`;
          window.open(waLink, '_blank');
        }
      } else if (tipoAccion === 'EMAIL') {
        const toastId = toast.loading('Enviando correo...');
        const form = new FormData();
        form.append('pdf', blob, 'Constancia_Devolucion.pdf');
        form.append('payload', JSON.stringify(payload));
        form.append('destinatario', us.email_contacto);
        form.append('nombreEmpleado', us.nombres);

        const res = await api.post('/movimientos/devolucion-con-correo', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.warning)
          toast.update(toastId, {
            render: 'Guardado, correo falló ⚠️',
            type: 'warning',
            isLoading: false,
            autoClose: 4000,
          });
        else
          toast.update(toastId, {
            render: 'Enviado con éxito! ✅',
            type: 'success',
            isLoading: false,
            autoClose: 3000,
          });

        setPdfUrl(pdfUrlBlob);
        setShowPdfModal(true);
      }

      setFormData({ empleado_id: '', motivo: '', equiposADevolver: [] });
      setEquiposDetectados([]);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error procesando solicitud');
    }
  };

  if (loading)
    return <div className='loading-state'>Cargando devoluciones...</div>;

  const usuariosOptions = usuariosConEquipos.map((us) => ({
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
        <button
          onClick={startDevolucionTour}
          className='btn-tour-header'
        >
          <HelpCircle size={18} />
        </button>
      </div>
      <input
        type='file'
        ref={fileInputRef}
        className='hidden-input'
        accept='application/pdf'
        onChange={handleFileChange}
      />
      <div className='content-grid'>
        <div id='tour-devolucion-form'>
          <DevolucionForm
            usuariosOptions={usuariosOptions}
            estadosOptions={estadosOptions}
            formData={formData}
            setFormData={setFormData}
            equiposDetectados={equiposDetectados}
            handleUserChange={handleUserChange}
            onAction={handleAction}
          />
        </div>
        <div id='tour-devolucion-tabla'>
          <DevolucionTable
            historial={historialVisual}
            onVerPdf={handleVerPdfHistorial}
            onVerFirmado={handleVerFirmado}
            onSubirClick={handleSubirClick}
            onInvalidar={onInvalidarClick}
            onReenviarCorreo={handleReenviarCorreo}
          />
        </div>
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title='Confirmar Rechazo'
          maxWidth='400px'
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
