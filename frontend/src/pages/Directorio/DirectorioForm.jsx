import React from 'react';
import Select from 'react-select';
import './DirectorioForm.scss';

const DirectorioForm = ({
  formData,
  setFormData,
  colaboradores,
  directorio,
  modalMode,
  onSubmit,
  onCancel,
}) => {
  const colaboradoresDisponibles = colaboradores.filter((c) => {
    if (
      (modalMode === 'EDIT' || modalMode === 'BAJA') &&
      formData.colaborador_id === c.id
    )
      return true;
    return !directorio.some((d) => d.colaborador_id === c.id);
  });

  const opcionesColaboradores = colaboradoresDisponibles.map((c) => ({
    value: c.id,
    label: `${c.nombres} ${c.apellidos}`,
  }));

  const opcionesDestino = colaboradores
    .filter((c) => c.id !== parseInt(formData.colaborador_id))
    .map((c) => ({
      value: c.id,
      label: `${c.nombres} ${c.apellidos}`,
    }));

  const opcionesLicencia = [
    { value: 'BUSINESS_STARTER', label: 'Google Workspace Business Starter' },
    { value: 'BUSINESS_STANDARD', label: 'Google Workspace Business Standard' },
  ];

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#7c3aed' : '#cbd5e1',
      boxShadow: state.isFocused
        ? '0 0 0 3px rgba(124, 58, 237, 0.15)'
        : 'none',
      minHeight: '45px',
      backgroundColor: state.isDisabled ? '#f8fafc' : '#fff',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
    }),
    valueContainer: (provided) => ({ ...provided, padding: '0 12px' }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.isDisabled ? '#94a3b8' : '#1e293b',
      fontWeight: '500',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#7c3aed'
        : state.isFocused
          ? '#f3f0ff'
          : 'white',
      color: state.isSelected ? 'white' : '#334155',
      cursor: 'pointer',
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
      className='directorio-form'
    >
      {/* El dueño siempre se muestra, bloqueado si es EDIT o BAJA */}
      <div className='form-group'>
        <label>Colaborador Propietario</label>
        <Select
          options={opcionesColaboradores}
          value={
            opcionesColaboradores.find(
              (op) => op.value === formData.colaborador_id,
            ) || null
          }
          onChange={(op) => handleSelectChange(op, 'colaborador_id')}
          isDisabled={modalMode !== 'ADD'}
          styles={customSelectStyles}
          placeholder='Buscar colaborador...'
          isClearable={modalMode === 'ADD'}
          menuPortalTarget={document.body}
          required
        />
      </div>

      {/* Si estamos en modo "Dar de Baja", ocultamos el cambio de licencia */}
      {modalMode !== 'BAJA' && (
        <div className='form-group'>
          <label>Tipo de Licencia Workspace</label>
          <Select
            options={opcionesLicencia}
            value={
              opcionesLicencia.find(
                (op) => op.value === formData.tipo_licencia,
              ) || null
            }
            onChange={(op) => handleSelectChange(op, 'tipo_licencia')}
            styles={customSelectStyles}
            isSearchable={false}
            menuPortalTarget={document.body}
          />
        </div>
      )}

      {/* SECCIÓN DE BAJA Y TRANSFERENCIA */}
      {modalMode === 'BAJA' && (
        <div
          className='transfer-box'
          style={{ marginTop: '10px' }}
        >
          <div
            style={{
              marginBottom: '15px',
              color: '#b45309',
              fontSize: '0.9rem',
              lineHeight: '1.4',
            }}
          >
            Al confirmar, la cuenta pasará a estado <strong>Suspendido</strong>.
            Puedes indicar a qué persona se le migrará el Drive y los correos de
            este usuario.
          </div>

          <div className='checkbox-wrapper'>
            <input
              type='checkbox'
              id='transferCheck'
              checked={formData.datos_transferidos}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  datos_transferidos: e.target.checked,
                })
              }
            />
            <label htmlFor='transferCheck'>
              ¿Se transferirán los datos en Google Workspace?
            </label>
          </div>

          {formData.datos_transferidos && (
            <div className='form-group mt-10'>
              <label>¿A qué colaborador se transferirán?</label>
              <Select
                options={opcionesDestino}
                value={
                  opcionesDestino.find(
                    (op) => op.value === formData.colaborador_destino_id,
                  ) || null
                }
                onChange={(op) =>
                  handleSelectChange(op, 'colaborador_destino_id')
                }
                styles={{
                  ...customSelectStyles,
                  control: (base, state) => ({
                    ...customSelectStyles.control(base, state),
                    borderColor: state.isFocused ? '#d97706' : '#cbd5e1',
                    boxShadow: state.isFocused
                      ? '0 0 0 3px rgba(217, 119, 6, 0.15)'
                      : 'none',
                  }),
                }}
                placeholder='Buscar usuario de destino...'
                isClearable
                menuPortalTarget={document.body}
                required={formData.datos_transferidos}
              />
            </div>
          )}
        </div>
      )}

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
          Confirmar Acción
        </button>
      </div>
    </form>
  );
};

export default DirectorioForm;
