import React from "react";
import { History, Building2, Handshake, AlertTriangle } from "lucide-react";
// IMPORTANTE: Esta línea conecta los estilos corregidos
import "./EquipoHistorial.scss";

const EquipoHistorial = ({ equipo, historyData }) => {
	return (
		<div className='history-container'>
			<div className='history-header'>
				<div className='big-icon'>
					<History size={36} />
				</div>
				<div className='title-info-wrapper'>
					<h3>
						{equipo?.marca} {equipo?.modelo}
					</h3>
					<span className='serial-info'>
						S/N: {equipo?.numero_serie} | Cód:{" "}
						{equipo?.codigo_patrimonial || "N/A"}
					</span>
				</div>
			</div>

			{historyData.length === 0 ? (
				<p className='no-history'>
					No hay movimientos registrados para este equipo.
				</p>
			) : (
				<div className='history-timeline'>
					{historyData.map((hist) => (
						<div key={hist.id} className='timeline-item'>
							{/* FECHA (Izquierda) */}
							<div className='timeline-date'>
								<strong>
									{new Date(hist.fecha_accion).toLocaleDateString("es-PE")}
								</strong>
								<span>
									{new Date(hist.fecha_accion).toLocaleTimeString("es-PE", {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>

							{/* CONTENIDO (Derecha) */}
							<div className='timeline-content'>
								<h5>{hist.accion_realizada}</h5>

								{hist.descripcion_cambio && (
									<p className='change-desc'>{hist.descripcion_cambio}</p>
								)}

								<div className='hist-details-grid'>
									<span
										className={`hist-tag ${hist.es_propio ? "owned" : "rented"}`}
									>
										{hist.es_propio ? (
											<Building2 size={10} />
										) : (
											<Handshake size={10} />
										)}
										{hist.es_propio
											? hist.empresa_nombre
											: hist.proveedor_nombre}
									</span>

									{/* Ocultamos estados desconocidos */}
									{hist.estado_fisico_nombre && (
										<span
											className={`status-badge ${hist.estado_fisico_nombre?.toLowerCase() === "operativo" ? "operativo" : "mantenimiento"}`}
										>
											{hist.estado_fisico_nombre}
										</span>
									)}

									<span
										className={`status-badge ${hist.disponible ? "operativo" : "malogrado"}`}
									>
										{hist.disponible ? "DISPONIBLE" : "INACTIVO"}
									</span>
								</div>

								{hist.observaciones_equipo && (
									<div className='hist-observations'>
										<AlertTriangle size={12} />
										<span>
											<strong>Obs:</strong> {hist.observaciones_equipo}
										</span>
									</div>
								)}

								<div className='timeline-footer'>
									<small>
										Responsable:{" "}
										{hist.usuario_nombres
											? `${hist.usuario_nombres} ${hist.usuario_apellidos}`
											: hist.usuario_email || "Sistema"}
									</small>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default EquipoHistorial;
