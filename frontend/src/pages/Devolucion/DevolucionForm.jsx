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
  CheckSquare,
  Square,
} from 'lucide-react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import './DevolucionForm.scss';

const DevolucionForm = ({
  usuariosOptions,
  estadosOptions,
  formData,
  setFormData,
  equiposDetectados,
  handleUserChange,
  onAction,
}) => {
  // Validamos que haya motivo y al menos un equipo marcado, y que todos los marcados tengan estado físico
  const isFormValid =
    formData.empleado_id &&
    formData.motivo &&
    formData.equiposADevolver.length > 0 &&
    formData.equiposADevolver.every((eq) => eq.estado_fisico_id !== '');

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
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0',
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

  const checkRequiereCargador = (categoria) => {
    return categoria === 'Laptop/PC' || categoria === 'Celular/Tablet';
  };

  const handleToggleEquipo = (equipo) => {
    const yaEsta = formData.equiposADevolver.find(
      (e) => e.equipo_id === equipo.id,
    );
    if (yaEsta) {
      // Lo quitamos
      setFormData({
        ...formData,
        equiposADevolver: formData.equiposADevolver.filter(
          (e) => e.equipo_id !== equipo.id,
        ),
      });
    } else {
      // Lo agregamos por defecto en estado Operativo
      const operativoId =
        estadosOptions.find((est) => est.label.toLowerCase() === 'operativo')
          ?.value || '';
      const reqCargador = checkRequiereCargador(equipo.categoria);

      setFormData({
        ...formData,
        equiposADevolver: [
          ...formData.equiposADevolver,
          {
            equipo_id: equipo.id,
            estado_fisico_id: operativoId,
            cargador: reqCargador ? true : null,
            observaciones: '',
          },
        ],
      });
    }
  };

  const updateEquipoDetalle = (equipoId, campo, valor) => {
    const nuevos = formData.equiposADevolver.map((eq) => {
      if (eq.equipo_id === equipoId) return { ...eq, [campo]: valor };
      return eq;
    });
    setFormData({ ...formData, equiposADevolver: nuevos });
  };

  return (
    <div className='form-card'>
      <div>
        <div className='input-group'>
          <label className='label-highlight primary'>
            <UserCheck size={16} /> Usuario (Con equipos asignados)
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

        {/* LISTA DE EQUIPOS QUE TIENE EN SU PODER */}
        {equiposDetectados.length > 0 ? (
          <div
            className='equipos-list-container'
            style={{ marginTop: '1.5rem' }}
          >
            <label
              className='label-highlight primary'
              style={{ marginBottom: '10px' }}
            >
              <Laptop size={16} /> Seleccione equipos a devolver
            </label>

            {equiposDetectados.map((eq) => {
              const devData = formData.equiposADevolver.find(
                (d) => d.equipo_id === eq.id,
              );
              const isSelected = !!devData;
              const requiereCargador = checkRequiereCargador(eq.categoria);

              return (
                <div
                  key={eq.id}
                  className={`detected-equipment-card ${isSelected ? 'selected' : ''}`}
                >
                  {/* Encabezado Clickable */}
                  <div
                    className='equipo-header'
                    onClick={() => handleToggleEquipo(eq)}
                  >
                    <div className='check-indicator'>
                      {isSelected ? (
                        <CheckSquare
                          size={20}
                          color='#7c3aed'
                        />
                      ) : (
                        <Square
                          size={20}
                          color='#cbd5e1'
                        />
                      )}
                    </div>
                    <div className='info-wrapper'>
                      <strong className='title'>
                        {eq.marca} {eq.modelo}
                      </strong>
                      <div className='serial'>
                        <Barcode size={12} /> SN: {eq.numero_serie}
                      </div>
                    </div>
                  </div>

                  {/* Opciones Adicionales (Solo si está seleccionado) */}
                  {isSelected && (
                    <div className='equipo-options'>
                      <div className='input-group-row'>
                        <div className='flex-1'>
                          <label
                            style={{ fontSize: '0.75rem', marginBottom: '4px' }}
                          >
                            Estado de Recepción *
                          </label>
                          <Select
                            options={estadosOptions}
                            value={
                              estadosOptions.find(
                                (o) => o.value === devData.estado_fisico_id,
                              ) || null
                            }
                            onChange={(o) =>
                              updateEquipoDetalle(
                                eq.id,
                                'estado_fisico_id',
                                o?.value || '',
                              )
                            }
                            styles={{
                              ...customSelectStyles,
                              control: (p, s) => ({
                                ...customSelectStyles.control(p, s),
                                height: '36px',
                                minHeight: '36px',
                              }),
                            }}
                            menuPortalTarget={document.body}
                          />
                        </div>

                        {requiereCargador ? (
                          <div className='flex-1'>
                            <label
                              style={{
                                fontSize: '0.75rem',
                                marginBottom: '4px',
                              }}
                            >
                              ¿Trajo Cargador?
                            </label>
                            <select
                              className='select-accesorios-mini'
                              value={devData.cargador ? 'SI' : 'NO'}
                              onChange={(e) =>
                                updateEquipoDetalle(
                                  eq.id,
                                  'cargador',
                                  e.target.value === 'SI',
                                )
                              }
                            >
                              <option value='SI'>Sí, incluye</option>
                              <option value='NO'>No (Falta)</option>
                            </select>
                          </div>
                        ) : (
                          <div className='flex-1 no-aplica-cargador'>
                            No requiere cargador
                          </div>
                        )}
                      </div>

                      {/* Observaciones si está dañado */}
                      {devData.estado_fisico_id &&
                        parseInt(devData.estado_fisico_id) !== 1 && (
                          <div
                            className='input-group'
                            style={{ marginTop: '10px' }}
                          >
                            <textarea
                              className='danger-textarea-mini'
                              placeholder='Describa el daño o problema...'
                              value={devData.observaciones}
                              onChange={(e) =>
                                updateEquipoDetalle(
                                  eq.id,
                                  'observaciones',
                                  e.target.value,
                                )
                              }
                              rows='2'
                            />
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className='empty-equipment-card'
            style={{ marginTop: '1.5rem' }}
          >
            Seleccione un usuario para ver los equipos que tiene pendientes por
            devolver.
          </div>
        )}

        <div
          className='input-group'
          style={{ marginTop: '1.5rem' }}
        >
          <label className='label-highlight blue'>
            <HelpCircle size={16} /> Motivo General de la Devolución *
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
