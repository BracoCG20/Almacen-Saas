import React from "react";
import {
	History,
	Check,
	X as IconX,
	FileText,
	Upload,
	Eye,
	Ban,
	Mail,
	AlertTriangle,
	CalendarDays,
	Circle,
	Clock,
	Barcode, // <-- Nuevo icono importado
} from "lucide-react";

const DevolucionTable = ({
	historial,
	onVerPdf,
	onVerFirmado,
	onSubirClick,
	onInvalidar,
	onReenviarCorreo,
}) => {
	// Separamos el formato de Fecha y Hora para apilarlos
	const formatDateOnly = (isoString) => {
		if (!isoString) return "-";
		const date = new Date(
			isoString.endsWith("Z") ? isoString : `${isoString}Z`,
		);
		return date.toLocaleDateString("es-PE", {
			timeZone: "America/Lima",
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
		});
	};

	const formatTimeOnly = (isoString) => {
		if (!isoString) return "";
		const date = new Date(
			isoString.endsWith("Z") ? isoString : `${isoString}Z`,
		);
		return date.toLocaleTimeString("es-PE", {
			timeZone: "America/Lima",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	const getStatusBadge = (estado) => {
		const estLower = (estado || "").toLowerCase().trim();
		if (estLower === "operativo")
			return { className: "operativo", text: "Operativo", Icon: Check };

		if (["inoperativo", "malogrado", "mantenimiento"].includes(estLower))
			return { className: "mantenimiento", text: estado, Icon: IconX };

		if (["robado", "perdido"].includes(estLower))
			return { className: "malogrado", text: estado, Icon: IconX };

		return { className: "desconocido", text: estado || "Desc.", Icon: Circle };
	};

	return (
		<div className='table-container'>
			<div className='table-header-title'>
				<h3>
					<History size={18} /> Últimas Devoluciones
				</h3>
			</div>
			<table>
				<thead>
					<tr>
						<th>Fecha y Hora</th>
						<th>Equipo Devuelto</th>
						<th>Usuario</th>
						<th>Motivo</th>
						<th className='center'>Estado</th>
						<th className='center'>Carg.</th>
						<th className='center'>Correo</th>
						<th className='center'>Acta</th>
						<th className='center'>Firma</th>
					</tr>
				</thead>
				<tbody>
					{historial.length === 0 ? (
						<tr>
							<td colSpan='9' className='no-data'>
								No hay devoluciones registradas aún.
							</td>
						</tr>
					) : (
						historial.map((h) => {
							const status = getStatusBadge(h.estado_equipo_momento);
							const StatusIcon = status.Icon;

							return (
								<tr key={h.id}>
									<td>
										{/* Nueva celda apilada para fecha y hora */}
										<div className='date-time-cell'>
											<span className='date-part'>
												<CalendarDays size={13} />{" "}
												{formatDateOnly(h.fecha_movimiento)}
											</span>
											<span className='time-part'>
												<Clock size={12} /> {formatTimeOnly(h.fecha_movimiento)}
											</span>
										</div>
									</td>
									<td>
										<div className='info-cell'>
											<span className='name'>{h.modelo}</span>
											{/* Código de barras reemplazando el texto S/N */}
											<span className='audit-text'>
												<Barcode size={12} /> {h.serie}
											</span>
										</div>
									</td>
									<td>
										<div className='info-cell'>
											<span className='name'>
												{h.empleado_nombre} {h.empleado_apellido}
											</span>
										</div>
									</td>
									<td>
										<span className='motivo-text'>
											{h.motivo || "No especificado"}
										</span>
									</td>
									<td className='center'>
										<div className={`status-badge ${status.className}`}>
											<StatusIcon size={12} style={{ marginRight: "4px" }} />
											{status.text}
										</div>
									</td>
									<td className='center'>
										{h.cargador ? (
											<Check size={16} className='check-icon' />
										) : (
											<IconX size={16} className='mail-error' />
										)}
									</td>
									<td className='center'>
										{h.correo_enviado === true && (
											<Mail
												size={16}
												className='mail-success'
												title='Correo enviado'
											/>
										)}
										{h.correo_enviado === false && (
											<button
												onClick={() => onReenviarCorreo(h)}
												className='btn-icon-transparent'
												title='Reenviar Correo'
											>
												<AlertTriangle size={16} className='mail-error' />
											</button>
										)}
										{h.correo_enviado === null && (
											<span className='dash'>-</span>
										)}
									</td>
									<td className='center'>
										<div className='actions-cell'>
											<button
												onClick={() => onVerPdf(h)}
												className='action-btn view'
												title='Ver Constancia'
											>
												<FileText size={16} />
											</button>
										</div>
									</td>
									<td className='center'>
										<div className='actions-cell'>
											{h.firma_valida === true ? (
												<>
													<button
														onClick={() => onVerFirmado(h.pdf_firmado_url)}
														className='action-btn success'
														title='Ver Firmado'
													>
														<Eye size={16} />
													</button>
													<button
														onClick={() => onInvalidar(h.id)}
														className='action-btn delete'
														title='Invalidar'
													>
														<Ban size={16} />
													</button>
												</>
											) : h.token_firma ? (
												<div
													className='status-pending-signature'
													title='Esperando firma...'
												>
													<Clock
														size={16}
														color='#d97706'
														className='animate-pulse'
													/>
													<span>PENDIENTE</span>
												</div>
											) : (
												<button
													onClick={() => onSubirClick(h.id)}
													className='btn-upload'
												>
													<Upload size={14} /> Subir
												</button>
											)}
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
};

export default DevolucionTable;
