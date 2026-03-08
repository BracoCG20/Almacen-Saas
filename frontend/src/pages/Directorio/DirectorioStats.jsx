import React from "react";
import { Cloud, ShieldCheck } from "lucide-react";
import "./DirectorioStats.scss";

const DirectorioStats = ({ estadisticas }) => {
	return (
		<div className='stats-grid'>
			{estadisticas.map((stat, idx) => {
				const isStarter = stat.tipo_licencia === "BUSINESS_STARTER";
				const porcentaje =
					stat.total > 0 ? Math.round((stat.usadas / stat.total) * 100) : 0;

				return (
					<div
						key={idx}
						className={`stat-card-mini ${isStarter ? "starter" : "standard"}`}
					>
						<div className='card-header'>
							<div className='title-wrapper'>
								<div className='icon-sm'>
									{isStarter ? <Cloud size={16} /> : <ShieldCheck size={16} />}
								</div>
								<h4>{stat.tipo_licencia.replace("_", " ")}</h4>
							</div>
							<span className='percentage-badge'>{porcentaje}% en uso</span>
						</div>

						<div className='progress-track'>
							<div
								className='progress-fill'
								style={{ width: `${porcentaje}%` }}
							></div>
						</div>

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
