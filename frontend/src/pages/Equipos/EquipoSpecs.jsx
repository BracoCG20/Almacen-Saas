import {
  Laptop,
  Building2,
  Handshake,
  AlertTriangle,
  Barcode,
  Clock,
  CalendarDays,
} from 'lucide-react';
import './EquipoSpecs.scss';

const EquipoSpecs = ({ equipo, calcularAntiguedad, formatDate }) => {
  if (!equipo) return null;

  return (
    <div className='specs-grid-modern'>
      <div className='header-specs'>
        <div className='big-icon'>
          <Laptop size={32} />
        </div>
        <div className='title-info-wrapper'>
          <h3>
            {equipo.marca} {equipo.modelo}
          </h3>
          <div className='badge-wrapper'>
            <span
              className={`status-badge ${equipo.disponible ? 'operativo' : 'malogrado'}`}
            >
              {equipo.disponible ? 'DISPONIBLE' : 'INACTIVO'}
            </span>
            <span
              className={`ownership-badge ${equipo.es_propio ? 'owned' : 'rented'}`}
            >
              {equipo.es_propio ? (
                <>
                  <Building2 size={12} /> PROPIO
                </>
              ) : (
                <>
                  <Handshake size={12} /> ALQUILADO
                </>
              )}
            </span>
          </div>
          <div className='owner-info-text'>
            {equipo.es_propio
              ? `Empresa: ${equipo.empresa_nombre}`
              : `Proveedor: ${equipo.nombre_proveedor}`}
          </div>
        </div>
      </div>

      {equipo.observaciones && (
        <div className='observation-alert'>
          <h5>
            <AlertTriangle size={14} /> Observaciones del Equipo
          </h5>
          <p>"{equipo.observaciones}"</p>
        </div>
      )}

      <h4 className='section-subtitle'>Identificación y Adquisición</h4>

      <div className='grid-2-col'>
        <div className='info-box flex-row'>
          <div className='icon-wrapper'>
            <Barcode size={20} />
          </div>
          <div className='text-wrapper'>
            <span className='label'>Código Patrimonial</span>
            <span className='value'>{equipo.codigo_patrimonial || 'N/A'}</span>
          </div>
        </div>
        <div className='info-box'>
          <span className='label'>Número de Serie (S/N)</span>
          <span className='value'>{equipo.numero_serie}</span>
        </div>
      </div>

      <div className='grid-2-col'>
        <div className='info-box flex-row'>
          <div className='icon-wrapper secondary'>
            <CalendarDays size={20} />
          </div>
          <div className='text-wrapper'>
            <span className='label'>Fecha de Adquisición</span>
            <span className='value date-text'>
              {formatDate(equipo.fecha_adquisicion)}
            </span>
          </div>
        </div>
        <div className='info-box flex-row'>
          <div className='icon-wrapper primary'>
            <Clock size={20} />
          </div>
          <div className='text-wrapper'>
            <span className='label'>Tiempo de Uso</span>
            <span className='value highlight-text'>
              {calcularAntiguedad(equipo.fecha_adquisicion)}
            </span>
          </div>
        </div>
      </div>

      {equipo.especificaciones &&
        Object.keys(equipo.especificaciones).length > 0 && (
          <>
            <h4 className='section-subtitle mt-4'>Especificaciones Técnicas</h4>
            <div className='specs-list'>
              {Object.entries(equipo.especificaciones).map(
                ([key, value], index) => (
                  <div
                    key={key}
                    className={`spec-item ${index % 2 !== 0 ? 'odd' : ''}`}
                  >
                    <strong>{key}:</strong> <span>{value || 'N/A'}</span>
                  </div>
                ),
              )}
            </div>
          </>
        )}
    </div>
  );
};

export default EquipoSpecs;
