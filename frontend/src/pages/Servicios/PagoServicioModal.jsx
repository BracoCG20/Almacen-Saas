//frontend/src/pages/Servicios/PagoServicioModal.jsx
import { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import FileUploader from '../../components/FileUploader/FileUploader';
import './PagoServicioModal.scss';

const PagoServicioModal = ({ servicio, onClose }) => {
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

  const [currentPagoPage, setCurrentPagoPage] = useState(1);
  const itemsPerPagoPage = 3;

  const [isAnularModalOpen, setIsAnularModalOpen] = useState(false);
  const [pagoToAnular, setPagoToAnular] = useState(null);

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

  const fetchPagos = async () => {
    if (!servicio) return;
    try {
      const res = await api.get(`/servicios/${servicio.id}/pagos`);
      setPagos(res.data);
    } catch (error) {
      toast.error('Error al cargar el historial de pagos');
    }
  };

  useEffect(() => {
    fetchPagos();
    if (servicio?.fecha_proximo_pago) {
      const proxima = new Date(servicio.fecha_proximo_pago);
      proxima.setMonth(proxima.getMonth() + 1);
      setFormData((prev) => ({
        ...prev,
        nueva_fecha_proximo_pago: proxima.toISOString().split('T')[0],
      }));
    }
  }, [servicio]);

  const indexOfLastPago = currentPagoPage * itemsPerPagoPage;
  const indexOfFirstPago = indexOfLastPago - itemsPerPagoPage;
  const currentPagosList = pagos.slice(indexOfFirstPago, indexOfLastPago);
  const totalPagoPages = Math.ceil(pagos.length / itemsPerPagoPage);
  const paginatePagos = (pageNumber) => setCurrentPagoPage(pageNumber);

  const getBackendFileUrl = (path) => {
    if (!path) return null;

    // Si el string contiene 'cloudinary' o empieza con http, es de la nube
    if (path.includes('cloudinary.com') || path.includes('http')) {
      return path.startsWith('/') ? path.substring(1) : path;
    }

    // Archivos locales antiguos
    const baseUrl = api.defaults.baseURL
      ? api.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:4000';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
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

  const handleDownloadExisting = async (url, name) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name || 'Comprobante_Pago.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(url, '_blank');
    }
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
      setCurrentPagoPage(1);
      fetchPagos();
    } catch (error) {
      toast.error('Error al registrar el pago ❌');
    } finally {
      setLoading(false);
    }
  };

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

  // --- REACT-SELECT ---
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      background: state.isDisabled ? '#f8fafc' : '#fff',
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0',
      borderRadius: '8px',
      height: '40px',
      minHeight: '40px',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 12px',
      height: '40px',
      position: 'relative',
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      padding: '0px',
      height: '40px',
      color: 'transparent',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '40px',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontSize: '0.8rem',
      fontWeight: '500',
      margin: '0px',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.8rem',
      margin: '0px',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f5f3ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
      fontSize: '0.8rem',
      padding: '8px 12px',
    }),
  };

  if (!servicio) return null;

  return (
    <div className='pago-modal-modern'>
      {/* SECCIÓN: FORMULARIO DE REGISTRO */}
      <div className='form-section'>
        <div className='section-header'>
          <div className='indicator' />
          <h4>Registrar Nuevo Pago</h4>
        </div>

        <form
          className='form-grid'
          onSubmit={handleSubmit}
        >
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
            <div className='currency-wrapper'>
              <div className='currency-select'>
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
                className='currency-input'
                required
                placeholder='0.00'
              />
            </div>
          </div>

          <div className='input-group'>
            <label>Período Cubierto *</label>
            <div className='date-split'>
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

          <div className='input-group full-width'>
            <label>Comprobante o Factura (Opcional)</label>
            <FileUploader
              accept='.pdf,image/*'
              newFile={archivo}
              onFileSelect={(file) => setArchivo(file)}
              onFileRemove={() => setArchivo(null)}
            />
          </div>

          <div
            className='full-width'
            style={{ marginTop: '10px' }}
          >
            <button
              type='submit'
              className='btn-save-modern'
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Registrando...' : 'Guardar Registro'}
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN: HISTORIAL DE PAGOS */}
      <div className='history-section'>
        <div
          className='section-header'
          style={{ marginBottom: '1rem' }}
        >
          <div className='indicator' />
          <h4>Historial de Pagos</h4>
        </div>

        {pagos.length === 0 ? (
          <div className='empty-state'>
            Aún no hay pagos registrados para este servicio.
          </div>
        ) : (
          <>
            <div className='table-container-mini'>
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Período</th>
                    <th>Monto</th>
                    <th className='center'>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPagosList.map((pago) => {
                    const urlCompleta = getBackendFileUrl(pago.url_factura);
                    return (
                      <tr
                        key={pago.id}
                        className={
                          pago.estado_pago === 'Anulado' ? 'anulado-row' : ''
                        }
                      >
                        <td className='date'>{formatDate(pago.fecha_pago)}</td>
                        <td className='period'>
                          {getMesNombre(pago.periodo_mes)} {pago.periodo_anio}
                        </td>
                        <td className='amount'>
                          {pago.estado_pago === 'Anulado' ? (
                            <span className='badge-anulado'>Anulado</span>
                          ) : (
                            `${pago.moneda} ${Number(pago.monto_pagado).toFixed(2)}`
                          )}
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
                                  className='action-btn view'
                                  title='Ver'
                                >
                                  <Eye size={14} />
                                </button>
                                <button
                                  type='button'
                                  onClick={() =>
                                    handleDownloadExisting(
                                      urlCompleta,
                                      pago.url_factura.split('/').pop(),
                                    )
                                  }
                                  className='action-btn download'
                                  title='Descargar'
                                >
                                  <Download size={14} />
                                </button>
                              </>
                            )}
                            {pago.estado_pago !== 'Anulado' && (
                              <button
                                type='button'
                                onClick={() => triggerAnularPago(pago.id)}
                                className='action-btn delete'
                                title='Anular'
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagos.length > itemsPerPagoPage && (
              <div className='pagination-mini'>
                <div className='info'>
                  Mostrando <strong>{indexOfFirstPago + 1}</strong> a{' '}
                  <strong>{Math.min(indexOfLastPago, pagos.length)}</strong> de{' '}
                  <strong>{pagos.length}</strong>
                </div>
                <div className='controls'>
                  <button
                    onClick={() => paginatePagos(currentPagoPage - 1)}
                    disabled={currentPagoPage === 1}
                  >
                    <ChevronLeft size={14} /> Ant
                  </button>
                  <span>
                    {currentPagoPage} / {totalPagoPages}
                  </span>
                  <button
                    onClick={() => paginatePagos(currentPagoPage + 1)}
                    disabled={currentPagoPage === totalPagoPages}
                  >
                    Sig <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL ANULAR PAGO */}
      <Modal
        isOpen={isAnularModalOpen}
        onClose={() => setIsAnularModalOpen(false)}
        title='Confirmar Anulación'
        maxWidth='400px'
      >
        <div className='confirm-modal-content'>
          <div className='warning-icon'>
            <AlertTriangle size={32} />
          </div>
          <h3>¿Anular este pago?</h3>
          <p>
            Se dejará constancia de esta anulación en el historial de auditoría
            del servicio. Esta acción no se puede revertir.
          </p>
          <div className='modal-actions'>
            <button
              type='button'
              className='btn-cancel'
              onClick={() => setIsAnularModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type='button'
              className='btn-confirm'
              onClick={confirmAnularPago}
            >
              Anular Pago
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PagoServicioModal;
