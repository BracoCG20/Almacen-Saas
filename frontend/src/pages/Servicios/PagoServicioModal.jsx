import React, { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';
import Select from 'react-select';
import {
  CalendarCheck,
  History,
  Eye,
  Download,
  Trash2,
  Save,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import FileUploader from '../../components/FileUploader/FileUploader';
import './AddServicioForm.scss';
import './PagoServicioModal.scss';

const PagoServicioModal = ({ servicio, onClose }) => {
  // --- ESTADOS PRINCIPALES ---
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [archivo, setArchivo] = useState(null);

  const [formData, setFormData] = useState({
    fecha_pago: new Date().toISOString().split('T')[0],
    monto_pagado: servicio?.precio || '',
    moneda: servicio?.moneda || 'USD',
    periodo_mes: new Date().getMonth() + 1,
    periodo_anio: new Date().getFullYear(),
    nueva_fecha_proximo_pago: '',
  });

  // --- ESTADOS DE MODAL DE ANULACIÓN ---
  const [isAnularModalOpen, setIsAnularModalOpen] = useState(false);
  const [pagoToAnular, setPagoToAnular] = useState(null);

  // --- LISTAS DE OPCIONES ---
  const monedaOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'PEN', label: 'PEN' },
    { value: 'EUR', label: 'EUR' },
  ];

  const mesesOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return {
      value: i + 1,
      label: date
        .toLocaleString('es-PE', { month: 'long' })
        .replace(/^\w/, (c) => c.toUpperCase()),
    };
  });

  const currentYear = new Date().getFullYear();
  const aniosOptions = [
    { value: currentYear - 1, label: String(currentYear - 1) },
    { value: currentYear, label: String(currentYear) },
    { value: currentYear + 1, label: String(currentYear + 1) },
    { value: currentYear + 2, label: String(currentYear + 2) },
  ];

  // --- FETCH DE HISTORIAL ---
  const fetchPagos = async () => {
    if (!servicio) return;
    try {
      const res = await api.get(`/servicios/${servicio.id}/pagos`);
      setPagos(res.data);
    } catch (error) {
      toast.error('Error al cargar el historial de pagos');
    }
  };

  // --- EFECTOS ---
  useEffect(() => {
    fetchPagos();

    // Auto-calcular la próxima fecha de pago (+1 mes)
    if (servicio?.fecha_proximo_pago) {
      const proxima = new Date(servicio.fecha_proximo_pago);
      proxima.setMonth(proxima.getMonth() + 1);
      setFormData((prev) => ({
        ...prev,
        nueva_fecha_proximo_pago: proxima.toISOString().split('T')[0],
      }));
    }
  }, [servicio]);

  // --- HELPERS ---
  const getBackendFileUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000';
    return `${baseUrl}${path}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(
      dateString.includes('T') ? dateString : `${dateString}T12:00:00Z`,
    );
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getMesNombre = (num) =>
    mesesOptions.find((m) => m.value === num)?.label || num;

  // --- MANEJADORES DE EVENTOS ---
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' && value !== '' ? Number(value) : value,
    });
  };

  const handleSelectChange = (selectedOption, actionMeta) => {
    setFormData({
      ...formData,
      [actionMeta.name]: selectedOption ? selectedOption.value : null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monto_pagado || !formData.periodo_mes) {
      return toast.warning('Debes completar el monto y el periodo del pago.');
    }

    setLoading(true);
    const form = new FormData();
    Object.keys(formData).forEach((key) => form.append(key, formData[key]));
    if (archivo) form.append('comprobante', archivo);

    try {
      await api.post(`/servicios/${servicio.id}/pagos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Pago registrado correctamente ✅');
      setArchivo(null);
      fetchPagos();
    } catch (error) {
      toast.error('Error al registrar el pago ❌');
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE ANULACIÓN ---
  const triggerAnularPago = (pagoId) => {
    setPagoToAnular(pagoId);
    setIsAnularModalOpen(true);
  };

  const confirmAnularPago = async () => {
    if (!pagoToAnular) return;
    try {
      await api.put(`/servicios/pagos/${pagoToAnular}/anular`);
      toast.success('Pago anulado exitosamente');
      setIsAnularModalOpen(false);
      setPagoToAnular(null);
      fetchPagos();
    } catch (error) {
      toast.error('Error al anular el pago');
    }
  };

  // --- ESTILOS REACT-SELECT ---
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: '8px',
      minHeight: '50px',
      height: '50px',
      borderColor: '#cbd5e1',
      cursor: 'pointer',
    }),
    valueContainer: (provided) => ({
      ...provided,
      position: 'relative',
      padding: '0 14px',
    }),
    input: (provided) => ({ ...provided, margin: '0px', padding: '0px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#334155',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  if (!servicio) return null;

  return (
    <div className='pago-modal-container'>
      <div className='modal-card padding-content'>
        <h4 className='section-title'>
          <CalendarCheck size={18} /> Registrar Nuevo Pago
        </h4>

        <form
          className='equipo-form'
          onSubmit={handleSubmit}
          style={{ padding: 0, maxHeight: 'none', overflow: 'visible' }}
        >
          <div className='form-row'>
            <div className='input-group'>
              <label>Fecha del Pago *</label>
              <input
                type='date'
                name='fecha_pago'
                value={formData.fecha_pago}
                onChange={handleChange}
                required
              />
            </div>
            <div className='input-group'>
              <label>Monto Pagado *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '100px' }}>
                  <Select
                    name='moneda'
                    options={monedaOptions}
                    value={monedaOptions.find(
                      (op) => op.value === formData.moneda,
                    )}
                    onChange={handleSelectChange}
                    styles={customSelectStyles}
                    isSearchable={false}
                    menuPortalTarget={document.body}
                    required
                  />
                </div>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  name='monto_pagado'
                  value={formData.monto_pagado}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                  required
                  placeholder='0.00'
                />
              </div>
            </div>
          </div>

          <div className='form-row'>
            <div className='input-group'>
              <label>Período Cubierto (Mes y Año) *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Select
                  name='periodo_mes'
                  options={mesesOptions}
                  value={mesesOptions.find(
                    (m) => m.value === formData.periodo_mes,
                  )}
                  onChange={handleSelectChange}
                  styles={customSelectStyles}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                  required
                />
                <Select
                  name='periodo_anio'
                  options={aniosOptions}
                  value={aniosOptions.find(
                    (a) => a.value === formData.periodo_anio,
                  )}
                  onChange={handleSelectChange}
                  styles={customSelectStyles}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                  required
                />
              </div>
            </div>
            <div className='input-group'>
              <label>Actualizar Próximo Cobro a:</label>
              <input
                type='date'
                name='nueva_fecha_proximo_pago'
                value={formData.nueva_fecha_proximo_pago}
                onChange={handleChange}
                title='Dejar vacío si no desea actualizar la fecha general del servicio'
              />
            </div>
          </div>

          <div
            className='input-group'
            style={{ marginTop: '10px' }}
          >
            <label>Comprobante o Factura (Opcional)</label>
            <FileUploader
              accept='.pdf,image/*'
              newFile={archivo}
              onFileSelect={(file) => setArchivo(file)}
              onFileRemove={() => setArchivo(null)}
            />
          </div>

          <button
            type='submit'
            className='btn-submit'
            disabled={loading}
          >
            <Save
              size={18}
              style={{ marginRight: '8px' }}
            />
            {loading ? 'Registrando Pago...' : 'Guardar Registro de Pago'}
          </button>
        </form>
      </div>

      {/* --- HISTORIAL DE PAGOS --- */}
      <div className='history-container'>
        <h4 className='history-header'>
          <History size={18} /> Historial de Pagos
        </h4>
        {pagos.length === 0 ? (
          <div className='empty-state'>
            Aún no hay pagos registrados para este servicio.
          </div>
        ) : (
          <div className='table-scroll'>
            <table>
              <thead>
                <tr>
                  <th>Fecha de Pago</th>
                  <th>Período</th>
                  <th>Monto</th>
                  <th className='center'>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => {
                  const urlCompleta = getBackendFileUrl(pago.url_factura);
                  return (
                    <tr key={pago.id}>
                      <td className='date'>{formatDate(pago.fecha_pago)}</td>
                      <td className='period'>
                        {getMesNombre(pago.periodo_mes)} {pago.periodo_anio}
                      </td>
                      <td className='amount'>
                        {pago.moneda} {Number(pago.monto_pagado).toFixed(2)}
                      </td>
                      <td className='center'>
                        <div className='table-actions'>
                          {pago.url_factura && (
                            <>
                              <button
                                type='button'
                                onClick={() =>
                                  window.open(urlCompleta, '_blank')
                                }
                                className='btn-icon view'
                                title='Ver Comprobante'
                              >
                                <Eye size={14} />
                              </button>
                              <a
                                href={urlCompleta}
                                download
                                target='_blank'
                                rel='noreferrer'
                                className='btn-icon download'
                                title='Descargar Comprobante'
                              >
                                <Download size={14} />
                              </a>
                            </>
                          )}
                          <button
                            type='button'
                            onClick={() => triggerAnularPago(pago.id)}
                            className='btn-icon remove'
                            title='Anular Pago'
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL CONFIRMACIÓN ANULAR --- */}
      <Modal
        isOpen={isAnularModalOpen}
        onClose={() => setIsAnularModalOpen(false)}
        title='Confirmar Anulación'
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon'>
            <AlertTriangle size={40} />
          </div>
          <h3>¿Anular este pago?</h3>
          <p>
            Se dejará constancia de esta anulación en el historial de auditoría
            del servicio. No se podrá revertir.
          </p>
          <div className='modal-actions'>
            <button
              type='button'
              className='btn-cancel'
              onClick={() => setIsAnularModalOpen(false)}
            >
              <X size={18} /> Cancelar
            </button>
            <button
              type='button'
              className='btn-confirm'
              onClick={confirmAnularPago}
            >
              <Check size={18} /> Confirmar Anulación
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PagoServicioModal;
