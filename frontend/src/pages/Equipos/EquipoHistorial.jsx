import React, { useState, useEffect } from "react";
import {
	History,
	Building2,
	Handshake,
	AlertTriangle,
	ChevronLeft,
	ChevronRight,
	Clock,
	User,
} from "lucide-react";
import "./EquipoHistorial.scss";

const EquipoHistorial = ({ equipo, historyData }) => {
	// --- ESTADOS DE PAGINACIÓN ---
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 3;

	// Reiniciar la página a 1 si cambia el equipo seleccionado
	useEffect(() => {
		setCurrentPage(1);
	}, [equipo]);

	// --- LÓGICA DE PAGINACIÓN ---
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(historyData.length / itemsPerPage);

	const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
				<>
					<ul className='audit-timeline'>
						{currentItems.map((hist) => (
							<li key={hist.id}>
								<div className='audit-card'>
									{/* CABECERA: Título de Acción y Fecha */}
									<div className='log-header'>
										<strong>{hist.accion_realizada}</strong>
										<span className='date-badge'>
											<Clock size={12} />{" "}
											{new Date(hist.fecha_accion).toLocaleString("es-PE", {
												day: "2-digit",
												month: "2-digit",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
												hour12: true,
											})}
										</span>
									</div>

									{/* CUERPO: Descripción principal */}
									{hist.descripcion_cambio && (
										<p className='change-desc'>{hist.descripcion_cambio}</p>
									)}

									{/* ETIQUETAS: Propiedad, Estado, Disponibilidad */}
									<div className='hist-details-grid'>
										<span
											className={`hist-tag ${hist.es_propio ? "owned" : "rented"}`}
										>
											{hist.es_propio ? (
												<Building2 size={10} />
											) : (
												<Handshake size={10} />
											)}
											{hist.es_propio ? "PROPIO" : "ALQUILADO"}
										</span>

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

									{/* OBSERVACIONES EXTRAS */}
									{hist.observaciones_equipo && (
										<div className='hist-observations'>
											<AlertTriangle
												size={12}
												style={{ flexShrink: 0, marginTop: "2px" }}
											/>
											<span>
												<strong>Obs:</strong> {hist.observaciones_equipo}
											</span>
										</div>
									)}

									{/* FOOTER EN 2 COLUMNAS (Igual que en Servicios) */}
									<div className='log-footer-grid'>
										<div className='footer-item'>
											<Building2 size={14} style={{ color: "#059669" }} />
											<span>
												Empresa:{" "}
												<strong>
													{hist.es_propio
														? hist.empresa_nombre
														: hist.proveedor_nombre}
												</strong>
											</span>
										</div>
										<div className='footer-item'>
											<User size={14} style={{ color: "#4f46e5" }} />
											<span>
												Por:{" "}
												<strong>
													{hist.usuario_nombres
														? `${hist.usuario_nombres} ${hist.usuario_apellidos}`
														: "Sistema"}
												</strong>
											</span>
										</div>
									</div>
								</div>
							</li>
						))}
					</ul>

					{/* PAGINACIÓN COMPACTA */}
					{historyData.length > itemsPerPage && (
						<div
							className='pagination-footer'
							style={{
								borderTop: "none",
								padding: "15px 5px 0 5px",
								marginTop: "10px",
								background: "transparent",
							}}
						>
							<div
								className='info'
								style={{ fontSize: "0.8rem", color: "#64748b" }}
							>
								Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
								<strong>{Math.min(indexOfLastItem, historyData.length)}</strong>{" "}
								de <strong>{historyData.length}</strong>
							</div>
							<div
								className='controls'
								style={{ display: "flex", alignItems: "center", gap: "10px" }}
							>
								<button
									onClick={() => paginate(currentPage - 1)}
									disabled={currentPage === 1}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "3px",
										padding: "4px 10px",
										borderRadius: "6px",
										fontSize: "0.8rem",
										fontWeight: "600",
										border: "1px solid #e2e8f0",
										background: currentPage === 1 ? "#f8fafc" : "#fff",
										cursor: currentPage === 1 ? "not-allowed" : "pointer",
										color: currentPage === 1 ? "#94a3b8" : "#475569",
									}}
								>
									<ChevronLeft size={14} /> Ant
								</button>
								<span
									style={{
										fontSize: "0.8rem",
										color: "#64748b",
										fontWeight: "600",
									}}
								>
									{currentPage} / {totalPages}
								</span>
								<button
									onClick={() => paginate(currentPage + 1)}
									disabled={currentPage === totalPages}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "3px",
										padding: "4px 10px",
										borderRadius: "6px",
										fontSize: "0.8rem",
										fontWeight: "600",
										border: "1px solid #e2e8f0",
										background: currentPage === totalPages ? "#f8fafc" : "#fff",
										cursor:
											currentPage === totalPages ? "not-allowed" : "pointer",
										color: currentPage === totalPages ? "#94a3b8" : "#475569",
									}}
								>
									Sig <ChevronRight size={14} />
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default EquipoHistorial;
