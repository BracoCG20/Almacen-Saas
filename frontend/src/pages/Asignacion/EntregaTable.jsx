import React from "react";
import {
	History,
	Check,
	FileText,
	Upload,
	Ban,
	Eye,
	Mail,
	AlertTriangle,
	CalendarDays,
	Clock,
	Barcode, // <-- Nuevo icono importado
} from "lucide-react";

const EntregaTable = ({
	historial,
	onVerPdfOriginal,
	onVerFirmado,
	onSubirClick,
	onInvalidar,
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

	return (
		<div className='table-container'>
			<div className='table-header-title'>
				<h3>
					<History size={18} /> Últimas Entregas
				</h3>
			</div>
			<table>
				<thead>
					<tr>
						<th>Fecha y Hora</th>
						<th>Equipo Entregado</th>
						<th>Usuario</th>
						<th className='center'>Carg.</th>
						<th className='center'>Correo</th>
						<th className='center'>Acta</th>
						<th className='center'>Firma</th>
					</tr>
				</thead>
				<tbody>
					{historial.length === 0 ? (
						<tr>
							<td colSpan='7' className='no-data'>
								No hay entregas registradas aún.
							</td>
						</tr>
					) : (
						historial.map((h) => (
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
								<td className='center'>
									{h.cargador ? (
										<Check size={16} className='check-icon' />
									) : (
										<span className='dash'>-</span>
									)}
								</td>
								<td className='center'>
									{h.correo_enviado === true && (
										<Mail size={16} className='mail-success' title='Enviado' />
									)}
									{h.correo_enviado === false && (
										<AlertTriangle
											size={16}
											className='mail-error'
											title='Error'
										/>
									)}
									{h.correo_enviado === null && <span className='dash'>-</span>}
								</td>
								<td className='center'>
									<div className='actions-cell'>
										<button
											onClick={() => onVerPdfOriginal(h)}
											className='action-btn view'
											title='Ver Original'
										>
											<FileText size={16} />
										</button>
									</div>
								</td>
								<td className='center'>
									<div className='actions-cell'>
										{/* CASO 1: YA ESTÁ FIRMADO */}
										{h.firma_valida === true ? (
											<>
												<button
													onClick={() => onVerFirmado(h.pdf_firmado_url)}
													className='action-btn success'
													title='Ver Acta Firmada'
												>
													<Eye size={16} />
												</button>
												<button
													onClick={() => onInvalidar(h.id)}
													className='action-btn delete'
													title='Invalidar Firma'
												>
													<Ban size={16} />
												</button>
											</>
										) : h.token_firma ? (
											/* CASO 2: PENDIENTE DE FIRMA */
											<div
												className='status-pending-signature'
												title='Esperando firma del colaborador...'
											>
												<Clock
													size={16}
													color='#d97706'
													className='animate-pulse'
												/>
												<span>PENDIENTE</span>
											</div>
										) : (
											/* CASO 3: NO SE HA ENVIADO POR CORREO */
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
						))
					)}
				</tbody>
			</table>
		</div>
	);
};

export default EntregaTable;
