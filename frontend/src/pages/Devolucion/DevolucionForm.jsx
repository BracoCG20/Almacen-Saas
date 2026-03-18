import React from 'react';
import {
  Save,
  Mail,
  MessageCircle,
  UserCheck,
  Laptop,
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
  // --- 1. VALIDACIÓN DEL FORMULARIO ---
  // Valido que el formulario esté completo: debe haber un usuario, un motivo,
  // al menos un equipo marcado para devolver y todos los equipos marcados deben tener su estado físico definido.
  const isFormValid =
    formData.empleado_id &&
    formData.motivo &&
    formData.equiposADevolver.length > 0 &&
    formData.equiposADevolver.every((eq) => eq.estado_fisico_id !== '');

  // Catálogos locales
  const motivoOptions = [
    { value: 'Cese de Vínculo Laboral', label: 'Cese de Vínculo Laboral' },
    { value: 'Renovación de Equipo', label: 'Renovación de Equipo' },
    {
      value: 'Equipo Dañado / Falla Técnica',
      label: 'Equipo Dañado / Falla Técnica',
    },
  ];

  const opcionesCargador = [
    { value: true, label: 'Sí, devuelto' },
    { value: false, label: 'No (Falta)' },
  ];

  // --- 2. ESTILOS SHADCN PARA REACT-SELECT ---
  // Estilo principal para los selects grandes (40px de altura)
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
      height: '100%',
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

  // Estilo ajustado para los selects internos de cada equipo (36px de altura para encajar mejor)
  const miniSelectStyles = {
    ...customSelectStyles,
    control: (provided, state) => ({
      ...customSelectStyles.control(provided, state),
      height: '36px',
      minHeight: '36px',
      borderRadius: '6px',
    }),
    indicatorsContainer: (provided) => ({ ...provided, height: '36px' }),
  };

  // --- 3. LÓGICA DE SELECCIÓN DE EQUIPOS ---

  // Verifico si por la categoría del equipo es obligatorio preguntar si devolvió el cargador/accesorios
  const checkRequiereCargador = (categoria) => {
    return categoria === 'Laptop/PC' || categoria === 'Celular/Tablet';
  };

  // Agrego o quito un equipo del carrito de "equipos a devolver" al hacer clic en su fila
  const handleToggleEquipo = (equipo) => {
    const yaEsta = formData.equiposADevolver.find(
      (e) => e.equipo_id === equipo.id,
    );

    if (yaEsta) {
      // Si ya estaba, lo quito del arreglo
      setFormData({
        ...formData,
        equiposADevolver: formData.equiposADevolver.filter(
          (e) => e.equipo_id !== equipo.id,
        ),
      });
    } else {
      // Si no estaba, lo agrego por defecto como "Operativo"
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

  // Actualizo dinámicamente cualquier campo (estado, cargador, observación) del equipo seleccionado
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

        {equiposDetectados.length > 0 ? (
          <div className='equipos-list-container'>
            <label className='label-highlight primary mb-small'>
              <Laptop size={16} /> Seleccione equipos a devolver
            </label>

            {/* Pinto como lista interactiva (checkboxes) todos los equipos que tiene este usuario */}
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

                  {/* Si el usuario marcó este equipo para devolver, despliego sus opciones internas */}
                  {isSelected && (
                    <div className='equipo-options'>
                      <div className='input-group-grid'>
                        <div className='grid-col'>
                          <label className='mini-label'>
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
                            styles={miniSelectStyles}
                            menuPortalTarget={document.body}
                          />
                        </div>

                        {requiereCargador ? (
                          <div className='grid-col'>
                            <label className='mini-label'>
                              ¿Trajo Cargador?
                            </label>
                            <Select
                              options={opcionesCargador}
                              value={
                                opcionesCargador.find(
                                  (o) => o.value === devData.cargador,
                                ) || null
                              }
                              onChange={(o) =>
                                updateEquipoDetalle(eq.id, 'cargador', o.value)
                              }
                              styles={miniSelectStyles}
                              isSearchable={false}
                              menuPortalTarget={document.body}
                            />
                          </div>
                        ) : (
                          <div className='grid-col no-aplica-cargador'>
                            <span>No requiere cargador</span>
                          </div>
                        )}
                      </div>

                      {/* Si el estado es diferente a 1 ("Operativo"), obligo a escribir una observación del daño */}
                      {devData.estado_fisico_id &&
                        parseInt(devData.estado_fisico_id) !== 1 && (
                          <div className='input-group mt-small'>
                            <textarea
                              className='danger-textarea-mini'
                              placeholder='Describa el daño o problema detalladamente...'
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
          <div className='empty-equipment-card'>
            Seleccione un usuario para ver los equipos que tiene pendientes por
            devolver.
          </div>
        )}

        {/* CreatableSelect nos permite elegir un motivo de la lista o escribir uno completamente nuevo */}
        <div className='input-group mt-medium'>
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
