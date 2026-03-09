import React from 'react';
import {
  Save,
  Mail,
  MessageCircle,
  UserCheck,
  Laptop,
  BatteryFull,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Barcode,
} from 'lucide-react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import './DevolucionForm.scss'; // <-- IMPORTAMOS SU PROPIO SCSS

const DevolucionForm = ({
  usuariosOptions,
  estadosOptions,
  formData,
  setFormData,
  equipoDetectado,
  handleUserChange,
  onAction,
}) => {
  const mostrarObservaciones =
    formData.estado_fisico_id && parseInt(formData.estado_fisico_id) !== 1;

  const isFormValid =
    equipoDetectado &&
    formData.estado_fisico_id &&
    formData.motivo &&
    (!mostrarObservaciones || formData.observaciones.trim());

  const motivoOptions = [
    { value: 'Cese de Vínculo Laboral', label: 'Cese de Vínculo Laboral' },
    { value: 'Renovación de Equipo', label: 'Renovación de Equipo' },
    {
      value: 'Equipo Dañado / Falla Técnica',
      label: 'Equipo Dañado / Falla Técnica',
    },
  ];

  // --- FIX CENTRADO REACT SELECT 40PX ---
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0', // Violeta
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
      height: '40px',
      minHeight: '40px',
      backgroundColor: state.isDisabled ? '#f8fafc' : '#fff',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 12px',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      padding: '0px',
      height: '40px',
      color: 'transparent',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    indicatorsContainer: (provided) => ({ ...provided, height: '40px' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontSize: '0.85rem',
      fontWeight: '400',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      margin: '0px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.85rem',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      margin: '0px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f5f3ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
      fontSize: '0.85rem',
      padding: '8px 12px',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <div className='form-card'>
      <div>
        <div className='input-group'>
          <label className='label-highlight primary'>
            <UserCheck size={16} /> Usuario (Con equipo asignado)
          </label>
          <Select
            options={usuariosOptions}
            value={
              usuariosOptions.find((o) => o.value === formData.empleado_id) ||
              null
            }
            onChange={handleUserChange}
            placeholder='Buscar usuario...'
            styles={customSelectStyles}
            menuPortalTarget={document.body}
          />
        </div>

        {equipoDetectado ? (
          <div className='detected-equipment-card'>
            <div className='icon-wrapper'>
              <Laptop size={24} />
            </div>
            <div className='info-wrapper'>
              <span className='subtitle'>EQUIPO A DEVOLVER</span>
              <strong className='title'>
                {equipoDetectado.marca} {equipoDetectado.modelo}
              </strong>
              <div className='serial'>
                <Barcode size={12} /> {equipoDetectado.numero_serie}
              </div>
            </div>
          </div>
        ) : (
          <div className='empty-equipment-card'>
            Seleccione un usuario para detectar automáticamente el equipo
            asignado.
          </div>
        )}

        <div
          className='input-group'
          style={{ marginTop: '1.5rem' }}
        >
          <label className='label-highlight blue'>
            <HelpCircle size={16} /> Motivo de la Devolución *
          </label>
          <CreatableSelect
            options={motivoOptions}
            value={
              formData.motivo
                ? { value: formData.motivo, label: formData.motivo }
                : null
            }
            onChange={(opt) =>
              setFormData({ ...formData, motivo: opt ? opt.value : '' })
            }
            placeholder='Seleccione o escriba el motivo...'
            styles={customSelectStyles}
            menuPortalTarget={document.body}
            isClearable
          />
        </div>

        <div
          className='input-group'
          style={{ marginTop: '1.5rem' }}
        >
          <label className='label-highlight primary'>
            <CheckCircle size={16} /> Estado Físico de Recepción *
          </label>
          <Select
            options={estadosOptions}
            value={
              estadosOptions.find(
                (o) => o.value === formData.estado_fisico_id,
              ) || null
            }
            onChange={(o) =>
              setFormData({ ...formData, estado_fisico_id: o?.value || '' })
            }
            placeholder='Seleccione el estado...'
            styles={customSelectStyles}
            menuPortalTarget={document.body}
            isSearchable={false}
          />
        </div>

        {mostrarObservaciones && (
          <div
            className='input-group'
            style={{ marginTop: '1.5rem' }}
          >
            <label className='label-highlight danger'>
              <AlertTriangle size={16} /> Observaciones (Obligatorio)
            </label>
            <textarea
              className='danger-textarea'
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              placeholder='Describa el daño, incidente o detalles...'
              rows='3'
            />
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <label className='checkbox-card danger-checkbox'>
            <input
              type='checkbox'
              checked={formData.cargador}
              onChange={(e) =>
                setFormData({ ...formData, cargador: e.target.checked })
              }
            />
            <span>
              <BatteryFull size={18} /> ¿Devuelve con cargador?
            </span>
          </label>
        </div>

        <div
          className='actions-container'
          id='tour-devolucion-acciones'
        >
          <button
            type='button'
            onClick={() => isFormValid && onAction('GUARDAR')}
            disabled={!isFormValid}
            className='btn-action gray'
          >
            <Save size={16} /> Solo Guardar y Ver Constancia
          </button>
          <button
            type='button'
            onClick={() => isFormValid && onAction('EMAIL')}
            disabled={!isFormValid}
            className='btn-action blue'
          >
            <Mail size={16} /> Guardar y Enviar por Correo
          </button>
          <button
            type='button'
            onClick={() => isFormValid && onAction('WHATSAPP')}
            disabled={!isFormValid}
            className='btn-action green'
          >
            <MessageCircle size={16} /> Guardar y Enviar WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevolucionForm;
