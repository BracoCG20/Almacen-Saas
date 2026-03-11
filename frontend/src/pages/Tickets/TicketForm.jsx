import React from 'react';
import Select from 'react-select';
import './TicketForm.scss';

const TicketForm = ({
  formData,
  setFormData,
  colaboradores,
  onSubmit,
  onCancel,
}) => {
  const opcionesColaboradores = colaboradores.map((c) => ({
    value: c.id,
    label: `${c.nombres} ${c.apellidos}`,
  }));

  const opcionesTipo = [
    { value: 'Hardware', label: 'Hardware (Equipos físicos)' },
    { value: 'Software', label: 'Software (Instalaciones, licencias)' },
    { value: 'Accesos', label: 'Accesos (Credenciales, correos)' },
    { value: 'Otros', label: 'Otros requerimientos' },
  ];

  const opcionesPrioridad = [
    { value: 'Baja', label: 'Baja (No urgente)' },
    { value: 'Media', label: 'Media (Normal)' },
    { value: 'Alta', label: 'Alta (Urgente)' },
    { value: 'Crítica', label: 'Crítica (Bloqueante)' },
  ];

  // ESTILOS INYECTADOS DIRECTO AL SELECT PARA EVITAR CONFLICTOS CON EL MODAL
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
      minHeight: '40px',
      cursor: 'pointer',
    }),
    valueContainer: (provided) => ({ ...provided, padding: '0 12px' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontWeight: '500',
      fontSize: '0.85rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.85rem',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }), // <-- ESTO EVITA QUE SE ESCONDA
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f5f3ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      fontSize: '0.85rem',
      cursor: 'pointer',
      padding: '8px 12px',
    }),
  };

  const handleSelectChange = (selectedOption, field) => {
    setFormData({
      ...formData,
      [field]: selectedOption ? selectedOption.value : '',
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className='ticket-form'
    >
      <div className='form-group'>
        <label>Colaborador Solicitante *</label>
        <Select
          options={opcionesColaboradores}
          value={
            opcionesColaboradores.find(
              (op) => op.value === formData.colaborador_id,
            ) || null
          }
          onChange={(op) => handleSelectChange(op, 'colaborador_id')}
          styles={customSelectStyles}
          placeholder='Buscar colaborador...'
          isClearable
          menuPortalTarget={document.body}
          required
        />
      </div>

      <div className='form-row-2'>
        <div className='form-group'>
          <label>Tipo de Solicitud *</label>
          <Select
            options={opcionesTipo}
            value={
              opcionesTipo.find((op) => op.value === formData.tipo_solicitud) ||
              null
            }
            onChange={(op) => handleSelectChange(op, 'tipo_solicitud')}
            styles={customSelectStyles}
            isSearchable={false}
            menuPortalTarget={document.body}
          />
        </div>
        <div className='form-group'>
          <label>Prioridad *</label>
          <Select
            options={opcionesPrioridad}
            value={
              opcionesPrioridad.find((op) => op.value === formData.prioridad) ||
              null
            }
            onChange={(op) => handleSelectChange(op, 'prioridad')}
            styles={customSelectStyles}
            isSearchable={false}
            menuPortalTarget={document.body}
          />
        </div>
      </div>

      <div className='form-group'>
        <label>Asunto (Resumen breve) *</label>
        <input
          type='text'
          className='input-text'
          placeholder='Ej: Necesito credenciales de Adobe'
          value={formData.asunto}
          onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
          required
        />
      </div>

      <div className='form-group'>
        <label>Descripción del Problema / Solicitud *</label>
        <textarea
          className='input-textarea'
          placeholder='Describe detalladamente qué necesitas...'
          value={formData.descripcion}
          onChange={(e) =>
            setFormData({ ...formData, descripcion: e.target.value })
          }
          rows='4'
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
          Generar Ticket
        </button>
      </div>
    </form>
  );
};

export default TicketForm;
