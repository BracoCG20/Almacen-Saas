import React, { useState } from "react";
import { Clock, UserCheck } from "lucide-react";
import "./ColaboradorHistorial.scss"; // Verifica que la ruta coincida con tu estructura

const ColaboradorHistorial = ({ historyData }) => {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 4;

	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
	const totalPages = Math.ceil(historyData.length / itemsPerPage);

	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	return (
		<div className='audit-modal-content'>
			{historyData.length === 0 ? (
				<div className='empty-audit'>
					<p>No hay registros en el historial de este colaborador.</p>
				</div>
			) : (
				<>
					<ul className='audit-timeline'>
						{currentItems.map((log) => (
							<li
								key={log.id}
								className={
									log.accion_realizada.includes("BAJA") ? "error-log" : ""
								}
							>
								<div className='audit-card'>
									<div className='log-header'>
										<strong>{log.accion_realizada}</strong>
										<span className='date-badge'>
											<Clock size={12} />{" "}
											{new Date(log.fecha_accion).toLocaleString("es-PE")}
										</span>
									</div>
									<p className='log-description'>{log.descripcion_cambio}</p>

									<div className='log-footer-grid'>
										<div className='footer-item'>
											<UserCheck size={14} className='icon-primary' />
											<span>
												Por:{" "}
												<strong>
													{log.usuario_nombres
														? `${log.usuario_nombres} ${log.usuario_apellidos}`
														: "Sistema"}
												</strong>
											</span>
										</div>
									</div>
								</div>
							</li>
						))}
					</ul>

					{historyData.length > itemsPerPage && (
						<div className='pagination-footer'>
							<div className='info'>
								Mostrando <strong>{indexOfFirstItem + 1}</strong> a{" "}
								<strong>{Math.min(indexOfLastItem, historyData.length)}</strong>{" "}
								de <strong>{historyData.length}</strong>
							</div>
							<div className='controls'>
								<button
									onClick={() => paginate(currentPage - 1)}
									disabled={currentPage === 1}
								>
									Ant
								</button>
								<span>
									{currentPage} / {totalPages}
								</span>
								<button
									onClick={() => paginate(currentPage + 1)}
									disabled={currentPage === totalPages}
								>
									Sig
								</button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};

export default ColaboradorHistorial;
