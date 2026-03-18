import { useEffect, useState, useRef } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import PdfModal from '../../components/Modal/PdfModal';
import Modal from '../../components/Modal/Modal';

import EntregaForm from './EntregaForm';
import EntregaTable from './EntregaTable';
import { generarPDFBlob } from '../../utils/pdfGeneratorAsignacion';

import { io } from 'socket.io-client';
import { AlertTriangle, X, Check, HelpCircle } from 'lucide-react';

import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import './Asignacion.scss';

const Asignacion = () => {
  // --- 1. ESTADOS DE DATOS (CATÁLOGOS E HISTORIAL) ---
  // Aquí guardo los equipos disponibles, usuarios que aún no tienen equipos y el historial general.
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [usuariosLibres, setUsuariosLibres] = useState([]);
  const [historialVisual, setHistorialVisual] = useState([]);

  // --- 2. ESTADOS DE INTERFAZ Y MODALES ---
  const [loading, setLoading] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // --- 3. ESTADOS DE CONTROL DE OPERACIONES ---
  const [movimientoToInvalidar, setMovimientoToInvalidar] = useState(null);
  const [selectedMovimientoId, setSelectedMovimientoId] = useState(null);
  const fileInputRef = useRef(null);

  // --- 4. ESTADO DEL FORMULARIO ---
  // Lo preparo desde el inicio para soportar múltiples equipos mediante un arreglo.
  const [formData, setFormData] = useState({
    empleado_id: '',
    equipos: [{ equipo_id: '', cargador: true }],
    observaciones: '',
  });

  /**
   * TOUR GUIADO DE LA PANTALLA
   * Utilizo driver.js para mostrar a los usuarios nuevos cómo funciona el módulo.
   */
  const startAsignacionTour = () => {
    const driverObj = driver({
      showProgress: true,
      nextBtnText: 'Siguiente &rarr;',
      prevBtnText: '&larr; Anterior',
      doneBtnText: '¡Entendido!',
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      steps: [
        {
          element: '#tour-asignacion-form',
          popover: {
            title: 'Formulario de Entrega',
            description:
              'Selecciona el equipo disponible y el colaborador al que se lo asignarás.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-asignacion-acciones',
          popover: {
            title: 'Generar Acta',
            description:
              'Guarda y descarga el PDF, envíalo por Email o WhatsApp.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '#tour-asignacion-tabla',
          popover: {
            title: 'Historial Reciente',
            description: 'Aquí aparecerán las últimas entregas realizadas.',
            side: 'left',
            align: 'start',
          },
        },
      ],
    });
    driverObj.drive();
  };

  /**
   * CARGA PRINCIPAL DE DATOS
   * Traigo los catálogos en paralelo. Además, deduzco qué usuarios están "ocupados"
   * revisando el historial, para mostrar en el select únicamente a los que están libres.
   */
  const fetchData = async () => {
    try {
      const [resEquipos, resColaboradores, resMovimientos] = await Promise.all([
        api.get('/equipos'),
        api.get('/colaboradores'),
        api.get('/movimientos'),
      ]);

      setEquiposDisponibles(
        resEquipos.data.filter((e) => e.disponible === true),
      );

      const ocupados = new Set();
      resMovimientos.data
        .sort(
          (a, b) => new Date(a.fecha_movimiento) - new Date(b.fecha_movimiento),
        )
        .forEach((m) =>
          m.tipo === 'entrega'
            ? ocupados.add(m.empleado_id)
            : ocupados.delete(m.empleado_id),
        );

      setUsuariosLibres(
        resColaboradores.data.filter(
          (u) => u.estado === true && !ocupados.has(u.id),
        ),
      );

      // Filtro solo las entregas y se las mando enteras a la tabla (ella se encarga de la paginación)
      const entregas = resMovimientos.data
        .filter((h) => h.tipo === 'entrega')
        .sort(
          (a, b) => new Date(b.fecha_movimiento) - new Date(a.fecha_movimiento),
        );

      setHistorialVisual(entregas);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * EFECTO DE MONTAJE Y WEBSOCKET
   * Cargo los datos iniciales y me conecto al socket para enterarme en tiempo real
   * cuando un trabajador firma su acta desde el correo.
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
      socket.off('documento_firmado');
      socket.disconnect();
    };
  }, []);

  /**
   * ACCIONES DE TABLA: SUBIR ACTA FÍSICA E INVALIDAR
   */
  const handleSubirClick = (id) => {
    setSelectedMovimientoId(id);
    fileInputRef.current.click(); // Simulo click en el input oculto
  };

  const onInvalidarClick = (id) => {
    setMovimientoToInvalidar(id);
    setIsRejectModalOpen(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedMovimientoId) return;

    const toastId = toast.loading('Subiendo archivo...');
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
      fetchData();
    } catch (err) {
      toast.update(toastId, {
        render: 'Error al subir ❌',
        type: 'error',
        isLoading: false,
        autoClose: 2000,
      });
    }
    e.target.value = null; // Limpio el input por si subo el mismo archivo otra vez
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

  /**
   * VISUALIZACIÓN DE PDF
   * Prepara la URL completa del backend si es necesario y abre el modal.
   */
  const handleVerFirmado = (url) => {
    if (!url) return;
    if (url.startsWith('http')) {
      setPdfUrl(url);
    } else {
      const baseUrl = api.defaults.baseURL
        ? api.defaults.baseURL.replace(/\/api\/?$/, '')
        : 'http://localhost:4000';
      setPdfUrl(`${baseUrl}${url}`);
    }
    setShowPdfModal(true);
  };

  /**
   * FUNCIÓN MAESTRA DE ASIGNACIÓN
   * Dependiendo del botón pulsado, genero el PDF en memoria y envío los datos al backend
   * para solo guardar, enviar por correo o mandar vía WhatsApp.
   */
  const handleAction = async (tipoAccion) => {
    if (!formData.empleado_id || formData.equipos.length === 0) return;

    const us = usuariosLibres.find(
      (u) => u.id === parseInt(formData.empleado_id),
    );
    if (tipoAccion === 'EMAIL' && !us.email_contacto) {
      return toast.error('El colaborador no tiene correo registrado');
    }

    // Enriquezco los datos de los equipos con la información del catálogo para generar el PDF
    const equiposParaPdf = formData.equipos.map((item) => {
      const eq = equiposDisponibles.find(
        (e) => e.id === parseInt(item.equipo_id),
      );
      return { ...eq, serie: eq.numero_serie, cargador: item.cargador };
    });

    const docPdf = generarPDFBlob(equiposParaPdf, us, null);
    const pdfBlob = docPdf.output('blob');

    try {
      const payload = {
        empleado_id: parseInt(formData.empleado_id),
        equipos: formData.equipos.map((eq) => ({
          equipo_id: parseInt(eq.equipo_id),
          cargador: eq.cargador,
        })),
        observaciones: formData.observaciones,
        fecha: new Date().toISOString(),
      };

      if (tipoAccion === 'GUARDAR' || tipoAccion === 'WHATSAPP') {
        await api.post('/movimientos/entrega', payload);
        toast.success('Entregas guardadas exitosamente');

        setPdfUrl(URL.createObjectURL(pdfBlob));
        setShowPdfModal(true);

        if (tipoAccion === 'WHATSAPP') {
          const nombreArchivo = `Acta_${us.nombres.split(' ')[0]}_Equipos.pdf`;
          docPdf.save(nombreArchivo); // Descargo el archivo para que lo adjunten

          const numero = us.telefono ? us.telefono.replace(/\D/g, '') : '';
          const mensaje = `Hola ${us.nombres}, te hago entrega del acta de asignación de tus equipos.`;
          const link = numero
            ? `https://wa.me/51${numero}?text=${encodeURIComponent(mensaje)}`
            : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
          window.open(link, '_blank');
        }
      } else if (tipoAccion === 'EMAIL') {
        const loadingToast = toast.loading('Guardando y enviando correo...');
        const formDataEmail = new FormData();
        formDataEmail.append('pdf', pdfBlob, 'Acta_Entrega.pdf');
        formDataEmail.append('payload', JSON.stringify(payload));
        formDataEmail.append('destinatario', us.email_contacto);
        formDataEmail.append('nombreEmpleado', us.nombres);

        const response = await api.post(
          '/movimientos/entrega-con-correo',
          formDataEmail,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          },
        );

        if (response.data.warning) {
          toast.update(loadingToast, {
            render: 'Guardado, fallo envío correo ⚠️',
            type: 'warning',
            isLoading: false,
            autoClose: 4000,
          });
        } else {
          toast.update(loadingToast, {
            render: '¡Guardado y Enviado! ✅',
            type: 'success',
            isLoading: false,
            autoClose: 3000,
          });
        }

        setPdfUrl(URL.createObjectURL(pdfBlob));
        setShowPdfModal(true);
      }

      // Limpio el formulario para la siguiente asignación
      setFormData({
        empleado_id: '',
        equipos: [{ equipo_id: '', cargador: true }],
        observaciones: '',
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error en el proceso');
    }
  };

  if (loading)
    return <div className='loading-state'>Cargando asignaciones...</div>;

  // Mapeo los datos para los Selects del formulario
  const equiposOptions = equiposDisponibles.map((e) => ({
    value: e.id,
    label: `${e.marca} ${e.modelo} - ${e.numero_serie}`,
    equipoFullData: e,
  }));

  const usuariosOptions = usuariosLibres.map((u) => ({
    value: u.id,
    label: `${u.nombres} ${u.apellidos}`,
  }));

  return (
    <div className='entrega-container'>
      <div className='page-header'>
        <h1>Registrar Entrega</h1>
        <button
          onClick={startAsignacionTour}
          className='btn-tour-header'
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Input oculto para la subida de actas firmadas */}
      <input
        type='file'
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept='application/pdf'
        onChange={handleFileChange}
      />

      <div className='content-grid'>
        <div id='tour-asignacion-form'>
          <EntregaForm
            equiposOptions={equiposOptions}
            usuariosOptions={usuariosOptions}
            formData={formData}
            setFormData={setFormData}
            onAction={handleAction}
          />
        </div>
        <div id='tour-asignacion-tabla'>
          <EntregaTable
            historial={historialVisual}
            onVerPdfOriginal={(item) => {
              // Reconstruyo el PDF original de la transacción a partir de los datos en la tabla
              let equiposAImprimir = [];
              if (item.equipos_agrupados) {
                equiposAImprimir = item.equipos_agrupados.map((eq) => ({
                  serie: eq.serie,
                  marca: eq.marca,
                  modelo: eq.modelo,
                  cargador: eq.cargador,
                }));
              } else {
                equiposAImprimir = [
                  {
                    serie: item.serie,
                    marca: item.marca,
                    modelo: item.modelo,
                    cargador: item.cargador,
                  },
                ];
              }

              const doc = generarPDFBlob(
                equiposAImprimir,
                {
                  nombres: item.empleado_nombre,
                  apellidos: item.empleado_apellido,
                  dni: item.dni || '---',
                },
                item.fecha_movimiento,
              );
              setPdfUrl(doc.output('bloburl'));
              setShowPdfModal(true);
            }}
            onVerFirmado={handleVerFirmado}
            onSubirClick={handleSubirClick}
            onInvalidar={onInvalidarClick}
          />
        </div>
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
            Esta acción invalidará el PDF firmado de esta entrega.
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

      <PdfModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        pdfUrl={pdfUrl}
        title='Documento'
      />
    </div>
  );
};

export default Asignacion;
