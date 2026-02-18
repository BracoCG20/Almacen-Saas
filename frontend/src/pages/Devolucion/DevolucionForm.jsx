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
  HelpCircle, // <-- Nuevo icono
} from 'lucide-react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable'; // Permite escribir otro motivo si no está en la lista

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

  // Validación estricta
  const isFormValid =
    equipoDetectado &&
    formData.estado_fisico_id &&
    formData.motivo &&
    (!mostrarObservaciones || formData.observaciones.trim());

  // Opciones comunes para el motivo de devolución
  const motivoOptions = [
    { value: 'Cese de Vínculo Laboral', label: 'Cese de Vínculo Laboral' },
    { value: 'Renovación de Equipo', label: 'Renovación de Equipo' },
    {
      value: 'Equipo Dañado / Falla Técnica',
      label: 'Equipo Dañado / Falla Técnica',
    },
  ];

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : 'none',
      minHeight: '50px',
      backgroundColor: state.isDisabled ? '#f8fafc' : '#fff',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 14px',
      position: 'relative',
    }),
    input: (provided) => ({ ...provided, margin: '0px', padding: '0px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    indicatorsContainer: (provided) => ({ ...provided, height: '50px' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontSize: '0.95rem',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.95rem',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#4f46e5'
        : state.isFocused
          ? '#f8fafc'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
      padding: '12px 15px',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#4f46e5',
    textTransform: 'uppercase',
  };

  return (
    <div className='form-card'>
      <div>
        <div className='input-group'>
          <label style={labelStyle}>
            <UserCheck size={18} /> Usuario (Con equipo asignado)
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
          <div
            style={{
              marginTop: '1.5rem',
              padding: '15px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
            }}
          >
            <div
              style={{
                width: '50px',
                height: '50px',
                background: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              }}
            >
              <Laptop size={24} />
            </div>
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.75rem',
                  color: '#64748b',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                }}
              >
                EQUIPO A DEVOLVER
              </span>
              <strong
                style={{
                  color: '#0f172a',
                  fontSize: '1.1rem',
                  display: 'block',
                }}
              >
                {equipoDetectado.marca} {equipoDetectado.modelo}
              </strong>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#334155',
                  fontFamily: 'monospace',
                  marginTop: '2px',
                }}
              >
                S/N: {equipoDetectado.numero_serie}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '15px',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              color: '#94a3b8',
              fontStyle: 'italic',
              textAlign: 'center',
              fontSize: '0.9rem',
            }}
          >
            Seleccione un usuario para detectar automáticamente el equipo
            asignado.
          </div>
        )}

        {/* --- NUEVO CAMPO: MOTIVO --- */}
        <div
          className='input-group'
          style={{ marginTop: '1.5rem' }}
        >
          <label style={{ ...labelStyle, color: '#3b82f6' }}>
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
          <label style={labelStyle}>
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
            <label style={{ ...labelStyle, color: '#dc2626' }}>
              <AlertTriangle size={16} /> Observaciones (Obligatorio)
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              placeholder='Describa el daño, incidente o detalles...'
              rows='3'
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #fca5a5',
                background: '#fef2f2',
                fontFamily: 'inherit',
                resize: 'none',
                height: '100px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <label
            className='checkbox-card'
            style={{ background: '#fff1f2', border: '1px solid #fecdd3' }}
          >
            <input
              type='checkbox'
              checked={formData.cargador}
              onChange={(e) =>
                setFormData({ ...formData, cargador: e.target.checked })
              }
              style={{
                accentColor: '#e11d48',
                width: '18px',
                height: '18px',
                cursor: 'pointer',
              }}
            />
            <span
              style={{
                color: '#9f1239',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <BatteryFull size={18} /> ¿Devuelve con cargador?
            </span>
          </label>
        </div>

        <div className='actions-container'>
          <button
            type='button'
            onClick={() => isFormValid && onAction('GUARDAR')}
            disabled={!isFormValid}
            className='btn-action gray'
          >
            <Save size={18} /> Solo Guardar y Ver Constancia
          </button>
          <button
            type='button'
            onClick={() => isFormValid && onAction('EMAIL')}
            disabled={!isFormValid}
            className='btn-action blue'
          >
            <Mail size={18} /> Guardar y Enviar por Correo
          </button>
          <button
            type='button'
            onClick={() => isFormValid && onAction('WHATSAPP')}
            disabled={!isFormValid}
            className='btn-action green'
          >
            <MessageCircle size={18} /> Guardar y Enviar WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevolucionForm;
