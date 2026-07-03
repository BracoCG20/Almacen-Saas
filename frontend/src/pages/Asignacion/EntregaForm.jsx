//frontend/src/pages/Asignacion/EntregaForm.jsx
import {
  Save,
  Mail,
  MessageCircle,
  Laptop,
  User,
  Plus,
  Trash2,
} from 'lucide-react';
import Select from 'react-select';
import './EntregaForm.scss';

const EntregaForm = ({
  equiposOptions,
  usuariosOptions,
  formData,
  setFormData,
  onAction,
}) => {
  // Valido que el formulario tenga un destinatario y al menos un equipo seleccionado correctamente.
  const isFormValid =
    formData.empleado_id &&
    formData.equipos.length > 0 &&
    formData.equipos.every((eq) => eq.equipo_id !== '');

  // Defino los estilos personalizados para react-select manteniendo nuestro diseño limpio.
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#7c3aed' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(124, 58, 237, 0.1)' : 'none',
      minHeight: '40px',
      height: '40px',
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
      fontSize: '0.8rem',
      fontWeight: '500',
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      margin: '0px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.8rem',
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
      fontSize: '0.8rem',
      padding: '8px 12px',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  // Agrego una nueva fila vacía al arreglo de equipos para realizar asignaciones múltiples.
  const handleAddEquipo = () => {
    setFormData({
      ...formData,
      equipos: [...formData.equipos, { equipo_id: '', cargador: true }],
    });
  };

  // Elimino una fila específica del arreglo de equipos según su índice.
  const handleRemoveEquipo = (index) => {
    const nuevosEquipos = [...formData.equipos];
    nuevosEquipos.splice(index, 1);
    setFormData({ ...formData, equipos: nuevosEquipos });
  };

  // Verifico si la categoría del equipo requiere que mostremos el checkbox de "Cargador/Accesorios".
  const checkRequiereCargador = (equipoId) => {
    if (!equipoId) return true;
    const option = equiposOptions.find((op) => op.value === equipoId);
    if (!option || !option.equipoFullData) return true;

    const categoria = option.equipoFullData.categoria;
    return categoria === 'Laptop/PC' || categoria === 'Celular/Tablet';
  };

  // Actualizo el ID del equipo en una fila específica y configuro si requiere cargador automáticamente.
  const handleChangeEquipo = (index, equipoId) => {
    const nuevosEquipos = [...formData.equipos];
    nuevosEquipos[index].equipo_id = equipoId;

    if (!checkRequiereCargador(equipoId)) {
      nuevosEquipos[index].cargador = null; // No aplica
    } else {
      nuevosEquipos[index].cargador = true; // Aplica y se marca por defecto
    }

    setFormData({ ...formData, equipos: nuevosEquipos });
  };

  // Alterno el valor del checkbox de cargador para una fila en concreto.
  const handleChangeCargador = (index, value) => {
    const nuevosEquipos = [...formData.equipos];
    nuevosEquipos[index].cargador = value;
    setFormData({ ...formData, equipos: nuevosEquipos });
  };

  // Filtro el Select para que no se pueda elegir un equipo que ya seleccioné en otra de las filas.
  const getOpcionesDisponibles = (currentIndex) => {
    const idsSeleccionados = formData.equipos.map((eq, i) =>
      i !== currentIndex ? eq.equipo_id : null,
    );
    return equiposOptions.filter((op) => !idsSeleccionados.includes(op.value));
  };

  return (
    <div className='form-card'>
      <div className='input-group spacing-bottom'>
        <label>
          <User size={16} /> Colaborador (Destinatario)
        </label>
        <Select
          options={usuariosOptions}
          value={
            usuariosOptions.find((op) => op.value === formData.empleado_id) ||
            null
          }
          onChange={(op) =>
            setFormData({ ...formData, empleado_id: op?.value || '' })
          }
          placeholder='Seleccione un colaborador...'
          styles={customSelectStyles}
          menuPortalTarget={document.body}
        />
      </div>

      <div className='equipos-section'>
        <label className='section-title'>
          <Laptop size={16} /> Equipos a Asignar
        </label>

        {formData.equipos.map((item, index) => {
          const requiereCargador = checkRequiereCargador(item.equipo_id);

          return (
            <div
              key={index}
              className='equipo-item-card'
            >
              <div className='equipo-item-content'>
                <div className='input-group'>
                  <Select
                    options={getOpcionesDisponibles(index)}
                    value={
                      equiposOptions.find(
                        (op) => op.value === item.equipo_id,
                      ) || null
                    }
                    onChange={(op) =>
                      handleChangeEquipo(index, op?.value || '')
                    }
                    placeholder={`Seleccione el equipo #${index + 1}...`}
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                  />
                </div>

                {requiereCargador && (
                  <label className='checkbox-card compact-checkbox'>
                    <input
                      type='checkbox'
                      checked={item.cargador === true}
                      onChange={(e) =>
                        handleChangeCargador(index, e.target.checked)
                      }
                    />
                    <span>¿Incluye Cargador / Accesorios?</span>
                  </label>
                )}
              </div>

              {formData.equipos.length > 1 && (
                <button
                  type='button'
                  onClick={() => handleRemoveEquipo(index)}
                  className='btn-remove-equipo'
                  title='Quitar equipo'
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          );
        })}

        <button
          type='button'
          onClick={handleAddEquipo}
          className='btn-add-equipo-shadcn'
        >
          <Plus size={16} /> Añadir equipo adicional
        </button>
      </div>

      <div
        className='actions-container'
        id='tour-asignacion-acciones'
      >
        <button
          type='button'
          onClick={() => onAction('GUARDAR')}
          className='btn-action gray'
          disabled={!isFormValid}
        >
          <Save size={16} /> Solo Guardar y Ver Acta
        </button>
        <button
          type='button'
          onClick={() => onAction('EMAIL')}
          className='btn-action blue'
          disabled={!isFormValid}
        >
          <Mail size={16} /> Guardar y Enviar por Correo
        </button>
        <button
          type='button'
          onClick={() => onAction('WHATSAPP')}
          className='btn-action green'
          disabled={!isFormValid}
        >
          <MessageCircle size={16} /> Guardar y Enviar por WhatsApp
        </button>
      </div>
    </div>
  );
};

export default EntregaForm;
