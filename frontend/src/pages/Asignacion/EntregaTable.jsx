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
} from "lucide-react";

const EntregaTable = ({
	historial,
	onVerPdfOriginal,
	onVerFirmado,
	onSubirClick,
	onInvalidar,
}) => {
	const formatDateTime = (isoString) => {
		if (!isoString) return "-";
		const date = new Date(
			isoString.endsWith("Z") ? isoString : `${isoString}Z`,
		);
		return date.toLocaleString("es-PE", {
			timeZone: "America/Lima",
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	};

	return (
		<div className='table-container'>
			<div className='table-header-title'>
				<h3>
					<History size={20} /> Últimas Entregas
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
					{historial.map((h) => (
						<tr key={h.id}>
							<td>
								<div className='email-cell'>
									<CalendarDays size={14} />{" "}
									{formatDateTime(h.fecha_movimiento)}
								</div>
							</td>
							<td>
								<div className='info-cell'>
									<span className='name'>{h.modelo}</span>
									<span className='audit-text'>S/N: {h.serie}</span>
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
									<span style={{ color: "#cbd5e1" }}>-</span>
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
								{h.correo_enviado === null && (
									<span style={{ color: "#cbd5e1" }}>-</span>
								)}
							</td>
							<td className='center'>
								<div className='actions-cell'>
									<button
										onClick={() => onVerPdfOriginal(h)}
										className='action-btn pdf-btn'
										title='Ver Original'
									>
										<FileText size={18} />
									</button>
								</div>
							</td>
							<td className='center'>
								<div className='actions-cell'>
									{!h.pdf_firmado_url && (
										<button
											onClick={() => onSubirClick(h.id)}
											className='btn-upload'
										>
											<Upload size={14} /> Subir
										</button>
									)}
									{h.pdf_firmado_url && h.firma_valida !== false && (
										<>
											<button
												onClick={() => onVerFirmado(h.pdf_firmado_url)}
												className='action-btn view'
												title='Ver Firmado'
											>
												<Eye size={18} />
											</button>
											<button
												onClick={() => onInvalidar(h.id)}
												className='action-btn delete'
												title='Invalidar'
											>
												<Ban size={18} />
											</button>
										</>
									)}
									{h.pdf_firmado_url && h.firma_valida === false && (
										<button
											onClick={() => onSubirClick(h.id)}
											className='btn-upload re-upload'
										>
											<Upload size={14} /> Re-subir
										</button>
									)}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default EntregaTable;
