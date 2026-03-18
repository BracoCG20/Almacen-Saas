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
  // Guard clause: Si por alguna razón el modal se abre sin un equipo cargado, no renderizo nada.
  if (!equipo) return null;

  return (
    <div className='specs-grid-modern'>
      {/* --- CABECERA PRINCIPAL --- */}
      {/* Muestro la marca, modelo y etiquetas visuales (badges) para saber su estado rápidamente */}
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

          {/* Identifico a quién le pertenece el equipo realmente */}
          <div className='owner-info-text'>
            {equipo.es_propio
              ? `Empresa: ${equipo.empresa_nombre}`
              : `Proveedor: ${equipo.nombre_proveedor}`}
          </div>
        </div>
      </div>

      {/* --- ALERTAS / OBSERVACIONES --- */}
      {/* Solo renderizo este bloque si el equipo tiene alguna nota sobre daños o detalles físicos */}
      {equipo.observaciones && (
        <div className='observation-alert'>
          <h5>
            <AlertTriangle size={14} /> Observaciones del Equipo
          </h5>
          <p>"{equipo.observaciones}"</p>
        </div>
      )}

      {/* --- SECCIÓN 1: IDENTIFICACIÓN Y TIEMPO DE VIDA --- */}
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

      {/* --- SECCIÓN 2: ESPECIFICACIONES TÉCNICAS DINÁMICAS --- */}
      {/* Verifico si el objeto de especificaciones existe y tiene al menos una llave antes de pintar la sección */}
      {equipo.especificaciones &&
        Object.keys(equipo.especificaciones).length > 0 && (
          <>
            <h4 className='section-subtitle mt-4'>Especificaciones Técnicas</h4>
            <div className='specs-list'>
              {Object.entries(equipo.especificaciones).map(
                ([key, value], index) => (
                  <div
                    key={key}
                    // Intercalo los colores de fondo para simular un estilo de tabla (Zebra striping)
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
