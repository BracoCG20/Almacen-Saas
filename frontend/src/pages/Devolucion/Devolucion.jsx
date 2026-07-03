//frontend/src/pages/Devolucion/Devolucion.jsx
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
  // 1. ESTADOS GLOBALES DE CATÁLOGOS
  // Aquí guardo toda la data cruda que viene de la base de datos para no hacer peticiones a cada rato.
  const [allEquipos, setAllEquipos] = useState([]);
  const [allUsuarios, setAllUsuarios] = useState([]);
  const [estadosEquipos, setEstadosEquipos] = useState([]);

  // 2. ESTADOS DE LÓGICA DE NEGOCIO (DEVOLUCIONES PARCIALES)
  // usuariosConEquipos: Filtro a los usuarios para mostrar SOLAMENTE a los que tienen al menos 1 equipo en su poder.
  const [usuariosConEquipos, setUsuariosConEquipos] = useState([]);
  // mapaAsignacionesMutiples: Mi "diccionario" secreto. Relaciona el ID del usuario con todos los objetos de equipo que tiene actualmente.
  const [mapaAsignacionesMutiples, setMapaAsignacionesMutiples] = useState({});
  // historialVisual: Lo que mando a la tabla para que se pinte.
  const [historialVisual, setHistorialVisual] = useState([]);

  // 3. ESTADOS DE UI Y CONTROL
  const [loading, setLoading] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  // equiposDetectados: Cuando seleccionas un usuario en el form, meto aquí sus equipos para que el form los pinte como checkboxes.
  const [equiposDetectados, setEquiposDetectados] = useState([]);

  const fileInputRef = useRef(null);
  const [selectedMovimientoId, setSelectedMovimientoId] = useState(null);

  // 4. ESTADO DEL FORMULARIO PRINCIPAL
  // Estructuré este estado para soportar la devolución de múltiples equipos a la vez.
  const [formData, setFormData] = useState({
    empleado_id: '',
    motivo: '',
    equiposADevolver: [], // Aquí guardaré objetos: { equipo_id, cargador, estado_fisico_id, observaciones }
  });

  // 5. ESTADOS PARA INVALIDAR FIRMAS
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [movimientoToInvalidar, setMovimientoToInvalidar] = useState(null);

  /**
   * TOUR GUIADO
   * Configuro driver.js para enseñarle al usuario nuevo cómo usar esta pantalla.
   */
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

  /**
   * CARGA Y CÁLCULO DE DATOS CORE
   * Esta función es el corazón de la vista. Trae los datos y deduce quién tiene qué.
   */
  const fetchData = async () => {
    try {
      // Hago todas las peticiones en paralelo para que la página cargue rapidísimo
      const [resEq, resUs, resHis, resEstados] = await Promise.all([
        api.get('/equipos'),
        api.get('/colaboradores'),
        api.get('/movimientos'),
        api.get('/equipos/estados'),
      ]);

      setAllEquipos(resEq.data);
      setAllUsuarios(resUs.data);
      setEstadosEquipos(resEstados.data);

      // Ordeno el historial del más antiguo al más nuevo para reconstruir la línea de tiempo
      const sortedHistory = [...resHis.data].sort(
        (a, b) => new Date(a.fecha_movimiento) - new Date(b.fecha_movimiento),
      );

      // LÓGICA DE DEDUCCIÓN DE INVENTARIO:
      // Recorro la historia. Si es entrega, le anoto el equipo al usuario. Si es devolución, se lo borro.
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

      // Ahora que sé qué equipos tiene cada quien, armo las listas finales para los Selects
      Object.keys(asignaciones).forEach((userIdStr) => {
        const uId = parseInt(userIdStr);
        const eqIds = Array.from(asignaciones[userIdStr]);

        if (eqIds.length > 0) {
          const usuario = resUs.data.find((u) => u.id === uId);
          if (usuario && usuario.estado) {
            usuariosList.push(usuario);
            // Guardo el objeto completo del equipo para poder leer su categoría, marca, etc. después
            mapaCompleto[uId] = eqIds
              .map((id) => resEq.data.find((e) => e.id === id))
              .filter(Boolean);
          }
        }
      });

      setUsuariosConEquipos(usuariosList);
      setMapaAsignacionesMutiples(mapaCompleto);

      // Separo solo las devoluciones para mandarlas a la tabla inferior
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

  /**
   * EFECTO DE MONTAJE Y WEBSOCKETS
   * Al cargar la pantalla, traigo los datos. Y me suscribo al socket para refrescar
   * la tabla en tiempo real si el usuario firma el PDF desde su celular.
   */
  useEffect(() => {
    let isMounted = true;
    fetchData();

    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:4000';
    const socket = io(baseUrl);

    socket.on('documento_firmado', () => {
      if (isMounted) {
        toast.info('Actualizando estados de firma...', { icon: '📝' });
        fetchData();
      }
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, []);

  // --- MÉTODOS PARA SUBIR E INVALIDAR PDFs FIRMADOS FÍSICAMENTE ---
  const handleSubirClick = (id) => {
    setSelectedMovimientoId(id);
    fileInputRef.current.click(); // Simulo un clic en el input invisible
  };

  const onInvalidarClick = (id) => {
    setMovimientoToInvalidar(id);
    setIsRejectModalOpen(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedMovimientoId) return;

    const toastId = toast.loading('Subiendo constancia...');
    const form = new FormData();
    form.append('pdf', file);

    try {
      await api.post(
        `/movimientos/${selectedMovimientoId}/subir-firmado`,
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      toast.update(toastId, {
        render: 'Guardado ✅',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
      });
      fetchData(); // Refresco para que la tabla muestre el check verde
    } catch (err) {
      toast.update(toastId, {
        render: 'Error al subir ❌',
        type: 'error',
        isLoading: false,
        autoClose: 2000,
      });
    }
    e.target.value = null; // Reseteo el input para que pueda subir otro igual después
  };

  const handleInvalidar = async () => {
    try {
      await api.put(`/movimientos/${movimientoToInvalidar}/invalidar`);
      toast.info('Documento invalidado. Se requiere nueva firma.');
      setIsRejectModalOpen(false);
      fetchData();
    } catch (e) {
      toast.error('Error al invalidar documento');
    }
  };

  // Helper para armar la URL correcta del PDF si está en Cloudinary o en local
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

  /**
   * MANEJADOR CUANDO SE SELECCIONA UN USUARIO EN EL FORMULARIO
   * Aquí leo el "diccionario" y le inyecto al Form la lista de equipos que ese usuario tiene pendientes por devolver.
   */
  const handleUserChange = (selectedOption) => {
    const userId = selectedOption?.value;
    if (userId) {
      const equipos = mapaAsignacionesMutiples[userId] || [];
      setEquiposDetectados(equipos);

      // Limpio el estado de los equipos a devolver por si cambió de usuario a mitad de camino
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

  /**
   * VISUALIZACIÓN DE ACTA ORIGINAL DESDE LA TABLA
   * Extrae los equipos agrupados de la transacción y se los manda al generador PDF.
   */
  const handleVerPdfHistorial = (item) => {
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

    const url = generarPDFDevolucion(equiposAImprimir, us, item.motivo);
    setPdfUrl(url);
    setShowPdfModal(true);
  };

  /**
   * REENVÍO DE CORREO EN CASO DE FALLO
   */
  const handleReenviarCorreo = async (item) => {
    if (!item.empleado_correo)
      return toast.error('Colaborador sin correo registrado.');

    const toastId = toast.loading('Reintentando envío...');
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
        render: '¡Reenviado con éxito!',
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

  /**
   * FUNCIÓN MAESTRA DE ACCIÓN (GUARDAR, EMAIL, WHATSAPP)
   * Toma los equipos seleccionados, genera el PDF final y se comunica con el Backend.
   */
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
      return toast.error('El colaborador no tiene correo registrado');

    // 1. Uno la información base del equipo detectado con los campos llenados por el usuario (estado, cargador, observaciones)
    const equiposParaPdf = formData.equiposADevolver.map((dev) => {
      const eqOriginal = equiposDetectados.find((e) => e.id === dev.equipo_id);
      return {
        ...eqOriginal,
        serie: eqOriginal.numero_serie,
        cargador: dev.cargador,
        observaciones: dev.observaciones,
      };
    });

    // 2. Genero el PDF en memoria (Blob)
    const pdfUrlBlob = generarPDFDevolucion(
      equiposParaPdf,
      us,
      formData.motivo,
    );
    const blob = await fetch(pdfUrlBlob).then((r) => r.blob());

    try {
      // 3. Preparo el paquete (Payload) para el backend
      const payload = {
        empleado_id: formData.empleado_id,
        motivo: formData.motivo,
        fecha: new Date().toISOString(),
        equipos: formData.equiposADevolver,
      };

      if (tipoAccion === 'GUARDAR' || tipoAccion === 'WHATSAPP') {
        // Mando la petición simple de registro
        await api.post('/movimientos/devolucion', payload);
        toast.success('Devolución registrada correctamente');

        // Muestro el PDF en pantalla
        setPdfUrl(pdfUrlBlob);
        setShowPdfModal(true);

        if (tipoAccion === 'WHATSAPP') {
          // Descargo el PDF automáticamente para que el admin lo pueda arrastrar al chat
          const link = document.createElement('a');
          link.href = pdfUrlBlob;
          link.download = `Constancia_Devolucion_${us.nombres}.pdf`;
          link.click();

          const numero = us.telefono ? us.telefono.replace(/\D/g, '') : '';
          const msg = `Hola ${us.nombres}, te hago entrega de la constancia de devolución de equipos.`;
          const waLink = numero
            ? `https://wa.me/51${numero}?text=${encodeURIComponent(msg)}`
            : `https://wa.me/?text=${encodeURIComponent(msg)}`;
          window.open(waLink, '_blank');
        }
      } else if (tipoAccion === 'EMAIL') {
        // Si es correo, mando el PDF como archivo adjunto (FormData) junto con el JSON como string
        const toastId = toast.loading('Guardando y enviando correo...');
        const form = new FormData();
        form.append('pdf', blob, 'Constancia_Devolucion.pdf');
        form.append('payload', JSON.stringify(payload));
        form.append('destinatario', us.email_contacto);
        form.append('nombreEmpleado', us.nombres);

        const res = await api.post('/movimientos/devolucion-con-correo', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data.warning) {
          toast.update(toastId, {
            render: 'Guardado, pero falló el correo ⚠️',
            type: 'warning',
            isLoading: false,
            autoClose: 4000,
          });
        } else {
          toast.update(toastId, {
            render: '¡Guardado y Enviado! ✅',
            type: 'success',
            isLoading: false,
            autoClose: 3000,
          });
        }

        setPdfUrl(pdfUrlBlob);
        setShowPdfModal(true);
      }

      // 4. Limpio el formulario para la siguiente devolución
      setFormData({ empleado_id: '', motivo: '', equiposADevolver: [] });
      setEquiposDetectados([]);
      fetchData(); // Refresco inventario visual
    } catch (e) {
      toast.error(e.response?.data?.error || 'Error procesando la solicitud');
    }
  };

  if (loading)
    return <div className='loading-state'>Cargando devoluciones...</div>;

  // Formateo de opciones para los React-Select
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

        {/* MODAL DE CONFIRMACIÓN PARA RECHAZAR FIRMAS INCOMPLETAS O ERRÓNEAS */}
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
              Deberás subir un nuevo archivo escaneado.
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

      {/* MODAL PREVISUALIZADOR DE PDF */}
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
