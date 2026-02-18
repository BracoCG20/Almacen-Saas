import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Trash,
  Plus,
  Save,
  AlertTriangle,
  Building2,
  Handshake,
  CalendarDays,
  Cpu,
  Barcode,
} from 'lucide-react';
import api from '../../service/api';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import './AddEquipoForm.scss';

const AddEquipoForm = ({ onSuccess, equipoToEdit }) => {
  // --- ESTADO PRINCIPAL DEL FORMULARIO ---
  const [formData, setFormData] = useState({
    empresa_id: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    codigo_patrimonial: '',
    estado_fisico_id: '',
    es_propio: true,
    proveedor_id: '',
    fecha_adquisicion: '',
    fecha_fin_alquiler: '',
    observaciones: '',
    ram: '',
    almacenamiento_valor: '',
    almacenamiento_unidad: 'GB',
    procesador: '',
  });

  // --- ESTADOS PARA EL CONSTRUCTOR RÁPIDO DE PROCESADOR ---
  const [builderMarca, setBuilderMarca] = useState(null);
  const [builderModelo, setBuilderModelo] = useState(null);
  const [builderGen, setBuilderGen] = useState(null);

  // --- ESTADOS DE LAS LISTAS DESPLEGABLES ---
  const [marcasOptions, setMarcasOptions] = useState([]);
  const [proveedoresOptions, setProveedoresOptions] = useState([]);
  const [empresasOptions, setEmpresasOptions] = useState([]);
  const [estadosFisicosOptions, setEstadosFisicosOptions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // --- ESPECIFICACIONES EXTRAS (DINÁMICAS) ---
  const [specsList, setSpecsList] = useState([]);

  // --- CONSTANTES DE OPCIONES ESTÁTICAS ---
  const condicionOptions = [
    { value: true, label: 'Equipo Propio' },
    { value: false, label: 'Equipo Alquilado / Leasing' },
  ];

  const unidadAlmacenamientoOptions = [
    { value: 'GB', label: 'GB' },
    { value: 'TB', label: 'TB' },
  ];

  const marcaProcOptions = [
    { value: 'Intel', label: 'Intel' },
    { value: 'AMD', label: 'AMD' },
    { value: 'Apple', label: 'Apple' },
  ];

  // --- FUNCIONES HELPERS PARA EL CONSTRUCTOR DE CPU ---
  const getModeloOptions = (marca) => {
    switch (marca) {
      case 'Intel':
        return [
          { value: 'Core i3', label: 'Core i3' },
          { value: 'Core i5', label: 'Core i5' },
          { value: 'Core i7', label: 'Core i7' },
          { value: 'Core i9', label: 'Core i9' },
          { value: 'Core Ultra 5', label: 'Core Ultra 5' },
          { value: 'Core Ultra 7', label: 'Core Ultra 7' },
          { value: 'Xeon', label: 'Xeon' },
        ];
      case 'AMD':
        return [
          { value: 'Ryzen 3', label: 'Ryzen 3' },
          { value: 'Ryzen 5', label: 'Ryzen 5' },
          { value: 'Ryzen 7', label: 'Ryzen 7' },
          { value: 'Ryzen 9', label: 'Ryzen 9' },
        ];
      case 'Apple':
        return [
          { value: 'M1', label: 'M1' },
          { value: 'M1 Pro', label: 'M1 Pro' },
          { value: 'M1 Max', label: 'M1 Max' },
          { value: 'M2', label: 'M2' },
          { value: 'M2 Pro', label: 'M2 Pro' },
          { value: 'M3', label: 'M3' },
          { value: 'M3 Pro', label: 'M3 Pro' },
          { value: 'M4', label: 'M4' },
        ];
      default:
        return [];
    }
  };

  const getGenOptions = (marca) => {
    switch (marca) {
      case 'Intel':
        return [
          { value: '8va Gen', label: '8va Gen' },
          { value: '9na Gen', label: '9na Gen' },
          { value: '10ma Gen', label: '10ma Gen' },
          { value: '11va Gen', label: '11va Gen' },
          { value: '12va Gen', label: '12va Gen' },
          { value: '13va Gen', label: '13va Gen' },
          { value: '14va Gen', label: '14va Gen' },
        ];
      case 'AMD':
        return [
          { value: 'Serie 3000', label: 'Serie 3000' },
          { value: 'Serie 4000', label: 'Serie 4000' },
          { value: 'Serie 5000', label: 'Serie 5000' },
          { value: 'Serie 6000', label: 'Serie 6000' },
          { value: 'Serie 7000', label: 'Serie 7000' },
          { value: 'Serie 8000', label: 'Serie 8000' },
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [resMarcas, resEmp, resEstados, resProv] = await Promise.all([
          api.get('/equipos/marcas').catch(() => ({ data: [] })),
          api.get('/empresas').catch(() => ({ data: [] })),
          api.get('/equipos/estados').catch(() => ({ data: [] })),
          api.get('/proveedores').catch(() => ({ data: [] })),
        ]);

        setMarcasOptions(
          resMarcas.data.map((m) => ({ value: m.nombre, label: m.nombre })),
        );
        setEmpresasOptions(
          resEmp.data
            .filter((e) => e.estado)
            .map((e) => ({ value: e.id, label: e.razon_social })),
        );
        setEstadosFisicosOptions(
          resEstados.data.map((e) => ({ value: e.id, label: e.nombre })),
        );
        setProveedoresOptions(
          resProv.data
            .filter((p) => p.estado)
            .map((p) => ({ value: p.id, label: p.razon_social })),
        );
      } catch (error) {
        console.error('Error cargando catálogos');
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (equipoToEdit) {
      let existingRam = '';
      let existingAlmacenamientoValor = '';
      let existingAlmacenamientoUnidad = 'GB';
      let existingProc = '';
      let otherSpecs = [];
      let parsedSpecs = {};
      if (typeof equipoToEdit.especificaciones === 'string') {
        try {
          parsedSpecs = JSON.parse(equipoToEdit.especificaciones);
        } catch (e) {}
      } else if (typeof equipoToEdit.especificaciones === 'object') {
        parsedSpecs = equipoToEdit.especificaciones || {};
      }

      Object.entries(parsedSpecs).forEach(([k, v]) => {
        const keyLower = k.toLowerCase().trim();
        if (keyLower === 'ram') {
          existingRam = String(v).replace(/[^\d.]/g, '');
        } else if (keyLower === 'procesador') {
          existingProc = v;
        } else if (keyLower === 'almacenamiento') {
          existingAlmacenamientoValor = String(v).replace(/[^\d.]/g, '');
          if (String(v).toUpperCase().includes('TB'))
            existingAlmacenamientoUnidad = 'TB';
        } else {
          otherSpecs.push({ key: k, value: v });
        }
      });

      setFormData({
        empresa_id: equipoToEdit.empresa_id || '',
        marca: equipoToEdit.marca || '',
        modelo: equipoToEdit.modelo || '',
        numero_serie: equipoToEdit.numero_serie || '',
        codigo_patrimonial: equipoToEdit.codigo_patrimonial || '',
        estado_fisico_id: equipoToEdit.estado_fisico_id || '',
        es_propio: equipoToEdit.es_propio !== false,
        proveedor_id: equipoToEdit.proveedor_id || '',
        fecha_adquisicion: equipoToEdit.fecha_adquisicion
          ? equipoToEdit.fecha_adquisicion.split('T')[0]
          : '',
        fecha_fin_alquiler: equipoToEdit.fecha_fin_alquiler
          ? equipoToEdit.fecha_fin_alquiler.split('T')[0]
          : '',
        observaciones: equipoToEdit.observaciones || '',
        ram: existingRam,
        almacenamiento_valor: existingAlmacenamientoValor,
        almacenamiento_unidad: existingAlmacenamientoUnidad,
        procesador: existingProc,
      });

      setSpecsList(otherSpecs);
    }
  }, [equipoToEdit]);

  // --- EFECTO PARA ARMAR EL STRING DEL PROCESADOR ---
  useEffect(() => {
    if (builderMarca || builderModelo || builderGen) {
      const parts = [
        builderMarca ? builderMarca.value : '',
        builderModelo ? builderModelo.value : '',
        builderGen ? builderGen.value : '',
      ].filter(Boolean);
      setFormData((prev) => ({ ...prev, procesador: parts.join(' ') }));
    }
  }, [builderMarca, builderModelo, builderGen]);

  // --- MANEJADORES DE INPUTS ---
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSelectChange = (name, newValue) => {
    setFormData({ ...formData, [name]: newValue ? newValue.value : '' });
  };

  const handleCondicionChange = (newValue) => {
    const esPropio = newValue.value;
    setFormData({
      ...formData,
      es_propio: esPropio,
      proveedor_id: esPropio ? '' : formData.proveedor_id,
      fecha_fin_alquiler: esPropio ? '' : formData.fecha_fin_alquiler,
    });
  };

  const handleBuilderMarcaChange = (selected) => {
    setBuilderMarca(selected);
    setBuilderModelo(null);
    setBuilderGen(null);
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specsList];
    newSpecs[index][field] = value;
    setSpecsList(newSpecs);
  };

  const addSpecRow = () => setSpecsList([...specsList, { key: '', value: '' }]);
  const removeSpecRow = (index) =>
    setSpecsList(specsList.filter((_, i) => i !== index));

  // --- ENVÍO DEL FORMULARIO ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.empresa_id)
      return toast.warning('Debes seleccionar la Empresa a cargo del equipo.');
    if (!formData.estado_fisico_id)
      return toast.warning('Debes indicar el Estado Físico del equipo.');
    if (!formData.es_propio && !formData.proveedor_id)
      return toast.warning(
        'Debes seleccionar un Proveedor para equipos alquilados.',
      );

    // 1. Armamos el JSON de Especificaciones
    const specsObject = specsList.reduce((acc, item) => {
      if (item.key && item.value) acc[item.key] = item.value;
      return acc;
    }, {});

    if (formData.ram) specsObject['RAM'] = `${formData.ram} GB`;
    if (formData.almacenamiento_valor)
      specsObject['Almacenamiento'] =
        `${formData.almacenamiento_valor} ${formData.almacenamiento_unidad}`;
    if (formData.procesador) specsObject['Procesador'] = formData.procesador;

    // 2. Extraemos los campos temporales del formData
    const {
      ram,
      almacenamiento_valor,
      almacenamiento_unidad,
      procesador,
      ...restFormData
    } = formData;

    const payload = { ...restFormData, especificaciones: specsObject };

    try {
      if (equipoToEdit) {
        await api.put(`/equipos/${equipoToEdit.id}`, payload);
        toast.success('Equipo actualizado correctamente');
      } else {
        await api.post('/equipos', payload);
        toast.success('Equipo registrado correctamente');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al guardar el equipo');
    }
  };

  // --- ESTILOS DE SELECT ---
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '8px',
      borderColor: state.isFocused ? '#4f46e5' : '#cbd5e1',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(79, 70, 229, 0.15)' : 'none',
      minHeight: '50px',
      height: '50px',
      backgroundColor: state.isDisabled ? '#f8fafc' : '#fff',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
    }),
    valueContainer: (provided) => ({ ...provided, padding: '0 14px' }),
    input: (provided) => ({ ...provided, margin: '0px', padding: '0px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b',
      fontSize: '0.95rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8',
      fontSize: '0.95rem',
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

  return (
    <form
      className='equipo-form'
      onSubmit={handleSubmit}
    >
      <div className='form-row'>
        <div className='input-group'>
          <label style={{ color: '#4f46e5' }}>
            <Building2 size={16} /> Empresa Asignada *
          </label>
          <Select
            options={empresasOptions}
            value={empresasOptions.find(
              (op) => op.value === formData.empresa_id,
            )}
            onChange={(opt) => handleSelectChange('empresa_id', opt)}
            styles={customSelectStyles}
            placeholder='Seleccione...'
            isLoading={loadingData}
            menuPortalTarget={document.body}
            required
          />
        </div>
        <div className='input-group'>
          <label>
            <Handshake size={16} /> Condición de Adquisición
          </label>
          <Select
            options={condicionOptions}
            value={condicionOptions.find(
              (op) => op.value === formData.es_propio,
            )}
            onChange={handleCondicionChange}
            styles={customSelectStyles}
            isSearchable={false}
            menuPortalTarget={document.body}
          />
        </div>
      </div>

      {!formData.es_propio && (
        <div
          className='form-row'
          style={{
            backgroundColor: '#fff7ed',
            padding: '15px',
            borderRadius: '10px',
            border: '1px solid #fdba74',
            marginTop: '5px',
          }}
        >
          <div className='input-group'>
            <label style={{ color: '#ea580c' }}>
              <Building2 size={16} /> Proveedor *
            </label>
            <Select
              options={proveedoresOptions}
              value={proveedoresOptions.find(
                (op) => op.value === formData.proveedor_id,
              )}
              onChange={(opt) => handleSelectChange('proveedor_id', opt)}
              styles={customSelectStyles}
              placeholder='Seleccione Proveedor...'
              isLoading={loadingData}
              menuPortalTarget={document.body}
            />
          </div>
          <div className='input-group'>
            <label>
              <CalendarDays size={14} /> Fin Contrato
            </label>
            <input
              type='date'
              name='fecha_fin_alquiler'
              value={formData.fecha_fin_alquiler}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      <div className='form-row'>
        <div className='input-group'>
          <label>
            <CalendarDays size={16} /> Fecha Adquisición *
          </label>
          <input
            type='date'
            name='fecha_adquisicion'
            value={formData.fecha_adquisicion}
            onChange={handleChange}
            required
          />
        </div>
        <div className='input-group'>
          <label>Marca *</label>
          <CreatableSelect
            isClearable
            isDisabled={loadingData}
            onChange={(opt) => handleSelectChange('marca', opt)}
            options={marcasOptions}
            value={
              marcasOptions.find((op) => op.value === formData.marca) ||
              (formData.marca
                ? { label: formData.marca, value: formData.marca }
                : null)
            }
            styles={customSelectStyles}
            placeholder='Escribir o buscar...'
            menuPortalTarget={document.body}
            required
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label>Modelo *</label>
          <input
            name='modelo'
            value={formData.modelo}
            onChange={handleChange}
            required
            placeholder='Ej: Latitude 5420'
          />
        </div>
        <div className='input-group'>
          <label>
            <Barcode size={14} /> Serie (S/N) *
          </label>
          <input
            name='numero_serie'
            value={formData.numero_serie}
            onChange={handleChange}
            required
            placeholder='S/N del fabricante'
          />
        </div>
      </div>

      <div className='form-row'>
        <div className='input-group'>
          <label style={{ color: '#f59e0b' }}>
            <AlertTriangle size={16} /> Estado Físico *
          </label>
          <Select
            options={estadosFisicosOptions}
            value={estadosFisicosOptions.find(
              (op) => op.value === formData.estado_fisico_id,
            )}
            onChange={(opt) => handleSelectChange('estado_fisico_id', opt)}
            styles={customSelectStyles}
            isSearchable={false}
            placeholder='Seleccione...'
            menuPortalTarget={document.body}
            required
          />
        </div>
        <div className='input-group'>
          <label>Observaciones Físicas</label>
          <input
            name='observaciones'
            value={formData.observaciones}
            onChange={handleChange}
            placeholder='Detalles, golpes, arañazos, etc.'
          />
        </div>
      </div>

      <div className='specs-section'>
        <h4>Especificaciones Principales</h4>
        <div className='form-row'>
          <div className='input-group'>
            <label>Memoria RAM (GB)</label>
            <input
              type='number'
              name='ram'
              value={formData.ram}
              onChange={handleChange}
              placeholder='Ej: 8, 16, 32'
            />
          </div>
          <div className='input-group'>
            <label>Almacenamiento</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type='number'
                name='almacenamiento_valor'
                value={formData.almacenamiento_valor}
                onChange={handleChange}
                placeholder='Ej: 512'
                style={{ flex: 1 }}
              />
              <div style={{ width: '100px' }}>
                <Select
                  name='almacenamiento_unidad'
                  options={unidadAlmacenamientoOptions}
                  value={unidadAlmacenamientoOptions.find(
                    (op) => op.value === formData.almacenamiento_unidad,
                  )}
                  onChange={(opt) =>
                    handleSelectChange('almacenamiento_unidad', opt)
                  }
                  styles={customSelectStyles}
                  isSearchable={false}
                  menuPortalTarget={document.body}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className='input-group'
          style={{ marginTop: '10px' }}
        >
          <label>Procesador</label>
          <input
            name='procesador'
            value={formData.procesador}
            onChange={handleChange}
            placeholder='Ej: Intel Core i7 10ma Gen'
          />
        </div>

        <div className='procesador-builder'>
          <span className='builder-title'>
            <Cpu size={14} /> Constructor Rápido de Procesador
          </span>
          <div className='builder-grid'>
            <Select
              options={marcaProcOptions}
              value={builderMarca}
              onChange={handleBuilderMarcaChange}
              placeholder='Marca...'
              styles={customSelectStyles}
              isClearable
              menuPortalTarget={document.body}
            />
            <Select
              options={getModeloOptions(builderMarca?.value)}
              value={builderModelo}
              onChange={setBuilderModelo}
              placeholder='Modelo...'
              styles={customSelectStyles}
              isDisabled={!builderMarca}
              isClearable
              menuPortalTarget={document.body}
            />
            <Select
              options={getGenOptions(builderMarca?.value)}
              value={builderGen}
              onChange={setBuilderGen}
              placeholder='Generación...'
              styles={customSelectStyles}
              isDisabled={!builderMarca || builderMarca?.value === 'Apple'}
              isClearable
              menuPortalTarget={document.body}
            />
          </div>
        </div>

        <h4 style={{ marginTop: '1.5rem' }}>
          Otras Especificaciones (Opcional)
        </h4>
        {specsList.map((spec, index) => (
          <div
            className='spec-row'
            key={index}
          >
            <input
              placeholder='Ej: Tarjeta de Video'
              value={spec.key}
              onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
            />
            <input
              placeholder='Ej: RTX 3060 4GB'
              value={spec.value}
              onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
            />
            <button
              type='button'
              className='btn-remove'
              onClick={() => removeSpecRow(index)}
            >
              <Trash size={18} />
            </button>
          </div>
        ))}
        <button
          type='button'
          className='btn-add-spec'
          onClick={addSpecRow}
        >
          <Plus size={18} /> Agregar componente extra
        </button>
      </div>

      <div className='form-actions'>
        <button
          type='submit'
          className='btn-submit'
        >
          <Save size={20} />{' '}
          {equipoToEdit ? 'Actualizar Cambios' : 'Guardar Nuevo Equipo'}
        </button>
      </div>
    </form>
  );
};

export default AddEquipoForm;
