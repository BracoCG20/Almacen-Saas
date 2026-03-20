import React from 'react';
import Select from 'react-select';
import { Clock, Info, User } from 'lucide-react';
import './TicketForm.scss';

const catalogoSolicitudes = [
  {
    value: 'Fallo de Hardware / Equipo no enciende',
    label: '💻 Fallo de Hardware / Equipo no enciende',
    prioridad: 'Alta',
    sla: '2 a 4 horas',
  },
  {
    value: 'Problemas de Red / Internet',
    label: '🌐 Problemas de Red / Internet',
    prioridad: 'Crítica',
    sla: '4 a 8 horas',
  },
  {
    value: 'Creación de Correo / Credenciales',
    label: '🔑 Creación de Correo / Credenciales',
    prioridad: 'Media',
    sla: '1 horas',
  },
  {
    value: 'Instalación de Software / Licencia',
    label: '💿 Instalación de Software / Licencia',
    prioridad: 'Media',
    sla: '2 a 4 horas',
  },
  {
    value: 'Creación de HTML Mailing',
    label: '✉️ Creación de HTML Mailing',
    prioridad: 'Baja',
    sla: '1 a 2 horas',
  },
  {
    value: 'Revisión / Mantenimiento',
    label: '🛠️ Revisión / Mantenimiento preventivo',
    prioridad: 'Media',
    sla: 'Hasta 3 días',
  },
  {
    value: 'Otros requerimientos',
    label: '📦 Otros requerimientos',
    prioridad: 'Sujeto a evaluación',
    sla: 'Sujeto a evaluación',
  },
];

const TicketForm = ({
  formData,
  setFormData,
  currentUser,
  onSubmit,
  onCancel,
}) => {
  const handleSelectChange = (selectedOption) => {
    if (selectedOption) {
      setFormData({
        ...formData,
        tipo_solicitud: selectedOption.value,
        prioridad: selectedOption.prioridad,
      });
    } else {
      setFormData({ ...formData, tipo_solicitud: '', prioridad: '' });
    }
  };

  const selectedService = catalogoSolicitudes.find(
    (s) => s.value === formData.tipo_solicitud,
  );

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
      minHeight: '42px',
      cursor: 'pointer',
    }),
    valueContainer: (provided) => ({ ...provided, padding: '0 12px' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '500',
      fontSize: '0.9rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.9rem',
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
      fontSize: '0.9rem',
      cursor: 'pointer',
      padding: '10px 12px',
    }),
  };

  return (
    <form
      onSubmit={onSubmit}
      className='ticket-form'
    >
      {/* 1. SOLICITANTE LECTURA SOLAMENTE */}
      <div className='form-group'>
        <label>Solicitante</label>
        <div className='readonly-user-badge'>
          <User size={16} />
          <span>{currentUser?.nombre || 'Usuario Actual'}</span>
        </div>
      </div>

      {/* 2. SELECTOR DE CATÁLOGO INTELIGENTE */}
      <div className='form-group mt-1'>
        <label>¿En qué te podemos ayudar? *</label>
        <Select
          className='react-select-container'
          classNamePrefix='react-select'
          options={catalogoSolicitudes}
          value={
            catalogoSolicitudes.find(
              (op) => op.value === formData.tipo_solicitud,
            ) || null
          }
          onChange={handleSelectChange}
          styles={customSelectStyles}
          placeholder='Selecciona el tipo de problema...'
          isSearchable={false}
          menuPortalTarget={document.body}
          required
        />
      </div>

      {/* 3. CAJA DE INFORMACIÓN SLA (Aparece al seleccionar algo) */}
      {selectedService && (
        <div
          className={`sla-info-box ${selectedService.prioridad.toLowerCase()}`}
        >
          <div className='sla-row'>
            <Info size={16} />
            <span>
              Prioridad asignada: <strong>{selectedService.prioridad}</strong>
            </span>
          </div>
          <div className='sla-row'>
            <Clock size={16} />
            <span>
              Tiempo de atención estimado:{' '}
              <strong>{selectedService.sla}</strong>
            </span>
          </div>
        </div>
      )}

      <div className='form-group mt-1'>
        <label>Asunto (Resumen breve) *</label>
        <input
          type='text'
          className='input-text'
          placeholder='Ej: Necesito credenciales de Adobe / Mi PC no da imagen'
          value={formData.asunto}
          onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
          required
        />
      </div>

      <div className='form-group'>
        <label>Descripción detallada *</label>
        <textarea
          className='input-textarea'
          placeholder='Describe detalladamente qué necesitas o los síntomas del problema para que el equipo técnico pueda ayudarte más rápido...'
          value={formData.descripcion}
          onChange={(e) =>
            setFormData({ ...formData, descripcion: e.target.value })
          }
          rows='5'
          required
        />
      </div>

      <div className='modal-actions'>
        <button
          type='button'
          className='btn-cancel'
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type='submit'
          className='btn-save'
        >
          Enviar Solicitud
        </button>
      </div>
    </form>
  );
};

export default TicketForm;
