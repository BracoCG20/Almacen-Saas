//frontend/src/pages/Directorio/DirectorioStats.jsx
import { Cloud, ShieldCheck } from 'lucide-react';
import './DirectorioStats.scss';

const DirectorioStats = ({ estadisticas }) => {
  return (
    <div className='stats-grid'>
      {/* Itero sobre el arreglo de estadísticas para generar una tarjeta por cada plan de Google Workspace */}
      {estadisticas.map((stat, idx) => {
        // Identifico si es el plan Starter para asignarle un color o ícono distinto al Standard
        const isStarter = stat.tipo_licencia === 'BUSINESS_STARTER';

        // Calculo matemáticamente el porcentaje de uso para rellenar la barra de progreso
        const porcentaje =
          stat.total > 0 ? Math.round((stat.usadas / stat.total) * 100) : 0;

        return (
          <div
            key={idx}
            className={`stat-card-mini ${isStarter ? 'starter' : 'standard'}`}
          >
            {/* Cabecera: Título y porcentaje de uso */}
            <div className='card-header'>
              <div className='title-wrapper'>
                <div className='icon-sm'>
                  {isStarter ? <Cloud size={16} /> : <ShieldCheck size={16} />}
                </div>
                <h4>{stat.tipo_licencia.replace('_', ' ')}</h4>
              </div>
              <span className='percentage-badge'>{porcentaje}% en uso</span>
            </div>

            {/* Barra de progreso visual que se llena según el cálculo anterior */}
            <div className='progress-track'>
              <div
                className='progress-fill'
                style={{ width: `${porcentaje}%` }}
              ></div>
            </div>

            {/* Métricas detalladas: Cuántas compramos, cuántas gastamos y cuántas sobran */}
            <div className='card-metrics'>
              <div className='metric-item'>
                <span className='label'>Total Compradas</span>
                <span className='value'>{stat.total}</span>
              </div>
              <div className='divider'></div>
              <div className='metric-item'>
                <span className='label'>Asignadas</span>
                <span className='value'>{stat.usadas}</span>
              </div>
              <div className='divider'></div>
              <div className='metric-item'>
                <span className='label'>Disponibles</span>
                <span className='value free'>{stat.disponibles}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DirectorioStats;
