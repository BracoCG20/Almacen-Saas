import React from "react";
import { X } from "lucide-react"; // Usando lucide-react
import "./Modal.scss"; // Reutilizamos los estilos del modal anterior

const PdfModal = ({ isOpen, onClose, pdfUrl, title }) => {
	if (!isOpen) return null;

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div
				className='modal-container'
				onClick={(e) => e.stopPropagation()}
				style={{ maxWidth: "900px", width: "90%", height: "85vh" }}
			>
				<div className='modal-header'>
					<h2>{title}</h2>
					<div style={{ display: "flex", gap: "10px" }}>
						<button className='btn-close' onClick={onClose}>
							<X size={20} />
						</button>
					</div>
				</div>
				<div
					className='modal-body'
					style={{
						height: "calc(100% - 60px)",
						padding: 0,
						overflow: "hidden",
					}}
				>
					{/* Iframe para mostrar el PDF nativo del navegador */}
					<iframe
						src={pdfUrl}
						width='100%'
						height='100%'
						style={{ border: "none" }}
						title='Vista Previa PDF'
					></iframe>
				</div>
			</div>
		</div>
	);
};

export default PdfModal;
